#!/usr/bin/env python3
"""
Generate branded OpenFans post images using AI image generation.

Reads the post queue JSON and generates images for each post concept
using the visual descriptions provided.

Usage:
  python generate-post-images.py <queue.json> [--output content/posts/]

This script creates placeholder branded images with OpenFans styling.
For production, swap the generation logic with your preferred AI image API
(DALL-E 3, Midjourney, Flux, etc).
"""

import json
import sys
from pathlib import Path

# PIL-based branded placeholder generator
# Creates clean branded cards when AI images aren't available yet
try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


BRAND_CYAN = (0, 175, 240)     # #00AFF0
BRAND_DARK = (15, 15, 20)      # near-black
BRAND_ORANGE = (245, 166, 35)  # #F5A623
WHITE = (255, 255, 255)
GRAY = (120, 120, 130)

POST_SIZE = (1080, 1080)       # Instagram square
REEL_SIZE = (1080, 1920)       # Instagram reel (9:16)


def create_branded_card(
    text: str,
    subtitle: str = "",
    size: tuple = POST_SIZE,
    output_path: str = "post.jpg",
    style: str = "dark",
) -> str:
    """Create a branded OpenFans post image with text overlay."""
    if not HAS_PIL:
        print(f"PIL not installed — skipping image generation for {output_path}", file=sys.stderr)
        return output_path

    img = Image.new("RGB", size, BRAND_DARK)
    draw = ImageDraw.Draw(img)

    # Gradient overlay at top
    for y in range(min(200, size[1] // 3)):
        alpha = int(255 * (1 - y / 200))
        r = int(BRAND_CYAN[0] * alpha / 255 * 0.3)
        g = int(BRAND_CYAN[1] * alpha / 255 * 0.3)
        b = int(BRAND_CYAN[2] * alpha / 255 * 0.3)
        draw.line([(0, y), (size[0], y)], fill=(r + 15, g + 15, b + 20))

    # Try to use a decent font, fall back to default
    try:
        font_large = ImageFont.truetype("arial.ttf", 56)
        font_small = ImageFont.truetype("arial.ttf", 28)
        font_brand = ImageFont.truetype("arial.ttf", 36)
    except (IOError, OSError):
        font_large = ImageFont.load_default()
        font_small = font_large
        font_brand = font_large

    # Brand name at top
    draw.text((60, 40), "OPENFANS", fill=BRAND_CYAN, font=font_brand)
    draw.text((60 + len("OPENFANS") * 22, 40), ".online", fill=GRAY, font=font_brand)

    # Accent line
    draw.rectangle(
        [(60, 100), (60 + 80, 104)],
        fill=BRAND_CYAN,
    )

    # Main text — word wrap
    margin = 60
    max_width = size[0] - margin * 2
    words = text.split()
    lines = []
    current_line = ""
    for word in words:
        test = f"{current_line} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font_large)
        if bbox[2] - bbox[0] <= max_width:
            current_line = test
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)

    # Center text vertically
    line_height = 70
    total_text_height = len(lines) * line_height
    y_start = (size[1] - total_text_height) // 2

    for i, line in enumerate(lines):
        y = y_start + i * line_height
        draw.text((margin, y), line, fill=WHITE, font=font_large)

    # Subtitle below main text
    if subtitle:
        sub_y = y_start + len(lines) * line_height + 30
        draw.text((margin, sub_y), subtitle, fill=BRAND_ORANGE, font=font_small)

    # Bottom bar
    bar_y = size[1] - 80
    draw.rectangle([(0, bar_y), (size[0], size[1])], fill=(20, 20, 25))
    draw.text((60, bar_y + 25), "openfans.online", fill=BRAND_CYAN, font=font_small)
    draw.text(
        (size[0] - 300, bar_y + 25),
        "Keep 95% of your earnings",
        fill=GRAY,
        font=font_small,
    )

    # Save
    img.save(output_path, "JPEG", quality=95)
    print(f"Created: {output_path}", file=sys.stderr)
    return output_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate-post-images.py <queue.json> [--output dir/]")
        sys.exit(1)

    queue_path = Path(sys.argv[1])
    output_dir = Path("content/posts/")

    for i, arg in enumerate(sys.argv):
        if arg == "--output" and i + 1 < len(sys.argv):
            output_dir = Path(sys.argv[i + 1])

    output_dir.mkdir(parents=True, exist_ok=True)

    queue = json.loads(queue_path.read_text(encoding="utf-8"))

    for i, item in enumerate(queue):
        num = str(i + 1).zfill(2)
        is_reel = item.get("type", "image") in ("reel", "video")
        size = REEL_SIZE if is_reel else POST_SIZE
        ext = ".jpg"

        filename = f"post-{num}{ext}"
        output_path = str(output_dir / filename)

        headline = item.get("headline", item.get("caption", "")[:80])
        subtitle = item.get("subtitle", "")

        create_branded_card(
            text=headline,
            subtitle=subtitle,
            size=size,
            output_path=output_path,
            style=item.get("style", "dark"),
        )

        # Update queue with generated image path
        item["image"] = output_path

    # Write updated queue with image paths
    updated_path = queue_path.with_stem(queue_path.stem + "-with-images")
    updated_path.write_text(json.dumps(queue, indent=2), encoding="utf-8")
    print(f"\nUpdated queue saved to: {updated_path}", file=sys.stderr)
    print(json.dumps({"ok": True, "count": len(queue), "output_dir": str(output_dir)}))


if __name__ == "__main__":
    main()
