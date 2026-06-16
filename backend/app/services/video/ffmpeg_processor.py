import json
import logging
import subprocess
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

WHOOSH_SFX = "assets/sfx/whoosh.mp3"
DEEP_BOOM_SFX = "assets/sfx/deep_boom.mp3"


class FFmpegProcessor:
    """Audio ducking, SFX insertion, and final video assembly."""

    def apply_audio_ducking(
        self,
        voice_track: Path,
        background_music: Path,
        output_path: Path,
        duck_level: float = 0.15,
    ) -> Path:
        """
        Drop background music to 15% (85% reduction) when voice is active.
        Uses FFmpeg sidechaincompress filter.
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)

        filter_complex = (
            f"[1:a]volume={duck_level}[music_ducked];"
            f"[0:a][music_ducked]amix=inputs=2:duration=first:dropout_transition=2[out]"
        )

        cmd = [
            "ffmpeg", "-y",
            "-i", str(voice_track),
            "-i", str(background_music),
            "-filter_complex", filter_complex,
            "-map", "[out]",
            "-c:a", "aac", "-b:a", "192k",
            str(output_path),
        ]

        self._run_ffmpeg(cmd)
        logger.info("Audio ducking applied: %s", output_path)
        return output_path

    def mix_with_sfx(
        self,
        main_audio: Path,
        output_path: Path,
        transition_points: list[float] | None = None,
        sfx_dir: Path | None = None,
    ) -> Path:
        """Insert whoosh and deep boom SFX at scene transitions."""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        transition_points = transition_points or []

        if not transition_points:
            import shutil
            shutil.copy2(main_audio, output_path)
            return output_path

        inputs = ["-i", str(main_audio)]
        filter_parts = ["[0:a]volume=1[main]"]
        mix_inputs = ["[main]"]

        sfx_dir = sfx_dir or Path("assets/sfx")
        whoosh = sfx_dir / "whoosh.mp3"
        boom = sfx_dir / "deep_boom.mp3"

        sfx_idx = 1
        for i, t in enumerate(transition_points):
            sfx_file = whoosh if i % 2 == 0 else boom
            if sfx_file.exists():
                inputs.extend(["-i", str(sfx_file)])
                delay_ms = int(t * 1000)
                filter_parts.append(
                    f"[{sfx_idx}:a]adelay={delay_ms}|{delay_ms},volume=0.6[sfx{sfx_idx}]"
                )
                mix_inputs.append(f"[sfx{sfx_idx}]")
                sfx_idx += 1

        n_inputs = len(mix_inputs)
        filter_parts.append(
            f"{''.join(mix_inputs)}amix=inputs={n_inputs}:duration=first[out]"
        )

        cmd = [
            "ffmpeg", "-y",
            *inputs,
            "-filter_complex", ";".join(filter_parts),
            "-map", "[out]",
            "-c:a", "aac", "-b:a", "192k",
            str(output_path),
        ]

        self._run_ffmpeg(cmd)
        return output_path

    def burn_subtitles(
        self,
        video_path: Path,
        word_timestamps: list[dict[str, Any]],
        output_path: Path,
        aspect_ratio: str = "21:9",
    ) -> Path:
        """Burn center-bottom aligned subtitles from ElevenLabs word timestamps."""
        srt_path = output_path.parent / "subtitles.srt"
        self._generate_srt(word_timestamps, srt_path)

        width, height = self._aspect_to_resolution(aspect_ratio)

        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-vf", (
                f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
                f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2,"
                f"subtitles={srt_path}:force_style="
                f"'Alignment=2,FontSize=22,PrimaryColour=&HFFFFFF,"
                f"OutlineColour=&H000000,Outline=2,MarginV=40'"
            ),
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-c:a", "copy",
            str(output_path),
        ]

        self._run_ffmpeg(cmd)
        logger.info("Subtitles burned into %s", output_path)
        return output_path

    def concat_videos(self, video_paths: list[Path], output_path: Path) -> Path:
        concat_file = output_path.parent / "concat_list.txt"
        concat_file.write_text(
            "\n".join(f"file '{p.absolute()}'" for p in video_paths)
        )

        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_file),
            "-c", "copy",
            str(output_path),
        ]

        self._run_ffmpeg(cmd)
        concat_file.unlink(missing_ok=True)
        return output_path

    def _generate_srt(
        self, word_timestamps: list[dict[str, Any]], srt_path: Path, words_per_line: int = 6
    ) -> None:
        lines: list[str] = []
        idx = 1

        for i in range(0, len(word_timestamps), words_per_line):
            chunk = word_timestamps[i : i + words_per_line]
            if not chunk:
                continue
            start = self._format_srt_time(chunk[0]["start"])
            end = self._format_srt_time(chunk[-1]["end"])
            text = " ".join(w["word"] for w in chunk)
            lines.append(f"{idx}\n{start} --> {end}\n{text}\n")
            idx += 1

        srt_path.write_text("\n".join(lines))

    @staticmethod
    def _format_srt_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    @staticmethod
    def _aspect_to_resolution(aspect: str) -> tuple[int, int]:
        ratios = {
            "21:9": (2560, 1080),
            "16:9": (1920, 1080),
            "9:16": (1080, 1920),
            "4:3": (1440, 1080),
        }
        return ratios.get(aspect, (2560, 1080))

    @staticmethod
    def _run_ffmpeg(cmd: list[str]) -> None:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error("FFmpeg error: %s", result.stderr)
            raise RuntimeError(f"FFmpeg failed: {result.stderr[:500]}")
