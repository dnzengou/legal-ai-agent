import logging
import os
import threading
import time
from collections import OrderedDict

from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)

_MAX_TRACKED_IPS = 10_000


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        logger.warning("Invalid %s=%r; using default %d", name, raw, default)
        return default


def _env_bool(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in {"1", "true", "yes", "on"}


class _Bucket:
    __slots__ = ("tokens", "last_refill")

    def __init__(self, capacity: float) -> None:
        self.tokens = capacity
        self.last_refill = time.monotonic()


class RateLimiter:
    """Per-key token bucket. Thread-safe, capped to bound memory."""

    def __init__(self, per_min: int, burst: int) -> None:
        self.per_min = per_min
        self.capacity = float(burst)
        self.refill_per_sec = per_min / 60.0
        self.enabled = per_min > 0 and burst > 0
        self.buckets: OrderedDict[str, _Bucket] = OrderedDict()
        self.lock = threading.Lock()

    def check(self, key: str) -> tuple[bool, float]:
        """Try to consume 1 token for `key`. Returns (allowed, retry_after_seconds)."""
        if not self.enabled:
            return True, 0.0
        now = time.monotonic()
        with self.lock:
            bucket = self.buckets.get(key)
            if bucket is None:
                if len(self.buckets) >= _MAX_TRACKED_IPS:
                    self.buckets.popitem(last=False)
                bucket = _Bucket(self.capacity)
                self.buckets[key] = bucket
            else:
                self.buckets.move_to_end(key)
                elapsed = now - bucket.last_refill
                bucket.tokens = min(self.capacity, bucket.tokens + elapsed * self.refill_per_sec)
                bucket.last_refill = now
            if bucket.tokens >= 1.0:
                bucket.tokens -= 1.0
                return True, 0.0
            retry = (1.0 - bucket.tokens) / self.refill_per_sec
            return False, retry

    def reset(self) -> None:
        with self.lock:
            self.buckets.clear()


_limiter = RateLimiter(
    per_min=_env_int("RATE_LIMIT_PER_MIN", 30),
    burst=_env_int("RATE_LIMIT_BURST", 60),
)
_TRUST_PROXY_HEADERS = _env_bool("TRUST_PROXY_HEADERS")

if not _limiter.enabled:
    logger.info("Rate limiting disabled (RATE_LIMIT_PER_MIN or RATE_LIMIT_BURST <= 0)")


def _client_key(request: Request) -> str:
    if _TRUST_PROXY_HEADERS:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            first = fwd.split(",", 1)[0].strip()
            if first:
                return first
    return request.client.host if request.client else "unknown"


def rate_limit(request: Request) -> None:
    allowed, retry = _limiter.check(_client_key(request))
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(max(1, int(retry + 0.999)))},
        )
