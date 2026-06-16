from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

from app.config import Settings


class VideoAssemblyService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def build_render_payload(
        self,
        project_id: str,
        scenes: list[dict[str, Any]],
        subtitle_tracks: list[dict[str, Any]],
    ) -> dict[str, Any]:
        return {
            "projectId": project_id,
            "aspectRatio": "21:9",
            "scenes": scenes,
            "subtitleTracks": subtitle_tracks,
            "audioDucking": {"backgroundMusicGain": 0.15, "voiceGain": 1.0},
            "transitionSfx": ["whoosh", "deep-boom"],
        }

    def render_documentary(self, render_payload: dict[str, Any], project_dir: Path) -> str:
        project_dir.mkdir(parents=True, exist_ok=True)
        props_path = project_dir / "render-props.json"
        output_path = project_dir / "documentary-final.mp4"
        props_path.write_text(json.dumps(render_payload, indent=2), encoding="utf-8")

        command = [
            "npx",
            "remotion",
            "render",
            self.settings.remotion_entry,
            self.settings.remotion_composition_id,
            str(output_path),
            "--props",
            props_path.read_text(encoding="utf-8"),
        ]
        subprocess.run(command, check=True, cwd=Path(__file__).resolve().parents[3] / "frontend")
        return str(output_path)

    def apply_audio_post_processing(
        self,
        input_video: str,
        narration_audio: str,
        background_audio: str,
        output_video: str,
    ) -> str:
        filter_complex = (
            "[1:a]volume=1.0[voice];"
            "[2:a]volume=0.15[bed];"
            "[bed][voice]sidechaincompress=threshold=0.015:ratio=12:attack=5:release=350[ducked];"
            "[ducked][voice]amix=inputs=2:duration=longest[aout]"
        )
        command = [
            self.settings.ffmpeg_bin,
            "-y",
            "-i",
            input_video,
            "-i",
            narration_audio,
            "-i",
            background_audio,
            "-filter_complex",
            filter_complex,
            "-map",
            "0:v",
            "-map",
            "[aout]",
            "-c:v",
            "copy",
            output_video,
        ]
        subprocess.run(command, check=True)
        return output_video
