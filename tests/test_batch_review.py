"""Tests for the portfolio batch-review example. No network."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "examples"))

from batch_review import review_portfolio, _grade  # noqa: E402
from client import LegalAIError  # noqa: E402


class _FakeClient:
    """Returns a canned review per contract text; raises for text == 'BOOM'."""

    def __init__(self, by_text):
        self.by_text = by_text

    def review(self, text, jurisdiction=None, party_role=None):
        if text == "BOOM":
            raise LegalAIError(502, "upstream error")
        return self.by_text[text]


def _review(score, grade, highs=0, gaps=()):
    return {
        "safety_score": score,
        "letter_grade": grade,
        "risks": [{"severity": "high"} for _ in range(highs)],
        "compliance_flags": [{"framework": f, "status": "gap"} for f in gaps],
    }


def test_grade_bands():
    assert [_grade(s) for s in (95, 85, 75, 65, 40)] == ["A", "B", "C", "D", "F"]


def test_portfolio_rollup_averages_and_criticals():
    client = _FakeClient({
        "good": _review(92, "A"),
        "mid": _review(72, "C", highs=1, gaps=["GDPR"]),
        "bad": _review(48, "F", highs=2, gaps=["GDPR", "SOC2"]),
    })
    out = review_portfolio(client, [("a.txt", "good"), ("b.txt", "mid"), ("c.txt", "bad")])
    p = out["portfolio"]
    assert p["reviewed"] == 3 and p["errored"] == 0
    assert p["average_score"] == round((92 + 72 + 48) / 3)  # 71
    assert p["average_grade"] == "C"
    # critical = score < 70, sorted worst-first
    assert [c["name"] for c in p["critical"]] == ["c.txt"]
    # GDPR appears in 2 contracts -> most common gap
    assert p["common_gaps"][0] == {"framework": "GDPR", "count": 2}


def test_errored_contract_excluded_from_average():
    client = _FakeClient({"ok": _review(80, "B")})
    out = review_portfolio(client, [("ok.txt", "ok"), ("boom.txt", "BOOM")])
    p = out["portfolio"]
    assert p["reviewed"] == 1 and p["errored"] == 1
    assert p["average_score"] == 80  # errored contract doesn't drag the average
    assert any("error" in c for c in out["contracts"])


def test_empty_portfolio_does_not_divide_by_zero():
    out = review_portfolio(_FakeClient({}), [])
    assert out["portfolio"]["average_score"] == 0
    assert out["portfolio"]["average_grade"] == "F"
