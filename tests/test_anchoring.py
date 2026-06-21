"""Citation / quote-anchoring tests for LegalAgent._anchor_clauses."""

import logging
from unittest.mock import MagicMock

import pytest

from src.agent import LegalAgent, _anchor_clauses
from src.schema import ContractReview, KeyClause, Risk


def _review_with(*excerpts: str) -> ContractReview:
    return ContractReview(
        summary="x",
        parties=["A", "B"],
        effective_date=None,
        term=None,
        key_clauses=[
            KeyClause(type="t", summary="s", text_excerpt=e) for e in excerpts
        ],
        risks=[Risk(severity="low", category="c", description="d", clause_ref="1")],
        recommendations=["r"],
    )


def test_anchors_verbatim_excerpt():
    source = "Preamble. Section 5: Either party may terminate on 30 days notice. End."
    review = _review_with("Either party may terminate on 30 days notice.")
    out = _anchor_clauses(review, source)
    c = out.key_clauses[0]
    assert c.char_start == source.index("Either")
    assert c.char_end == c.char_start + len(c.text_excerpt)
    assert source[c.char_start : c.char_end] == c.text_excerpt


def test_leaves_offsets_null_on_non_verbatim(caplog):
    source = "Section 5: Either party may terminate on 30 days notice."
    review = _review_with("Either party may terminate on thirty days notice.")  # spelled out
    with caplog.at_level(logging.WARNING, logger="src.agent"):
        out = _anchor_clauses(review, source)
    assert out.key_clauses[0].char_start is None
    assert out.key_clauses[0].char_end is None
    assert "could not be anchored" in caplog.text


def test_first_occurrence_wins_when_excerpt_repeats():
    source = "boilerplate boilerplate boilerplate"
    review = _review_with("boilerplate")
    out = _anchor_clauses(review, source)
    assert out.key_clauses[0].char_start == 0
    assert out.key_clauses[0].char_end == len("boilerplate")


def test_mixed_clauses_partial_anchor(caplog):
    source = "Quote A here. Then nothing else relevant."
    review = _review_with("Quote A here.", "Quote B nowhere")
    with caplog.at_level(logging.WARNING, logger="src.agent"):
        out = _anchor_clauses(review, source)
    assert out.key_clauses[0].char_start == 0
    assert out.key_clauses[1].char_start is None
    assert "1/2 key clauses" in caplog.text


def test_overrides_model_supplied_offsets():
    """Even if the model returns offsets, the server's post-process owns the value."""
    source = "Hello world."
    review = _review_with("Hello")
    review.key_clauses[0].char_start = 999
    review.key_clauses[0].char_end = 1234
    out = _anchor_clauses(review, source)
    assert out.key_clauses[0].char_start == 0
    assert out.key_clauses[0].char_end == 5


def test_agent_review_calls_anchoring(monkeypatch):
    """End-to-end: agent.review() should anchor against the source it was given."""
    source = "Whereas the parties agree to terminate immediately upon breach."
    review = _review_with("terminate immediately upon breach")
    client = MagicMock()
    client.messages.parse.return_value = MagicMock(parsed_output=review)
    agent = LegalAgent(client=client)
    result = agent.review(source)
    c = result.key_clauses[0]
    assert c.char_start == source.index("terminate immediately upon breach")
    assert source[c.char_start : c.char_end] == c.text_excerpt


def test_agent_review_pdf_does_not_anchor():
    """PDF path has no plain-text source; offsets must remain null."""
    review = _review_with("verbatim PDF text")
    client = MagicMock()
    client.messages.parse.return_value = MagicMock(parsed_output=review)
    agent = LegalAgent(client=client)
    fake_pdf = "JVBERi0xLjQK" + "A" * 200
    result = agent.review_pdf(fake_pdf)
    assert result.key_clauses[0].char_start is None
    assert result.key_clauses[0].char_end is None
