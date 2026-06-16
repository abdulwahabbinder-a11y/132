import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import get_settings
from app.database import get_supabase
from app.schemas.short import ViralScript
from app.services.llm.claude_client import ClaudeClient
from app.services.llm.viral_script import ViralScriptGenerator
from app.services.media.flux import FluxImageGenerator
from app.services.scrapers.aggregator import ResearchAggregator
from app.services.settings_service import get_platform_setting
from app.services.video.elevenlabs import ElevenLabsService
from app.services.video.ffmpeg_processor import FFmpegProcessor
from app.services.remotion_render import render_viral_short

logger = logging.getLogger(__name__)

PHASES = ("scraping", "scripting", "assets", "rendering", "completed")


class ShortVideoPipeline:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.settings = get_settings()
        self.work_dir = Path(self.settings.asset_storage_path) / "shorts" / job_id
        self.output_dir = Path(self.settings.output_storage_path) / "shorts" / job_id
        self.work_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.aggregator = ResearchAggregator(log_fn=self._log)
        self.claude = ClaudeClient()
        self.script_gen = ViralScriptGenerator()
        self.flux = FluxImageGenerator()
        self.ffmpeg = FFmpegProcessor()

    async def run(self, topic: str, target_duration_seconds: int = 60) -> dict[str, Any]:
        try:
            # Phase 1: Web scraping
            self._set_phase("scraping", 5)
            self._log("scraping", "Starting multi-source live research (all enabled scrapers)...", 5)
            scraped = await self._scrape_live_data(topic)
            self._log("scraping", f"Collected data from {scraped.get('source_count', 0)} sources", 22)
            self._update_job(scraped_data=scraped)

            # Phase 2: Research synthesis + script generation
            self._set_phase("scripting", 25)
            research_brief = None
            research_llm = get_platform_setting("research_llm", "claude")

            if research_llm == "claude" and get_platform_setting("claude_api_key"):
                self._log("scripting", "Claude AI synthesizing research brief from all sources...", 26)
                try:
                    research_brief = await self.claude.research_synthesis(
                        topic, scraped.get("combined_text", "")
                    )
                    self._log(
                        "scripting",
                        f"Research brief ready — {len(research_brief.get('key_facts', []))} key facts, hook angles identified",
                        32,
                    )
                except Exception as exc:
                    self._log("scripting", f"Claude research skipped: {exc}", 30, "warn")

            script_llm = get_platform_setting("script_llm", "claude_then_llama")
            self._log("scripting", f"Generating viral script ({script_llm})...", 34)
            script = await self.script_gen.generate(
                topic=topic,
                scraped_text=scraped.get("combined_text", ""),
                target_duration_seconds=target_duration_seconds,
                research_brief=research_brief,
            )
            self._log("scripting", f"Script ready: {len(script.scenes)} scenes, hook: \"{script.hook[:50]}...\"", 40)
            self._update_job(script_json=script.model_dump())

            # Phase 3: Asset generation
            self._set_phase("assets", 45)
            scene_assets = await self._generate_assets(script)

            # Phase 4: Rendering
            self._set_phase("rendering", 75)
            self._log("rendering", "Assembling 9:16 vertical video with Remotion...", 75)
            output_path = await self._render_video(script, scene_assets)

            self._set_phase("completed", 100)
            self._log("rendering", f"Video rendered successfully: {output_path.name}", 100, "success")
            self._update_job(status="completed", progress=100, output_url=str(output_path))

            return {"output_path": str(output_path), "script": script.model_dump()}

        except Exception as exc:
            logger.exception("Short pipeline failed for job %s", self.job_id)
            self._set_phase("failed", 0)
            self._log("failed", str(exc), 0, "error")
            self._update_job(status="failed", error=str(exc))
            raise

    async def _scrape_live_data(self, topic: str) -> dict[str, Any]:
        return await self.aggregator.scrape_all(topic)

    async def _generate_assets(self, script: ViralScript) -> list[dict[str, Any]]:
        elevenlabs = ElevenLabsService()
        assets: list[dict[str, Any]] = []
        all_timestamps: list[dict[str, Any]] = []
        time_offset = 0.0

        for i, scene in enumerate(script.scenes):
            progress = 45 + int((i / len(script.scenes)) * 28)
            scene_dir = self.work_dir / f"scene_{scene.scene_number:03d}"
            scene_dir.mkdir(parents=True, exist_ok=True)

            self._log(
                "assets",
                f"Scene {scene.scene_number}/{len(script.scenes)}: generating Flux image...",
                progress,
            )

            image_path = scene_dir / "image.png"
            await self.flux.generate_image(
                prompt=scene.image_prompt,
                output_path=image_path,
                width=1080,
                height=1920,
            )

            self._log(
                "assets",
                f"Scene {scene.scene_number}: synthesizing ElevenLabs narration...",
                progress + 1,
            )

            audio_path = scene_dir / "narration.mp3"
            ts_path = scene_dir / "timestamps.json"
            tts = await elevenlabs.synthesize_with_timestamps(
                text=scene.narration_text,
                output_path=audio_path,
                timestamps_path=ts_path,
            )

            for ts in tts["word_timestamps"]:
                all_timestamps.append({
                    "word": ts["word"],
                    "start": ts["start"] + time_offset,
                    "end": ts["end"] + time_offset,
                })
            time_offset += tts.get("duration_seconds", scene.duration_seconds)

            assets.append({
                "scene_number": scene.scene_number,
                "image_path": str(image_path),
                "audio_path": str(audio_path),
                "on_screen_text": scene.on_screen_text,
                "duration_seconds": scene.duration_seconds,
            })

        self._log("assets", f"All {len(assets)} scene assets generated", 73)
        manifest_path = self.work_dir / "scene_assets.json"
        manifest_path.write_text(json.dumps({
            "scenes": assets,
            "word_timestamps": all_timestamps,
            "aspect_ratio": "9:16",
            "title": script.title,
            "hook": script.hook,
        }, indent=2))

        return assets

    async def _render_video(
        self, script: ViralScript, scene_assets: list[dict[str, Any]]
    ) -> Path:
        manifest_path = self.work_dir / "remotion_props.json"
        timestamps_path = self.work_dir / "scene_assets.json"
        ts_data = json.loads(timestamps_path.read_text())

        props = {
            "title": script.title,
            "hook": script.hook,
            "aspect_ratio": "9:16",
            "scenes": [
                {
                    "scene_number": a["scene_number"],
                    "image_path": a["image_path"],
                    "audio_path": a["audio_path"],
                    "on_screen_text": a.get("on_screen_text", ""),
                    "duration_seconds": a["duration_seconds"],
                }
                for a in scene_assets
            ],
            "word_timestamps": ts_data.get("word_timestamps", []),
        }
        manifest_path.write_text(json.dumps(props, indent=2))

        remotion_output = self.output_dir / "remotion_raw.mp4"
        remotion_ok = await asyncio.to_thread(
            render_viral_short,
            job_id=self.job_id,
            props=props,
            output_path=remotion_output,
            log_fn=self._log,
        )

        final_path = self.output_dir / "viral_short.mp4"
        if remotion_ok and remotion_output.exists():
            self.ffmpeg.burn_subtitles(
                video_path=remotion_output,
                word_timestamps=ts_data.get("word_timestamps", []),
                output_path=final_path,
                aspect_ratio="9:16",
            )
        else:
            self._log("rendering", "Remotion unavailable, using FFmpeg slideshow fallback", 85, "warn")
            await self._ffmpeg_slideshow_fallback(scene_assets, ts_data, final_path)

        return final_path

    async def _ffmpeg_slideshow_fallback(
        self,
        scene_assets: list[dict[str, Any]],
        ts_data: dict,
        output_path: Path,
    ) -> None:
        """Fallback: stitch images + audio with FFmpeg when Remotion is unavailable."""
        concat_dir = self.work_dir / "concat"
        concat_dir.mkdir(exist_ok=True)
        clip_paths: list[Path] = []

        for asset in scene_assets:
            clip = concat_dir / f"clip_{asset['scene_number']}.mp4"
            duration = asset["duration_seconds"]
            self.ffmpeg.run([
                "ffmpeg", "-y",
                "-loop", "1", "-i", str(Path(asset["image_path"]).resolve()),
                "-i", str(Path(asset["audio_path"]).resolve()),
                "-c:v", "libx264", "-t", str(duration),
                "-pix_fmt", "yuv420p",
                "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
                "-c:a", "aac", "-shortest",
                str(clip),
            ], label=f"FFmpeg clip {asset['scene_number']}")
            clip_paths.append(clip)

        concat_file = concat_dir / "list.txt"
        concat_file.write_text("\n".join(f"file '{p.resolve()}'" for p in clip_paths))
        raw = self.output_dir / "concat_raw.mp4"
        self.ffmpeg.run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_file), "-c", "copy", str(raw),
        ], label="FFmpeg concat")

        self.ffmpeg.burn_subtitles(
            video_path=raw,
            word_timestamps=ts_data.get("word_timestamps", []),
            output_path=output_path,
            aspect_ratio="9:16",
        )

    def _log(self, phase: str, message: str, progress: int, level: str = "info") -> None:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "phase": phase,
            "message": message,
            "progress": progress,
            "level": level,
        }
        logger.info("[%s] %s — %s", self.job_id, phase, message)

        supabase = get_supabase()
        result = (
            supabase.table("short_video_jobs")
            .select("logs")
            .eq("id", self.job_id)
            .maybe_single()
            .execute()
        )
        logs = (result.data or {}).get("logs", []) if result.data else []
        logs.append(entry)

        supabase.table("short_video_jobs").update({
            "logs": logs,
            "progress": progress,
            "phase": phase,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", self.job_id).execute()

    def _set_phase(self, phase: str, progress: int) -> None:
        supabase = get_supabase()
        supabase.table("short_video_jobs").update({
            "phase": phase,
            "status": "processing" if phase not in ("completed", "failed") else phase,
            "progress": progress,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", self.job_id).execute()

    def _update_job(self, **fields: Any) -> None:
        supabase = get_supabase()
        fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        supabase.table("short_video_jobs").update(fields).eq("id", self.job_id).execute()


def run_short_pipeline(job_id: str, topic: str, target_duration_seconds: int = 60) -> dict[str, Any]:
    pipeline = ShortVideoPipeline(job_id)
    return asyncio.run(pipeline.run(topic, target_duration_seconds))
