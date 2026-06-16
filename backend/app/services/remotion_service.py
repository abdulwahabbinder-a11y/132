import json
import subprocess
from pathlib import Path


class RemotionService:
    def __init__(self, engine_dir: str = "/workspace/video-engine") -> None:
        self.engine_dir = Path(engine_dir)

    async def render_documentary(self, payload: dict, output_path: str) -> str:
        input_file = self.engine_dir / "tmp-input.json"
        output_file = Path(output_path)
        input_file.write_text(json.dumps(payload), encoding="utf-8")
        subprocess.run(
            [
                "node",
                str(self.engine_dir / "src" / "render.js"),
                "--input",
                str(input_file),
                "--output",
                str(output_file),
            ],
            check=True,
            cwd=self.engine_dir,
        )
        return str(output_file)
