#!/usr/bin/env python3
"""
OpenFans — Combined Comment + DM Outreach

Runs BOTH comment and DM outreach in a single browser with two tabs.
Tab 1: Comments (42s apart, 100/batch)
Tab 2: DMs with auto-follow (55s apart, 50/batch)

Alternates between commenting and DMing to use one browser.

Usage:
  python ig-outreach.py
"""

import sys
import os
import time
import random
import json
import threading
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
BROWSER_PROFILE = str(Path.home() / ".ig_of_bot")
BASE = Path(__file__).resolve().parent.parent
HANDLES_FILE = str(BASE / "content" / "ig-of-handles.txt")
COMMENT_LOG = str(BASE / "logs" / "comment-outreach.jsonl")
DM_LOG = str(BASE / "logs" / "dm-outreach.jsonl")

COMMENT_DELAY = 30
DM_DELAY = 55  # disabled
COMMENT_BATCH = 100
DM_BATCH = 50
BATCH_PAUSE = 300

URL = "openfans.online"

# --- Comment Templates ---
COMMENTS = [
    "love your content! have you looked into platforms with better creator payouts? {url} does 95% -- just thought you should know",
    "the grind is real! if you ever want to keep more of what you earn, check out {url} - 95% payouts and instant crypto deposits",
    "you deserve to keep more of your money honestly. {url} only takes 5% vs the 20% you are probably losing now",
    "seriously underrated! have you heard about {url}? creators keep 95% there -- way better deal than most platforms",
    "queen! just wanted to put {url} on your radar -- 95% creator payouts + instant USDC. no more waiting weeks for your money",
    "your hustle is inspiring! a friend switched to {url} and keeps way more of her earnings now. 95% payouts, instant deposits",
    "ok but why are you still giving away 20% of your income? {url} lets you keep 95%. just saying",
    "not trying to be weird but {url} is literally paying creators 95% of their earnings with instant payouts. thought of you",
    "the fact that platforms still take 20% from creators like you is crazy. {url} only takes 5%. worth a look!",
    "you are building something amazing! have you seen {url} yet? they are onboarding founders right now, 95% payouts",
    "real talk -- you should look at {url}. 95% payouts, instant USDC, no bank delays. built for creators like you",
    "your content is so good you deserve to keep almost all of it. {url} = 95% payouts. just throwing it out there",
]

# --- DM Templates ---
DM_TEMPLATES = [
    "hey {name}! love what you're building. quick question -- how do you feel about your platform taking 20% of everything you earn?\n\ni'm with openfans.online -- we do 95% payouts, instant USDC, no bank delays. we're onboarding founder creators right now (limited spots, 90 days).\n\nno pressure at all, just thought you should know it exists!",
    "hi {name}! genuinely love your content.\n\nwanted to put something on your radar -- openfans.online is a new creator platform where you keep 95% of what you earn (vs 80% on most platforms). payouts are instant via crypto, no waiting 21 days.\n\nwe're doing a founder program right now -- early creators get priority support. thought of you.\n\nopenfans.online if you're curious!",
    "hey! not trying to be weird but i think you're leaving money on the table.\n\nif you're making $5K/mo on your current platform, you're losing $1,000/mo to fees. that's $12K/year.\n\nopenfans.online takes only 5% and pays out instantly in USDC. no bank holds, no 'processing' delays.\n\nwe're onboarding founders right now. worth a look?",
    "hi {name}! saw your page and had to reach out.\n\ni'm part of a new platform called openfans -- built specifically because the 20% cut on other platforms is insane. we do 95% payouts, instant crypto deposits, and nobody can freeze your account.\n\nwe're running a founder program (90 days, limited spots). would love to have you.\n\nopenfans.online -- no pressure!",
    "hey {name}!\n\nreal talk -- you deserve to keep more of what you earn. openfans.online gives creators 95% payouts with instant USDC deposits. no bank middlemen, no 21-day waits.\n\nwe're bringing on founder creators right now and your content would be perfect. check it out if you're interested!",
    "hi! huge fan of your content.\n\nquick pitch: openfans.online = 95% payouts (vs 80% elsewhere) + instant crypto deposits + can't be deplatformed.\n\nwe're in our founder phase -- early creators get the best deal. thought you should see it before spots fill up.\n\nno pressure!",
]


def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", file=sys.stderr, flush=True)


def log_result(log_file, target, text, success, error=""):
    Path(log_file).parent.mkdir(parents=True, exist_ok=True)
    entry = {"ts": datetime.now().isoformat(), "target": target,
             "message": text[:100], "success": success, "error": error}
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


def do_comment(page, target, comment_text):
    """Comment on a creator's latest post."""
    handle = target.lstrip("@")
    try:
        page.goto(f"https://www.instagram.com/{handle}/",
                  wait_until="domcontentloaded", timeout=30000)
    except Exception:
        try:
            page.goto(f"https://www.instagram.com/{handle}/",
                      wait_until="domcontentloaded", timeout=30000)
        except Exception:
            return False
    time.sleep(3)
    dismiss_popups(page)

    if "Sorry, this page" in page.content() or "/accounts/login" in page.url:
        return False

    # Click latest post
    post_links = page.query_selector_all('a[href*="/p/"]')
    if not post_links:
        post_links = page.query_selector_all('a[href*="/reel/"]')
    if not post_links:
        return False

    try:
        post_links[0].click()
        time.sleep(3)
    except Exception:
        return False

    # Find comment input
    placeholder = page.query_selector('span:has-text("Add a comment")')
    if placeholder:
        placeholder.click()
        time.sleep(1)

    comment_area = None
    for sel in ['textarea[aria-label*="comment" i]', 'textarea[placeholder*="comment" i]',
                'textarea[aria-label*="Comment" i]', 'div[contenteditable="true"][role="textbox"]', 'textarea']:
        comment_area = page.query_selector(sel)
        if comment_area and comment_area.is_visible():
            break
        comment_area = None

    if not comment_area:
        return False

    comment_area.click()
    time.sleep(0.5)
    page.keyboard.type(comment_text, delay=20)
    time.sleep(1)

    # Click Post button
    for sel in ['div[role="button"]:has-text("Post")', 'button:has-text("Post")', 'span:has-text("Post")']:
        btn = page.query_selector(sel)
        if btn and btn.is_visible():
            box = btn.bounding_box()
            if box:
                page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                break
    else:
        page.keyboard.press("Enter")

    time.sleep(2)
    return True


def do_dm(page, target, dm_text):
    """Follow + DM a creator."""
    handle = target.lstrip("@")
    try:
        page.goto(f"https://www.instagram.com/{handle}/",
                  wait_until="domcontentloaded", timeout=30000)
    except Exception:
        return False
    time.sleep(3)
    dismiss_popups(page)

    if "Sorry, this page" in page.content() or "/accounts/login" in page.url:
        return False

    # Follow first
    for sel in ['button:has-text("Follow")', 'div[role="button"]:has-text("Follow")']:
        btn = page.query_selector(sel)
        if btn and btn.is_visible() and btn.inner_text().strip() == "Follow":
            box = btn.bounding_box()
            if box:
                page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            time.sleep(2)
            break

    # Click Message button
    message_btn = None
    for sel in ['div[role="button"]:has-text("Message")', 'button:has-text("Message")']:
        message_btn = page.query_selector(sel)
        if message_btn and message_btn.is_visible():
            break
        message_btn = None

    if not message_btn:
        return False

    box = message_btn.bounding_box()
    if box:
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    time.sleep(3)
    dismiss_popups(page)

    # Find message input
    msg_input = None
    for sel in ['textarea[placeholder*="Message" i]', 'div[contenteditable="true"][role="textbox"]',
                'textarea[aria-label*="Message" i]', 'textarea']:
        msg_input = page.query_selector(sel)
        if msg_input and msg_input.is_visible():
            break
        msg_input = None

    if not msg_input:
        return False

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
    return True


def main():
    # Load targets
    if Path(HANDLES_FILE).exists():
        with open(HANDLES_FILE, "r") as f:
            all_targets = [line.strip() for line in f if line.strip()]
        log(f"Loaded {len(all_targets)} targets")
    else:
        log("ERROR: No handles file")
        sys.exit(1)

    # Split into comment targets and DM targets (different halves)
    random.shuffle(all_targets)
    comment_done = load_done(COMMENT_LOG)
    dm_done = load_done(DM_LOG)

    comment_targets = [t for t in all_targets if t not in comment_done]
    dm_targets = [t for t in all_targets if t not in dm_done]

    log(f"Comment targets: {len(comment_targets)} (skipping {len(comment_done)} done)")
    log(f"DM targets: {len(dm_targets)} (skipping {len(dm_done)} done)")

    used_comments = set()
    used_dms = set()
    c_count = 0
    d_count = 0
    c_idx = 0
    d_idx = 0

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            BROWSER_PROFILE,
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
            log("NOT LOGGED IN. Log in to @openfans.online now. Waiting 60s...")
            time.sleep(60)
        dismiss_popups(page)

        # Alternating loop: comment, dm, comment, dm...
        while c_idx < len(comment_targets) or d_idx < len(dm_targets):

            # --- COMMENT ---
            if c_idx < len(comment_targets):
                target = comment_targets[c_idx]
                c_idx += 1

                # Pick comment
                avail = [c for c in COMMENTS if c not in used_comments]
                if not avail:
                    used_comments.clear()
                    avail = COMMENTS
                template = random.choice(avail)
                used_comments.add(template)
                comment = template.format(url=URL)

                log(f"[COMMENT {c_count+1}] @{target.lstrip('@')}")
                ok = do_comment(page, target, comment)
                if ok:
                    c_count += 1
                    log_result(COMMENT_LOG, target, comment, True)
                    log(f"  Posted! ({c_count} total)")
                else:
                    log_result(COMMENT_LOG, target, comment, False, "failed")
                    log(f"  Failed")

                # Batch pause for comments
                if c_count > 0 and c_count % COMMENT_BATCH == 0:
                    log(f"COMMENT BATCH {c_count} done. Pausing {BATCH_PAUSE}s...")
                    time.sleep(BATCH_PAUSE)

                time.sleep(random.randint(COMMENT_DELAY, COMMENT_DELAY + 6))

            # DMs disabled — too low success rate on new account

        browser.close()

    log(f"\n{'='*40}")
    log(f"DONE: {c_count} comments, {d_count} DMs")
    log(f"{'='*40}")


if __name__ == "__main__":
    main()
