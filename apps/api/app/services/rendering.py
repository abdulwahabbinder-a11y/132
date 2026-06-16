import asyncio
import json
from pathlib import Path
from typing import Any

from app.core.config import Settings


class RemotionRenderer:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def render_documentary(self, *, job_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        job_dir = self.settings.render_output_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        payload_path = job_dir / "render-payload.json"
        output_path = job_dir / "documentary-21x9.mp4"
        payload_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        command = [
            "npm",
            "run",
            "render",
            "--workspace",
            "packages/remotion",
            "--",
            "--props",
            str(payload_path),
            "--output",
            str(output_path),
        ]
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise RuntimeError(
                "Remotion render failed: "
                + stderr.decode("utf-8", errors="ignore")
                + stdout.decode("utf-8", errors="ignore")
            )

        ffmpeg_output = await self.apply_ffmpeg_mastering(output_path)
        return {
            "payload_path": str(payload_path),
            "raw_output_path": str(output_path),
            "final_output_path": str(ffmpeg_output),
            "final_video_url": str(ffmpeg_output),
        }

    async def apply_ffmpeg_mastering(self, input_path: Path) -> Path:
        output_path = input_path.with_name(input_path.stem + "-mastered.mp4")
        # The Remotion composition already lays out subtitles; this FFmpeg pass is reserved
        # for production audio ducking and transition SFX mixing when stems are present.
        filter_complex = (
            "[0:a]acompressor=threshold=-18dB:ratio=3:attack=20:release=250,"
            "loudnorm=I=-16:TP=-1.5:LRA=11[aout]"
        )
        command = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-filter_complex",
            filter_complex,
            "-map",
            "0:v",
            "-map",
            "[aout]",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(output_path),
        ]
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise RuntimeError(
                "FFmpeg mastering failed: "
                + stderr.decode("utf-8", errors="ignore")
                + stdout.decode("utf-8", errors="ignore")
            )
        return output_path
