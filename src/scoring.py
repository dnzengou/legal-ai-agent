"""Deterministic contract safety scoring.

The model surfaces risks and compliance gaps; the *score* is computed here, on the
server, from those risks — never taken from the model. This mirrors the citation
anchoring in `agent.py`: the model proposes, the server owns the verifiable number.
A deterministic score is reproducible, testable without the network, and can't be
inflated by a model that "wants to give a green light".

Scoring model (inspired by the weighted deduction scheme used across first-pass
contract reviews): start at 100, deduct per risk by severity, clamp to [0, 100],
then map to a letter grade.
"""

from __future__ import annotations

from typing import Iterable

# Per-risk deductions. High-severity findings (uncapped liability, broad IP
# assignment, auto-renewal traps) dominate the score; low-severity nits barely move it.
SEVERITY_DEDUCTION: dict[str, int] = {
    "high": 20,
    "medium": 8,
    "low": 3,
}


def compute_safety_score(risks: Iterable) -> int:
    """Return a 0–100 safety score derived from the review's risks.

    Each risk deducts points by severity; the result is clamped to [0, 100].
    A contract with no flagged risks scores 100.
    """
    deduction = sum(SEVERITY_DEDUCTION.get(getattr(r, "severity", ""), 0) for r in risks)
    return max(0, min(100, 100 - deduction))


def letter_grade(score: int) -> str:
    """Map a 0–100 safety score to an A–F letter grade.

    90+ A (low risk) · 80+ B (minor revisions) · 70+ C (negotiate) ·
    60+ D (significant issues) · <60 F (high risk — do not sign).
    """
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"
