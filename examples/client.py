"""Minimal, dependency-free Python client for the legal-ai-agent API.

Stdlib only (urllib) — copy this file into any project, no pip install required.

    from client import LegalAIClient

    client = LegalAIClient("https://api.legal-ai-agent.fly.dev", api_key="your-key")
    review = client.review("This Agreement is entered into...", jurisdiction="US-DE")
    print(review["safety_score"], review["letter_grade"])
    for risk in review["risks"]:
        print(risk["severity"], risk["category"])

Run as a script for a quick smoke test against a running instance:

    ANTHROPIC/API not needed here — this only talks to your legal-ai-agent server.
    python examples/client.py http://localhost:8000 --key demo-key --text "..."
"""

from __future__ import annotations

import base64
import json
import urllib.error
import urllib.request


class LegalAIError(Exception):
    """Raised on a non-2xx response. Carries the HTTP status and the server's detail."""

    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail
        super().__init__(f"HTTP {status}: {detail}")


class LegalAIClient:
    def __init__(self, base_url: str, api_key: str | None = None, timeout: float = 120.0):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def health(self) -> dict:
        """GET /health — liveness probe. Returns {"status": "ok", "version": ...}."""
        return self._request("GET", "/health")

    def review(
        self,
        contract_text: str,
        jurisdiction: str | None = None,
        party_role: str | None = None,
    ) -> dict:
        """POST /review — review contract text; returns the structured review dict."""
        payload = {"contract_text": contract_text}
        if jurisdiction:
            payload["jurisdiction"] = jurisdiction
        if party_role:
            payload["party_role"] = party_role
        return self._request("POST", "/review", payload)

    def review_pdf(
        self,
        pdf_path: str | None = None,
        pdf_base64: str | None = None,
        jurisdiction: str | None = None,
        party_role: str | None = None,
    ) -> dict:
        """POST /review-pdf — review a PDF given a file path or a pre-encoded base64 string."""
        if not pdf_base64:
            if not pdf_path:
                raise ValueError("provide either pdf_path or pdf_base64")
            with open(pdf_path, "rb") as f:
                pdf_base64 = base64.b64encode(f.read()).decode("ascii")
        payload = {"pdf_base64": pdf_base64}
        if jurisdiction:
            payload["jurisdiction"] = jurisdiction
        if party_role:
            payload["party_role"] = party_role
        return self._request("POST", "/review-pdf", payload)

    def _request(self, method: str, path: str, payload: dict | None = None) -> dict:
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        headers = {"Accept": "application/json"}
        if data is not None:
            headers["Content-Type"] = "application/json"
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        req = urllib.request.Request(self.base_url + path, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            try:
                detail = json.loads(body).get("detail", body)
            except json.JSONDecodeError:
                detail = body
            raise LegalAIError(e.code, detail) from None


def _main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="legal-ai-agent client smoke test")
    parser.add_argument("base_url", help="e.g. http://localhost:8000")
    parser.add_argument("--key", help="X-API-Key value")
    parser.add_argument("--text", help="contract text to review (else just hits /health)")
    parser.add_argument("--jurisdiction")
    args = parser.parse_args()

    client = LegalAIClient(args.base_url, api_key=args.key)
    print("health:", client.health())
    if args.text:
        review = client.review(args.text, jurisdiction=args.jurisdiction)
        print(f"score: {review['safety_score']} (grade {review['letter_grade']})")
        print(f"risks: {len(review['risks'])} · compliance: {len(review.get('compliance_flags', []))}")


if __name__ == "__main__":
    _main()
