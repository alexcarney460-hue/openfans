#!/usr/bin/env python3
"""
OpenFans — Follow + DM Outreach

Follows OF creators and attempts to DM them.
Much safer than commenting — follows rarely trigger action blocks.

Usage:
  python ig-follow-dm.py                    # follow + DM all targets
  python ig-follow-dm.py --follow-only      # just follow, no DMs
  python ig-follow-dm.py --dry-run          # preview without acting

Rate: 1 follow every 45s, DM attempt after each follow.
Batch of 50, then 5 min pause.
"""

import sys
import os
import time
import random
import json
import argparse
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
BASE = Path(__file__).resolve().parent.parent
HANDLES_FILE = str(BASE / "content" / "ig-of-handles.txt")
FOLLOW_LOG = str(BASE / "logs" / "follow-outreach.jsonl")
DM_LOG = str(BASE / "logs" / "dm-outreach.jsonl")

FOLLOW_DELAY = 45
BATCH_SIZE = 50
BATCH_PAUSE = 300  # 5 min

URL = "openfans.online"

# --- DM Templates ---
DM_TEMPLATES = [
    "hey {name}! just followed -- love your content. quick heads up: {url} is locking in the first 100 creators at 5% fees for life. onlyfans charges 20%. thought you should know!",
    "hi {name}! new follower here. wanted to put {url} on your radar -- first 100 creators get 5% platform fees locked in forever instead of the 20% onlyfans takes. spots filling up fast",
    "hey! just hit follow. real talk -- {url} is giving their first 100 creators 5% fees for life. that's $15K/year more in your pocket vs onlyfans on a $10K month. worth a look",
    "hi {name}! love what you're building. {url} is onboarding their first 100 creators at 5% fees locked for life. onlyfans takes 4x that. just thought you should see it before spots close",
    "hey {name}! {url} first 100 creators = 5% fees forever. onlyfans: 20% forever. the math is obvious. founder spots still open if you're interested!",
    "hi! just followed your page. if you're tired of giving onlyfans 20%, check out {url} -- first 100 creators locked in at 5% for life. instant crypto payouts too",
]


def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", file=sys.stderr, flush=True)


def log_result(log_file, target, action, success, error=""):
    Path(log_file).parent.mkdir(parents=True, exist_ok=True)
    entry = {"ts": datetime.now().isoformat(), "target": target,
             "action": action, "success": success, "error": error}
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def load_done(log_file):
    done = set()
    if Path(log_file).exists():
        with open(log_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line.strip())
                    if e.get("success"):
                        done.add(e["target"])
                except Exception:
                    pass
    return done


def dismiss_popups(page):
    for txt in ["Not Now", "Not now", "Decline"]:
        try:
            btn = page.query_selector(f'button:has-text("{txt}")')
            if btn and btn.is_visible():
                btn.click()
                time.sleep(1)
        except Exception:
            pass


def get_dm(used, handle):
    available = [t for t in DM_TEMPLATES if t not in used]
    if not available:
        used.clear()
        available = DM_TEMPLATES
    template = random.choice(available)
    used.add(template)
    name = handle.lstrip("@").split("_")[0].split(".")[0].capitalize()
    return template.format(name=name, url=URL)


def follow_and_dm(page, target, dm_text=None):
    """Follow a creator and optionally DM them."""
    handle = target.lstrip("@")
    followed = False
    dm_sent = False

    try:
        page.goto(f"https://www.instagram.com/{handle}/",
                  wait_until="domcontentloaded", timeout=30000)
    except Exception:
        try:
            page.goto(f"https://www.instagram.com/{handle}/",
                      wait_until="domcontentloaded", timeout=30000)
        except Exception:
            return False, False
    time.sleep(3)
    dismiss_popups(page)

    if "Sorry, this page" in page.content() or "/accounts/login" in page.url:
        log(f"  Profile not found: @{handle}")
        return False, False

    # --- FOLLOW ---
    follow_btn = None
    for sel in ['button:has-text("Follow")', 'div[role="button"]:has-text("Follow")']:
        btn = page.query_selector(sel)
        if btn and btn.is_visible():
            text = btn.inner_text().strip()
            if text == "Follow":
                follow_btn = btn
                break

    if follow_btn:
        log(f"  Following @{handle}...")
        box = follow_btn.bounding_box()
        if box:
            page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        else:
            follow_btn.click()
        time.sleep(2)
        followed = True
    else:
        # Already following or button not found
        already = page.query_selector('button:has-text("Following")')
        if already:
            log(f"  Already following @{handle}")
            followed = True
        else:
            log(f"  No follow button for @{handle}")

    # --- DM (if requested) ---
    if dm_text and followed:
        time.sleep(1)
        message_btn = None
        for sel in ['div[role="button"]:has-text("Message")', 'button:has-text("Message")']:
            message_btn = page.query_selector(sel)
            if message_btn and message_btn.is_visible():
                break
            message_btn = None

        if message_btn:
            log(f"  Opening DM...")
            box = message_btn.bounding_box()
            if box:
                page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            time.sleep(3)
            dismiss_popups(page)

            # Find message input
            msg_input = None
            for sel in ['textarea[placeholder*="Message" i]',
                        'div[contenteditable="true"][role="textbox"]',
                        'textarea[aria-label*="Message" i]', 'textarea']:
                msg_input = page.query_selector(sel)
                if msg_input and msg_input.is_visible():
                    break
                msg_input = None

            if msg_input:
                log(f"  Typing DM...")
                msg_input.click()
                time.sleep(0.5)
                for line in dm_text.split("\n"):
                    if line:
                        page.keyboard.type(line, delay=12)
                    page.keyboard.press("Shift+Enter")
                time.sleep(1)
                page.keyboard.press("Enter")
                time.sleep(2)

                # Try Send button too
                send_btn = page.query_selector('div[role="button"]:has-text("Send")')
                if send_btn and send_btn.is_visible():
                    box = send_btn.bounding_box()
                    if box:
                        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                time.sleep(1)
                dm_sent = True
                log(f"  DM sent!")
            else:
                log(f"  DM input not found")
        else:
            log(f"  No message button (DM may be restricted)")

    return followed, dm_sent


def run(targets, follow_only=False, dry_run=False):
    # Skip already-followed
    already_followed = load_done(FOLLOW_LOG)
    targets = [t for t in targets if t not in already_followed]
    if already_followed:
        log(f"Skipping {len(already_followed)} already-followed")

    random.shuffle(targets)
    used_dms = set()
    follow_count = 0
    dm_count = 0

    log(f"Starting follow{'' if follow_only else ' + DM'} outreach: {len(targets)} targets")

    if dry_run:
        for t in targets[:10]:
            dm = get_dm(used_dms, t) if not follow_only else "(follow only)"
            print(f"  {t}: {dm[:80]}...")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            str(Path.home() / ".ig_of_follow"),
            headless=False,
            channel="chrome",
            viewport=VIEWPORT,
            user_agent=USER_AGENT,
            ignore_default_args=["--no-sandbox", "--disable-extensions"],
        )
        page = browser.pages[0] if browser.pages else browser.new_page()

        # Check login
        page.goto("https://www.instagram.com/", wait_until="domcontentloaded")
        time.sleep(3)
        if "/accounts/login" in page.url:
            log("NOT LOGGED IN. Log in now. Waiting 60s...")
            time.sleep(60)
        dismiss_popups(page)

        for i, target in enumerate(targets):
            dm_text = None if follow_only else get_dm(used_dms, target)

            log(f"\n--- {i+1}/{len(targets)}: {target} ---")

            followed, dm_sent = follow_and_dm(page, target, dm_text)

            if followed:
                follow_count += 1
                log_result(FOLLOW_LOG, target, "follow", True)
            else:
                log_result(FOLLOW_LOG, target, "follow", False, "failed")

            if dm_sent:
                dm_count += 1
                log_result(DM_LOG, target, "dm", True)

            log(f"  Follows: {follow_count} | DMs: {dm_count}")

            # Batch pause
            if follow_count > 0 and follow_count % BATCH_SIZE == 0:
                log(f"\nBATCH {follow_count} done. Pausing {BATCH_PAUSE//60}m...")
                time.sleep(BATCH_PAUSE)
            elif i < len(targets) - 1:
                delay = random.randint(FOLLOW_DELAY, FOLLOW_DELAY + 10)
                log(f"  Waiting {delay}s...")
                time.sleep(delay)

        browser.close()

    log(f"\n{'='*40}")
    log(f"DONE: {follow_count} follows, {dm_count} DMs")
    log(f"{'='*40}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--follow-only", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    handles_file = Path(HANDLES_FILE)
    if handles_file.exists():
        with open(handles_file, "r") as f:
            targets = [line.strip() for line in f if line.strip()]
        log(f"Loaded {len(targets)} targets")
    else:
        print("ERROR: No handles file")
        sys.exit(1)

    run(targets, follow_only=args.follow_only, dry_run=args.dry_run)
