"""Generate the Open Graph social-share image and favicon-grade logo.

Writes site/og-image.png (1200x630, PNG, under 100 KB target) and site/og-image.svg
(logomark). Designed to be legible at small sizes and in both light and dark previews.

Usage:
    python scripts/generate_og_image.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"

WIDTH, HEIGHT = 1200, 630

# Brand palette — same tokens as the site (styles.css :root)
BG = (10, 14, 20)              # near-black, matches dark theme body
PANEL = (16, 22, 32)
ACCENT = (79, 159, 255)        # --accent #4f9fff (legal)
ACCENT_GREEN = (74, 222, 128)  # --success #4ade80 (ai)
ACCENT_AMBER = (251, 191, 36)  # --warning #fbbf24 (agent)
INK = (230, 237, 243)
MUTED = (155, 170, 188)

# Font loading — fall back to default if DejaVu is missing
def _font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    for candidate in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
    ):
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def draw_png() -> None:
    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    d = ImageDraw.Draw(img)

    # Soft panel with a bit of inset
    d.rounded_rectangle((48, 48, WIDTH - 48, HEIGHT - 48), radius=24, fill=PANEL)

    # Fonts — slightly smaller wordmark so the ring sits to the right cleanly
    f_big = _font(96, bold=True)
    f_dot = _font(96, bold=True)
    f_tag = _font(34)
    f_small = _font(24)

    # Wordmark on the left — matches site colours: legal (blue), ai (green), agent (amber)
    x = 110
    y = 220

    def seg(text: str, color: tuple[int, int, int]) -> None:
        nonlocal x
        d.text((x, y), text, font=f_big, fill=color)
        x += int(d.textlength(text, font=f_big))

    seg("legal", ACCENT)
    seg(" · ", MUTED)
    seg("ai", ACCENT_GREEN)
    seg(" · ", MUTED)
    seg("agent", ACCENT_AMBER)

    # Tagline
    d.text((110, y + 130), "First-pass legal analysis in seconds.", font=f_tag, fill=INK)
    d.text(
        (110, y + 175),
        "Contracts · appeals · provenance-anchored citations.",
        font=f_tag,
        fill=MUTED,
    )

    # Bottom-right URL
    url = "legal-ai-agent.netlify.app"
    url_w = d.textlength(url, font=f_small)
    d.text((WIDTH - 110 - url_w, HEIGHT - 110), url, font=f_small, fill=MUTED)

    # Score-ring in the top-right corner, clear of the wordmark
    cx, cy, r = WIDTH - 180, 150, 60
    # track
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=BG, width=12)
    # progress arc (78%)
    d.arc(
        (cx - r, cy - r, cx + r, cy + r),
        start=-90,
        end=-90 + int(360 * 0.78),
        fill=ACCENT_GREEN,
        width=12,
    )
    f_ring = _font(36, bold=True)
    f_ring_label = _font(18, bold=True)
    # centered-ish numerals
    n = "78"
    g = "B"
    n_w = d.textlength(n, font=f_ring)
    g_w = d.textlength(g, font=f_ring_label)
    d.text((cx - n_w // 2, cy - 24), n, font=f_ring, fill=INK)
    d.text((cx - g_w // 2, cy + 14), g, font=f_ring_label, fill=ACCENT_GREEN)

    out = SITE / "og-image.png"
    img.save(out, "PNG", optimize=True)
    print(f"wrote {out} — {out.stat().st_size} bytes")


SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="legal-ai-agent">
  <rect width="1200" height="630" fill="#0a0e14"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#101620"/>
  <g font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="96">
    <text x="110" y="316" fill="#4f9fff">legal</text>
    <text x="400" y="316" fill="#9baabc"> · </text>
    <text x="470" y="316" fill="#4ade80">ai</text>
    <text x="580" y="316" fill="#9baabc"> · </text>
    <text x="650" y="316" fill="#fbbf24">agent</text>
  </g>
  <g font-family="DejaVu Sans, Arial, sans-serif" font-size="34">
    <text x="110" y="446" fill="#e6edf3">First-pass legal analysis in seconds.</text>
    <text x="110" y="492" fill="#9baabc">Contracts · appeals · provenance-anchored citations.</text>
  </g>
  <g transform="translate(1020,150)">
    <circle r="60" fill="none" stroke="#0a0e14" stroke-width="12"/>
    <circle r="60" fill="none" stroke="#4ade80" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="377 377" stroke-dashoffset="83" transform="rotate(-90)"/>
    <text font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="36"
          text-anchor="middle" y="6" fill="#e6edf3">78</text>
    <text font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="20"
          text-anchor="middle" y="34" fill="#4ade80">B</text>
  </g>
  <text font-family="DejaVu Sans, Arial, sans-serif" font-size="24"
        x="1090" y="550" fill="#9baabc" text-anchor="end">legal-ai-agent.netlify.app</text>
</svg>
"""


def draw_svg() -> None:
    out = SITE / "og-image.svg"
    out.write_text(SVG)
    print(f"wrote {out} — {out.stat().st_size} bytes")


if __name__ == "__main__":
    draw_svg()
    draw_png()
