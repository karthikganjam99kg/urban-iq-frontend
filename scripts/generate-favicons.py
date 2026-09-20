"""Generate the UrbanIQ favicon and app-icon set from the sidebar brand tile.

The mark is the same one the app renders in `.brand-icon`: the U+2301 electric
arrow on a 135-degree blue-to-cyan gradient with a 29.55% corner radius. The
outline below is the real Menlo glyph the browser falls back to, traced once so
the icons do not depend on a font being installed.

Run with Pillow available:
    python3 scripts/generate-favicons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

PUBLIC = Path(__file__).resolve().parent.parent / "public"

# Brand tokens mirrored from src/styles/app.css (.brand-icon)
BLUE_500 = (45, 127, 249)
CYAN_400 = (49, 215, 232)
RADIUS_RATIO = 13 / 44

# Menlo U+2301 outline in font units, y-up, with its ink bounding box.
GLYPH_UNITS = (
    (674, 634),
    (674, 332),
    (114, 662),
    (114, 856),
    (546, 606),
    (546, 908),
    (1106, 578),
    (1106, 384),
)
GLYPH_X0, GLYPH_X1 = 114, 1106
GLYPH_Y0, GLYPH_Y1 = 332, 908
GLYPH_W = GLYPH_X1 - GLYPH_X0
GLYPH_H = GLYPH_Y1 - GLYPH_Y0
GLYPH_ASPECT = GLYPH_W / GLYPH_H

# The app draws the glyph at ~34% of the tile, which turns to mush at 16px.
GLYPH_SCALE = 0.62
GLYPH_SCALE_MASKABLE = 0.50

SUPERSAMPLE = 4


def glyph_unit_points():
    """Normalised 0..1 points with y flipped to screen orientation."""
    return [
        ((x - GLYPH_X0) / GLYPH_W, 1 - (y - GLYPH_Y0) / GLYPH_H) for x, y in GLYPH_UNITS
    ]


def diagonal_gradient(size):
    """135-degree gradient, drawn small then upscaled."""
    steps = 128
    ramp = Image.new("RGB", (steps, steps))
    pixels = ramp.load()
    for y in range(steps):
        for x in range(steps):
            t = (x + y) / (2 * (steps - 1))
            pixels[x, y] = tuple(
                round(a + (b - a) * t) for a, b in zip(BLUE_500, CYAN_400)
            )
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


def glyph_polygon(size, scale):
    width = size * scale
    height = width / GLYPH_ASPECT
    ox = (size - width) / 2
    oy = (size - height) / 2
    return [(ox + x * width, oy + y * height) for x, y in glyph_unit_points()]


def render_icon(size, radius_ratio=RADIUS_RATIO, glyph_scale=GLYPH_SCALE):
    canvas = size * SUPERSAMPLE
    icon = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    icon.paste(diagonal_gradient(canvas), (0, 0), rounded_mask(canvas, radius_ratio))

    glyph = Image.new("L", (canvas, canvas), 0)
    ImageDraw.Draw(glyph).polygon(glyph_polygon(canvas, glyph_scale), fill=255)
    icon.paste(Image.new("RGBA", (canvas, canvas), (255, 255, 255, 255)), (0, 0), glyph)

    return icon.resize((size, size), Image.LANCZOS)


def write_svg(path):
    box = 512
    points = " ".join(f"{x:.1f},{y:.1f}" for x, y in glyph_polygon(box, GLYPH_SCALE))
    path.write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box} {box}" role="img" aria-label="UrbanIQ">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2d7ff9" />
      <stop offset="1" stop-color="#31d7e8" />
    </linearGradient>
  </defs>
  <rect width="{box}" height="{box}" rx="{round(box * RADIUS_RATIO)}" fill="url(#tile)" />
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
    render_icon(96).save(
        PUBLIC / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )
    render_icon(180, radius_ratio=0, glyph_scale=GLYPH_SCALE_MASKABLE).save(
        PUBLIC / "apple-touch-icon.png"
    )
    render_icon(192).save(PUBLIC / "icon-192.png")
    render_icon(512).save(PUBLIC / "icon-512.png")
    render_icon(512, radius_ratio=0, glyph_scale=GLYPH_SCALE_MASKABLE).save(
        PUBLIC / "icon-maskable-512.png"
    )
    write_manifest(PUBLIC / "site.webmanifest")

    for name in sorted(p.name for p in PUBLIC.iterdir()):
        print(name)


if __name__ == "__main__":
    main()
