"""Client tests — verify request construction and error mapping. No network."""

import io
import json
import sys
from pathlib import Path

import pytest

# examples/ isn't a package; add it to the path.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "examples"))

from client import LegalAIClient, LegalAIError  # noqa: E402


class _FakeResp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()


@pytest.fixture
def captured(monkeypatch):
    """Capture the urllib Request and return a canned JSON body."""
    box = {}

    def fake_urlopen(req, timeout=None):
        box["url"] = req.full_url
        box["method"] = req.get_method()
        box["headers"] = {k.lower(): v for k, v in req.header_items()}
        box["body"] = req.data.decode() if req.data else None
        box["timeout"] = timeout
        return _FakeResp(json.dumps({"safety_score": 84, "letter_grade": "B"}).encode())

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
    return box


def test_review_builds_post_with_key(captured):
    client = LegalAIClient("https://api.example.com/", api_key="secret", timeout=30)
    out = client.review("contract text", jurisdiction="US-DE", party_role="buyer")
    assert out == {"safety_score": 84, "letter_grade": "B"}
    assert captured["url"] == "https://api.example.com/review"  # trailing slash stripped
    assert captured["method"] == "POST"
    assert captured["headers"]["x-api-key"] == "secret"
    assert captured["headers"]["content-type"] == "application/json"
    assert captured["timeout"] == 30
    body = json.loads(captured["body"])
    assert body == {"contract_text": "contract text", "jurisdiction": "US-DE", "party_role": "buyer"}


def test_review_omits_optional_fields(captured):
    LegalAIClient("https://x").review("just text")
    assert json.loads(captured["body"]) == {"contract_text": "just text"}


def test_no_api_key_header_when_unset(captured):
    LegalAIClient("https://x").review("t")
    assert "x-api-key" not in captured["headers"]


def test_health_is_a_get_with_no_body(captured):
    LegalAIClient("https://x").health()
    assert captured["method"] == "GET"
    assert captured["url"] == "https://x/health"
    assert captured["body"] is None


def test_review_pdf_encodes_base64(captured, tmp_path):
    pdf = tmp_path / "c.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake")
    LegalAIClient("https://x", api_key="k").review_pdf(pdf_path=str(pdf))
    import base64
    assert json.loads(captured["body"])["pdf_base64"] == base64.b64encode(b"%PDF-1.4 fake").decode()


def test_review_pdf_requires_input():
    with pytest.raises(ValueError, match="pdf_path or pdf_base64"):
        LegalAIClient("https://x").review_pdf()


def test_http_error_maps_to_legalai_error(monkeypatch):
    import urllib.error

    def boom(req, timeout=None):
        raise urllib.error.HTTPError(
            req.full_url, 401, "Unauthorized", {}, io.BytesIO(b'{"detail": "Invalid or missing API key"}')
        )

    monkeypatch.setattr("urllib.request.urlopen", boom)
    with pytest.raises(LegalAIError) as ei:
        LegalAIClient("https://x", api_key="bad").review("t")
    assert ei.value.status == 401
    assert ei.value.detail == "Invalid or missing API key"
