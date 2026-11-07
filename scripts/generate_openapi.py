"""Snapshot the live FastAPI OpenAPI spec to site/openapi.json.

Run after any api/ or src/ change that affects the request/response shape.
Published at https://<deploy>/openapi.json for AI agents and client generators.

Usage:
    ANTHROPIC_API_KEY=dummy python scripts/generate_openapi.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from api.app import app

spec = app.openapi()
spec["servers"] = [
    {"url": "https://api.legal-ai-agent.fly.dev", "description": "Reference deployment (BYO key)"},
    {"url": "http://localhost:8000", "description": "Local development"},
]
spec["externalDocs"] = {
    "description": "Project docs on GitHub",
    "url": "https://github.com/dnzengou/legal-ai-agent",
}

out = ROOT / "site" / "openapi.json"
out.write_text(json.dumps(spec, indent=2) + "\n")
print(f"wrote {out} — {out.stat().st_size} bytes")
