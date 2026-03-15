#!/usr/bin/env python3
"""
Scrape Instagram handles of OnlyFans creators using Brave Search API.
Searches for creator lists, directories, and promo pages to extract handles.

Usage:
  python scrape-of-handles-brave.py

Outputs to: content/ig-of-handles.txt
"""

import json
import re
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path
from datetime import datetime

BRAVE_API_KEY = "BSAcMxzO8AD021dICd0f-5Zq5vuJJ8F"
BASE = Path(__file__).resolve().parent.parent
HANDLES_FILE = str(BASE / "content" / "ig-of-handles.txt")

# Instagram handle regex
IG_HANDLE_RE = re.compile(r'@([a-zA-Z0-9_.]{3,30})')

# Common words that aren't handles
SKIP_HANDLES = {
    "gmail", "yahoo", "hotmail", "outlook", "email", "onlyfans",
    "instagram", "twitter", "tiktok", "facebook", "youtube", "snapchat",
    "the", "and", "for", "with", "from", "this", "that", "here",
    "link", "bio", "com", "net", "org", "www", "http", "https",
    "admin", "support", "help", "info", "contact", "privacy",
    "copyright", "terms", "about", "home", "page", "post",
}


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", file=sys.stderr, flush=True)


def brave_search(query, count=20, offset=0):
    """Search using Brave Search API."""
    params = urllib.parse.urlencode({
        "q": query,
        "count": count,
        "offset": offset,
    })
    url = f"https://api.search.brave.com/res/v1/web/search?{params}"
    req = urllib.request.Request(url, headers={
        "X-Subscription-Token": BRAVE_API_KEY,
        "Accept": "application/json",
    })

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        log(f"  Search error: {e}")
        return {}


def fetch_page(url, timeout=20):
    """Fetch a webpage and return its text content."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode(errors="replace")
    except Exception:
        return ""


def extract_ig_handles(text):
    """Extract Instagram handles from text content."""
    handles = set()
    for match in IG_HANDLE_RE.finditer(text):
        handle = match.group(1).lower()
        # Filter out obvious non-handles
        if handle in SKIP_HANDLES:
            continue
        if len(handle) < 3:
            continue
        if handle.isdigit():
            continue
        if handle.startswith(("http", "www")):
            continue
        handles.add(f"@{handle}")
    return handles


def extract_from_instagram_urls(text):
    """Extract handles from instagram.com URLs in text."""
    handles = set()
    # Match instagram.com/username patterns
    ig_url_re = re.compile(r'instagram\.com/([a-zA-Z0-9_.]{3,30})')
    for match in ig_url_re.finditer(text):
        username = match.group(1).lower()
        if username not in ("p", "reel", "stories", "explore", "accounts", "about",
                           "legal", "privacy", "terms", "developer", "directory"):
            handles.add(f"@{username}")
    return handles


def main():
    all_handles = set()

    # Search queries to find OF creator Instagram handles
    queries = [
        # Direct creator list searches
        "onlyfans creators instagram handles list",
        "onlyfans model instagram accounts 2025",
        "onlyfans model instagram accounts 2026",
        "best onlyfans instagram models list",
        "onlyfans girls instagram promotion",
        "onlyfans creator instagram bio link",
        "top onlyfans accounts instagram handles",
        "new onlyfans creators instagram 2026",
        "onlyfans instagram models to follow",
        "rising onlyfans creators instagram",
        # Reddit threads
        "site:reddit.com onlyfans creator instagram list",
        "site:reddit.com best onlyfans instagram models",
        "reddit onlyfans creators promoting instagram",
        # Twitter/X threads
        "site:x.com onlyfans instagram promo",
        "site:twitter.com onlyfans creator instagram",
        # Directory sites
        "site:onlyfinder.com instagram",
        "onlyfans directory instagram handles",
        "onlyfans search engine creator instagram",
        # Blog lists
        "best onlyfans babes instagram 2026",
        "hottest onlyfans creators instagram accounts",
        "onlyfans models with instagram accounts list",
        "must follow onlyfans creators instagram",
        "underrated onlyfans instagram models",
        "onlyfans free accounts instagram promotion",
        "onlyfans instagram promo pages",
        # Specific niches
        "fitness onlyfans creators instagram",
        "cosplay onlyfans creators instagram",
        "onlyfans latina creators instagram",
        "onlyfans asian creators instagram",
        "onlyfans uk creators instagram",
        "onlyfans australian creators instagram",
        # Promo pages
        "onlyfans promo instagram page accounts list",
        "onlyfans shoutout page instagram handles",
        "onlyfans promo pages instagram 2026",
        "instagram onlyfans promotion accounts follow",
    ]

    log(f"Running {len(queries)} search queries...")

    for i, query in enumerate(queries):
        log(f"[{i+1}/{len(queries)}] Searching: {query}")

        # Search with Brave
        results = brave_search(query, count=20)
        web_results = results.get("web", {}).get("results", [])

        if not web_results:
            log(f"  No results")
            time.sleep(1)
            continue

        # Extract handles from search result snippets first
        for result in web_results:
            snippet = (result.get("description", "") + " " +
                      result.get("title", "") + " " +
                      result.get("url", ""))
            handles = extract_ig_handles(snippet)
            handles.update(extract_from_instagram_urls(snippet))
            all_handles.update(handles)

        # Fetch top 5 result pages for deeper scraping
        for result in web_results[:5]:
            url = result.get("url", "")
            if not url:
                continue
            # Skip certain domains
            if any(d in url for d in ["youtube.com", "facebook.com", "tiktok.com"]):
                continue

            content = fetch_page(url)
            if content:
                handles = extract_ig_handles(content)
                handles.update(extract_from_instagram_urls(content))
                all_handles.update(handles)

        log(f"  Running total: {len(all_handles)} handles")
        time.sleep(1.5)  # Rate limit

    # Load existing to combine
    existing = set()
    if Path(HANDLES_FILE).exists():
        with open(HANDLES_FILE, "r") as f:
            existing = {line.strip() for line in f if line.strip()}

    new_handles = all_handles - existing
    combined = all_handles | existing

    # Save
    with open(HANDLES_FILE, "w", encoding="utf-8") as f:
        for handle in sorted(combined):
            f.write(handle + "\n")

    log(f"")
    log(f"{'=' * 50}")
    log(f"DONE")
    log(f"  New handles found: {len(new_handles)}")
    log(f"  Previously had: {len(existing)}")
    log(f"  Total saved: {len(combined)}")
    log(f"  File: {HANDLES_FILE}")
    log(f"{'=' * 50}")


if __name__ == "__main__":
    main()
