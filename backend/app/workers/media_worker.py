"""
Asynchronous background pipeline worker.

Full pipeline per project:
  1. Fetch media for each scene (Wikimedia, Archive.org, Pexels, Pixabay, Flux AI)
  2. Synthesize narration audio scene-by-scene (ElevenLabs)
  3. Animate static images (Wan2.1)
  4. Lip-sync + DeepVideo for historical character scenes
  5. Assemble final video (FFmpeg via VideoService)
  6. Upload to Supabase Storage
  7. Update DB with output URL and status
"""

import asyncio
import os
import structlog
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.video_project import VideoProject, VideoScene, VideoStatus
from app.services.scraper_service import ScraperService
from app.services.elevenlabs_service import ElevenLabsService
from app.services.video_service import VideoService
from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


async def _update_project(
    db: AsyncSession,
    project_id: str,
    status: VideoStatus,
    progress: int,
    error: str = None,
    **kwargs,
):
    result = await db.execute(select(VideoProject).where(VideoProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        return
    project.status = status
    project.progress_percent = progress
    if error:
        project.error_message = error
    for k, v in kwargs.items():
        setattr(project, k, v)
    await db.commit()


async def process_project_media(project_id: str):
    """
    Full end-to-end media pipeline for a video project.
    Runs as a FastAPI BackgroundTask.
    """
    log = logger.bind(project=project_id)
    log.info("pipeline.start")

    scraper = ScraperService()
    tts = ElevenLabsService()
    video_svc = VideoService()

    async with AsyncSessionLocal() as db:
        # ── Load project + scenes ──────────────────────────────────────────────
        result = await db.execute(
            select(VideoProject).where(VideoProject.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            log.error("pipeline.project_not_found")
            return

        scenes_result = await db.execute(
            select(VideoScene)
            .where(VideoScene.project_id == project_id)
            .order_by(VideoScene.scene_number)
        )
        scenes: list[VideoScene] = scenes_result.scalars().all()
        total = len(scenes)

        try:
            # ─── Stage 1: Media fetching ─────────────────────────────────────
            await _update_project(db, project_id, VideoStatus.FETCHING_MEDIA, 5)
            log.info("pipeline.fetching_media", total_scenes=total)

            for i, scene in enumerate(scenes):
                scene_id = str(scene.id)
                keywords = scene.visual_keywords or []

                if scene.is_abstract_scene:
                    # Generate Flux AI image for conceptual scenes
                    flux_prompt = " ".join(keywords[:5])
                    local_path = await scraper.generate_flux_image(flux_prompt, scene_id, scene.scene_number)
                    if local_path:
                        scene.image_url = local_path
                else:
                    # Fetch real archival image from Wikimedia / Archive.org
                    query = " ".join(keywords[:3])
                    img_url = await scraper.fetch_wikimedia_image(query)
                    if img_url:
                        dest = os.path.join(settings.ASSETS_DIR, f"{scene_id}_archival.jpg")
                        local = await scraper.download_asset(img_url, dest)
                        scene.image_url = local or img_url
                    if not scene.image_url:
                        scene.image_url = await scraper.fetch_archive_media(query)

                # Always try to fetch B-roll stock footage
                stock = await scraper.fetch_pexels_video(keywords)
                if not stock:
                    stock = await scraper.fetch_pixabay_video(keywords)
                if stock:
                    dest = os.path.join(settings.ASSETS_DIR, f"{scene_id}_stock.mp4")
                    local = await scraper.download_asset(stock, dest)
                    scene.stock_footage_url = local or stock

                scene.media_fetched = True
                await db.commit()
                progress = 5 + int((i + 1) / total * 25)
                await _update_project(db, project_id, VideoStatus.FETCHING_MEDIA, progress)

            # ─── Stage 2: ElevenLabs Audio Synthesis ─────────────────────────
            await _update_project(db, project_id, VideoStatus.GENERATING_AUDIO, 30)
            log.info("pipeline.generating_audio")

            scene_dicts = [{"narration_text": s.narration_text} for s in scenes]
            audio_result = await tts.synthesize_full_narration(scene_dicts, project_id)
            narration_audio_path = audio_result["audio_path"]
            word_timestamps = audio_result["word_timestamps"]

            # Update project with audio + timestamps
            result2 = await db.execute(select(VideoProject).where(VideoProject.id == project_id))
            proj = result2.scalar_one()
            proj.audio_url = narration_audio_path
            proj.word_timestamps = word_timestamps
            await db.commit()

            # ─── Stage 3: Animation (Wan2.1) ─────────────────────────────────
            await _update_project(db, project_id, VideoStatus.ANIMATING, 40)
            log.info("pipeline.animating")

            clip_paths: list[str] = []

            for i, scene in enumerate(scenes):
                scene_id = str(scene.id)
                source_image = scene.image_url
                final_clip = None

                if source_image and os.path.isfile(source_image):
                    # Animate static image
                    keywords_str = " ".join(scene.visual_keywords or [])
                    animated = await video_svc.animate_image_wan(
                        source_image, scene_id, prompt=keywords_str
                    )
                    if animated:
                        scene.video_clip_url = animated
                        scene.animated = True

                        if scene.is_historical_character and scene.character_name:
                            # Build audio slice path (simplified: use full audio for now)
                            audio_slice = narration_audio_path
                            lipsync = await video_svc.run_liveportrait(
                                source_image, audio_slice, scene_id
                            )
                            if lipsync:
                                scene.lipsync_video_url = lipsync
                                scene.lipsync_done = True
                                deepvideo = await video_svc.run_deepvideo(lipsync, scene_id)
                                final_clip = deepvideo or lipsync
                            else:
                                final_clip = animated
                        else:
                            final_clip = animated

                # Fall back to stock footage if animation failed
                if not final_clip and scene.stock_footage_url and os.path.isfile(scene.stock_footage_url or ""):
                    final_clip = scene.stock_footage_url

                if final_clip:
                    scene.final_clip_url = final_clip
                    clip_paths.append(final_clip)

                await db.commit()
                progress = 40 + int((i + 1) / total * 30)
                await _update_project(db, project_id, VideoStatus.ANIMATING, progress)

            # ─── Stage 4: FFmpeg Final Assembly ──────────────────────────────
            await _update_project(db, project_id, VideoStatus.ASSEMBLING, 70)
            log.info("pipeline.assembling", clips=len(clip_paths))

            if not clip_paths:
                raise RuntimeError("No video clips were generated for assembly")

            result3 = await db.execute(select(VideoProject).where(VideoProject.id == project_id))
            proj = result3.scalar_one()

            output_path = await video_svc.assemble_final_video(
                scene_clip_paths=clip_paths,
                narration_audio_path=narration_audio_path,
                word_timestamps=word_timestamps,
                background_music_path=None,  # TODO: wire up BG music library
                project_id=project_id,
                aspect_ratio=proj.aspect_ratio.value if proj.aspect_ratio else "21:9",
            )

            # ─── Stage 5: Thumbnail ───────────────────────────────────────────
            await _update_project(db, project_id, VideoStatus.RENDERING, 90)
            thumb_path = await video_svc.generate_thumbnail(output_path, project_id)

            # ─── Stage 6: Finalize ────────────────────────────────────────────
            result4 = await db.execute(select(VideoProject).where(VideoProject.id == project_id))
            proj = result4.scalar_one()
            proj.status = VideoStatus.COMPLETED
            proj.progress_percent = 100
            proj.output_video_url = output_path
            proj.thumbnail_url = thumb_path
            proj.completed_at = datetime.now(timezone.utc)
            await db.commit()

            log.info("pipeline.complete", output=output_path)

        except Exception as exc:
            log.error("pipeline.failed", error=str(exc))
            await _update_project(
                db, project_id,
                VideoStatus.FAILED, 0,
                error=str(exc),
            )
