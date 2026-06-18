import asyncio
import json
import logging
from pathlib import Path
from typing import Any

from app.config import get_settings
from app.database import get_supabase
from app.schemas.story import SceneScript, StoryScript
from app.services.media.flux import FluxImageGenerator
from app.services.media.pexels import PexelsClient
from app.services.media.pixabay import PixabayClient
from app.services.scrapers.internet_archive import InternetArchiveScraper
from app.services.scrapers.wikipedia import WikipediaScraper
from app.services.scrapers.wikimedia import WikimediaScraper
from app.services.video.deepvideo import DeepVideoPipeline
from app.services.video.elevenlabs import ElevenLabsService
from app.services.video.ffmpeg_processor import FFmpegProcessor
from app.services.video.wan21 import Wan21Animator
from app.services.remotion_render import render_documentary
from app.services.object_storage import publish_output_file

logger = logging.getLogger(__name__)


class AssetWorker:
    """Asynchronous background worker for scraping and downloading scene assets."""

    def __init__(self, job_id: str):
        self.job_id = job_id
        self.settings = get_settings()
        self.work_dir = Path(self.settings.asset_storage_path) / job_id
        self.work_dir.mkdir(parents=True, exist_ok=True)

        self.wikipedia = WikipediaScraper()
        self.wikimedia = WikimediaScraper()
        self.internet_archive = InternetArchiveScraper()
        self.pexels = PexelsClient()
        self.pixabay = PixabayClient()
        self.flux = FluxImageGenerator()
        self.elevenlabs = ElevenLabsService()
        self.wan21 = Wan21Animator()
        self.deepvideo = DeepVideoPipeline()
        self.ffmpeg = FFmpegProcessor()

    async def run_pipeline(self, story: StoryScript, topic: str) -> dict[str, Any]:
        self._update_job_status("fetching_facts", 15)

        timeline_facts = await self.wikipedia.fetch_timeline_facts(topic)
        facts_path = self.work_dir / "timeline_facts.json"
        facts_path.write_text(json.dumps(timeline_facts, indent=2))

        scene_assets: list[dict[str, Any]] = []
        all_word_timestamps: list[dict[str, Any]] = []
        scene_videos: list[Path | None] = []
        time_offset = 0.0

        total_scenes = len(story.scenes)

        for i, scene in enumerate(story.scenes):
            progress = 20 + int((i / total_scenes) * 60)
            self._update_job_status(f"processing_scene_{scene.scene_number}", progress)

            scene_dir = self.work_dir / f"scene_{scene.scene_number:03d}"
            scene_dir.mkdir(parents=True, exist_ok=True)

            assets = await self._fetch_scene_media(scene, scene_dir)
            scene_assets.append({"scene_number": scene.scene_number, "assets": assets})

            narration_path = scene_dir / "narration.mp3"
            timestamps_path = scene_dir / "timestamps.json"
            tts_result = await self.elevenlabs.synthesize_with_timestamps(
                text=scene.narration_text,
                output_path=narration_path,
                timestamps_path=timestamps_path,
            )

            for ts in tts_result["word_timestamps"]:
                all_word_timestamps.append(
                    {
                        "word": ts["word"],
                        "start": ts["start"] + time_offset,
                        "end": ts["end"] + time_offset,
                    }
                )

            scene_video = await self._process_scene_video(
                scene, assets, narration_path, scene_dir
            )
            scene_videos.append(scene_video)

            time_offset += tts_result.get("duration_seconds", 4.0)

        self._update_job_status("assembling_video", 85)

        composition_manifest = {
            "job_id": self.job_id,
            "title": story.title,
            "aspect_ratio": "21:9",
            "scenes": [
                {
                    "scene_number": s.scene_number,
                    "narration_text": s.narration_text,
                    "location_coordinates": (
                        s.location_coordinates.model_dump()
                        if s.location_coordinates
                        else None
                    ),
                    "video_path": str(scene_videos[i]) if scene_videos[i] else None,
                }
                for i, s in enumerate(story.scenes)
            ],
            "word_timestamps": all_word_timestamps,
            "timeline_facts": timeline_facts,
        }

        manifest_path = self.work_dir / "composition_manifest.json"
        manifest_path.write_text(json.dumps(composition_manifest, indent=2))

        output_path = await self._finalize_video(
            [v for v in scene_videos if v], all_word_timestamps, composition_manifest
        )

        published_url = publish_output_file(
            Path(output_path),
            f"documentaries/{self.job_id}/final_documentary.mp4",
        )
        self._update_job_status("completed", 100, output_url=published_url)

        return {
            "manifest_path": str(manifest_path),
            "output_path": str(output_path),
            "scene_assets": scene_assets,
        }

    async def _fetch_scene_media(
        self, scene: SceneScript, scene_dir: Path
    ) -> list[dict[str, Any]]:
        assets: list[dict[str, Any]] = []

        if scene.is_abstract_scene:
            flux_path = scene_dir / "flux_image.png"
            flux_result = await self.flux.generate_image(
                prompt=" ".join(scene.visual_keywords),
                output_path=flux_path,
            )
            assets.append(flux_result)
        else:
            wikimedia_assets = await self.wikimedia.search_archival_photos(
                keywords=scene.visual_keywords,
                character_name=scene.character_name,
                output_dir=scene_dir / "wikimedia",
            )
            assets.extend(wikimedia_assets)

            ia_assets = await self.internet_archive.search_archival_media(
                keywords=scene.visual_keywords,
                output_dir=scene_dir / "archive",
            )
            assets.extend(ia_assets)

        pexels_assets = await self.pexels.search_videos(
            keywords=scene.visual_keywords,
            output_dir=scene_dir / "broll",
            per_page=2,
        )
        assets.extend(pexels_assets)

        if not pexels_assets:
            pixabay_assets = await self.pixabay.search_videos(
                keywords=scene.visual_keywords,
                output_dir=scene_dir / "broll",
                per_page=2,
            )
            assets.extend(pixabay_assets)

        return assets

    async def _process_scene_video(
        self,
        scene: SceneScript,
        assets: list[dict[str, Any]],
        narration_path: Path,
        scene_dir: Path,
    ) -> Path | None:
        if scene.is_historical_character and scene.character_name:
            portrait = next(
                (a for a in assets if a.get("local_path") and "wikimedia" in a.get("source", "")),
                None,
            )
            if portrait:
                try:
                    result = await self.deepvideo.process_character_scene(
                        portrait_path=Path(portrait["local_path"]),
                        audio_path=narration_path,
                        character_name=scene.character_name,
                        work_dir=scene_dir / "character",
                    )
                    return Path(result["local_path"])
                except Exception as exc:
                    logger.warning(
                        "Character scene failed for job %s scene %s: %s",
                        self.job_id,
                        scene.scene_number,
                        exc,
                    )

        static_image = next(
            (a for a in assets if a.get("local_path") and a["local_path"].endswith((".png", ".jpg", ".jpeg"))),
            None,
        )
        if static_image:
            animated_path = scene_dir / "animated.mp4"
            try:
                await self.wan21.animate_image(
                    image_path=Path(static_image["local_path"]),
                    prompt=" ".join(scene.visual_keywords),
                    output_path=animated_path,
                )
                return animated_path
            except Exception as exc:
                logger.warning(
                    "Wan2.1 animation failed for job %s scene %s: %s",
                    self.job_id,
                    scene.scene_number,
                    exc,
                )

        video_asset = next(
            (a for a in assets if a.get("local_path") and a["local_path"].endswith(".mp4")),
            None,
        )
        if video_asset:
            return Path(video_asset["local_path"])

        return None

    async def _finalize_video(
        self,
        scene_videos: list[Path],
        word_timestamps: list[dict[str, Any]],
        manifest: dict[str, Any],
    ) -> Path:
        output_dir = Path(self.settings.output_storage_path) / self.job_id
        output_dir.mkdir(parents=True, exist_ok=True)

        if scene_videos:
            concat_path = output_dir / "concatenated.mp4"
            self.ffmpeg.concat_videos(scene_videos, concat_path)
        else:
            concat_path = output_dir / "placeholder.mp4"
            self._create_placeholder_video(concat_path)

        remotion_output = output_dir / "remotion_render.mp4"
        remotion_ok = await asyncio.to_thread(
            render_documentary,
            job_id=self.job_id,
            props=manifest,
            output_path=remotion_output,
        )

        final_source = remotion_output if remotion_ok and remotion_output.exists() else concat_path

        final_path = output_dir / "final_documentary.mp4"
        self.ffmpeg.burn_subtitles(
            video_path=final_source,
            word_timestamps=word_timestamps,
            output_path=final_path,
            aspect_ratio="21:9",
        )

        return final_path

    def _create_placeholder_video(self, output_path: Path) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        self.ffmpeg.run(
            [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", "color=c=black:s=2560x1080:d=5",
                "-c:v", "libx264", "-t", "5",
                str(output_path),
            ],
            label="FFmpeg placeholder",
        )

    def _update_job_status(
        self, status: str, progress: int, output_url: str | None = None, error: str | None = None
    ) -> None:
        supabase = get_supabase()
        update: dict[str, Any] = {"status": status, "progress": progress}
        if output_url:
            update["output_url"] = output_url
        if error:
            update["error"] = error

        supabase.table("video_jobs").update(update).eq("id", self.job_id).execute()


def run_video_pipeline(job_id: str) -> dict[str, Any]:
    supabase = get_supabase()
    result = (
        supabase.table("video_jobs")
        .select("*")
        .eq("id", job_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        raise ValueError(f"Job {job_id} not found")

    job = result.data
    story_data = job.get("story_json", {})
    story = StoryScript(**story_data)
    topic = job.get("topic", story.topic)

    worker = AssetWorker(job_id)

    try:
        return asyncio.run(worker.run_pipeline(story, topic))
    except Exception as exc:
        logger.exception("Pipeline failed for job %s", job_id)
        worker._update_job_status("failed", 0, error=str(exc))
        raise
