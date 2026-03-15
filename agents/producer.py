"""
PRODUCER — Video Production Agent for OpenFans Reels

Renders story-driven reels with MINIMAL text overlays.
Unlike Motion Ventures (text-heavy), OpenFans reels tell stories through
cinematic AI-generated images with zoompan animation.

Only the end card gets text (logo + URL).

Pipeline:
  1. Generate AI images per scene via Nano Banana 2
  2. Apply zoompan + color grading per scene via FFmpeg
  3. Add end card with OpenFans branding
  4. Concatenate all scene clips into final .mp4
"""

import os
import subprocess
from pathlib import Path
from agents.config import FFMPEG, TMP, BASE, FONT_BOLD, FONT_SEMI, COLOR_GRADES
from agents.imagegen import generate_scene_image


def _ffmpeg(*args, timeout=180) -> bool:
    cmd = [FFMPEG, "-y"] + [str(a).replace("\\", "/") for a in args]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=str(BASE))
    if result.returncode != 0:
        print(f"    FFmpeg error: {result.stderr[-400:]}")
    return result.returncode == 0


def _escape_text(text: str) -> str:
    """Escape text for FFmpeg drawtext in filter_script:v files."""
    return (text
            .replace("\\", "\\\\")
            .replace("'", "\u2019")
            .replace(":", "\\\\:")
            .replace(",", "\\,")
            .replace("[", "\\[")
            .replace("]", "\\]")
            .replace(";", "\\;"))


def _make_scene_clip(img_path: str, scene: dict, clip_path: str) -> bool:
    """Create a scene clip from a still image with zoompan + color grading.

    MINIMAL text — only adds text if scene explicitly has text_lines.
    Most scenes should be pure visual storytelling.
    """
    duration = scene.get("duration", 3.0)
    zoom_speed = scene.get("zoom_speed", 0.0008)
    color_mood = scene.get("color_mood", "cool_cyan")
    text_lines = scene.get("text_lines", [])
    fontsize = scene.get("fontsize", 42)

    grade = COLOR_GRADES.get(color_mood, COLOR_GRADES["cool_cyan"])
    frames = int(duration * 30)

    # Zoom direction varies by scene for visual interest
    scene_num = scene.get("scene_num", 1)
    if scene_num % 3 == 0:
        # Zoom out
        zoom_expr = f"z=if(eq(on\\,1)\\,1.15\\,max(z-{zoom_speed}\\,1.0))"
    elif scene_num % 3 == 1:
        # Zoom in
        zoom_expr = f"z=min(zoom+{zoom_speed}\\,1.2)"
    else:
        # Pan slightly (zoom in with offset)
        zoom_expr = f"z=min(zoom+{zoom_speed * 0.5}\\,1.1)"

    vf_parts = [
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
        f"zoompan={zoom_expr}:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):d={frames}:s=1080x1920:fps=30",
        grade,
    ]

    # Only add text if explicitly provided (most scenes are text-free)
    if text_lines:
        escaped = [_escape_text(line) for line in text_lines]
        text = r"\n".join(escaped)
        # Subtle text with fade-in, no background box (story-driven, not text-driven)
        vf_parts.append(
            f"drawtext=text={text}"
            f":fontfile={FONT_BOLD}"
            f":fontsize={fontsize}:fontcolor=white"
            f":borderw=2:bordercolor=black@0.6"
            f":x=(w-text_w)/2:y=h*0.82"
            f":alpha=if(lt(t\\,0.5)\\,t/0.5\\,1)"
        )

    vf = ",".join(vf_parts)
    filter_file = clip_path + ".filter.txt"
    with open(filter_file, "w", encoding="utf-8") as f:
        f.write(vf)

    ok = _ffmpeg(
        "-loop", "1", "-i", str(img_path).replace("\\", "/"),
        "-filter_script:v", filter_file.replace("\\", "/"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-t", str(duration),
        str(clip_path).replace("\\", "/"),
    )

    try:
        os.unlink(filter_file)
    except OSError:
        pass

    return ok


def _make_end_card(clip_path: str, duration: float = 2.0) -> bool:
    """Create the OpenFans branded end card — logo + URL on black."""
    # Create a simple branded end card using FFmpeg
    vf = (
        f"color=c=#0A0E1A:s=1080x1920:d={duration},"
        f"drawtext=text=openfans.online"
        f":fontfile={FONT_BOLD}"
        f":fontsize=52:fontcolor=#00AFF0"
        f":x=(w-text_w)/2:y=(h-text_h)/2+40"
        f":alpha=if(lt(t\\,0.5)\\,t/0.5\\,1),"
        f"drawtext=text=link in bio"
        f":fontfile={FONT_SEMI}"
        f":fontsize=28:fontcolor=white@0.7"
        f":x=(w-text_w)/2:y=(h+text_h)/2+90"
        f":alpha=if(lt(t\\,0.8)\\,0\\,if(lt(t\\,1.3)\\,(t-0.8)/0.5\\,1))"
    )

    filter_file = clip_path + ".filter.txt"
    with open(filter_file, "w", encoding="utf-8") as f:
        f.write(vf)

    ok = _ffmpeg(
        "-f", "lavfi", "-i", f"color=c=#0A0E1A:s=1080x1920:d={duration}",
        "-filter_script:v", filter_file.replace("\\", "/"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-t", str(duration),
        str(clip_path).replace("\\", "/"),
    )

    try:
        os.unlink(filter_file)
    except OSError:
        pass

    return ok


def run(reel: dict) -> dict | None:
    """Produce a complete reel video from scene definitions.

    Args:
        reel: dict with 'title', 'scenes' (list of scene dicts), 'caption'
              Each scene has: visual_description, duration, color_mood, zoom_speed,
              and optionally text_lines (most should NOT have text)

    Returns:
        dict with 'file', 'title', 'size_kb', 'duration' or None on failure
    """
    title = reel.get("title", "reel")
    scenes = reel.get("scenes", [])
    safe_title = "".join(c if c.isalnum() else "" for c in title)[:20].lower() or "reel"
    output_path = str(TMP / f"reel-{safe_title}.mp4")

    print(f"  [PRODUCER] Rendering \"{title}\" ({len(scenes)} scenes)...")

    clips = []

    for i, scene in enumerate(scenes):
        scene["scene_num"] = i + 1
        num = i + 1
        description = scene.get("visual_description", "cinematic scene")
        mood = scene.get("visual_mood", "cinematic, dramatic lighting, night-out glamour")

        # Generate AI image for this scene
        print(f"    Scene {num}/{len(scenes)}: generating image...")
        img_path = generate_scene_image(
            scene_description=description,
            visual_mood=mood,
            scene_num=num,
            prefix=f"of-{safe_title}",
        )

        if not img_path:
            print(f"    Scene {num}: image generation failed, skipping")
            continue

        # Render scene clip with zoompan + color grade
        clip_path = str(TMP / f"of-{safe_title}-c{num}.mp4")
        if _make_scene_clip(img_path, scene, clip_path):
            clips.append(clip_path)
            print(f"    Scene {num}: OK")
        else:
            print(f"    Scene {num}: FFmpeg render failed")

        # Cleanup image
        try:
            os.unlink(img_path)
        except OSError:
            pass

    if not clips:
        print("  [PRODUCER] ERROR: No scenes rendered")
        return None

    # Add end card
    end_card_path = str(TMP / f"of-{safe_title}-endcard.mp4")
    if _make_end_card(end_card_path, duration=2.0):
        clips.append(end_card_path)
    else:
        print("  [PRODUCER] Warning: end card failed, continuing without it")

    # Concatenate all clips
    if len(clips) == 1:
        os.replace(clips[0], output_path)
    else:
        concat_file = str(TMP / f"concat-{safe_title}.txt")
        with open(concat_file, "w", encoding="utf-8") as f:
            for clip in clips:
                f.write(f"file '{clip.replace(chr(92), '/')}'\n")

        ok = _ffmpeg(
            "-f", "concat", "-safe", "0",
            "-i", concat_file.replace("\\", "/"),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", "-crf", "18",
            output_path.replace("\\", "/"),
        )

        try:
            os.unlink(concat_file)
        except OSError:
            pass

        if not ok:
            print("  [PRODUCER] ERROR: Concat failed")
            return None

    # Cleanup individual clips
    for clip in clips:
        if clip != output_path:
            try:
                os.unlink(clip)
            except OSError:
                pass

    size = os.path.getsize(output_path)
    total_dur = sum(s.get("duration", 3) for s in scenes) + 2.0  # +2 for end card

    print(f"  [PRODUCER] Done: {output_path} ({size // 1024}KB, {total_dur:.1f}s)")
    return {
        "file": output_path,
        "title": title,
        "size_kb": size // 1024,
        "duration": total_dur,
        "scene_count": len(scenes),
    }
