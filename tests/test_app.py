"""App-level tests: routes, hardening middleware, and response shape (no network)."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from api import app as app_module
from api import auth as auth_module
from src.schema import ComplianceFlag, ContractReview, KeyClause, Risk


@pytest.fixture
def fake_review() -> ContractReview:
    return ContractReview(
        summary="A SaaS agreement.",
        parties=["Acme", "Buyer"],
        key_clauses=[KeyClause(type="termination", summary="x", text_excerpt="y")],
        risks=[Risk(severity="high", category="auto_renewal", description="d", clause_ref="5")],
        compliance_flags=[ComplianceFlag(framework="GDPR", status="gap", note="No DPA")],
        recommendations=["Negotiate opt-out"],
        safety_score=80,
        letter_grade="B",
    )


@pytest.fixture
def client(monkeypatch, fake_review):
    monkeypatch.setattr(auth_module, "_API_KEYS", frozenset())  # auth off for these tests
    monkeypatch.setattr(app_module.agent, "review", MagicMock(return_value=fake_review))
    return TestClient(app_module.app)


def test_root_reports_version_and_endpoints(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["version"] == app_module.VERSION
    assert "/review" in body["endpoints"]


def test_health_version_matches(client):
    r = client.get("/health")
    assert r.json() == {"status": "ok", "version": app_module.VERSION}


def test_security_headers_present(client):
    r = client.get("/health")
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    assert r.headers["X-Frame-Options"] == "DENY"
    assert "default-src 'none'" in r.headers["Content-Security-Policy"]


def test_request_id_is_echoed(client):
    r = client.get("/health")
    assert r.headers.get("X-Request-ID")


def test_inbound_request_id_is_honored(client):
    r = client.get("/health", headers={"X-Request-ID": "trace-abc"})
    assert r.headers["X-Request-ID"] == "trace-abc"


def test_review_response_includes_score_and_compliance(client):
    r = client.post("/review", json={"contract_text": "x" * 100})
    assert r.status_code == 200
    body = r.json()
    assert body["safety_score"] == 80
    assert body["letter_grade"] == "B"
    assert body["compliance_flags"][0]["framework"] == "GDPR"
    assert body["compliance_flags"][0]["status"] == "gap"


def test_unhandled_error_is_sanitized(monkeypatch, fake_review):
    monkeypatch.setattr(auth_module, "_API_KEYS", frozenset())
    monkeypatch.setattr(app_module.agent, "review", MagicMock(side_effect=RuntimeError("boom secret")))
    # raise_server_exceptions=False so the registered handler's response is returned.
    client = TestClient(app_module.app, raise_server_exceptions=False)
    r = client.post("/review", json={"contract_text": "x" * 100})
    assert r.status_code == 500
    assert r.json() == {"detail": "Internal server error"}
    assert "boom secret" not in r.text
