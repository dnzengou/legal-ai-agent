import hmac
import logging
import os

from fastapi import Header, HTTPException, status

logger = logging.getLogger(__name__)


def _load_api_keys() -> frozenset[str]:
    raw = os.getenv("API_KEYS", "").strip()
    if not raw:
        return frozenset()
    return frozenset(k.strip() for k in raw.split(",") if k.strip())


_API_KEYS = _load_api_keys()

if not _API_KEYS:
    logger.warning("API_KEYS not set — auth is DISABLED; do not run this configuration in production")


def require_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
    if not _API_KEYS:
        return
    if x_api_key is None or not any(hmac.compare_digest(x_api_key, k) for k in _API_KEYS):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )
