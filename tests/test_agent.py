"""Smoke tests with mocked Anthropic client. No network."""

from unittest.mock import MagicMock
import pytest

from src.agent import LegalAgent, MAX_PDF_BYTES
from src.schema import ContractReview, KeyClause, Risk


@pytest.fixture
def fake_review() -> ContractReview:
    return ContractReview(
        summary="A SaaS subscription agreement between Acme and Buyer.",
        parties=["Acme Corp", "Buyer LLC"],
        effective_date="2026-01-01",
        term="2 years, auto-renewing",
        key_clauses=[
            KeyClause(type="termination", summary="30-day notice", text_excerpt="Either party may terminate..."),
        ],
        risks=[
            Risk(severity="high", category="auto_renewal", description="Renews without explicit consent", clause_ref="Section 5.2"),
        ],
        recommendations=["Negotiate opt-out for auto-renewal"],
    )


@pytest.fixture
def mock_client(fake_review):
    client = MagicMock()
    response = MagicMock()
    response.parsed_output = fake_review
    client.messages.parse.return_value = response
    return client


def test_review_returns_structured_output(mock_client, fake_review):
    agent = LegalAgent(client=mock_client)
    result = agent.review("This is a contract... " * 10, jurisdiction="US-DE", party_role="buyer")
    assert result == fake_review
    mock_client.messages.parse.assert_called_once()


def test_review_passes_jurisdiction_and_role(mock_client):
    agent = LegalAgent(client=mock_client)
    agent.review("Contract text " * 10, jurisdiction="EU", party_role="vendor")
    call_kwargs = mock_client.messages.parse.call_args.kwargs
    user_content = call_kwargs["messages"][0]["content"]
    assert "EU" in user_content
    assert "vendor" in user_content


def test_review_pdf_passes_document_block(mock_client, fake_review):
    agent = LegalAgent(client=mock_client)
    fake_pdf = "JVBERi0xLjQK" + "A" * 200  # fake base64
    result = agent.review_pdf(fake_pdf, jurisdiction="US-CA")
    assert result == fake_review
    call_kwargs = mock_client.messages.parse.call_args.kwargs
    content = call_kwargs["messages"][0]["content"]
    assert content[0]["type"] == "document"
    assert content[0]["source"]["media_type"] == "application/pdf"
    assert content[0]["source"]["data"] == fake_pdf


def test_review_pdf_rejects_oversized_payload(mock_client):
    agent = LegalAgent(client=mock_client)
    # Base64 expands 4:3, so produce a string that decodes > MAX_PDF_BYTES
    huge = "A" * (MAX_PDF_BYTES * 2)
    with pytest.raises(ValueError, match="exceeds"):
        agent.review_pdf(huge)


def test_review_request_uses_correct_model(mock_client):
    agent = LegalAgent(client=mock_client)
    agent.review("Contract " * 20)
    call_kwargs = mock_client.messages.parse.call_args.kwargs
    assert call_kwargs["model"] == "claude-opus-4-8"
    assert call_kwargs["thinking"] == {"type": "adaptive"}
    assert call_kwargs["output_config"] == {"effort": "high"}
