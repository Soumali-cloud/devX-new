"""API-key protection for sensitive navigation operations."""

import secrets

from fastapi import Header, HTTPException

from backend.core.config import settings


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Require a configured API key; allow local development when none is set."""
    configured = [key for key in ([settings.API_KEY] + settings.API_KEYS) if key]
    if configured and not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header is required")
    if configured and not any(secrets.compare_digest(x_api_key, key) for key in configured):
        raise HTTPException(status_code=403, detail="Invalid API key")
