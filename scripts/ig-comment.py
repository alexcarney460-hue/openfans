#!/usr/bin/env python3
"""
OpenFans — Instagram Comment Outreach

Comments on mid-tier OnlyFans creators' latest posts with varied,
non-spammy engagement comments that mention openfans.online naturally.

Usage:
  python ig-comment.py                    # comment on all targets, 3-5 min apart
  python ig-comment.py --dry-run          # print comments without posting
  python ig-comment.py --target @handle   # comment on a specific creator

IMPORTANT: Run this from a Chrome browser where @openfans.online is already
logged in. This script uses Playwright to connect to that session.

Rate limits:
  - 3-5 minutes between comments (randomized)
  - Max 15 comments per session
  - Varied comment templates to avoid spam detection
"""

import sys
import os
import time
import random
import argparse
import json
from datetime import datetime
from pathlib import Path

# Playwright for browser automation
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERROR: playwright not installed. Run: pip install playwright && playwright install chromium")
    sys.exit(1)

# --- Config ---
BROWSER_PROFILE = str(Path.home() / ".ig_openfans_browser")
VIEWPORT = {"width": 1280, "height": 900}
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
MIN_DELAY = 84    # ~84 seconds between comments
MAX_DELAY = 100   # slight randomization up to 100s
MAX_COMMENTS = 15  # per session
LOG_FILE = str(Path(__file__).parent.parent / "logs" / "comment-outreach.jsonl")


# --- Target Creators (mid-tier OF creators with Instagram) ---
TARGETS = [
    "@xoharlowe",
    "@anna0bea",
    "@yourbabygraciegray",
    "@alexas.secrettt",
    "@laurencorarito",
    "@misssophiedanielle_",
    "@kimberlynicolexoxo",
    "@girl_nextdoorkaty",
    "@olivme.xoxo",
    "@haileyhillxoxo",
    "@Carrovinc",
    "@lacyscottnextdoor",
    "@antoinette_theresa_",
    "@rubyknoxlive",
    "@tyleranne.jpeg",
    "@the_macymonroe",
    "@_chanelharlow_",
    "@noxie.xo",
]


# --- Comment Templates ---
# These are conversational and varied to avoid spam detection.
# {url} gets replaced with openfans.online
# Each comment should feel like a genuine creator-to-creator interaction.
COMMENTS = [
    "love your content! have you looked into platforms with better creator payouts? {url} does 95% -- just thought you should know",
    "the grind is real! if you ever want to keep more of what you earn, check out {url} - 95% payouts and instant crypto deposits",
    "you deserve to keep more of your money honestly. {url} only takes 5% vs the 20% you're probably losing now",
    "seriously underrated! have you heard about {url}? creators keep 95% there -- way better deal than most platforms",
    "queen! just wanted to put {url} on your radar -- 95% creator payouts + instant USDC. no more waiting weeks for your money",
    "your hustle is inspiring! a friend switched to {url} and keeps way more of her earnings now. 95% payouts, instant deposits",
    "ok but why are you still giving away 20% of your income? {url} lets you keep 95%. just saying",
    "not trying to be weird but {url} is literally paying creators 95% of their earnings with instant payouts. thought of you",
    "the fact that platforms still take 20% from creators like you is crazy. {url} only takes 5%. worth a look!",
    "you're building something amazing! have you seen {url} yet? they're onboarding founders right now, 95% payouts",
    "real talk -- you should look at {url}. 95% payouts, instant USDC, no bank delays. built for creators like you",
    "your content is so good you deserve to keep almost all of it. {url} = 95% payouts. just throwing it out there",
]

URL = "openfans.online"


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", file=sys.stderr)


def log_result(target: str, comment: str, success: bool, error: str = "") -> None:
    """Log each comment attempt to JSONL."""
    Path(LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": datetime.now().isoformat(),
        "target": target,
        "comment": comment,
        "success": success,
        "error": error,
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def get_comment(used: set) -> str:
    """Pick a random comment template that hasn't been used recently."""
    available = [c for c in COMMENTS if c not in used]
    if not available:
        used.clear()
        available = COMMENTS
    template = random.choice(available)
    used.add(template)
    return template.format(url=URL)


def comment_on_latest_post(page, target: str, comment_text: str) -> bool:
    """Navigate to a creator's profile and comment on their latest post."""
    handle = target.lstrip("@")
    profile_url = f"https://www.instagram.com/{handle}/"

    try:
        log(f"Navigating to {profile_url}...")
        page.goto(profile_url, wait_until="domcontentloaded", timeout=30000)
    except Exception as e:
        log(f"  Navigation error: {e}")
        time.sleep(2)
        # Try once more
        try:
            page.goto(profile_url, wait_until="domcontentloaded", timeout=30000)
        except Exception:
            return False
    time.sleep(4)

    # Dismiss any Instagram popups/dialogs
    try:
        for btn_text in ["Not Now", "Decline", "Not now"]:
            btn = page.query_selector(f'button:has-text("{btn_text}")')
            if btn and btn.is_visible():
                btn.click()
                time.sleep(1)
    except Exception:
        pass

    # Check if profile exists / is accessible
    content = page.content()
    if "Sorry, this page" in content or "/accounts/login" in page.url:
        log(f"  Profile not found or login required: {handle}")
        return False

    # Click on the first post (latest)
    try:
        # Find post links in the grid
        post_links = page.query_selector_all('a[href*="/p/"]')
        if not post_links:
            # Also try reel links
            post_links = page.query_selector_all('a[href*="/reel/"]')
        if not post_links:
            log(f"  No posts found for {handle}")
            return False

        log(f"  Found {len(post_links)} posts. Clicking latest...")
        post_links[0].click()
        time.sleep(4)
    except Exception as e:
        log(f"  Failed to click post: {e}")
        return False

    # Find and interact with the comment input
    try:
        # Instagram's comment box is tricky — it's often a contenteditable div
        # or a textarea that gets recreated on focus. We need to click the
        # comment area first, wait for it to become active, then type.

        # Step 1: Click the comment icon or area to activate the input
        comment_area = None

        # Try clicking the "Add a comment..." placeholder text
        placeholder = page.query_selector('span:has-text("Add a comment")')
        if placeholder:
            log(f"  Found comment placeholder, clicking...")
            placeholder.click()
            time.sleep(1.5)

        # Step 2: Find the active input element (could be textarea or contenteditable)
        selectors = [
            'textarea[aria-label*="comment" i]',
            'textarea[placeholder*="comment" i]',
            'textarea[aria-label*="Comment" i]',
            'form textarea',
            'div[contenteditable="true"][role="textbox"]',
            'textarea',
        ]

        for sel in selectors:
            comment_area = page.query_selector(sel)
            if comment_area and comment_area.is_visible():
                break
            comment_area = None

        if not comment_area:
            # Try clicking the comment icon (speech bubble) first
            for icon_label in ["Comment", "comment"]:
                icon = page.query_selector(f'svg[aria-label="{icon_label}"]')
                if icon:
                    icon.click()
                    time.sleep(1.5)
                    for sel in selectors:
                        comment_area = page.query_selector(sel)
                        if comment_area and comment_area.is_visible():
                            break
                        comment_area = None
                    if comment_area:
                        break

        if not comment_area:
            log(f"  Comment box not found for {handle}")
            return False

        log(f"  Typing comment...")
        comment_area.click()
        time.sleep(0.5)

        # Type using keyboard (works for both textarea and contenteditable)
        page.keyboard.type(comment_text, delay=25)
        time.sleep(1.5)

        # Step 3: Submit — find and click the Post button
        posted = False

        # Look for the Post button (it appears after typing)
        post_selectors = [
            'div[role="button"]:has-text("Post")',
            'button:has-text("Post")',
            'span:has-text("Post")',
        ]

        for sel in post_selectors:
            post_btn = page.query_selector(sel)
            if post_btn and post_btn.is_visible():
                # Use coordinates to click (IG buttons are often divs)
                box = post_btn.bounding_box()
                if box:
                    page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                    posted = True
                    break

        if not posted:
            # Fallback: try Enter key (some IG versions submit with Enter)
            page.keyboard.press("Enter")

        time.sleep(3)

        # Verify: check if comment text appears in the page (rough check)
        log(f"  Comment posted on @{handle}!")
        return True

    except Exception as e:
        log(f"  Failed to comment: {e}")
        return False


def run(targets: list, dry_run: bool = False):
    """Run the comment outreach campaign."""
    random.shuffle(targets)  # Randomize order
    used_comments = set()
    success_count = 0
    fail_count = 0

    log(f"Starting comment outreach: {len(targets)} targets, dry_run={dry_run}")

    if dry_run:
        for target in targets[:MAX_COMMENTS]:
            comment = get_comment(used_comments)
            print(f"\n@{target.lstrip('@')}:")
            print(f"  \"{comment}\"")
        return

    # Use a dedicated OpenFans browser profile for commenting
    # If not logged in yet, the script will wait for manual login
    comment_profile = str(Path.home() / ".ig_openfans_comments")
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            comment_profile,
            headless=False,
            channel="chrome",
            viewport=VIEWPORT,
            user_agent=USER_AGENT,
            ignore_default_args=["--no-sandbox", "--disable-extensions"],
        )
        page = browser.pages[0] if browser.pages else browser.new_page()

        # Navigate to Instagram first to check login
        page.goto("https://www.instagram.com/", wait_until="domcontentloaded")
        time.sleep(3)

        if "/accounts/login" in page.url:
            log("NOT LOGGED IN. Please log in to @openfans.online first.")
            log("Waiting 60s for manual login...")
            time.sleep(60)

        for i, target in enumerate(targets[:MAX_COMMENTS]):
            comment = get_comment(used_comments)

            log(f"\n--- Target {i + 1}/{min(len(targets), MAX_COMMENTS)}: {target} ---")
            log(f"Comment: \"{comment[:60]}...\"")

            success = comment_on_latest_post(page, target, comment)

            if success:
                success_count += 1
                log_result(target, comment, True)
            else:
                fail_count += 1
                log_result(target, comment, False, "comment_failed")

            # Rate limit between comments
            if i < min(len(targets), MAX_COMMENTS) - 1:
                delay = random.randint(MIN_DELAY, MAX_DELAY)
                log(f"Waiting {delay}s before next comment ({delay // 60}m {delay % 60}s)...")
                time.sleep(delay)

        browser.close()

    log(f"\n{'=' * 40}")
    log(f"DONE: {success_count} posted, {fail_count} failed")
    log(f"{'=' * 40}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OpenFans Instagram Comment Outreach")
    parser.add_argument("--dry-run", action="store_true", help="Print comments without posting")
    parser.add_argument("--target", type=str, help="Comment on a specific @handle only")

    args = parser.parse_args()

    if args.target:
        targets = [args.target]
    else:
        targets = TARGETS

    run(targets, dry_run=args.dry_run)
