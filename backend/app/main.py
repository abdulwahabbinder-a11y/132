from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import stripe
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.dependencies import get_supabase, require_user
from app.core.config import Settings, get_settings
from app.db.supabase import SupabaseGateway
from app.schemas import AuthenticatedUser, GenerateStoryRequest, GenerateStoryResponse
from app.services.script_router import ScriptRouter
from app.workers.pipeline import process_documentary_generation


def create_app() -> FastAPI:
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key

    app = FastAPI(
        title="AI Documentary Video Generator API",
        version="0.1.0",
        description="Subscription-based backend for documentary script, asset, voice, and video generation.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/webhooks/stripe")
    async def stripe_webhook(
        request: Request,
        settings: Settings = Depends(get_settings),
        supabase: SupabaseGateway = Depends(get_supabase),
    ) -> dict[str, bool]:
        body = await request.body()
        signature = request.headers.get("stripe-signature")
        if not signature:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe signature")

        try:
            event = stripe.Webhook.construct_event(body, signature, settings.stripe_webhook_secret)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe payload") from exc
        except stripe.SignatureVerificationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe signature") from exc

        if event["type"] == "customer.subscription.created":
            subscription = event["data"]["object"]
            customer_id = subscription.get("customer")
            metadata_user_id = (subscription.get("metadata") or {}).get("supabase_user_id")
            current_period_end = subscription.get("current_period_end")
            billing_cycle_end = (
                datetime.fromtimestamp(current_period_end, tz=timezone.utc) if current_period_end else None
            )
            if not customer_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription missing customer")
            await supabase.reset_subscription_credits(
                stripe_customer_id=customer_id,
                plan_type="pro",
                billing_cycle_end=billing_cycle_end,
                metadata_user_id=metadata_user_id,
            )

        return {"received": True}

    @app.post("/api/generate-story", response_model=GenerateStoryResponse)
    async def generate_story(
        payload: GenerateStoryRequest,
        background_tasks: BackgroundTasks,
        user: AuthenticatedUser = Depends(require_user),
        settings: Settings = Depends(get_settings),
        supabase: SupabaseGateway = Depends(get_supabase),
    ) -> GenerateStoryResponse:
        subscription = await supabase.get_or_create_subscription(user.id)
        if subscription.video_credits_left <= 0:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="No video credits left. Upgrade to Pro or wait for your billing cycle reset.",
            )

        script_router = ScriptRouter(settings)
        scenes = await script_router.generate_story(payload)
        credits_left = await supabase.decrement_video_credit(user.id)
        generation_id = uuid4()
        await supabase.create_generation_job(
            generation_id=generation_id,
            user_id=user.id,
            topic=payload.topic,
            language=payload.language,
            scenes=[scene.model_dump(mode="json") for scene in scenes],
        )
        background_tasks.add_task(
            process_documentary_generation,
            settings=settings,
            generation_id=generation_id,
            user_id=user.id,
            request=payload,
            scenes=scenes,
        )
        return GenerateStoryResponse(generation_id=generation_id, scenes=scenes, credits_left=credits_left)

    return app


app = create_app()
