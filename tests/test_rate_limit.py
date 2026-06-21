"""Rate limit tests. Uses TestClient with the agent patched to skip Anthropic."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from api import app as app_module
from api import auth as auth_module
from api import rate_limit as rl
from src.schema import ContractReview, KeyClause, Risk


@pytest.fixture
def fake_review() -> ContractReview:
    return ContractReview(
        summary="ok",
        parties=["A", "B"],
        effective_date=None,
        term=None,
        key_clauses=[KeyClause(type="x", summary="y", text_excerpt="z")],
        risks=[Risk(severity="low", category="x", description="y", clause_ref="1")],
        recommendations=["r"],
    )


@pytest.fixture
def client(monkeypatch, fake_review):
    monkeypatch.setattr(auth_module, "_API_KEYS", frozenset())
    monkeypatch.setattr(app_module.agent, "review", MagicMock(return_value=fake_review))
    return TestClient(app_module.app)


def _tighten(limiter, *, per_min: int, burst: int) -> None:
    limiter.per_min = per_min
    limiter.capacity = float(burst)
    limiter.refill_per_sec = per_min / 60.0
    limiter.enabled = per_min > 0 and burst > 0
    limiter.reset()


VALID_BODY = {"contract_text": "x" * 100}


def test_under_burst_all_succeed(client):
    _tighten(rl._limiter, per_min=60, burst=5)
    for _ in range(5):
        r = client.post("/review", json=VALID_BODY)
        assert r.status_code == 200


def test_exceeding_burst_returns_429(client):
    _tighten(rl._limiter, per_min=1, burst=2)
    assert client.post("/review", json=VALID_BODY).status_code == 200
    assert client.post("/review", json=VALID_BODY).status_code == 200
    r = client.post("/review", json=VALID_BODY)
    assert r.status_code == 429
    assert int(r.headers["Retry-After"]) >= 1


def test_health_not_rate_limited(client):
    _tighten(rl._limiter, per_min=1, burst=1)
    rl._limiter.check("testclient")  # drain the bucket
    rl._limiter.check("testclient")
    for _ in range(5):
        assert client.get("/health").status_code == 200


def test_disabled_when_per_min_zero(client):
    _tighten(rl._limiter, per_min=0, burst=10)
    for _ in range(20):
        assert client.post("/review", json=VALID_BODY).status_code == 200


def test_forwarded_for_used_when_trusted(client, monkeypatch):
    monkeypatch.setattr(rl, "_TRUST_PROXY_HEADERS", True)
    _tighten(rl._limiter, per_min=1, burst=1)
    headers_a = {"X-Forwarded-For": "1.1.1.1"}
    headers_b = {"X-Forwarded-For": "2.2.2.2"}
    assert client.post("/review", json=VALID_BODY, headers=headers_a).status_code == 200
    # different client IP: independent bucket
    assert client.post("/review", json=VALID_BODY, headers=headers_b).status_code == 200
    # same as first: should now be limited
    assert client.post("/review", json=VALID_BODY, headers=headers_a).status_code == 429


def test_forwarded_for_ignored_when_untrusted(client, monkeypatch):
    monkeypatch.setattr(rl, "_TRUST_PROXY_HEADERS", False)
    _tighten(rl._limiter, per_min=1, burst=1)
    assert client.post("/review", json=VALID_BODY, headers={"X-Forwarded-For": "1.1.1.1"}).status_code == 200
    # second request from same testclient host is limited regardless of XFF
    assert client.post("/review", json=VALID_BODY, headers={"X-Forwarded-For": "2.2.2.2"}).status_code == 429


def test_bucket_refills_over_time(monkeypatch):
    _tighten(rl._limiter, per_min=600, burst=1)  # 10 tok/sec refill
    # call order: check() → monotonic; _Bucket() → monotonic; check() → monotonic; check() → monotonic
    times = iter([100.0, 100.0, 100.0, 100.5])
    monkeypatch.setattr(rl.time, "monotonic", lambda: next(times))
    assert rl._limiter.check("k") == (True, 0.0)  # consume 1
    allowed, retry = rl._limiter.check("k")  # same instant, empty
    assert not allowed and retry > 0
    allowed, _ = rl._limiter.check("k")  # 0.5s later, refilled to cap
    assert allowed


def test_bucket_eviction_under_pressure(monkeypatch):
    monkeypatch.setattr(rl, "_MAX_TRACKED_IPS", 3)
    _tighten(rl._limiter, per_min=60, burst=10)
    for ip in ("a", "b", "c", "d"):
        rl._limiter.check(ip)
    assert len(rl._limiter.buckets) == 3
    assert "a" not in rl._limiter.buckets  # LRU evicted
    assert "d" in rl._limiter.buckets
