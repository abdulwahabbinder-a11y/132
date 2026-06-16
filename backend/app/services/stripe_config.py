from app.config import get_settings
from app.services.settings_service import get_platform_setting


def stripe_secret_key() -> str:
    return get_platform_setting("stripe_secret_key") or get_settings().stripe_secret_key


def stripe_webhook_secret() -> str:
    return get_platform_setting("stripe_webhook_secret") or get_settings().stripe_webhook_secret


def stripe_pro_price_id() -> str:
    return get_platform_setting("stripe_pro_price_id") or get_settings().stripe_pro_price_id
