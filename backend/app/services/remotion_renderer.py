from __future__ import annotations

import asyncio
import json
from pathlib import Path

import aiofiles

from app.core.config import Settings
from app.schemas import DocumentaryRenderManifest


class RemotionRenderer:
    """Renders Remotion compositions and applies final FFmpeg audio processing."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def render_documentary(self, manifest: DocumentaryRenderManifest, generation_dir: Path) -> str:
        manifest_path = generation_dir / "render-manifest.json"
        raw_output_path = generation_dir / "documentary-raw.mp4"
        final_output_path = generation_dir / "documentary-final-21x9.mp4"

        async with aiofiles.open(manifest_path, "w", encoding="utf-8") as file:
            await file.write(json.dumps({"manifest": manifest.model_dump(mode="json")}, indent=2))

        await self._run(
            [
                "npm",
                "exec",
                "--workspace",
                "apps/remotion",
                "remotion",
                "render",
                "src/index.tsx",
                "Documentary",
                str(raw_output_path),
                f"--props={manifest_path}",
                "--codec=h264",
                "--pixel-format=yuv420p",
                "--scale=1",
            ],
            cwd=Path.cwd(),
        )
        await self.apply_ffmpeg_finishing(raw_output_path, final_output_path, self._transition_delays_ms(manifest))
        return str(final_output_path)

    async def apply_ffmpeg_finishing(self, input_path: Path, output_path: Path, transition_delays_ms: list[int]) -> None:
        """Apply narration-aware music ducking and normalize the cinematic MP4 output."""

        music_path = self.settings.background_music_path
        sfx_paths = self._transition_sfx_paths()
        if not (music_path and music_path.exists()) and not sfx_paths:
            command = [
                "ffmpeg",
                "-y",
                "-i",
                str(input_path),
                "-vf",
                "scale=2560:1098,setsar=1",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                str(output_path),
            ]
        else:
            command = ["ffmpeg", "-y", "-i", str(input_path)]
            filter_parts: list[str] = []
            mix_labels = ["[0:a]"]
            input_index = 1

            if music_path and music_path.exists():
                command.extend(["-stream_loop", "-1", "-i", str(music_path)])
                filter_parts.append(f"[{input_index}:a]volume=0.15[ducked_music]")
                mix_labels.append("[ducked_music]")
                input_index += 1

            for sfx_number, delay in enumerate(transition_delays_ms):
                if not sfx_paths:
                    break
                sfx_path = sfx_paths[sfx_number % len(sfx_paths)]
                command.extend(["-i", str(sfx_path)])
                label = f"sfx{sfx_number}"
                filter_parts.append(f"[{input_index}:a]adelay={delay}|{delay},volume=0.85[{label}]")
                mix_labels.append(f"[{label}]")
                input_index += 1

            filter_parts.append(
                f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:dropout_transition=2[aout]"
            )
            command.extend(
                [
                    "-filter_complex",
                    ";".join(filter_parts),
                    "-map",
                    "0:v",
                    "-map",
                    "[aout]",
                    "-c:v",
                    "copy",
                    "-c:a",
                    "aac",
                    "-shortest",
                    str(output_path),
                ]
            )
        await self._run(command, cwd=Path.cwd())

    def _transition_sfx_paths(self) -> list[Path]:
        sfx_dir = self.settings.transition_sfx_dir
        if not sfx_dir or not sfx_dir.exists():
            return []
        return sorted([*sfx_dir.glob("*.mp3"), *sfx_dir.glob("*.wav")])

    @staticmethod
    def _transition_delays_ms(manifest: DocumentaryRenderManifest) -> list[int]:
        delays: list[int] = []
        cursor_seconds = 0.0
        for index, scene in enumerate(manifest.scenes):
            words = scene.voiceover.word_timestamps if scene.voiceover else []
            duration = max(max((word.end for word in words), default=0) + 1.1, 4.0)
            cursor_seconds += duration
            if index < len(manifest.scenes) - 1:
                delays.append(int(cursor_seconds * 1000))
        return delays

    @staticmethod
    async def _run(command: list[str], cwd: Path) -> None:
        process = await asyncio.create_subprocess_exec(
            *command,
            cwd=str(cwd),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise RuntimeError(
                f"Command failed ({' '.join(command)}):\nSTDOUT:\n{stdout.decode()}\nSTDERR:\n{stderr.decode()}"
            )
