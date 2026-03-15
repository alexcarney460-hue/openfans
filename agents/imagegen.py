"""
Image generation via Nano Banana 2 (Gemini 3.1 Flash Image).
Generates cinematic AI images for OpenFans reel scenes.
"""

import json
import base64
import urllib.request
from pathlib import Path
from agents.config import GEMINI_KEY, TMP

MODEL = "gemini-3.1-flash-image-preview"
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def generate_image(prompt: str, output_path: str, aspect_ratio: str = "9:16", size: str = "1K") -> str | None:
    """Generate an image using Nano Banana 2 and save to disk."""
    print(f"    [IMAGEGEN] Generating: {prompt[:80]}...")

    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": {
                "aspectRatio": aspect_ratio,
                "imageSize": size,
            },
        },
    }).encode()

    req = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={
            "x-goog-api-key": GEMINI_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"    [IMAGEGEN] API error: {e}")
        return None

    candidates = data.get("candidates", [])
    if not candidates:
        print(f"    [IMAGEGEN] No candidates in response")
        return None

    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and inline.get("data"):
            img_bytes = base64.b64decode(inline["data"])
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(img_bytes)
            print(f"    [IMAGEGEN] Saved: {output_path} ({len(img_bytes) // 1024}KB)")
            return output_path

    print(f"    [IMAGEGEN] No image data in response")
    return None


def generate_scene_image(scene_description: str, visual_mood: str, scene_num: int, prefix: str = "of") -> str | None:
    """Generate a cinematic scene image for an OpenFans reel.

    Unlike Motion Ventures (text-overlay focused), OpenFans reels are
    STORY-DRIVEN with minimal text. Images need to be cinematic and
    emotionally expressive — they ARE the story.
    """
    prompt = (
        f"Cinematic Instagram Reel frame, vertical 9:16, photorealistic. "
        f"Visual mood: {visual_mood}. "
        f"Scene: {scene_description}. "
        f"Style: film-quality, shallow depth of field, dramatic lighting, "
        f"emotionally expressive. Color palette includes electric cyan (#00AFF0) "
        f"as accent lighting (neon signs, phone screens, ambient glow). "
        f"No text, no words, no letters, no watermarks in the image. "
        f"The image should tell a story on its own without any text overlay."
    )

    output = str(TMP / f"{prefix}-scene{scene_num}.png")
    return generate_image(prompt, output, aspect_ratio="9:16", size="1K")
