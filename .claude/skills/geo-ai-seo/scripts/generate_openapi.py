#!/usr/bin/env python3
"""Portable OpenAPI snapshot generator.

Usage:
    python generate_openapi.py --app api.app:app --out site/openapi.json
    python generate_openapi.py --app myapp.main:app --out dist/openapi.json \\
        --server https://api.example.com --server-desc "Production"

Works with any ASGI app that exposes `.openapi()` (FastAPI, Starlette-based frameworks).
"""
import argparse
import importlib
import json
import sys
from pathlib import Path


def load_app(dotted: str):
    """Import `module.path:attr` and return the attribute (the ASGI app)."""
    if ":" not in dotted:
        raise SystemExit(f"--app must be 'module.path:attr', got {dotted!r}")
    mod_path, attr = dotted.rsplit(":", 1)
    sys.path.insert(0, str(Path.cwd()))
    mod = importlib.import_module(mod_path)
    return getattr(mod, attr)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("--app", required=True, help="Dotted path to ASGI app (e.g. api.app:app)")
    parser.add_argument("--out", required=True, type=Path, help="Output path (e.g. site/openapi.json)")
    parser.add_argument("--server", action="append", default=[], help="Public server URL (repeatable)")
    parser.add_argument("--server-desc", action="append", default=[], help="Description for each --server (matched by position)")
    parser.add_argument("--external-docs", help="URL to external project docs")
    args = parser.parse_args()

    app = load_app(args.app)
    if not hasattr(app, "openapi"):
        raise SystemExit(f"{args.app} has no .openapi() method")

    spec = app.openapi()

    if args.server:
        descs = list(args.server_desc) + [""] * max(0, len(args.server) - len(args.server_desc))
        spec["servers"] = [
            {"url": u, "description": d} for u, d in zip(args.server, descs)
        ]

    if args.external_docs:
        spec["externalDocs"] = {"description": "Project docs", "url": args.external_docs}

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(spec, indent=2) + "\n")
    print(f"wrote {args.out} — {args.out.stat().st_size} bytes · "
          f"OpenAPI {spec.get('openapi', '?')} · {len(spec.get('paths', {}))} paths")


if __name__ == "__main__":
    main()
