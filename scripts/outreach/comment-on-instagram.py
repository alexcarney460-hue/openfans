#!/usr/bin/env python3
"""
OpenFans -- Instagram Comment Outreach for Requested Creators

Reads the outreach queue and comments on each creator's latest Instagram
post to let them know fans are requesting them on OpenFans.

Usage:
  python comment-on-instagram.py                 # run with visible browser
  python comment-on-instagram.py --headless      # headless mode (after cookies saved)
  python comment-on-instagram.py --dry-run       # print comments without posting
  python comment-on-instagram.py --max 5         # limit to 5 comments this run

IMPORTANT: First run must be with visible browser (headless=False) to handle
Instagram login challenges and save cookies.
"""

import sys
import json
import time
import random
import argparse
from datetime import datetime, timezone
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERROR: playwright not installed. Run: pip install playwright && python -m playwright install chromium")
    sys.exit(1)

# --- Config ---
SCRIPT_DIR = Path(__file__).resolve().parent
QUEUE_FILE = str(SCRIPT_DIR / "outreach-queue.json")
LOG_FILE = str(SCRIPT_DIR / "outreach-log.jsonl")
COOKIE_FILE = str(SCRIPT_DIR / "ig-cookies.json")
BROWSER_PROFILE = str(Path.home() / ".ig_openfans_outreach")

IG_USERNAME = "motionventures_ai"
IG_PASSWORD = "Iloveliam2014"

VIEWPORT = {"width": 1280, "height": 900}
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

MAX_COMMENTS_PER_DAY = 15
MIN_DELAY = 60   # seconds between comments
MAX_DELAY = 120  # seconds between comments

# --- Comment Templates ---
# Short, friendly, non-salesy. Rotated randomly.
COMMENT_TEMPLATES = [
    "Your fans are requesting you on OpenFans -- keep 95% of what you earn. Check it out at openfans.online",
    "Hey! People are looking for you on OpenFans. You could keep 95% instead of 80%. openfans.online",
    "Fans are waiting for you on OpenFans! Keep more of what you earn. openfans.online",
]

# Database connection for logging to outreach_log table
DB_CONNECTION = "postgresql://postgres:OpenFans2026Secure@db.qnomimlnkjutldxuxuqj.supabase.co:5432/postgres"


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", file=sys.stderr, flush=True)


def log_to_file(platform_username: str, instagram_handle: str, action: str,
                status: str, comment_text: str = "", error_message: str = "") -> None:
    """Append a result to the local JSONL log file."""
    Path(LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "platform_username": platform_username,
        "instagram_handle": instagram_handle,
        "action": action,
        "status": status,
        "comment_text": comment_text,
        "error_message": error_message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def log_to_database(platform_username: str, instagram_handle: str, action: str,
                    status: str, comment_text: str = "", error_message: str = "") -> None:
    """Insert a result into the outreach_log database table."""
    try:
        import psycopg2
        conn = psycopg2.connect(DB_CONNECTION)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO outreach_log (platform_username, instagram_handle, action, status, comment_text, error_message)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (platform_username, instagram_handle, action, status, comment_text, error_message))
        conn.commit()
        conn.close()
    except Exception as e:
        log(f"  DB log error (non-fatal): {e}")


def load_queue() -> list:
    """Load the outreach queue."""
    if not Path(QUEUE_FILE).exists():
        return []
    try:
        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def save_queue(queue: list) -> None:
    """Save the updated outreach queue."""
    with open(QUEUE_FILE, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2, default=str)


def load_already_commented() -> set:
    """Load usernames that have already been commented on from the log file."""
    commented = set()
    if not Path(LOG_FILE).exists():
        return commented
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if entry.get("status") == "commented":
                        commented.add(entry.get("platform_username", ""))
                except (json.JSONDecodeError, KeyError):
                    pass
    except FileNotFoundError:
        pass
    return commented


def get_comment() -> str:
    """Pick a random comment template."""
    return random.choice(COMMENT_TEMPLATES)


def dismiss_popups(page) -> None:
    """Dismiss common Instagram popups."""
    for txt in ["Not Now", "Not now", "Decline", "Close"]:
        try:
            btn = page.query_selector(f'button:has-text("{txt}")')
            if btn and btn.is_visible():
                btn.click()
                time.sleep(1)
        except Exception:
            pass


def handle_login(page) -> bool:
    """Handle Instagram login if needed."""
    time.sleep(3)

    if "/accounts/login" not in page.url and "login" not in page.url.lower():
        log("Already logged in.")
        return True

    log("Not logged in. Attempting login...")

    # Try cookie-based login first
    if Path(COOKIE_FILE).exists():
        try:
            with open(COOKIE_FILE, "r", encoding="utf-8") as f:
                cookies = json.load(f)
            page.context.add_cookies(cookies)
            page.reload(wait_until="domcontentloaded")
            time.sleep(4)
            if "/accounts/login" not in page.url:
                log("Logged in via saved cookies.")
                return True
        except Exception as e:
            log(f"Cookie login failed: {e}")

    # Manual login via credentials
    try:
        username_input = page.query_selector('input[name="username"]')
        password_input = page.query_selector('input[name="password"]')

        if username_input and password_input:
            username_input.click()
            time.sleep(0.5)
            username_input.fill("")
            page.keyboard.type(IG_USERNAME, delay=random.randint(30, 80))
            time.sleep(random.uniform(0.5, 1.0))

            password_input.click()
            time.sleep(0.5)
            password_input.fill("")
            page.keyboard.type(IG_PASSWORD, delay=random.randint(30, 80))
            time.sleep(random.uniform(0.5, 1.5))

            # Click login button
            login_btn = page.query_selector('button[type="submit"]')
            if login_btn:
                login_btn.click()
            else:
                page.keyboard.press("Enter")

            time.sleep(6)

            # Handle "Save Your Login Info?" prompt
            dismiss_popups(page)

            # Handle 2FA / challenge
            if "challenge" in page.url or "two_factor" in page.url:
                log("LOGIN CHALLENGE DETECTED. Please complete it manually in the browser.")
                log("Waiting 120 seconds for manual challenge resolution...")
                time.sleep(120)

            if "/accounts/login" not in page.url:
                # Save cookies for future runs
                cookies = page.context.cookies()
                with open(COOKIE_FILE, "w", encoding="utf-8") as f:
                    json.dump(cookies, f, indent=2)
                log("Login successful. Cookies saved.")
                return True

    except Exception as e:
        log(f"Login error: {e}")

    log("LOGIN FAILED. Please log in manually in the browser window.")
    log("Waiting 90 seconds for manual login...")
    time.sleep(90)

    # Save cookies after manual login
    if "/accounts/login" not in page.url:
        try:
            cookies = page.context.cookies()
            with open(COOKIE_FILE, "w", encoding="utf-8") as f:
                json.dump(cookies, f, indent=2)
            log("Cookies saved after manual login.")
        except Exception:
            pass
        return True

    return False


def comment_on_latest_post(page, instagram_handle: str, comment_text: str) -> bool:
    """Navigate to a creator's profile and comment on their latest post."""
    profile_url = f"https://www.instagram.com/{instagram_handle}/"

    try:
        log(f"  Navigating to {profile_url}...")
        page.goto(profile_url, wait_until="domcontentloaded", timeout=30000)
    except Exception as e:
        log(f"  Navigation error: {e}")
        # Retry once
        try:
            time.sleep(3)
            page.goto(profile_url, wait_until="domcontentloaded", timeout=30000)
        except Exception:
            return False

    time.sleep(random.uniform(3.0, 5.0))
    dismiss_popups(page)

    # Check if profile exists / is accessible
    content = page.content()
    if "Sorry, this page" in content or "/accounts/login" in page.url:
        log(f"  Profile not found or login lost: {instagram_handle}")
        return False

    # Check for private account
    if "This account is private" in content or "This Account is Private" in content:
        log(f"  Account is private: {instagram_handle}")
        return False

    # Click on the first post (latest)
    try:
        post_links = page.query_selector_all('a[href*="/p/"]')
        if not post_links:
            post_links = page.query_selector_all('a[href*="/reel/"]')
        if not post_links:
            log(f"  No posts found for {instagram_handle}")
            return False

        log(f"  Found {len(post_links)} posts. Opening latest...")
        post_links[0].click()
        time.sleep(random.uniform(3.0, 5.0))
    except Exception as e:
        log(f"  Failed to click post: {e}")
        return False

    # Find and interact with the comment input
    try:
        # Click the "Add a comment..." placeholder to activate input
        placeholder = page.query_selector('span:has-text("Add a comment")')
        if placeholder:
            log(f"  Found comment placeholder, clicking...")
            placeholder.click()
            time.sleep(random.uniform(1.0, 2.0))

        # Find the active input element
        comment_area = None
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
            # Try clicking the comment icon (speech bubble)
            for icon_label in ["Comment", "comment"]:
                icon = page.query_selector(f'svg[aria-label="{icon_label}"]')
                if icon:
                    icon.click()
                    time.sleep(random.uniform(1.0, 2.0))
                    for sel in selectors:
                        comment_area = page.query_selector(sel)
                        if comment_area and comment_area.is_visible():
                            break
                        comment_area = None
                    if comment_area:
                        break

        if not comment_area:
            log(f"  Comment box not found for {instagram_handle}")
            return False

        log(f"  Typing comment...")
        comment_area.click()
        time.sleep(random.uniform(0.3, 0.7))

        # Type with human-like delay
        page.keyboard.type(comment_text, delay=random.randint(20, 45))
        time.sleep(random.uniform(1.0, 2.5))

        # Submit -- find and click the Post button
        posted = False
        post_selectors = [
            'div[role="button"]:has-text("Post")',
            'button:has-text("Post")',
            'span:has-text("Post")',
        ]

        for sel in post_selectors:
            post_btn = page.query_selector(sel)
            if post_btn and post_btn.is_visible():
                box = post_btn.bounding_box()
                if box:
                    page.mouse.click(
                        box["x"] + box["width"] / 2,
                        box["y"] + box["height"] / 2
                    )
                    posted = True
                    break

        if not posted:
            # Fallback: try Enter key
            page.keyboard.press("Enter")

        time.sleep(random.uniform(3.0, 5.0))

        # Check for error indicators (blocked, rate limited, etc.)
        page_content = page.content()
        if "Try Again Later" in page_content or "Action Blocked" in page_content:
            log(f"  ACTION BLOCKED by Instagram. Stopping session.")
            return False

        log(f"  Comment posted on @{instagram_handle}!")
        return True

    except Exception as e:
        log(f"  Failed to comment: {e}")
        return False


def run(max_comments: int, headless: bool, dry_run: bool):
    """Run the Instagram comment outreach."""
    queue = load_queue()
    if not queue:
        log("Outreach queue is empty. Run find-instagram-handles.py first.")
        return

    already_commented = load_already_commented()

    # Filter to only pending entries that haven't been commented on
    pending = [
        entry for entry in queue
        if entry.get("status") == "pending"
        and entry.get("platform_username") not in already_commented
    ]

    if not pending:
        log("No pending creators in the queue.")
        return

    log(f"Found {len(pending)} pending creators in queue (max {max_comments} per run)")

    if dry_run:
        for entry in pending[:max_comments]:
            comment = get_comment()
            print(f"\n  @{entry['instagram_handle']} ({entry['request_count']} fan requests):")
            print(f"    \"{comment}\"")
        return

    success_count = 0
    fail_count = 0
    skip_count = 0

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            BROWSER_PROFILE,
            headless=headless,
            channel="chrome",
            viewport=VIEWPORT,
            user_agent=USER_AGENT,
            ignore_default_args=["--no-sandbox", "--disable-extensions"],
        )
        page = browser.pages[0] if browser.pages else browser.new_page()

        # Navigate to Instagram and handle login
        page.goto("https://www.instagram.com/", wait_until="domcontentloaded")
        logged_in = handle_login(page)

        if not logged_in:
            log("Could not log in. Aborting.")
            browser.close()
            return

        dismiss_popups(page)

        for i, entry in enumerate(pending[:max_comments]):
            ig_handle = entry.get("instagram_handle", "")
            platform_username = entry.get("platform_username", "")

            if not ig_handle:
                log(f"  Skipping {platform_username} -- no Instagram handle")
                skip_count += 1
                continue

            comment_text = get_comment()

            log(f"\n--- [{i + 1}/{min(len(pending), max_comments)}] "
                f"@{ig_handle} (requested as '{platform_username}', "
                f"{entry.get('request_count', '?')} fans) ---")
            log(f"  Comment: \"{comment_text[:70]}...\"")

            success = comment_on_latest_post(page, ig_handle, comment_text)

            if success:
                success_count += 1
                # Update queue entry status
                entry["status"] = "commented"
                entry["commented_at"] = datetime.now(timezone.utc).isoformat()
                # Log to file and database
                log_to_file(platform_username, ig_handle, "comment", "commented",
                            comment_text)
                log_to_database(platform_username, ig_handle, "comment", "commented",
                                comment_text)
            else:
                fail_count += 1
                entry["status"] = "failed"
                log_to_file(platform_username, ig_handle, "comment", "failed",
                            comment_text, "comment_failed")
                log_to_database(platform_username, ig_handle, "comment", "failed",
                                comment_text, "comment_failed")

                # If action blocked, stop immediately
                page_content = page.content()
                if "Try Again Later" in page_content or "Action Blocked" in page_content:
                    log("ACTION BLOCKED -- stopping all comments for today.")
                    break

            # Human-like delay between comments (60-120 seconds)
            if i < min(len(pending), max_comments) - 1:
                delay = random.randint(MIN_DELAY, MAX_DELAY)
                log(f"  Waiting {delay}s before next comment...")
                time.sleep(delay)

        # Save updated cookies
        try:
            cookies = page.context.cookies()
            with open(COOKIE_FILE, "w", encoding="utf-8") as f:
                json.dump(cookies, f, indent=2)
        except Exception:
            pass

        browser.close()

    # Save updated queue with status changes
    save_queue(queue)

    log(f"\n{'=' * 50}")
    log(f"OUTREACH COMPLETE")
    log(f"  Commented: {success_count}")
    log(f"  Failed:    {fail_count}")
    log(f"  Skipped:   {skip_count}")
    log(f"{'=' * 50}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Comment on requested creators' Instagram posts")
    parser.add_argument("--headless", action="store_true",
                        help="Run browser in headless mode (use after first login)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print comments without posting")
    parser.add_argument("--max", type=int, default=MAX_COMMENTS_PER_DAY,
                        help=f"Max comments per run (default: {MAX_COMMENTS_PER_DAY})")
    args = parser.parse_args()

    run(max_comments=args.max, headless=args.headless, dry_run=args.dry_run)
