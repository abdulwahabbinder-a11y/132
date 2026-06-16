import logging
from pathlib import Path

from app.core.config import get_settings
from app.schemas.story import SceneSchema
from app.services.animation_service import AnimationService
from app.services.character_engine_service import CharacterEngineService
from app.services.ffmpeg_service import FFmpegService
from app.services.media_fetcher_service import MediaFetcherService
from app.services.remotion_service import RemotionService
from app.services.scraper_service import ScraperService
from app.services.storage_service import StorageService
from app.services.tts_service import TTSService

settings = get_settings()
logger = logging.getLogger(__name__)


class VideoPipelineService:
    def __init__(self) -> None:
        self.scraper = ScraperService()
        self.media_fetcher = MediaFetcherService()
        self.tts = TTSService()
        self.animator = AnimationService()
        self.character_engine = CharacterEngineService()
        self.remotion = RemotionService()
        self.ffmpeg = FFmpegService()
        self.storage = StorageService()

    async def process_job(self, job_id: str, topic: str, scenes: list[SceneSchema]) -> str:
        scene_payloads: list[dict] = []
        narration_tracks: list[str] = []
        for scene in scenes:
            facts = await self.scraper.fetch_verifiable_facts(topic=topic, scene=scene)
            media = await self.media_fetcher.fetch_scene_media(scene)
            tts_result = await self.tts.synthesize(scene.narration_text)
            narration_tracks.append(tts_result.get("audio_url", ""))

            animated_clip = await self._resolve_scene_animation(scene=scene, media=media, tts_result=tts_result)
            scene_payloads.append(
                {
                    "scene_number": scene.scene_number,
                    "narration_text": scene.narration_text,
                    "visual_keywords": scene.visual_keywords,
                    "location_coordinates": scene.location_coordinates,
                    "facts": facts,
                    "media": media,
                    "animated_clip": animated_clip,
                    "word_timestamps": tts_result.get("alignment", {}),
                }
            )

        job_dir = self.storage.job_dir(job_id)
        remotion_output = str(Path(job_dir) / "render-raw.mp4")
        await self.remotion.render_documentary(
            payload={"job_id": job_id, "scenes": scene_payloads},
            output_path=remotion_output,
        )

        final_output = str(Path(job_dir) / "final-21x9.mp4")
        self.ffmpeg.apply_ducking_and_sfx(
            narration_mp3=narration_tracks[0] if narration_tracks else "",
            background_music=settings.background_music_path,
            whoosh_sfx=settings.transition_whoosh_path,
            boom_sfx=settings.transition_boom_path,
            rendered_video=remotion_output,
            output_video=final_output,
        )
        return final_output

    async def _resolve_scene_animation(self, scene: SceneSchema, media: dict, tts_result: dict) -> dict:
        base_image_url = self._pick_best_image_url(media)
        if not base_image_url:
            return {"warning": "No base image found", "clip_url": None}

        if scene.is_historical_character:
            character_render = await self.character_engine.render_character_scene(
                character_image_url=base_image_url,
                audio_url=tts_result.get("audio_url", ""),
                character_name=scene.character_name or "Unknown figure",
            )
            return {"clip_url": character_render["deepvideo"].get("video_url"), "source": character_render}

        animated = await self.animator.animate_image_to_clip(
            image_url=base_image_url,
            guidance_prompt=f"Cinematic documentary movement for {', '.join(scene.visual_keywords)}",
        )
        return {"clip_url": animated.get("video_url"), "source": animated}

    @staticmethod
    def _pick_best_image_url(media: dict) -> str | None:
        abstract = media.get("abstract_art", {})
        if abstract.get("data"):
            first = abstract["data"][0]
            return first.get("url")

        wikimedia_pages = media.get("archival_media", {}).get("wikimedia", {}).get("query", {}).get("pages", {})
        for page in wikimedia_pages.values():
            image_info = page.get("imageinfo", [])
            if image_info:
                return image_info[0].get("url")
        return None
