import os

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-not-used")

import pytest


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Drop bucket state between tests so HTTP tests don't bleed into each other."""
    from api import rate_limit as rl

    rl._limiter.reset()
    yield
    rl._limiter.reset()
