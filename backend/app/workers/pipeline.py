from __future__ import annotations

from pathlib import Path
from uuid import UUID

from app.core.config import Settings
from app.db.supabase import SupabaseGateway
from app.schemas import (
    DocumentaryRenderManifest,
    GenerateStoryRequest,
    SceneRenderManifest,
    StoryScene,
)
from app.services.elevenlabs import ElevenLabsClient
from app.services.nim_client import NimClient
from app.services.public_data import PublicDataMediaFetcher
from app.services.remotion_renderer import RemotionRenderer
from app.services.video_engines import CharacterVideoEngine


async def process_documentary_generation(
    *,
    settings: Settings,
    generation_id: UUID,
    user_id: UUID,
    request: GenerateStoryRequest,
    scenes: list[StoryScene],
) -> None:
    """Run the complete post-script documentary generation pipeline."""

    supabase = SupabaseGateway(settings)
    generation_dir = Path(settings.asset_output_dir) / str(generation_id)
    generation_dir.mkdir(parents=True, exist_ok=True)

    try:
        await supabase.update_generation_job(generation_id, status="processing")
        nim = NimClient(settings)
        facts_fetcher = PublicDataMediaFetcher(settings)
        speech = ElevenLabsClient(settings)
        character_engine = CharacterVideoEngine(settings)
        renderer = RemotionRenderer(settings)

        global_facts = await facts_fetcher.fetch_timeline_facts(request.topic)
        scene_manifests: list[SceneRenderManifest] = []

        for scene in scenes:
            scene_dir = generation_dir / f"scene-{scene.scene_number:03d}"
            scene_dir.mkdir(parents=True, exist_ok=True)
            assets = await facts_fetcher.fetch_scene_assets(scene, scene_dir, nim)
            voiceover = await speech.synthesize_scene(
                scene_number=scene.scene_number,
                narration_text=scene.narration_text,
                output_dir=scene_dir,
            )
            clip_path = await character_engine.create_cinematic_clip(
                scene=scene,
                assets=assets,
                voiceover=voiceover,
                output_dir=scene_dir,
            )
            scene_manifests.append(
                SceneRenderManifest(
                    scene=scene,
                    facts=global_facts,
                    assets=assets,
                    voiceover=voiceover,
                    cinematic_clip_path=clip_path,
                )
            )

        manifest = DocumentaryRenderManifest(
            generation_id=generation_id,
            topic=request.topic,
            language=request.language,
            scenes=scene_manifests,
            mapbox_access_token=settings.mapbox_access_token,
        )
        final_path = await renderer.render_documentary(manifest, generation_dir)
        await supabase.update_generation_job(
            generation_id,
            status="completed",
            render_manifest=manifest.model_dump(mode="json"),
            final_video_path=final_path,
        )
    except Exception as exc:  # noqa: BLE001 - stores full pipeline failure for operator triage.
        await supabase.update_generation_job(generation_id, status="failed", error_message=str(exc))
        raise
