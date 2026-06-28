"""Deterministic safety-scoring tests (no network)."""

from unittest.mock import MagicMock

from src.scoring import compute_safety_score, letter_grade, SEVERITY_DEDUCTION
from src.agent import LegalAgent, _apply_score
from src.schema import ContractReview, KeyClause, Risk


def _risk(severity: str) -> Risk:
    return Risk(severity=severity, category="c", description="d", clause_ref="1")


def _review(*severities: str) -> ContractReview:
    return ContractReview(
        summary="x",
        parties=["A", "B"],
        key_clauses=[KeyClause(type="t", summary="s", text_excerpt="e")],
        risks=[_risk(s) for s in severities],
        recommendations=["r"],
    )


def test_no_risks_scores_100_grade_a():
    assert compute_safety_score([]) == 100
    assert letter_grade(100) == "A"


def test_single_high_risk_deduction():
    assert compute_safety_score([_risk("high")]) == 100 - SEVERITY_DEDUCTION["high"]


def test_severity_weights_distinct():
    assert SEVERITY_DEDUCTION["high"] > SEVERITY_DEDUCTION["medium"] > SEVERITY_DEDUCTION["low"]


def test_score_is_clamped_to_zero():
    # 6 high risks would deduct 120; must clamp at 0, never negative.
    assert compute_safety_score([_risk("high")] * 6) == 0


def test_unknown_severity_does_not_deduct():
    bogus = MagicMock(severity="catastrophic")
    assert compute_safety_score([bogus]) == 100


def test_letter_grade_boundaries():
    assert letter_grade(90) == "A"
    assert letter_grade(89) == "B"
    assert letter_grade(80) == "B"
    assert letter_grade(79) == "C"
    assert letter_grade(70) == "C"
    assert letter_grade(69) == "D"
    assert letter_grade(60) == "D"
    assert letter_grade(59) == "F"
    assert letter_grade(0) == "F"


def test_apply_score_sets_fields():
    review = _review("high", "low")  # 100 - 20 - 3 = 77
    out = _apply_score(review)
    assert out.safety_score == 77
    assert out.letter_grade == "C"


def test_agent_review_scores_result():
    """End-to-end: agent.review() fills safety_score/letter_grade server-side."""
    review = _review("medium", "medium")  # 100 - 16 = 84 -> B
    client = MagicMock()
    client.messages.parse.return_value = MagicMock(parsed_output=review)
    result = LegalAgent(client=client).review("contract " * 20)
    assert result.safety_score == 84
    assert result.letter_grade == "B"


def test_agent_overrides_model_supplied_score():
    """Even if the model returns a score, the server owns the value."""
    review = _review("high")
    review.safety_score = 100  # model tried to claim a perfect score
    review.letter_grade = "A"
    out = _apply_score(review)
    assert out.safety_score == 80
    assert out.letter_grade == "B"
