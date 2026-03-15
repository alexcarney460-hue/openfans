"""
PUBLISHER — Posts finished reels to Instagram via Playwright browser automation.
Wraps the ig-post.py script for the OpenFans account.
"""

import json
import subprocess
import sys
from pathlib import Path
from agents.config import BASE


IG_SCRIPT = str(BASE / "scripts" / "ig-post.py")


def run(reel_info: dict, caption: str) -> dict:
    """Post a reel to Instagram.

    Args:
        reel_info: dict with 'file' key pointing to the .mp4
        caption: the Instagram caption text

    Returns:
        dict with posting result
    """
    file_path = reel_info.get("file", "")
    title = reel_info.get("title", "reel")

    if not Path(file_path).exists():
        print(f"  [PUBLISHER] ERROR: Reel file not found: {file_path}")
        return {"ok": False, "error": "file_not_found"}

    # Truncate caption to Instagram's 2200 char limit
    if len(caption) > 2200:
        caption = caption[:2190] + "..."

    print(f"  [PUBLISHER] Posting \"{title}\" to Instagram...")
    print(f"  [PUBLISHER] File: {file_path}")
    print(f"  [PUBLISHER] Caption: {caption[:80]}...")

    try:
        result = subprocess.run(
            [sys.executable, IG_SCRIPT, file_path, caption],
            capture_output=True,
            text=True,
            timeout=180,
            cwd=str(BASE),
        )

        stderr_lines = result.stderr.strip().split("\n") if result.stderr else []
        for line in stderr_lines:
            print(f"    {line}")

        stdout = result.stdout.strip()
        try:
            output = json.loads(stdout)
        except (json.JSONDecodeError, ValueError):
            output = {"ok": result.returncode == 0, "raw": stdout}

        post_result = {
            "ok": output.get("ok", False),
            "title": title,
            "type": output.get("type", "reel"),
            "caption_length": len(caption),
        }

        if post_result["ok"]:
            print(f"  [PUBLISHER] Posted successfully!")
        else:
            print(f"  [PUBLISHER] Post may have failed -- check Instagram manually")

        return post_result

    except subprocess.TimeoutExpired:
        print("  [PUBLISHER] TIMEOUT -- reel upload took too long")
        return {"ok": False, "error": "timeout"}
    except Exception as e:
        print(f"  [PUBLISHER] ERROR: {e}")
        return {"ok": False, "error": str(e)}
