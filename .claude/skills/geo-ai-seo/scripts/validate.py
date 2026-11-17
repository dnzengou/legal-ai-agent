#!/usr/bin/env python3
"""Audit a site/ directory against the GEO checklist.

Usage:
    python validate.py site/
    python validate.py site/ --strict   # exit 1 on any warning

Checks file presence, parseability, link integrity in sitemap, expiry on security.txt,
and that robots.txt references the sitemap. Does not fetch anything over the network.
"""
import argparse
import datetime as dt
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

REQUIRED = [
    "robots.txt",
    "sitemap.xml",
    "llms.txt",
    "humans.txt",
    ".well-known/security.txt",
]
RECOMMENDED = [
    "llms-full.txt",
    "openapi.json",
    "faq.html",
    "og-image.png",
    "og-image.svg",
]


def check_present(root: Path, path: str, required: bool) -> tuple[str, str]:
    p = root / path
    if not p.exists():
        return ("FAIL" if required else "WARN", f"{path} missing")
    if p.stat().st_size == 0:
        return ("FAIL", f"{path} is empty")
    return ("OK", path)


def check_robots_has_sitemap(root: Path) -> tuple[str, str]:
    p = root / "robots.txt"
    if not p.exists():
        return ("SKIP", "no robots.txt to check")
    text = p.read_text(encoding="utf-8", errors="replace")
    if "Sitemap:" not in text:
        return ("WARN", "robots.txt has no Sitemap: directive")
    return ("OK", "robots.txt references a sitemap")


def check_sitemap(root: Path) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    p = root / "sitemap.xml"
    if not p.exists():
        return out
    try:
        tree = ET.parse(p)
    except ET.ParseError as e:
        return [("FAIL", f"sitemap.xml does not parse: {e}")]
    ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    urls = tree.findall(f"{ns}url")
    if not urls:
        out.append(("WARN", "sitemap.xml has zero <url> entries"))
    hosts = set()
    for u in urls:
        loc = u.findtext(f"{ns}loc") or ""
        mod = u.findtext(f"{ns}lastmod") or ""
        if not loc:
            out.append(("WARN", "sitemap.xml has a <url> without <loc>"))
        else:
            hosts.add(urlparse(loc).netloc)
        if not mod:
            out.append(("WARN", f"sitemap.xml: {loc} has no <lastmod>"))
    if len(hosts) > 1:
        out.append(("WARN", f"sitemap.xml mixes hosts: {sorted(hosts)}"))
    if not out:
        out.append(("OK", f"sitemap.xml: {len(urls)} URLs, single host"))
    return out


def check_security_txt(root: Path) -> list[tuple[str, str]]:
    p = root / ".well-known" / "security.txt"
    if not p.exists():
        return []
    text = p.read_text(encoding="utf-8", errors="replace")
    out: list[tuple[str, str]] = []
    if "Contact:" not in text:
        out.append(("FAIL", "security.txt has no Contact:"))
    if "Expires:" not in text:
        out.append(("FAIL", "security.txt has no Expires:"))
        return out
    exp_line = next(l for l in text.splitlines() if l.startswith("Expires:"))
    exp_raw = exp_line.split(":", 1)[1].strip()
    try:
        exp = dt.datetime.fromisoformat(exp_raw.replace("Z", "+00:00"))
    except ValueError:
        return [("FAIL", f"security.txt Expires not ISO-8601: {exp_raw}")]
    now = dt.datetime.now(dt.timezone.utc)
    delta = exp - now
    if delta.days < 0:
        out.append(("FAIL", f"security.txt expired {abs(delta.days)}d ago"))
    elif delta.days < 30:
        out.append(("WARN", f"security.txt expires in {delta.days}d — rotate soon"))
    else:
        out.append(("OK", f"security.txt valid for {delta.days}d"))
    return out


def check_openapi(root: Path) -> list[tuple[str, str]]:
    p = root / "openapi.json"
    if not p.exists():
        return []
    try:
        spec = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [("FAIL", f"openapi.json does not parse: {e}")]
    v = spec.get("openapi", "")
    if not v.startswith("3."):
        return [("WARN", f"openapi.json claims version {v!r}, expected 3.x")]
    paths = len(spec.get("paths", {}))
    return [("OK", f"openapi.json: {v}, {paths} paths")]


def check_faq_schema(root: Path) -> list[tuple[str, str]]:
    p = root / "faq.html"
    if not p.exists():
        return []
    text = p.read_text(encoding="utf-8", errors="replace")
    if '"@type": "FAQPage"' not in text and '"@type":"FAQPage"' not in text.replace(" ", ""):
        return [("WARN", "faq.html has no FAQPage JSON-LD")]
    return [("OK", "faq.html: FAQPage JSON-LD present")]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("root", type=Path, help="Path to the site/ directory")
    parser.add_argument("--strict", action="store_true", help="Exit 1 on WARN as well as FAIL")
    args = parser.parse_args()

    if not args.root.is_dir():
        print(f"not a directory: {args.root}", file=sys.stderr)
        return 2

    results: list[tuple[str, str]] = []
    for path in REQUIRED:
        results.append(check_present(args.root, path, required=True))
    for path in RECOMMENDED:
        results.append(check_present(args.root, path, required=False))
    results.append(check_robots_has_sitemap(args.root))
    results.extend(check_sitemap(args.root))
    results.extend(check_security_txt(args.root))
    results.extend(check_openapi(args.root))
    results.extend(check_faq_schema(args.root))

    width = max(len(s) for s, _ in results)
    for status, msg in results:
        print(f"  {status:<{width}}  {msg}")

    fails = sum(1 for s, _ in results if s == "FAIL")
    warns = sum(1 for s, _ in results if s == "WARN")
    oks = sum(1 for s, _ in results if s == "OK")
    print(f"\n{oks} OK · {warns} WARN · {fails} FAIL")

    if fails or (args.strict and warns):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
