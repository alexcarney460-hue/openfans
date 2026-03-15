#!/usr/bin/env python3
"""
OpenFans — Instagram DM Outreach

Sends personalized DMs to OnlyFans creators about OpenFans.
Uses Playwright with a persistent Chrome profile.

Usage:
  python ig-dm.py                    # DM all targets, 55s apart
  python ig-dm.py --dry-run          # print DMs without sending
  python ig-dm.py --target @handle   # DM a specific creator

Rate: 1 DM every 55 seconds, batch of 50 then 5 min pause.
"""

import sys
import os
import time
import random
import argparse
import json
from datetime import datetime
from pathlib import Path

from playwright.sync_api import sync_playwright

# --- Config ---
VIEWPORT = {"width": 1280, "height": 900}
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
MIN_DELAY = 55
MAX_DELAY = 65
BATCH_SIZE = 50
BATCH_PAUSE = 300  # 5 min
LOG_FILE = str(Path(__file__).parent.parent / "logs" / "dm-outreach.jsonl")
BROWSER_PROFILE = str(Path.home() / ".ig_openfans_dms")

# --- DM Templates ---
# Varied, personal, non-spammy. Each feels like a real person reaching out.
DM_TEMPLATES = [
    (
        "hey {name}! love what you're building. quick question -- how do you feel about "
        "your platform taking 20% of everything you earn?\n\n"
        "i'm with openfans.online -- we do 95% payouts, instant USDC, no bank delays. "
        "we're onboarding founder creators right now (limited spots, 90 days).\n\n"
        "no pressure at all, just thought you should know it exists. keep killing it either way!"
    ),
    (
        "hi {name}! genuinely love your content.\n\n"
        "wanted to put something on your radar -- openfans.online is a new creator platform "
        "where you keep 95% of what you earn (vs 80% on most platforms). payouts are instant "
        "via crypto, no waiting 21 days.\n\n"
        "we're doing a founder program right now -- early creators get priority support + "
        "reduced fees. thought of you.\n\nopenfans.online if you're curious!"
    ),
    (
        "hey! not trying to be weird but i think you're leaving money on the table.\n\n"
        "if you're making $5K/mo on your current platform, you're losing $1,000/mo to fees. "
        "that's $12K/year.\n\n"
        "openfans.online takes only 5% and pays out instantly in USDC. no bank holds, "
        "no 'processing' delays.\n\n"
        "we're onboarding founders right now. worth a look?"
    ),
    (
        "hi {name}! saw your page and had to reach out.\n\n"
        "i'm part of a new platform called openfans -- built specifically because the 20% "
        "cut on other platforms is insane. we do 95% payouts, instant crypto deposits, "
        "and nobody can freeze your account.\n\n"
        "we're running a founder program (90 days, limited spots). would love to have you.\n\n"
        "openfans.online -- no pressure, just wanted you to know about it!"
    ),
    (
        "hey {name}!\n\n"
        "real talk -- you deserve to keep more of what you earn. "
        "openfans.online gives creators 95% payouts with instant USDC deposits. "
        "no bank middlemen, no 21-day waits.\n\n"
        "we're bringing on founder creators right now and your content would be perfect. "
        "check it out if you're interested!\n\nkeep doing your thing either way"
    ),
    (
        "hi! huge fan of your content.\n\n"
        "quick pitch: openfans.online = 95% payouts (vs 80% elsewhere) + instant crypto "
        "deposits + can't be deplatformed.\n\n"
        "we're in our founder phase -- early creators get the best deal. "
        "thought you should see it before spots fill up.\n\nno pressure!"
    ),
]


def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", file=sys.stderr, flush=True)


def log_result(target, message, success, error=""):
    Path(LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": datetime.now().isoformat(),
        "target": target,
        "message": message[:100],
        "success": success,
        "error": error,
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def get_dm(used, handle):
    """Pick a random DM template that hasn't been used recently."""
    available = [t for t in DM_TEMPLATES if t not in used]
    if not available:
        used.clear()
        available = DM_TEMPLATES
    template = random.choice(available)
    used.add(template)
    name = handle.lstrip("@").split("_")[0].split(".")[0].capitalize()
    return template.format(name=name)


def send_dm(page, target, message_text):
    """Navigate to a creator's profile and send them a DM."""
    handle = target.lstrip("@")

    try:
        # Go to their profile
        log(f"  Opening profile @{handle}...")
        page.goto(f"https://www.instagram.com/{handle}/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)

        # Dismiss any popups
        for btn_text in ["Not Now", "Decline", "Not now"]:
            try:
                btn = page.query_selector(f'button:has-text("{btn_text}")')
                if btn and btn.is_visible():
                    btn.click()
                    time.sleep(1)
            except Exception:
                pass

        # Check if profile exists
        if "Sorry, this page" in page.content() or "/accounts/login" in page.url:
            log(f"  Profile not found: {handle}")
            return False

        # Follow them first if not already following (required for DMs on most accounts)
        follow_btn = None
        for sel in [
            'button:has-text("Follow")',
            'div[role="button"]:has-text("Follow")',
        ]:
            btn = page.query_selector(sel)
            if btn and btn.is_visible():
                text = btn.inner_text().strip()
                # Only click if it says "Follow" (not "Following" or "Follow Back")
                if text == "Follow":
                    follow_btn = btn
                    break

        if follow_btn:
            log(f"  Following @{handle} first...")
            box = follow_btn.bounding_box()
            if box:
                page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            else:
                follow_btn.click()
            time.sleep(2)

        # Find and click the "Message" button
        message_btn = None
        for sel in [
            'div[role="button"]:has-text("Message")',
            'button:has-text("Message")',
            'a:has-text("Message")',
        ]:
            message_btn = page.query_selector(sel)
            if message_btn and message_btn.is_visible():
                break
            message_btn = None

        if not message_btn:
            log(f"  No Message button found for @{handle}")
            return False

        # Click Message button
        box = message_btn.bounding_box()
        if box:
            page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        else:
            message_btn.click()
        time.sleep(3)

        # Dismiss any "Turn on Notifications" popup
        for btn_text in ["Not Now", "Not now", "Decline"]:
            try:
                btn = page.query_selector(f'button:has-text("{btn_text}")')
                if btn and btn.is_visible():
                    btn.click()
                    time.sleep(1)
            except Exception:
                pass

        # Find the message input
        msg_input = None
        selectors = [
            'textarea[placeholder*="Message" i]',
            'div[contenteditable="true"][role="textbox"]',
            'textarea[aria-label*="Message" i]',
            'textarea',
        ]

        for sel in selectors:
            msg_input = page.query_selector(sel)
            if msg_input and msg_input.is_visible():
                break
            msg_input = None

        if not msg_input:
            log(f"  Message input not found for @{handle}")
            return False

        # Type the message
        log(f"  Typing DM...")
        msg_input.click()
        time.sleep(0.5)

        # Type line by line (handle newlines)
        for line in message_text.split("\n"):
            if line:
                page.keyboard.type(line, delay=15)
            page.keyboard.press("Shift+Enter")  # newline without sending
        time.sleep(1)

        # Send the message (Enter key)
        page.keyboard.press("Enter")
        time.sleep(2)

        # Also try clicking Send button if Enter didn't work
        send_btn = page.query_selector('div[role="button"]:has-text("Send")')
        if send_btn and send_btn.is_visible():
            box = send_btn.bounding_box()
            if box:
                page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            time.sleep(1)

        log(f"  DM sent to @{handle}!")
        return True

    except Exception as e:
        log(f"  Failed to DM @{handle}: {e}")
        return False


def run(targets, dry_run=False):
    # Skip already-DM'd targets
    already_sent = set()
    if Path(LOG_FILE).exists():
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if entry.get("success"):
                        already_sent.add(entry["target"])
                except (json.JSONDecodeError, KeyError):
                    pass
    targets = [t for t in targets if t not in already_sent]
    if already_sent:
        log(f"Skipping {len(already_sent)} already-DM'd targets")

    random.shuffle(targets)
    used_templates = set()
    success_count = 0
    fail_count = 0

    log(f"Starting DM outreach: {len(targets)} targets, dry_run={dry_run}")

    if dry_run:
        for target in targets[:10]:
            dm = get_dm(used_templates, target)
            print(f"\n@{target.lstrip('@')}:")
            print(f"  \"{dm[:120]}...\"")
        return

    # Launch browser (use dedicated profile, ignore --no-sandbox to avoid exit 21)
    dm_profile = str(Path.home() / ".ig_openfans_dms")
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            dm_profile,
            headless=False,
            channel="msedge",
            viewport=VIEWPORT,
            user_agent=USER_AGENT,
            ignore_default_args=["--no-sandbox", "--disable-extensions"],
        )
        page = browser.pages[0] if browser.pages else browser.new_page()

        # Check login
        page.goto("https://www.instagram.com/", wait_until="domcontentloaded")
        time.sleep(3)

        if "/accounts/login" in page.url:
            log("NOT LOGGED IN. Please log in to @openfans.online now.")
            log("Waiting 60s for manual login...")
            time.sleep(60)

        # Dismiss notifications popup
        for btn_text in ["Not Now", "Not now"]:
            try:
                btn = page.query_selector(f'button:has-text("{btn_text}")')
                if btn and btn.is_visible():
                    btn.click()
                    time.sleep(1)
            except Exception:
                pass

        for i, target in enumerate(targets):
            dm = get_dm(used_templates, target)

            log(f"\n--- DM {i + 1}/{len(targets)}: {target} ---")

            success = send_dm(page, target, dm)

            if success:
                success_count += 1
                log_result(target, dm, True)
            else:
                fail_count += 1
                log_result(target, dm, False, "dm_failed")

            # Batch pause
            if success_count > 0 and success_count % BATCH_SIZE == 0:
                log(f"\n{'='*40}")
                log(f"BATCH COMPLETE: {success_count} DMs sent. Pausing {BATCH_PAUSE}s ({BATCH_PAUSE//60}m)...")
                log(f"{'='*40}")
                time.sleep(BATCH_PAUSE)
            elif i < len(targets) - 1:
                delay = random.randint(MIN_DELAY, MAX_DELAY)
                log(f"Waiting {delay}s...")
                time.sleep(delay)

        browser.close()

    log(f"\n{'='*40}")
    log(f"DONE: {success_count} sent, {fail_count} failed")
    log(f"{'='*40}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OpenFans Instagram DM Outreach")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--target", type=str)
    args = parser.parse_args()

    if args.target:
        targets = [args.target]
    else:
        handles_file = Path(__file__).parent.parent / "content" / "ig-of-handles.txt"
        if handles_file.exists():
            with open(handles_file, "r") as f:
                targets = [line.strip() for line in f if line.strip()]
            log(f"Loaded {len(targets)} targets from {handles_file}")
        else:
            print("ERROR: No handles file found. Run scrape-of-handles-brave.py first.")
            sys.exit(1)

    run(targets, dry_run=args.dry_run)
