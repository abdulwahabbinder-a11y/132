import subprocess
from pathlib import Path


class FFmpegService:
    def apply_ducking_and_sfx(
        self,
        narration_mp3: str,
        background_music: str,
        whoosh_sfx: str,
        boom_sfx: str,
        rendered_video: str,
        output_video: str,
    ) -> str:
        """
        Background ducking target: 85% reduction while narration is active.
        """
        Path(output_video).parent.mkdir(parents=True, exist_ok=True)
        filter_complex = (
            "[1:a]volume=0.15[bgduck];"
            "[0:a][bgduck]amix=inputs=2:duration=longest[mixed];"
            "[mixed][2:a][3:a]amix=inputs=3:duration=longest[finala]"
        )
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                narration_mp3,
                "-i",
                background_music,
                "-i",
                whoosh_sfx,
                "-i",
                boom_sfx,
                "-i",
                rendered_video,
                "-filter_complex",
                filter_complex,
                "-map",
                "4:v:0",
                "-map",
                "[finala]",
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                output_video,
            ],
            check=True,
        )
        return output_video
