"""Auth middleware tests. Uses TestClient + dependency override for the agent."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from api import app as app_module
from api import auth as auth_module
from src.schema import ContractReview, KeyClause, Risk


@pytest.fixture
def fake_review() -> ContractReview:
    return ContractReview(
        summary="Fake review.",
        parties=["A", "B"],
        effective_date=None,
        term=None,
        key_clauses=[KeyClause(type="termination", summary="x", text_excerpt="y")],
        risks=[Risk(severity="low", category="x", description="y", clause_ref="1")],
        recommendations=["z"],
    )


@pytest.fixture
def client_with_keys(monkeypatch, fake_review):
    monkeypatch.setattr(auth_module, "_API_KEYS", frozenset({"good-key"}))
    monkeypatch.setattr(app_module.agent, "review", MagicMock(return_value=fake_review))
    return TestClient(app_module.app)


@pytest.fixture
def client_no_keys(monkeypatch, fake_review):
    monkeypatch.setattr(auth_module, "_API_KEYS", frozenset())
    monkeypatch.setattr(app_module.agent, "review", MagicMock(return_value=fake_review))
    return TestClient(app_module.app)


VALID_BODY = {"contract_text": "x" * 100}


def test_health_is_unauthenticated(client_with_keys):
    r = client_with_keys.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_review_rejects_missing_key(client_with_keys):
    r = client_with_keys.post("/review", json=VALID_BODY)
    assert r.status_code == 401
    assert r.headers.get("WWW-Authenticate") == "ApiKey"


def test_review_rejects_wrong_key(client_with_keys):
    r = client_with_keys.post("/review", json=VALID_BODY, headers={"X-API-Key": "bad-key"})
    assert r.status_code == 401


def test_review_accepts_valid_key(client_with_keys):
    r = client_with_keys.post("/review", json=VALID_BODY, headers={"X-API-Key": "good-key"})
    assert r.status_code == 200
    assert r.json()["summary"] == "Fake review."


def test_review_pdf_rejects_missing_key(client_with_keys):
    r = client_with_keys.post("/review-pdf", json={"pdf_base64": "A" * 200})
    assert r.status_code == 401


def test_empty_allowlist_disables_auth(client_no_keys):
    r = client_no_keys.post("/review", json=VALID_BODY)
    assert r.status_code == 200


def test_load_api_keys_parses_csv(monkeypatch):
    monkeypatch.setenv("API_KEYS", " k1 , k2,,k3 ")
    assert auth_module._load_api_keys() == frozenset({"k1", "k2", "k3"})


def test_load_api_keys_empty_when_unset(monkeypatch):
    monkeypatch.delenv("API_KEYS", raising=False)
    assert auth_module._load_api_keys() == frozenset()
