#!/usr/bin/env python3
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "_production" / "poster-source-v2.webp"
OUTPUT = ROOT / "public" / "poster.png"
THUMB = ROOT / "_production" / "poster-thumb-160.png"
FONT = Path("/Library/Fonts/AGaramondPro-Bold.otf")


def tracked_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, tracking: int) -> int:
    widths = [draw.textlength(char, font=font) for char in text]
    return round(sum(widths) + tracking * (len(text) - 1))


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    tracking: int,
) -> None:
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=font, fill=fill)
        x += draw.textlength(char, font=font) + tracking


image = Image.open(SOURCE).convert("RGBA").resize((1024, 1024), Image.Resampling.LANCZOS)
overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

draw.rounded_rectangle((112, 36, 912, 178), radius=2, fill=(247, 243, 235, 238))
draw.rectangle((112, 36, 119, 178), fill=(168, 166, 110, 255))
draw.line((138, 161, 885, 161), fill=(46, 43, 40, 58), width=1)

font = ImageFont.truetype(str(FONT), 112)
title = "SIX HID IT"
tracking = 7
width = tracked_width(draw, title, font, tracking)
draw_tracked(draw, ((1024 - width) // 2, 48), title, font, (46, 43, 40, 255), tracking)

image = Image.alpha_composite(image, overlay).convert("RGB")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
image.save(OUTPUT, "PNG", optimize=True)
image.resize((160, 160), Image.Resampling.LANCZOS).save(THUMB, "PNG", optimize=True)

print(OUTPUT)
print(THUMB)
