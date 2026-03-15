#!/usr/bin/env python3
"""
OpenFans -- Daily Outreach Orchestrator

Runs the full outreach pipeline:
  1. Find Instagram handles for unclaimed requested creators
  2. Comment on their latest posts

Designed to be run daily via cron or Windows Task Scheduler.

Usage:
  python daily-outreach.py                # full pipeline
  python daily-outreach.py --dry-run      # preview only, no actions
  python daily-outreach.py --find-only    # only search for handles
  python daily-outreach.py --comment-only # only comment (queue must exist)
  python daily-outreach.py --max 10       # limit comments per run
"""

import sys
import subprocess
import argparse
import json
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PYTHON = sys.executable
QUEUE_FILE = SCRIPT_DIR / "outreach-queue.json"
LOG_FILE = SCRIPT_DIR / "outreach-log.jsonl"


def log(msg: str) -> None:
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def run_script(script_name: str, extra_args: list | None = None) -> int:
    """Run a Python script in the outreach directory and return the exit code."""
    script_path = str(SCRIPT_DIR / script_name)
    cmd = [PYTHON, script_path]
    if extra_args:
        cmd.extend(extra_args)

    log(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=str(SCRIPT_DIR))
    return result.returncode


def count_queue_pending() -> int:
    """Count pending entries in the outreach queue."""
    if not QUEUE_FILE.exists():
        return 0
    try:
        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            queue = json.load(f)
        return sum(1 for entry in queue if entry.get("status") == "pending")
    except (json.JSONDecodeError, FileNotFoundError):
        return 0


def count_todays_comments() -> int:
    """Count comments made today from the log file."""
    today = datetime.now().strftime("%Y-%m-%d")
    count = 0
    if not LOG_FILE.exists():
        return 0
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if (entry.get("status") == "commented"
                            and entry.get("created_at", "").startswith(today)):
                        count += 1
                except (json.JSONDecodeError, KeyError):
                    pass
    except FileNotFoundError:
        pass
    return count


def print_summary() -> None:
    """Print a summary of the outreach status."""
    pending = count_queue_pending()
    todays_comments = count_todays_comments()

    # Count total from log
    total_commented = 0
    total_failed = 0
    if LOG_FILE.exists():
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        if entry.get("status") == "commented":
                            total_commented += 1
                        elif entry.get("status") == "failed":
                            total_failed += 1
                    except (json.JSONDecodeError, KeyError):
                        pass
        except FileNotFoundError:
            pass

    log("")
    log("=" * 50)
    log("DAILY OUTREACH SUMMARY")
    log("=" * 50)
    log(f"  Queue pending:     {pending}")
    log(f"  Comments today:    {todays_comments}")
    log(f"  Total commented:   {total_commented}")
    log(f"  Total failed:      {total_failed}")
    log("=" * 50)


def main():
    parser = argparse.ArgumentParser(description="OpenFans Daily Outreach Orchestrator")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview mode -- no actual comments posted")
    parser.add_argument("--find-only", action="store_true",
                        help="Only search for Instagram handles")
    parser.add_argument("--comment-only", action="store_true",
                        help="Only comment on queued creators")
    parser.add_argument("--max", type=int, default=15,
                        help="Max comments per run (default: 15)")
    parser.add_argument("--headless", action="store_true",
                        help="Run browser in headless mode")
    args = parser.parse_args()

    log("OpenFans Daily Outreach Pipeline")
    log(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    log("")

    # Step 1: Find Instagram handles
    if not args.comment_only:
        log("STEP 1: Finding Instagram handles for unclaimed creators...")
        find_args = []
        if args.dry_run:
            find_args.append("--dry-run")
        exit_code = run_script("find-instagram-handles.py", find_args)
        if exit_code != 0:
            log(f"WARNING: find-instagram-handles.py exited with code {exit_code}")
        log("")

    # Step 2: Comment on Instagram posts
    if not args.find_only:
        pending = count_queue_pending()
        if pending == 0:
            log("STEP 2: No pending creators in queue. Skipping comments.")
        else:
            log(f"STEP 2: Commenting on {min(pending, args.max)} creators' posts...")
            comment_args = ["--max", str(args.max)]
            if args.dry_run:
                comment_args.append("--dry-run")
            if args.headless:
                comment_args.append("--headless")
            exit_code = run_script("comment-on-instagram.py", comment_args)
            if exit_code != 0:
                log(f"WARNING: comment-on-instagram.py exited with code {exit_code}")

    # Summary
    print_summary()


if __name__ == "__main__":
    main()
