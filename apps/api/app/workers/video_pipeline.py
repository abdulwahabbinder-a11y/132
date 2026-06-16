import asyncio
from typing import Any

from app.schemas.story import StoryScene
from app.services.character_engine import CharacterCinematicsEngine
from app.services.elevenlabs import ElevenLabsClient
from app.services.media_sources import PublicMediaFetcher
from app.services.nvidia_nim import NvidiaNimClient
from app.services.rendering import RemotionRenderer
from app.services.supabase_service import SupabaseService


class DocumentaryVideoPipeline:
    def __init__(
        self,
        *,
        supabase: SupabaseService,
        media: PublicMediaFetcher,
        nim: NvidiaNimClient,
        elevenlabs: ElevenLabsClient,
        character_engine: CharacterCinematicsEngine,
        renderer: RemotionRenderer,
    ):
        self.supabase = supabase
        self.media = media
        self.nim = nim
        self.elevenlabs = elevenlabs
        self.character_engine = character_engine
        self.renderer = renderer

    async def run(
        self,
        *,
        job_id: str,
        topic: str,
        language: str,
        scenes: list[StoryScene],
    ) -> None:
        try:
            self.supabase.update_job(job_id, status="processing")
            scene_manifests = await asyncio.gather(
                *[
                    self._process_scene(job_id=job_id, topic=topic, scene=scene)
                    for scene in scenes
                ]
            )
            asset_manifest = {"scenes": scene_manifests}
            self.supabase.update_job(job_id, asset_manifest=asset_manifest, status="rendering")

            render_payload = self._build_render_payload(
                job_id=job_id,
                topic=topic,
                language=language,
                scenes=scenes,
                manifests=scene_manifests,
            )
            self.supabase.update_job(job_id, render_payload=render_payload)
            render_result = await self.renderer.render_documentary(
                job_id=job_id,
                payload=render_payload,
            )
            self.supabase.update_job(
                job_id,
                status="completed",
                final_video_url=render_result["final_video_url"],
                render_payload={**render_payload, "render_result": render_result},
            )
        except Exception as exc:  # noqa: BLE001 - background workers must persist failures.
            self.supabase.update_job(job_id, status="failed", error_message=str(exc))

    async def _process_scene(
        self,
        *,
        job_id: str,
        topic: str,
        scene: StoryScene,
    ) -> dict[str, Any]:
        public_assets = await self.media.fetch_scene_assets(topic, scene)
        abstract_image = None
        if scene.is_abstract_scene:
            flux_response = await self.nim.generate_flux_image(
                f"Photorealistic premium documentary visual for: {scene.narration_text}"
            )
            abstract_image = self._first_generated_url(flux_response)

        visual_asset = abstract_image or PublicMediaFetcher.best_visual_asset(public_assets)
        narration = await self.elevenlabs.synthesize_with_timestamps(
            text=scene.narration_text,
            job_id=job_id,
            scene_number=scene.scene_number,
        )
        animated_clip = None
        if visual_asset:
            animated_clip = await self.nim.animate_image_with_wan(
                image_url=visual_asset,
                prompt=f"Four-second cinematic motion clip for scene {scene.scene_number}",
            )

        character_render = None
        if scene.is_historical_character and scene.character_name:
            character_render = await self.character_engine.render_character_scene(
                character_name=scene.character_name,
                source_image_url=visual_asset,
                audio_url=narration.get("audio_url"),
                narration_text=scene.narration_text,
            )

        return {
            **public_assets,
            "abstract_image": abstract_image,
            "primary_visual_asset": visual_asset,
            "narration": narration,
            "animated_clip": animated_clip,
            "character_render": character_render,
        }

    @staticmethod
    def _first_generated_url(response: dict[str, Any]) -> str | None:
        data = response.get("data") or []
        if data and isinstance(data[0], dict):
            return data[0].get("url") or data[0].get("b64_json")
        return response.get("url")

    @staticmethod
    def _build_render_payload(
        *,
        job_id: str,
        topic: str,
        language: str,
        scenes: list[StoryScene],
        manifests: list[dict[str, Any]],
    ) -> dict[str, Any]:
        manifest_by_scene = {
            manifest["scene_number"]: manifest for manifest in manifests
        }
        return {
            "jobId": job_id,
            "topic": topic,
            "language": language,
            "aspectRatio": "21:9",
            "backgroundMusic": {
                "duckingAmount": 0.85,
                "transitionSfx": ["whoosh", "deep-boom"],
            },
            "scenes": [
                {
                    **scene.model_dump(),
                    "assets": manifest_by_scene.get(scene.scene_number, {}),
                }
                for scene in scenes
            ],
        }
