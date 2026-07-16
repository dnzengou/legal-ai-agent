"""Illustrative use case: portfolio batch review.

An "application to come" built on top of the legal-ai-agent API — reviews a batch
of contracts and rolls the per-contract safety scores up into a portfolio view
(average grade, the worst offenders, and the most common compliance gaps). Not a
deployed service; run it locally against your own API instance.

    python examples/batch_review.py http://localhost:8000 --key demo-key \
        --dir ./contracts_txt

Depends only on the stdlib client next to this file (client.py) — no pip install.
"""

from __future__ import annotations

import argparse
import os
from collections import Counter

from client import LegalAIClient, LegalAIError

# Same deterministic thresholds the server uses, so the portfolio grade matches /review.
_GRADE_BANDS = [(90, "A"), (80, "B"), (70, "C"), (60, "D"), (0, "F")]


def _grade(score: float) -> str:
    for cutoff, letter in _GRADE_BANDS:
        if score >= cutoff:
            return letter
    return "F"


def review_portfolio(client: LegalAIClient, contracts: list[tuple[str, str]]) -> dict:
    """Review each (name, text) contract; return per-contract results + a portfolio roll-up.

    A contract that errors is recorded with `error` set and excluded from the averages,
    so one bad input never sinks the whole run."""
    reviewed: list[dict] = []
    gap_counter: Counter[str] = Counter()

    for name, text in contracts:
        try:
            review = client.review(text)
        except LegalAIError as e:
            reviewed.append({"name": name, "error": e.detail})
            continue
        for flag in review.get("compliance_flags", []):
            if flag.get("status") == "gap":
                gap_counter[flag["framework"]] += 1
        reviewed.append({
            "name": name,
            "safety_score": review["safety_score"],
            "letter_grade": review["letter_grade"],
            "high_risks": sum(1 for r in review["risks"] if r["severity"] == "high"),
        })

    scored = [r for r in reviewed if "safety_score" in r]
    avg = round(sum(r["safety_score"] for r in scored) / len(scored)) if scored else 0
    return {
        "contracts": reviewed,
        "portfolio": {
            "reviewed": len(scored),
            "errored": len(reviewed) - len(scored),
            "average_score": avg,
            "average_grade": _grade(avg),
            # The riskiest contracts first — where a reviewer should look.
            "critical": sorted(
                ({"name": r["name"], "safety_score": r["safety_score"], "letter_grade": r["letter_grade"]}
                 for r in scored if r["safety_score"] < 70),
                key=lambda r: r["safety_score"],
            ),
            "common_gaps": [{"framework": f, "count": n} for f, n in gap_counter.most_common()],
        },
    }


def _load_dir(path: str) -> list[tuple[str, str]]:
    out = []
    for name in sorted(os.listdir(path)):
        if name.endswith((".txt", ".md")):
            with open(os.path.join(path, name), encoding="utf-8") as f:
                out.append((name, f.read()))
    if not out:
        raise SystemExit(f"no .txt/.md contracts found in {path}")
    return out


def _main() -> None:
    parser = argparse.ArgumentParser(description="Portfolio batch review")
    parser.add_argument("base_url", help="e.g. http://localhost:8000")
    parser.add_argument("--key", help="X-API-Key value")
    parser.add_argument("--dir", required=True, help="directory of .txt/.md contracts")
    args = parser.parse_args()

    client = LegalAIClient(args.base_url, api_key=args.key)
    result = review_portfolio(client, _load_dir(args.dir))
    p = result["portfolio"]
    print(f"Portfolio: {p['reviewed']} reviewed ({p['errored']} errored) · "
          f"avg {p['average_score']} (grade {p['average_grade']})")
    if p["critical"]:
        print("Critical (score < 70):")
        for c in p["critical"]:
            print(f"  {c['letter_grade']} {c['safety_score']:>3}  {c['name']}")
    if p["common_gaps"]:
        print("Common compliance gaps: " + ", ".join(f"{g['framework']}×{g['count']}" for g in p["common_gaps"]))


if __name__ == "__main__":
    _main()
