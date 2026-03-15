#!/usr/bin/env python3
"""
OpenFans -- Find Instagram Handles for Requested Creators

Queries the database for unclaimed creator requests, searches Brave
for their Instagram handles, and writes an outreach queue file.

Usage:
  python find-instagram-handles.py              # find top 20 unclaimed creators
  python find-instagram-handles.py --limit 10   # find top 10
  python find-instagram-handles.py --dry-run    # print SQL results only
"""

import sys
import json
import time
import random
import argparse
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote_plus

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

# --- Config ---
SCRIPT_DIR = Path(__file__).resolve().parent
QUEUE_FILE = str(SCRIPT_DIR / "outreach-queue.json")
LOG_FILE = str(SCRIPT_DIR / "outreach-log.jsonl")

BRAVE_API_KEY = "BSAcMxzO8AD021dICd0f-5Zq5vuJJ8F"
BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"

# Supabase REST API config
SUPABASE_URL = "https://qnomimlnkjutldxuxuqj.supabase.co"
SUPABASE_ANON_KEY = None  # Will use direct DB connection string via REST

# Direct database connection string (used via Supabase PostgREST)
DB_CONNECTION = "postgresql://postgres:OpenFans2026Secure@db.qnomimlnkjutldxuxuqj.supabase.co:5432/postgres"

MAX_CREATORS_PER_RUN = 20
BRAVE_DELAY_MIN = 1.5
BRAVE_DELAY_MAX = 3.0


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", file=sys.stderr, flush=True)


def get_db_connection():
    """Get a psycopg2 database connection."""
    try:
        import psycopg2
    except ImportError:
        print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
        sys.exit(1)

    return psycopg2.connect(DB_CONNECTION)


def fetch_unclaimed_creators(limit: int) -> list:
    """
    Query creator_requests for unclaimed creators (no matching claim with
    status='claimed'). Groups by platform_username and orders by request
    count descending.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                cr.platform_username,
                cr.platform,
                cr.creator_name,
                COUNT(*) AS request_count
            FROM creator_requests cr
            LEFT JOIN creator_claims cc
                ON cc.platform = cr.platform
                AND cc.platform_username = cr.platform_username
                AND cc.status = 'claimed'
            WHERE cc.id IS NULL
            GROUP BY cr.platform_username, cr.platform, cr.creator_name
            ORDER BY request_count DESC
            LIMIT %s
        """, (limit,))

        rows = cur.fetchall()
        creators = []
        for row in rows:
            creators.append({
                "platform_username": row[0],
                "platform": row[1],
                "creator_name": row[2],
                "request_count": row[3],
            })
        return creators
    finally:
        conn.close()


def load_existing_queue() -> dict:
    """Load existing outreach queue and return a set of already-queued usernames."""
    if not Path(QUEUE_FILE).exists():
        return {}
    try:
        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            queue = json.load(f)
        return {entry["platform_username"]: entry for entry in queue}
    except (json.JSONDecodeError, KeyError):
        return {}


def load_already_commented() -> set:
    """Load the outreach log and return usernames that have been commented on."""
    commented = set()
    if not Path(LOG_FILE).exists():
        return commented
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if entry.get("status") == "commented":
                        commented.add(entry["platform_username"])
                except (json.JSONDecodeError, KeyError):
                    pass
    except FileNotFoundError:
        pass
    return commented


def search_brave_for_instagram(username: str, creator_name: str) -> dict | None:
    """
    Search Brave for a creator's Instagram handle.
    Returns { instagram_handle, instagram_url, search_url } or None.
    """
    query = f"{username} instagram"
    encoded_query = quote_plus(query)
    search_url = f"{BRAVE_SEARCH_URL}?q={encoded_query}&count=10"

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY,
    }

    try:
        resp = requests.get(search_url, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        log(f"  Brave search error for '{username}': {e}")
        return None

    # Parse results for Instagram profile URLs
    ig_handles = []
    results = data.get("web", {}).get("results", [])

    for result in results:
        url = result.get("url", "")
        title = result.get("title", "")
        description = result.get("description", "")

        # Match instagram.com profile URLs
        ig_match = re.search(
            r"(?:https?://)?(?:www\.)?instagram\.com/([a-zA-Z0-9_.]+)/?",
            url
        )
        if ig_match:
            handle = ig_match.group(1).lower()
            # Skip non-profile pages
            if handle in ("p", "reel", "stories", "explore", "accounts", "about", "developer", "legal"):
                continue
            ig_handles.append({
                "handle": handle,
                "url": f"https://instagram.com/{handle}",
                "source_title": title,
                "source_desc": description,
            })

        # Also check description text for instagram handles
        desc_match = re.search(r"@([a-zA-Z0-9_.]{3,30})", description)
        if desc_match and "instagram" in description.lower():
            handle = desc_match.group(1).lower()
            ig_handles.append({
                "handle": handle,
                "url": f"https://instagram.com/{handle}",
                "source_title": title,
                "source_desc": description,
            })

    if not ig_handles:
        return None

    # Score handles by relevance to the username
    def score_handle(h: dict) -> int:
        handle = h["handle"]
        s = 0
        # Exact match is best
        clean_username = username.lower().replace("_", "").replace(".", "")
        clean_handle = handle.replace("_", "").replace(".", "")
        if clean_username == clean_handle:
            s += 100
        elif clean_username in clean_handle or clean_handle in clean_username:
            s += 50
        # Partial word overlap
        username_parts = set(re.split(r"[_.\-]", username.lower()))
        handle_parts = set(re.split(r"[_.\-]", handle))
        overlap = username_parts & handle_parts
        s += len(overlap) * 20
        # Prefer results with creator name in title/desc
        if creator_name and creator_name.lower() in h["source_title"].lower():
            s += 30
        return s

    ig_handles.sort(key=score_handle, reverse=True)
    best = ig_handles[0]

    return {
        "instagram_handle": best["handle"],
        "instagram_url": best["url"],
        "search_url": search_url,
    }


def save_queue(queue: list) -> None:
    """Save the outreach queue to JSON."""
    with open(QUEUE_FILE, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2, default=str)
    log(f"Saved {len(queue)} entries to {QUEUE_FILE}")


def main():
    parser = argparse.ArgumentParser(description="Find Instagram handles for unclaimed creators")
    parser.add_argument("--limit", type=int, default=MAX_CREATORS_PER_RUN,
                        help=f"Max creators to process (default: {MAX_CREATORS_PER_RUN})")
    parser.add_argument("--dry-run", action="store_true",
                        help="Only print unclaimed creators, don't search Brave")
    args = parser.parse_args()

    log("Fetching unclaimed creators from database...")
    creators = fetch_unclaimed_creators(args.limit * 2)  # fetch extra to account for skips

    if not creators:
        log("No unclaimed creators found.")
        return

    log(f"Found {len(creators)} unclaimed creators")

    if args.dry_run:
        for c in creators[:args.limit]:
            print(f"  {c['platform_username']} ({c['platform']}) — {c['request_count']} requests")
        return

    # Load existing data to skip duplicates
    existing_queue = load_existing_queue()
    already_commented = load_already_commented()

    # Build the new queue (preserve existing pending entries)
    queue = [entry for entry in existing_queue.values() if entry.get("status") == "pending"]
    queued_usernames = {entry["platform_username"] for entry in queue}

    processed = 0
    for creator in creators:
        if processed >= args.limit:
            break

        username = creator["platform_username"]

        # Skip if already in queue or already commented
        if username in queued_usernames:
            log(f"  Skipping {username} — already in queue")
            continue
        if username in already_commented:
            log(f"  Skipping {username} — already commented")
            continue

        log(f"\nSearching Brave for: {username} ({creator['request_count']} requests)...")

        result = search_brave_for_instagram(username, creator.get("creator_name", ""))

        if result:
            entry = {
                "platform_username": username,
                "instagram_handle": result["instagram_handle"],
                "request_count": creator["request_count"],
                "instagram_url": result["instagram_url"],
                "status": "pending",
                "found_at": datetime.now(timezone.utc).isoformat(),
            }
            queue.append(entry)
            queued_usernames.add(username)
            processed += 1
            log(f"  Found: @{result['instagram_handle']} -> {result['instagram_url']}")
        else:
            log(f"  No Instagram handle found for {username}")

        # Human-like delay between searches
        delay = random.uniform(BRAVE_DELAY_MIN, BRAVE_DELAY_MAX)
        time.sleep(delay)

    save_queue(queue)
    log(f"\nDone. {processed} new creators added to queue. Total queue: {len(queue)}")


if __name__ == "__main__":
    main()
