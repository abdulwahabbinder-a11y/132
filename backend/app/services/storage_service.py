from pathlib import Path


class StorageService:
    def __init__(self, base_dir: str = "/workspace/artifacts") -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def job_dir(self, job_id: str) -> Path:
        path = self.base_dir / job_id
        path.mkdir(parents=True, exist_ok=True)
        return path
