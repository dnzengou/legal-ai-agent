"""Minimal MCP server exposing legal-ai-agent as a tool for AI agents.

Any Model Context Protocol host (Claude Desktop, Claude Code, ChatGPT, Cursor, Zed)
can import this and call `review_contract` as if it were a native tool.

Requires:
    pip install mcp

Configure the host — e.g. Claude Desktop (claude_desktop_config.json):

    {
      "mcpServers": {
        "legal-ai-agent": {
          "command": "python",
          "args": ["/absolute/path/to/examples/mcp_server.py"],
          "env": {
            "LEGAL_AI_URL": "http://localhost:8000",
            "LEGAL_AI_KEY": "your-key-here"
          }
        }
      }
    }

Then ask the host: "Review this contract: <paste>" and it will call the tool.
"""

from __future__ import annotations

import json
import os
import urllib.request
from typing import Any

try:
    from mcp.server.fastmcp import FastMCP
except ImportError as e:
    raise SystemExit(
        "mcp package not installed. Run: pip install mcp"
    ) from e

BASE_URL = os.environ.get("LEGAL_AI_URL", "http://localhost:8000").rstrip("/")
API_KEY = os.environ.get("LEGAL_AI_KEY")

mcp = FastMCP("legal-ai-agent")


def _call(path: str, body: dict[str, Any]) -> dict[str, Any]:
    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["X-API-Key"] = API_KEY
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(body).encode(),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())


@mcp.tool()
def review_contract(
    contract_text: str,
    jurisdiction: str = "",
    party_role: str = "",
) -> dict[str, Any]:
    """Review a contract and return clauses, risks, compliance flags, recommendations,
    safety score (0-100), letter grade (A-F), and confidence score (0-100).

    Every finding ships with a verbatim citation that the server anchors to source.
    Unanchored findings are forcibly downgraded to low confidence.

    Args:
        contract_text: The contract or legal document to review (up to ~500k chars).
        jurisdiction: Optional. E.g. "US-DE", "EU", "SE".
        party_role: Optional. E.g. "buyer", "vendor", "applicant".
    """
    return _call(
        "/review",
        {
            "contract_text": contract_text,
            "jurisdiction": jurisdiction or None,
            "party_role": party_role or None,
        },
    )


@mcp.tool()
def review_pdf(
    pdf_base64: str,
    jurisdiction: str = "",
    party_role: str = "",
) -> dict[str, Any]:
    """Review a base64-encoded PDF contract (≤ 32 MB decoded).

    Returns the same shape as review_contract. Note: citation anchoring is weaker on
    PDFs because there is no plain-text source to match against — plan on
    confidence_level of medium or low.
    """
    return _call(
        "/review-pdf",
        {
            "pdf_base64": pdf_base64,
            "jurisdiction": jurisdiction or None,
            "party_role": party_role or None,
        },
    )


@mcp.tool()
def health() -> dict[str, Any]:
    """Check the legal-ai-agent deployment's health and version."""
    with urllib.request.urlopen(f"{BASE_URL}/health", timeout=10) as r:
        return json.loads(r.read().decode())


if __name__ == "__main__":
    mcp.run()
