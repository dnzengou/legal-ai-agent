"""Server-owned confidence scoring — the anti-hallucination gate.

Every risk and compliance flag carries a `Provenance.text_excerpt` from the model.
The server anchors that excerpt to the source (same substring-match as `agent._anchor_clauses`).
An unanchored finding is auto-downgraded to `low` confidence — the model literally
cannot fabricate a citation without the server catching it.

The overall confidence is a deterministic function of two axes:
- **anchoring rate** — fraction of findings whose provenance was found verbatim
- **average self-reported confidence** — model's own labels, mapped high=1.0 / medium=0.6 / low=0.3

Overall = round(50 * anchor_rate + 50 * avg_self_confidence), clamped to [0, 100].
Level: >=80 high, >=60 medium, else low. Same shape as `scoring.py` letter grades.

A review with zero findings gets confidence 100 / high (nothing to hallucinate about).
"""

from __future__ import annotations

from typing import Iterable, Sequence

_CONF_WEIGHT: dict[str, float] = {"high": 1.0, "medium": 0.6, "low": 0.3}


def _self_confidence(finding) -> float:
    """Map the finding's self-reported confidence to [0, 1]. Missing → treat as low (0.3)."""
    label = getattr(finding, "confidence", None)
    return _CONF_WEIGHT.get(label, 0.3)


def _is_anchored(finding) -> bool:
    """A finding is anchored when its provenance was found verbatim in source."""
    prov = getattr(finding, "provenance", None)
    return bool(prov and getattr(prov, "anchored", False))


def downgrade_unanchored(findings: Iterable) -> int:
    """Mutate: any finding whose provenance failed to anchor has its self-reported
    confidence overridden to 'low'. This is the anti-hallucination enforcement point.

    Returns the count of findings that were downgraded."""
    downgraded = 0
    for f in findings:
        if not _is_anchored(f) and getattr(f, "confidence", None) != "low":
            f.confidence = "low"
            downgraded += 1
    return downgraded


def compute_overall_confidence(findings: Sequence) -> int:
    """Return a 0-100 overall confidence score for the review.

    A review with no findings is treated as 100 (nothing to hallucinate about)."""
    if not findings:
        return 100
    n = len(findings)
    anchor_rate = sum(1 for f in findings if _is_anchored(f)) / n
    avg_self = sum(_self_confidence(f) for f in findings) / n
    raw = round(50 * anchor_rate + 50 * avg_self)
    return max(0, min(100, raw))


def confidence_level(score: int) -> str:
    """Bucket 0-100 → 'high' | 'medium' | 'low'. Same shape as letter_grade()."""
    if score >= 80:
        return "high"
    if score >= 60:
        return "medium"
    return "low"
