"""Generate the UrbanIQ favicon and app-icon set from the brand tile.

Run with Pillow available:
    python3 scripts/generate-favicons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

PUBLIC = Path(__file__).resolve().parent.parent / "public"

# Brand tokens mirrored from src/styles/app.css
BLUE_600 = (23, 105, 224)
BLUE_500 = (45, 127, 249)
CYAN_400 = (49, 215, 232)
NAVY_900 = (10, 23, 41)

GRADIENT_STOPS = ((0.0, BLUE_600), (0.45, BLUE_500), (1.0, CYAN_400))

# Signal bolt in unit coordinates, matching the "⌁" brand glyph.
BOLT = (
    (0.585, 0.100),
    (0.295, 0.545),
    (0.465, 0.545),
    (0.395, 0.900),
    (0.715, 0.435),
    (0.535, 0.435),
    (0.645, 0.100),
)

SUPERSAMPLE = 4


def lerp(start, end, t):
    return tuple(round(a + (b - a) * t) for a, b in zip(start, end))


def stop_color(t):
    t = min(max(t, 0.0), 1.0)
    for (t0, c0), (t1, c1) in zip(GRADIENT_STOPS, GRADIENT_STOPS[1:]):
        if t <= t1:
            span = t1 - t0
            return lerp(c0, c1, 0.0 if span == 0 else (t - t0) / span)
    return GRADIENT_STOPS[-1][1]


def diagonal_gradient(size):
    """135-degree gradient, drawn small and upscaled for speed."""
    steps = 128
    ramp = Image.new("RGB", (steps, steps))
    pixels = ramp.load()
    for y in range(steps):
        for x in range(steps):
            pixels[x, y] = stop_color((x + y) / (2 * (steps - 1)))
    return ramp.resize((size, size), Image.LANCZOS)


def rounded_mask(size, radius_ratio):
    mask = Image.new("L", (size, size), 0)
    if radius_ratio <= 0:
        mask.paste(255, (0, 0, size, size))
        return mask
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size - 1, size - 1),
        radius=round(size * radius_ratio),
        fill=255,
    )
    return mask


def bolt_points(size, scale):
    offset = (1 - scale) / 2
    return [
        ((offset + x * scale) * size, (offset + y * scale) * size) for x, y in BOLT
    ]


def render_icon(size, radius_ratio=0.28, glyph_scale=0.80):
    canvas = size * SUPERSAMPLE
    icon = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    icon.paste(diagonal_gradient(canvas), (0, 0), rounded_mask(canvas, radius_ratio))

    points = bolt_points(canvas, glyph_scale)

    shadow = Image.new("L", (canvas, canvas), 0)
    ImageDraw.Draw(shadow).polygon(
        [(x, y + canvas * 0.012) for x, y in points], fill=90
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(canvas * 0.012))
    icon.paste(Image.new("RGBA", (canvas, canvas), NAVY_900 + (255,)), (0, 0), shadow)

    glyph = Image.new("L", (canvas, canvas), 0)
    ImageDraw.Draw(glyph).polygon(points, fill=255)
    icon.paste(Image.new("RGBA", (canvas, canvas), (255, 255, 255, 255)), (0, 0), glyph)

    return icon.resize((size, size), Image.LANCZOS)


def write_svg(path):
    points = " ".join(f"{x * 512:.1f},{y * 512:.1f}" for x, y in BOLT)
    path.write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="UrbanIQ">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1769e0" />
      <stop offset="0.45" stop-color="#2d7ff9" />
      <stop offset="1" stop-color="#31d7e8" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="143" fill="url(#tile)" />
  <polygon points="{points}" fill="#ffffff" />
</svg>
""",
        encoding="utf-8",
    )


def write_manifest(path):
    path.write_text(
        """{
  "name": "UrbanIQ · Hyderabad Command Centre",
  "short_name": "UrbanIQ",
  "description": "AI-powered urban intelligence command centre for Hyderabad.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a1729",
  "theme_color": "#0a1729",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
""",
        encoding="utf-8",
    )


def main():
    PUBLIC.mkdir(exist_ok=True)

    write_svg(PUBLIC / "favicon.svg")
    render_icon(96, glyph_scale=0.82).save(
        PUBLIC / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )
    render_icon(180, radius_ratio=0, glyph_scale=0.62).save(
        PUBLIC / "apple-touch-icon.png"
    )
    render_icon(192).save(PUBLIC / "icon-192.png")
    render_icon(512).save(PUBLIC / "icon-512.png")
    render_icon(512, radius_ratio=0, glyph_scale=0.58).save(
        PUBLIC / "icon-maskable-512.png"
    )
    write_manifest(PUBLIC / "site.webmanifest")

    for name in sorted(p.name for p in PUBLIC.iterdir()):
        print(name)


if __name__ == "__main__":
    main()
