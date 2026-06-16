from __future__ import annotations

from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models import SceneAsset, VideoProject
from app.schemas import StoryScene
from app.services.providers import ProviderClients
from app.services.video_assembly import VideoAssemblyService


class MediaPipelineService:
    def __init__(self, settings: Settings, providers: ProviderClients) -> None:
        self.settings = settings
        self.providers = providers
        self.video_assembly = VideoAssemblyService(settings)

    async def process_project(self, db: AsyncSession, project_id: str) -> None:
        project = await db.get(VideoProject, project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found.")

        project.status = "researching_assets"
        await db.commit()

        project_dir = self.settings.storage_path / project.id
        project_dir.mkdir(parents=True, exist_ok=True)

        scenes = [StoryScene.model_validate(scene) for scene in project.script_payload]
        subtitle_tracks: list[dict[str, Any]] = []
        rendered_scenes: list[dict[str, Any]] = []

        for scene in scenes:
            fact_payload = await self.providers.fetch_wikipedia_facts(project.topic)

            archival_media: list[dict[str, Any]] = []
            generated_media: dict[str, Any] | None = None
            if scene.is_abstract_scene:
                generated_media = await self.providers.generate_flux_image(
                    prompt=f"{project.topic}. {scene.narration_text}. Photorealistic, cinematic, documentary still.",
                    project_dir=project_dir,
                    scene_number=scene.scene_number,
                )
            else:
                archival_media = await self.providers.fetch_wikimedia_commons_media(
                    f"{project.topic} {' '.join(scene.visual_keywords)}"
                )
                archival_media.extend(
                    await self.providers.fetch_internet_archive_media(
                        f"{project.topic} {' '.join(scene.visual_keywords)}"
                    )
                )

            stock_media = await self.providers.fetch_pexels_videos(scene.visual_keywords)
            stock_media.extend(await self.providers.fetch_pixabay_videos(scene.visual_keywords))
            narration_manifest = await self.providers.synthesize_narration(
                text=scene.narration_text,
                project_dir=project_dir,
                scene_number=scene.scene_number,
            )
            subtitle_tracks.append(
                {
                    "sceneNumber": scene.scene_number,
                    "timestamps": narration_manifest["raw"].get("alignment") or narration_manifest["raw"],
                }
            )

            reference_image_url = self._pick_reference_image_url(archival_media, generated_media)
            motion_clip = None
            if reference_image_url:
                motion_clip = await self.providers.animate_image_with_wan(
                    media_path=reference_image_url,
                    prompt=scene.narration_text,
                    project_dir=project_dir,
                    scene_number=scene.scene_number,
                )

            final_character_clip = None
            if scene.is_historical_character and reference_image_url:
                liveportrait_output = await self.providers.run_liveportrait(
                    image_url=reference_image_url,
                    audio_manifest=narration_manifest,
                )
                final_character_clip = await self.providers.run_deepvideo(
                    liveportrait_output=liveportrait_output,
                    prompt=scene.narration_text,
                )

            asset = SceneAsset(
                project_id=project.id,
                scene_number=scene.scene_number,
                fact_payload=fact_payload,
                archival_media_payload=archival_media or None,
                stock_media_payload=stock_media or None,
                generated_media_payload=generated_media,
                motion_clip_payload=motion_clip,
                final_clip_payload=final_character_clip,
                is_historical_character=scene.is_historical_character,
                character_name=scene.character_name,
            )
            db.add(asset)

            rendered_scenes.append(
                {
                    **scene.model_dump(mode="json"),
                    "facts": fact_payload,
                    "archivalMedia": archival_media,
                    "stockMedia": stock_media,
                    "generatedMedia": generated_media,
                    "motionClip": motion_clip,
                    "characterClip": final_character_clip,
                }
            )

        project.status = "rendering_video"
        project.subtitles_payload = {"tracks": subtitle_tracks}
        await db.commit()

        render_payload = self.video_assembly.build_render_payload(project.id, rendered_scenes, subtitle_tracks)
        output_path = self.video_assembly.render_documentary(render_payload, project_dir)
        project.render_output_url = output_path
        project.status = "completed"
        await db.commit()

    @staticmethod
    def _pick_reference_image_url(
        archival_media: list[dict[str, Any]],
        generated_media: dict[str, Any] | None,
    ) -> str | None:
        for item in archival_media:
            if item.get("url"):
                return item["url"]
        if generated_media:
            return generated_media.get("manifest_path")
        return None

    async def list_recent_projects(self, db: AsyncSession, user_id: str) -> list[VideoProject]:
        result = await db.execute(
            select(VideoProject).where(VideoProject.user_id == user_id).order_by(VideoProject.created_at.desc()).limit(10)
        )
        return list(result.scalars().all())
