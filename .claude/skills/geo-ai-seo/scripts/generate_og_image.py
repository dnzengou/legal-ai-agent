#!/usr/bin/env python3
"""Portable 1200x630 Open Graph image generator.

Usage:
    python generate_og_image.py --title "My Project" \\
        --tagline "First-pass X in seconds" \\
        --url "my-project.example.com" \\
        --out site/og-image.png

Requires Pillow (pip install pillow). Also writes a sibling .svg if --out ends in .png.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1200, 630

# Default dark palette — override via --bg / --accent
DEFAULTS = {
    "bg": (10, 14, 20),
    "panel": (16, 22, 32),
    "ink": (230, 237, 243),
    "muted": (155, 170, 188),
    "accent": (79, 159, 255),
    "accent2": (74, 222, 128),
    "accent3": (251, 191, 36),
}


def _font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
    ):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def draw_png(out: Path, title: str, tagline: str, url: str) -> None:
    c = DEFAULTS
    img = Image.new("RGB", (WIDTH, HEIGHT), c["bg"])
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((48, 48, WIDTH - 48, HEIGHT - 48), radius=24, fill=c["panel"])

    f_title = _font(96, bold=True)
    f_tag = _font(34)
    f_small = _font(24)

    d.text((110, 220), title, font=f_title, fill=c["accent"])
    d.text((110, 350), tagline[:72], font=f_tag, fill=c["ink"])

    url_w = d.textlength(url, font=f_small)
    d.text((WIDTH - 110 - url_w, HEIGHT - 110), url, font=f_small, fill=c["muted"])

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "PNG", optimize=True)
    print(f"wrote {out} — {out.stat().st_size} bytes")


def draw_svg(out: Path, title: str, tagline: str, url: str) -> None:
    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="{title}">
  <rect width="1200" height="630" fill="#0a0e14"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#101620"/>
  <text font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="96"
        x="110" y="320" fill="#4f9fff">{title}</text>
  <text font-family="DejaVu Sans, Arial, sans-serif" font-size="34"
        x="110" y="420" fill="#e6edf3">{tagline}</text>
  <text font-family="DejaVu Sans, Arial, sans-serif" font-size="24"
        x="1090" y="550" fill="#9baabc" text-anchor="end">{url}</text>
</svg>
"""
    out.write_text(svg)
    print(f"wrote {out} — {out.stat().st_size} bytes")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("--title", required=True)
    parser.add_argument("--tagline", required=True)
    parser.add_argument("--url", required=True)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    draw_png(args.out, args.title, args.tagline, args.url)
    if args.out.suffix == ".png":
        draw_svg(args.out.with_suffix(".svg"), args.title, args.tagline, args.url)


if __name__ == "__main__":
    main()
