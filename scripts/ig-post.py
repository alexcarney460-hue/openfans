#!/usr/bin/env python3
"""
Instagram poster for OpenFans — posts images/videos via Playwright browser automation.

Usage:
  Single post:   python ig-post.py <image_path> "<caption>"
  Batch queue:   python ig-post.py --batch <queue.json>
  Login check:   python ig-post.py --check

queue.json format:
[
  {"image": "content/posts/01.jpg", "caption": "Post caption here..."},
  {"image": "content/posts/02.mp4", "caption": "Reel caption..."}
]

Uses a separate browser profile (~/.ig_openfans_browser) so it won't
interfere with other IG accounts. Rate limited to 1 post per 70 minutes
for new accounts, configurable via --delay.
"""

import sys
import os
import time
import json
from pathlib import Path
from datetime import datetime

# --- Config ---
BROWSER_PROFILE = str(Path.home() / ".ig_openfans_browser")
DEFAULT_DELAY_MINS = 70  # minutes between posts (new account safety)
VIEWPORT = {"width": 1280, "height": 900}
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", file=sys.stderr)


def find_and_click_dialog_button(page, button_text: str) -> bool:
    """Find a button in the IG dialog header by text and click via coordinates."""
    # Try multiple strategies
    for attempt in range(3):
        result = page.evaluate(
            """(text) => {
            const dialog = document.querySelector("div[role='dialog']");
            if (!dialog) return null;
            const allEls = dialog.querySelectorAll("*");
            for (const el of allEls) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && rect.width < 200) {
                    const elText = el.textContent?.trim();
                    if (elText === text && el.children.length <= 1) {
                        return {x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2)};
                    }
                }
            }
            // Fallback: look for any clickable element with the text
            const buttons = dialog.querySelectorAll("div[role='button'], button, a, span");
            for (const el of buttons) {
                if (el.textContent?.trim() === text) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        return {x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2)};
                    }
                }
            }
            return null;
        }""",
            button_text,
        )
        if result:
            page.mouse.click(result["x"], result["y"])
            return True
        time.sleep(1)
    return False


def dismiss_popups(page) -> None:
    """Dismiss any Instagram popups."""
    for text in ["Not Now", "Not now", "OK", "Turn On", "Cancel"]:
        try:
            btn = page.locator(f'button:has-text("{text}")')
            if btn.count() > 0:
                btn.first.click()
                time.sleep(1)
        except Exception:
            pass


def check_login(page) -> bool:
    """Check if the browser is logged in to Instagram."""
    page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=60000)
    time.sleep(5)
    dismiss_popups(page)
    # If we see the Create/New post button, we're logged in
    create = page.locator('svg[aria-label="New post"]')
    if create.count() == 0:
        create = page.locator('svg[aria-label="Create"]')
    return create.count() > 0


def post_single(page, image_path: str, caption: str) -> dict:
    """Post a single image or video to Instagram."""
    image_path = str(Path(image_path).resolve())
    is_video = image_path.lower().endswith((".mp4", ".mov", ".avi"))

    if not Path(image_path).exists():
        log(f"ERROR: File not found: {image_path}")
        return {"ok": False, "error": "file_not_found", "path": image_path}

    # Navigate to home — retry on redirect interruptions
    for _nav_retry in range(3):
        try:
            page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=60000)
            break
        except Exception as nav_err:
            if "interrupted" in str(nav_err).lower() or "navigation" in str(nav_err).lower():
                log(f"  Navigation interrupted, retrying... ({_nav_retry + 1})")
                time.sleep(3)
            else:
                raise
    time.sleep(4)
    dismiss_popups(page)

    # Click Create
    create = page.locator('svg[aria-label="New post"]').locator("..")
    if create.count() == 0:
        create = page.locator('svg[aria-label="Create"]').locator("..")
    if create.count() == 0:
        log("ERROR: Create button not found — are you logged in?")
        return {"ok": False, "error": "not_logged_in"}

    create.first.click()
    time.sleep(2)

    # Instagram now shows a submenu (Post / AI) after clicking Create
    try:
        post_option = page.locator('span:text-is("Post")')
        if post_option.count() > 0:
            post_option.first.click()
            log("Clicked 'Post' from Create submenu")
            time.sleep(3)
    except Exception:
        pass

    dismiss_popups(page)
    time.sleep(2)

    # Upload file — retry a few times as dialog may be slow
    file_input = None
    for _retry in range(5):
        fi = page.locator('input[type="file"]')
        if fi.count() > 0:
            file_input = fi
            break
        log(f"  Waiting for file input... (attempt {_retry + 1})")
        dismiss_popups(page)
        time.sleep(2)

    if file_input is None:
        page.screenshot(path=f"debug-no-file-input-{int(time.time())}.png")
        log("ERROR: File input not found")
        return {"ok": False, "error": "no_file_input"}

    file_input.first.set_input_files(image_path)
    log(f"Uploaded: {Path(image_path).name}")

    if is_video:
        time.sleep(8)
        try:
            ok_btn = page.locator('button:has-text("OK")')
            if ok_btn.count() > 0:
                ok_btn.first.click()
                log("Dismissed reels popup")
                time.sleep(2)
        except Exception:
            pass
        time.sleep(5)
    else:
        time.sleep(5)

    # CROP step -> Next
    if find_and_click_dialog_button(page, "Next"):
        log("Next (crop)")
    else:
        log("WARNING: Next (crop) not found")
    time.sleep(3)

    if is_video:
        try:
            ok_btn = page.locator('button:has-text("OK")')
            if ok_btn.count() > 0:
                ok_btn.first.click()
                time.sleep(2)
        except Exception:
            pass

    # FILTER step -> Next
    if find_and_click_dialog_button(page, "Next"):
        log("Next (filter)")
    else:
        log("WARNING: Next (filter) not found")
    time.sleep(3)

    # CAPTION step
    textbox = page.locator('div[role="textbox"]')
    if textbox.count() > 0:
        textbox.first.click()
        time.sleep(0.3)
        page.keyboard.insert_text(caption)
        log("Caption inserted")
        time.sleep(1)
    else:
        log("WARNING: No textbox found")

    # Disable "Share to Facebook" toggle if present
    try:
        fb_toggle = page.evaluate("""() => {
            const dialog = document.querySelector("div[role='dialog']");
            if (!dialog) return null;
            // Look for Facebook toggle — it's an input[type='checkbox'] or a toggle near "Facebook" text
            const labels = dialog.querySelectorAll("*");
            for (const el of labels) {
                const text = el.textContent?.trim();
                if (text === "Facebook" || text === "Share to Facebook") {
                    // Find nearby toggle/checkbox
                    const parent = el.closest("div");
                    if (parent) {
                        const toggle = parent.querySelector("input[type='checkbox'], div[role='switch'], input[role='switch']");
                        if (toggle) {
                            const rect = toggle.getBoundingClientRect();
                            if (rect.width > 0) {
                                // Check if it's enabled
                                const isOn = toggle.checked || toggle.getAttribute("aria-checked") === "true" || toggle.value === "true";
                                if (isOn) {
                                    return {x: Math.round(rect.x + rect.width/2), y: Math.round(rect.y + rect.height/2)};
                                }
                            }
                        }
                    }
                }
            }
            return null;
        }""")
        if fb_toggle:
            page.mouse.click(fb_toggle["x"], fb_toggle["y"])
            log("Disabled 'Share to Facebook' toggle")
            time.sleep(1)
    except Exception as e:
        log(f"Note: Could not check Facebook toggle: {e}")

    # SHARE
    if find_and_click_dialog_button(page, "Share"):
        log("Share clicked!")
    else:
        log("ERROR: Share button not found")
        page.screenshot(path="debug-share-fail.png")
        return {"ok": False, "error": "share_not_found"}

    # Wait for processing
    wait_time = 120 if is_video else 25
    log(f"Waiting up to {wait_time}s for processing...")

    shared = False
    for i in range(wait_time // 5):
        time.sleep(5)
        dialog_text = page.evaluate(
            """() => {
            const d = document.querySelector("div[role='dialog']");
            return d ? d.textContent.substring(0, 200) : "none";
        }"""
        )
        if "shared" in dialog_text.lower() or "your reel" in dialog_text.lower():
            log("Post confirmed shared!")
            shared = True
            break
        if dialog_text == "none":
            log("Dialog closed — likely shared")
            shared = True
            break
        if i % 3 == 0:
            log(f"  Still processing... [{i*5}s]")

    post_type = "reel" if is_video else "feed"
    ts = datetime.now().isoformat()
    page.screenshot(path=f"debug-{post_type}-{int(time.time())}.png")

    return {"ok": shared, "type": post_type, "file": Path(image_path).name, "posted_at": ts}


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Instagram poster for OpenFans")
    parser.add_argument("image", nargs="?", help="Image/video path")
    parser.add_argument("caption", nargs="?", default="", help="Post caption")
    parser.add_argument("--batch", type=str, help="Path to batch queue JSON file")
    parser.add_argument("--check", action="store_true", help="Check login status only")
    parser.add_argument(
        "--delay",
        type=int,
        default=DEFAULT_DELAY_MINS,
        help=f"Minutes between batch posts (default: {DEFAULT_DELAY_MINS})",
    )
    parser.add_argument(
        "--profile",
        type=str,
        default=BROWSER_PROFILE,
        help="Browser profile directory",
    )
    parser.add_argument("--headless", action="store_true", help="Run headless")
    args = parser.parse_args()

    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            args.profile,
            headless=args.headless,
            viewport=VIEWPORT,
            user_agent=USER_AGENT,
            locale="en-US",
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        # --- Check login ---
        if args.check:
            logged_in = check_login(page)
            status = "logged_in" if logged_in else "not_logged_in"
            log(f"Status: {status}")
            print(json.dumps({"logged_in": logged_in}))
            if not logged_in:
                log("Please log in manually in the browser window that opened.")
                log("Press Enter when done...")
                input()
            ctx.close()
            return

        # --- Batch mode ---
        if args.batch:
            queue_path = Path(args.batch)
            if not queue_path.exists():
                log(f"ERROR: Queue file not found: {queue_path}")
                ctx.close()
                sys.exit(1)

            queue = json.loads(queue_path.read_text(encoding="utf-8"))
            results = []
            total = len(queue)

            log(f"Batch posting {total} items with {args.delay}min delay between posts")

            # Check login first
            if not check_login(page):
                log("ERROR: Not logged in! Run with --check first to log in.")
                ctx.close()
                sys.exit(1)

            for i, item in enumerate(queue):
                log(f"\n--- Post {i+1}/{total} ---")
                result = post_single(page, item["image"], item["caption"])
                results.append(result)

                if result["ok"]:
                    log(f"SUCCESS: {result.get('file', 'unknown')}")
                else:
                    log(f"FAILED: {result.get('error', 'unknown')}")

                # Save progress after each post
                progress_path = queue_path.with_suffix(".progress.json")
                progress_path.write_text(
                    json.dumps(results, indent=2), encoding="utf-8"
                )

                # Rate limit delay (skip after last post)
                if i < total - 1 and result["ok"]:
                    delay_secs = args.delay * 60
                    log(f"Waiting {args.delay} minutes before next post...")
                    time.sleep(delay_secs)

            print(json.dumps({"ok": True, "results": results, "total": total}))
            ctx.close()
            return

        # --- Single post mode ---
        if not args.image:
            parser.print_help()
            ctx.close()
            sys.exit(1)

        if not check_login(page):
            log("ERROR: Not logged in! Run with --check first.")
            ctx.close()
            sys.exit(1)

        result = post_single(page, args.image, args.caption)
        print(json.dumps(result))
        ctx.close()


if __name__ == "__main__":
    main()
