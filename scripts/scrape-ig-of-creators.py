#!/usr/bin/env python3
"""
Scrape Instagram profiles that have "onlyfans" or "OF" in their bio.
Uses Apify's Instagram scrapers to find creator handles at scale.

Usage:
  python scrape-ig-of-creators.py                    # scrape via Apify
  python scrape-ig-of-creators.py --hashtag           # scrape via hashtag search
  python scrape-ig-of-creators.py --count 2000        # target count

Outputs to: content/ig-of-creators.json
"""

import json
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path
from datetime import datetime

APIFY_TOKEN = os.environ.get("APIFY_TOKEN", "")
BASE = Path(__file__).resolve().parent.parent
OUTPUT_FILE = str(BASE / "content" / "ig-of-creators.json")
HANDLES_FILE = str(BASE / "content" / "ig-of-handles.txt")


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", file=sys.stderr)


def apify_request(method, path, body=None):
    """Make authenticated request to Apify API."""
    url = f"https://api.apify.com/v2{path}?token={APIFY_TOKEN}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
    }, method=method)
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())


def run_hashtag_scraper(hashtags, results_per_tag=500):
    """Use Apify Instagram Hashtag Scraper to find OF creators.

    Strategy: Search hashtags that OF creators commonly use, then
    filter for profiles with 'onlyfans' or 'OF' in bio.
    """
    log(f"Starting hashtag scraper for: {hashtags}")

    # Actor: apify/instagram-hashtag-scraper
    actor_id = "reGe1ST3OBgYZSsZJ"

    input_data = {
        "hashtags": hashtags,
        "resultsLimit": results_per_tag,
        "resultsType": "posts",
    }

    # Start the actor run
    log("Launching Apify actor...")
    try:
        result = apify_request("POST", f"/acts/{actor_id}/runs", input_data)
        run_id = result["data"]["id"]
        log(f"Actor run started: {run_id}")
    except Exception as e:
        log(f"Failed to start actor: {e}")
        if hasattr(e, 'read'):
            log(f"  Body: {e.read().decode(errors='replace')[:300]}")
        return []

    # Poll until complete
    log("Waiting for results...")
    for _ in range(120):  # max 10 min
        time.sleep(5)
        try:
            status = apify_request("GET", f"/actor-runs/{run_id}")
            state = status["data"]["status"]
            if state == "SUCCEEDED":
                log("Actor run completed!")
                break
            elif state in ("FAILED", "ABORTED", "TIMED-OUT"):
                log(f"Actor run failed: {state}")
                return []
        except Exception:
            continue
    else:
        log("Timed out waiting for actor")
        return []

    # Fetch results
    dataset_id = status["data"]["defaultDatasetId"]
    try:
        items = apify_request("GET", f"/datasets/{dataset_id}/items")
    except Exception as e:
        log(f"Failed to fetch results: {e}")
        return []

    log(f"Got {len(items)} posts from hashtag search")
    return items


def run_profile_scraper(usernames):
    """Use Apify Instagram Profile Scraper to get bios."""
    log(f"Scraping {len(usernames)} profiles for bio info...")

    # Actor: apify/instagram-profile-scraper
    actor_id = "dSCLg0C3YEZ83HzYX"

    # Process in batches of 50
    all_profiles = []
    for i in range(0, len(usernames), 50):
        batch = usernames[i:i+50]
        log(f"  Batch {i//50 + 1}: {len(batch)} profiles...")

        input_data = {
            "usernames": batch,
        }

        try:
            result = apify_request("POST", f"/acts/{actor_id}/runs", input_data)
            run_id = result["data"]["id"]
        except Exception as e:
            log(f"  Failed: {e}")
            continue

        # Poll
        for _ in range(60):
            time.sleep(5)
            try:
                status = apify_request("GET", f"/actor-runs/{run_id}")
                state = status["data"]["status"]
                if state == "SUCCEEDED":
                    dataset_id = status["data"]["defaultDatasetId"]
                    items = apify_request("GET", f"/datasets/{dataset_id}/items")
                    all_profiles.extend(items)
                    log(f"  Got {len(items)} profiles")
                    break
                elif state in ("FAILED", "ABORTED"):
                    log(f"  Batch failed: {state}")
                    break
            except Exception:
                continue

    return all_profiles


def run_search_scraper(search_terms, max_results=500):
    """Use Apify Instagram Search to find profiles matching search terms."""
    log(f"Searching Instagram for: {search_terms}")

    # Actor: apify/instagram-scraper (general purpose)
    actor_id = "shu8hvrXbJbY3Eb9W"

    all_results = []
    for term in search_terms:
        log(f"  Searching: '{term}'...")
        input_data = {
            "search": term,
            "searchType": "user",
            "resultsLimit": max_results,
        }

        try:
            result = apify_request("POST", f"/acts/{actor_id}/runs", input_data)
            run_id = result["data"]["id"]
        except Exception as e:
            log(f"  Failed to start: {e}")
            if hasattr(e, 'read'):
                log(f"    {e.read().decode(errors='replace')[:200]}")
            continue

        # Poll
        for _ in range(60):
            time.sleep(5)
            try:
                status = apify_request("GET", f"/actor-runs/{run_id}")
                state = status["data"]["status"]
                if state == "SUCCEEDED":
                    dataset_id = status["data"]["defaultDatasetId"]
                    items = apify_request("GET", f"/datasets/{dataset_id}/items")
                    all_results.extend(items)
                    log(f"  Got {len(items)} results for '{term}'")
                    break
                elif state in ("FAILED", "ABORTED"):
                    log(f"  Failed: {state}")
                    break
            except Exception:
                continue

    return all_results


def extract_handles_from_posts(posts):
    """Extract unique Instagram usernames from post data."""
    handles = set()
    for post in posts:
        # Get the poster's username
        username = (
            post.get("ownerUsername") or
            post.get("username") or
            post.get("owner", {}).get("username") or
            ""
        )
        if username:
            handles.add(f"@{username.lower()}")
    return handles


def extract_handles_from_profiles(profiles):
    """Extract handles from profile data, filtering for OF-related bios."""
    of_creators = []
    of_keywords = ["onlyfans", "only fans", "o.f", "of link", "link in bio",
                   "linktree", "linktr.ee", "beacons.ai", "allmylinks",
                   "fansly", "fan site", "subscribe", "exclusive content",
                   "18+", "spicy", "💋", "🔞", "🍑", "linkin.bio"]

    for profile in profiles:
        bio = (profile.get("biography") or profile.get("bio") or "").lower()
        username = profile.get("username", "")

        # Check if bio mentions OF-related keywords
        if any(kw in bio for kw in of_keywords):
            of_creators.append({
                "handle": f"@{username.lower()}",
                "followers": profile.get("followersCount") or profile.get("edge_followed_by", {}).get("count", 0),
                "bio": bio[:200],
                "posts": profile.get("postsCount", 0),
            })

    return of_creators


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=2000)
    parser.add_argument("--hashtag", action="store_true")
    args = parser.parse_args()

    all_handles = set()
    all_creators = []

    # Load existing handles to skip
    existing = set()
    if Path(HANDLES_FILE).exists():
        with open(HANDLES_FILE, "r") as f:
            existing = {line.strip() for line in f if line.strip()}
        log(f"Loaded {len(existing)} existing handles to skip")

    # Strategy 1: Search Instagram for OF-related terms
    search_terms = [
        "onlyfans model",
        "onlyfans creator",
        "OF creator",
        "linktree onlyfans",
        "exclusive content creator",
        "subscribe onlyfans",
        "spicy content",
        "18+ content creator",
    ]

    search_results = run_search_scraper(search_terms, max_results=300)
    if search_results:
        for item in search_results:
            username = item.get("username", "")
            bio = (item.get("biography") or item.get("bio") or "").lower()
            handle = f"@{username.lower()}" if username else ""
            if handle and handle not in existing:
                all_handles.add(handle)
                all_creators.append({
                    "handle": handle,
                    "followers": item.get("followersCount", 0),
                    "bio": bio[:200],
                    "source": "search",
                })

    log(f"After search: {len(all_handles)} handles")

    # Strategy 2: Hashtag scraping — find posts using OF-related hashtags
    if args.hashtag or len(all_handles) < args.count:
        of_hashtags = [
            "onlyfansgirl", "onlyfanspromo", "onlyfanscreator",
            "onlyfansmodel", "onlyfansbabe", "ofcreator",
            "onlyfansfree", "onlyfanspage", "linkinbio",
            "exclusivecontent", "onlyfansgirls", "ofmodel",
            "subscribetomyonlyfans", "onlyfansstar",
            "spicycontent", "adultcreator", "fansonly",
            "onlyfansbaddie", "onlyfansaccount", "fanslycreator",
        ]

        posts = run_hashtag_scraper(of_hashtags, results_per_tag=200)
        new_handles = extract_handles_from_posts(posts)
        new_handles -= existing
        all_handles.update(new_handles)

        # Add to creators list
        for h in new_handles:
            all_creators.append({
                "handle": h,
                "followers": 0,
                "bio": "",
                "source": "hashtag",
            })

        log(f"After hashtags: {len(all_handles)} handles")

    # Save results
    log(f"Total unique handles: {len(all_handles)}")

    # Save full creator data
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_creators, f, indent=2, ensure_ascii=False)
    log(f"Saved creator data to {OUTPUT_FILE}")

    # Save handles list (for the comment bot)
    with open(HANDLES_FILE, "w", encoding="utf-8") as f:
        for handle in sorted(all_handles):
            f.write(handle + "\n")
    log(f"Saved {len(all_handles)} handles to {HANDLES_FILE}")

    return all_creators


if __name__ == "__main__":
    main()
