import asyncio
import json
from pathlib import Path

import httpx

from app.core.config import get_settings

settings = get_settings()


class VideoAssemblyService:
    async def animate_static_image(self, image_path: str, prompt: str, destination_dir: Path) -> dict:
        payload = {
            "model": "AnyFlow-Wan2.1-T2V-14B",
            "prompt": prompt,
            "image_path": image_path,
            "duration_seconds": settings.scene_clip_duration_seconds,
        }
        headers = {
            "Authorization": f"Bearer {settings.nvidia_nim_api_key.get_secret_value()}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{settings.nvidia_nim_base_url}/video/generations",
                json=payload,
                headers=headers,
            )
        response.raise_for_status()

        response_json = response.json()
        clip_url = response_json.get("data", [{}])[0].get("url")
        if not clip_url:
            return {"provider": "wan2.1", "status": "submitted", "raw_response": response_json}

        output_path = destination_dir / "animated.mp4"
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            clip_response = await client.get(clip_url)
        clip_response.raise_for_status()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(clip_response.content)
        return {"provider": "wan2.1", "clip_path": str(output_path), "source_url": clip_url}

    async def run_liveportrait(self, image_path: str, audio_path: str, destination_dir: Path) -> dict:
        destination_dir.mkdir(parents=True, exist_ok=True)
        metadata_path = destination_dir / "liveportrait.json"
        metadata_path.write_text(
            json.dumps(
                {
                    "status": "stubbed",
                    "message": "Replace with actual LivePortrait inference worker.",
                    "image_path": image_path,
                    "audio_path": audio_path,
                },
                indent=2,
            )
        )
        return {"provider": "liveportrait", "clip_path": image_path, "metadata_path": str(metadata_path)}

    async def run_deepvideo_character_render(self, source_clip_path: str, destination_dir: Path) -> dict:
        destination_dir.mkdir(parents=True, exist_ok=True)
        metadata_path = destination_dir / "deepvideo-v1.json"
        metadata_path.write_text(
            json.dumps(
                {
                    "status": "stubbed",
                    "message": "Replace with actual DeepVideo-V1 pipeline runner.",
                    "source_clip_path": source_clip_path,
                },
                indent=2,
            )
        )
        return {
            "provider": "deepvideo-v1",
            "clip_path": source_clip_path,
            "metadata_path": str(metadata_path),
        }

    def build_ffmpeg_ducking_command(
        self,
        narration_path: str,
        music_path: str,
        whoosh_path: str,
        boom_path: str,
        output_path: str,
    ) -> list[str]:
        return [
            "ffmpeg",
            "-y",
            "-i",
            narration_path,
            "-i",
            music_path,
            "-i",
            whoosh_path,
            "-i",
            boom_path,
            "-filter_complex",
            (
                "[1:a][0:a]sidechaincompress=threshold=0.02:ratio=18:attack=15:release=250[ducked];"
                "[2:a]adelay=0|0[whoosh];"
                "[3:a]adelay=900|900[boom];"
                "[0:a][ducked][whoosh][boom]amix=inputs=4:normalize=0:weights='1 0.15 0.35 0.45'[mix]"
            ),
            "-map",
            "[mix]",
            output_path,
        ]

    async def render_with_remotion(self, manifest_path: Path, output_path: Path) -> str:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        command = [
            "pnpm",
            "--filter",
            "@docgen/video-composer",
            "render",
            "--manifest",
            str(manifest_path),
            "--output",
            str(output_path),
        ]
        process = await asyncio.create_subprocess_exec(
            *command,
            cwd=str(Path(__file__).resolve().parents[4]),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise RuntimeError(
                f"Remotion render failed with code {process.returncode}: {stderr.decode().strip()}"
            )
        return stdout.decode().strip() or str(output_path)
