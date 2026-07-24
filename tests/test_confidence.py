"""Anti-hallucination tests — provenance anchoring + confidence scoring.

Covers the three moving parts:
- confidence.compute_overall_confidence: math, edge cases
- confidence.downgrade_unanchored: unanchored findings get 'low' regardless of self-report
- agent._anchor_clauses: extends anchoring from KeyClause to Risk/ComplianceFlag provenance
- agent.review: end-to-end — fabricated citations get caught, confidence drops
"""

from unittest.mock import MagicMock

import pytest

from src.agent import LegalAgent, _anchor_clauses, _apply_score
from src.confidence import (
    compute_overall_confidence,
    confidence_level,
    downgrade_unanchored,
)
from src.schema import (
    ComplianceFlag,
    ContractReview,
    KeyClause,
    Provenance,
    Risk,
)


def _risk(severity="low", provenance=None, confidence=None):
    return Risk(
        severity=severity, category="c", description="d", clause_ref="1",
        provenance=provenance, confidence=confidence,
    )


def _prov(text, anchored=False):
    return Provenance(text_excerpt=text, anchored=anchored)


def _review(*risks, key_clauses=None, compliance=None):
    return ContractReview(
        summary="x",
        parties=["A", "B"],
        key_clauses=key_clauses or [KeyClause(type="t", summary="s", text_excerpt="e")],
        risks=list(risks),
        compliance_flags=compliance or [],
        recommendations=["r"],
    )


# --- confidence.py unit tests ---

def test_empty_findings_scores_100():
    # nothing to hallucinate about
    assert compute_overall_confidence([]) == 100
    assert confidence_level(100) == "high"


def test_all_anchored_high_confidence_maxes_out():
    findings = [
        _risk(provenance=_prov("x", anchored=True), confidence="high"),
        _risk(provenance=_prov("y", anchored=True), confidence="high"),
    ]
    assert compute_overall_confidence(findings) == 100


def test_all_anchored_but_low_self_reports_drops():
    findings = [
        _risk(provenance=_prov("x", anchored=True), confidence="low"),
        _risk(provenance=_prov("y", anchored=True), confidence="low"),
    ]
    # anchor=1.0 (100% anchored), avg self=0.3 → 50 + 15 = 65
    assert compute_overall_confidence(findings) == 65
    assert confidence_level(65) == "medium"


def test_zero_anchoring_zero_confidence_bottoms_out():
    findings = [
        _risk(provenance=_prov("bogus"), confidence="low"),
        _risk(provenance=_prov("also bogus"), confidence="low"),
    ]
    # anchor=0, avg self=0.3 → 0 + 15 = 15
    assert compute_overall_confidence(findings) == 15
    assert confidence_level(15) == "low"


def test_missing_self_report_treated_as_low():
    findings = [_risk(provenance=_prov("x", anchored=True), confidence=None)]
    # anchor=1.0, avg self=0.3 (missing→low) → 50 + 15 = 65
    assert compute_overall_confidence(findings) == 65


def test_confidence_level_boundaries():
    assert confidence_level(80) == "high"
    assert confidence_level(79) == "medium"
    assert confidence_level(60) == "medium"
    assert confidence_level(59) == "low"
    assert confidence_level(0) == "low"


# --- anti-hallucination gate ---

def test_downgrade_unanchored_overrides_self_report():
    """A model claiming 'high' confidence on a fabricated citation is forced to 'low'."""
    findings = [
        _risk(provenance=_prov("real quote", anchored=True), confidence="high"),
        _risk(provenance=_prov("MADE UP", anchored=False), confidence="high"),  # would-be hallucination
        _risk(provenance=None, confidence="high"),  # no provenance at all
    ]
    downgraded = downgrade_unanchored(findings)
    assert downgraded == 2  # only the anchored one survives its self-report
    assert findings[0].confidence == "high"
    assert findings[1].confidence == "low"
    assert findings[2].confidence == "low"


def test_downgrade_already_low_is_not_recounted():
    findings = [_risk(provenance=_prov("x", anchored=False), confidence="low")]
    assert downgrade_unanchored(findings) == 0  # already low, no change


# --- _anchor_clauses extended to findings ---

def test_anchor_extends_to_risk_provenance():
    source = "Preamble. Either party may terminate on 30 days notice. End."
    review = _review(_risk(provenance=_prov("Either party may terminate on 30 days notice.")))
    _anchor_clauses(review, source)
    p = review.risks[0].provenance
    assert p.anchored is True
    assert p.char_start == source.index("Either")
    assert p.char_end == p.char_start + len(p.text_excerpt)


def test_anchor_marks_fabricated_provenance_unanchored():
    source = "Section 5: Either party may terminate on 30 days notice."
    review = _review(_risk(provenance=_prov("This clause does not exist in source at all.")))
    _anchor_clauses(review, source)
    p = review.risks[0].provenance
    assert p.anchored is False
    assert p.char_start is None
    assert p.char_end is None


def test_anchor_handles_missing_provenance():
    """A finding with no provenance at all shouldn't crash — it stays unanchored."""
    source = "any text"
    review = _review(_risk(provenance=None))
    _anchor_clauses(review, source)  # must not raise
    assert review.risks[0].provenance is None


def test_anchor_covers_compliance_flags_too():
    source = "The parties agree to process personal data in accordance with GDPR."
    review = _review(
        compliance=[ComplianceFlag(
            framework="GDPR", status="gap", note="no DPA",
            provenance=_prov("process personal data in accordance with GDPR"),
        )],
    )
    _anchor_clauses(review, source)
    assert review.compliance_flags[0].provenance.anchored is True


# --- end-to-end via _apply_score ---

def test_apply_score_sets_overall_confidence_and_level():
    review = _review(
        _risk(provenance=_prov("x", anchored=True), confidence="high"),
        _risk(provenance=_prov("y", anchored=True), confidence="medium"),
    )
    _apply_score(review)
    assert review.overall_confidence is not None
    assert review.confidence_level in ("high", "medium", "low")


def test_apply_score_downgrades_fabricated_before_scoring():
    """The anti-hallucination gate must fire before compute_overall_confidence."""
    review = _review(
        _risk(provenance=_prov("real", anchored=True), confidence="high"),  # legit
        _risk(provenance=_prov("fake", anchored=False), confidence="high"),  # would inflate
    )
    _apply_score(review)
    # anchor rate = 0.5; self-report AFTER downgrade = (1.0 + 0.3) / 2 = 0.65
    # overall = 50 * 0.5 + 50 * 0.65 = 25 + 32.5 → 58
    assert review.overall_confidence == 58
    assert review.confidence_level == "low"
    # the fabricated one is now 'low' regardless of what the model claimed
    assert review.risks[1].confidence == "low"


def test_agent_review_returns_confidence_end_to_end():
    """End-to-end: agent.review() returns a review with both scores set."""
    source = "Auto-renewal for 12 months unless terminated with 60 days notice."
    review = _review(_risk(
        severity="high",
        provenance=_prov("Auto-renewal for 12 months unless terminated with 60 days notice."),
        confidence="high",
    ))
    client = MagicMock()
    client.messages.parse.return_value = MagicMock(parsed_output=review)
    result = LegalAgent(client=client).review(source)
    assert result.overall_confidence == 100
    assert result.confidence_level == "high"
    assert result.risks[0].provenance.anchored is True


def test_review_pdf_reports_low_confidence_honestly():
    """PDF path has no source string — findings can't anchor — confidence must reflect that."""
    review = _review(_risk(
        provenance=_prov("Any excerpt from the PDF"), confidence="high",
    ))
    client = MagicMock()
    client.messages.parse.return_value = MagicMock(parsed_output=review)
    fake_pdf = "JVBERi0xLjQK" + "A" * 200
    result = LegalAgent(client=client).review_pdf(fake_pdf)
    # 1 finding, unanchored, downgraded to low → anchor=0, self=0.3 → 15
    assert result.overall_confidence == 15
    assert result.confidence_level == "low"
    assert result.risks[0].confidence == "low"
    assert result.risks[0].provenance.anchored is False


def test_empty_findings_yield_perfect_confidence():
    """A contract with nothing risky is trivially not hallucinating anything."""
    review = _review(key_clauses=[KeyClause(type="t", summary="s", text_excerpt="e")])
    # no risks, no compliance flags
    client = MagicMock()
    client.messages.parse.return_value = MagicMock(parsed_output=review)
    result = LegalAgent(client=client).review("any text with e in it")
    assert result.overall_confidence == 100
    assert result.confidence_level == "high"
