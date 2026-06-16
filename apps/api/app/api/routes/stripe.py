from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep
from app.services.stripe_service import StripeBillingService

router = APIRouter(tags=["billing"])


@router.post("/webhooks/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
    session: AsyncSession = Depends(db_session_dep),
) -> dict[str, str]:
    if not stripe_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe signature")

    payload = await request.body()
    service = StripeBillingService()
    event = service.construct_event(payload=payload, signature=stripe_signature)

    if event["type"] == "customer.subscription.created":
        await service.sync_subscription_created(session, event["data"]["object"])
        await session.commit()

    return {"received": "true"}
