# OpenFans Marketing Team — Handoff Document

> **Last Updated:** 2026-03-15
> **Account:** @openfans.online (Instagram)
> **Platform:** openfans.online

---

## Current Assets

### Content
| File | Description |
|------|-------------|
| `SOCIAL-CONTENT-PLAN.md` | 10-post launch series (reels + carousels) |
| `REELS-BATCH-2.md` | 10 NEW reel scripts with shot-by-shot storyboards |
| `BRAND-KIT.md` | Full brand guidelines, colors, tone, voice |
| `content/outreach-templates.md` | DM templates for Twitter, Instagram, Email |
| `content/ready-to-send-outreach.md` | Pre-written outreach copy |
| `content/reddit-comments-to-post.md` | Reddit comment templates |

### Lead Lists
| File | Count | Description |
|------|-------|-------------|
| `content/ig-of-handles.txt` | **3,179** | Scraped IG handles of OF creators |
| `content/creator-leads.json` | 200 | Mixed leads (web, Reddit, Twitter) |
| `content/reddit-creator-leads.json` | 176 | Reddit thread leads |

### Scripts & Automation
| Script | Purpose | Rate |
|--------|---------|------|
| `scripts/ig-comment.py` | Comment on creators' posts | 42s between, 100/batch, 5m pause |
| `scripts/ig-dm.py` | Send DMs to creators | 55s between, 50/batch, 5m pause |
| `scripts/ig-post.py` | Post images/reels to IG | 70m between (new account) |
| `scripts/reel-pipeline.py` | Produce + post reels (AI images + FFmpeg) | Auto, 70m between |
| `scripts/scrape-of-handles-brave.py` | Scrape OF creator IG handles | Brave Search API |
| `scripts/scrape-creator-leads.mjs` | Scrape creator leads | Brave Search API |

### Browser Profiles (Playwright persistent sessions)
| Profile | Path | Purpose |
|---------|------|---------|
| Comments | `~/.ig_openfans_comments/` | Comment bot, logged into @openfans.online |
| DMs | `~/.ig_openfans_dms/` | DM bot (needs first login) |
| Posts | `~/.ig_openfans_browser/` | Posting bot |

---

## Campaign Status (as of 2026-03-15)

### Comments Posted: 44
- All unique, non-spammy comments mentioning openfans.online
- Targets: mid-tier OF creators' latest posts
- Log: `logs/comment-outreach.jsonl`

### DMs Sent: 0
- Script built and ready
- 6 varied DM templates
- Log: `logs/dm-outreach.jsonl`

### Reels Posted: 0
- 10 scripts written (REELS-BATCH-2.md)
- Pipeline built but blocked on image generation API keys
- **Need:** Fresh Gemini API key (old ones leaked/revoked) OR fal.ai account

---

## How to Run

### Comment Bot
```bash
cd C:\Users\Claud\.openclaw\workspace\openfans

# Run comment outreach (loads 3,179 handles, skips already-posted)
python scripts/ig-comment.py

# Dry run (preview without posting)
python scripts/ig-comment.py --dry-run

# Single target
python scripts/ig-comment.py --target @somehandle
```

### DM Bot
```bash
# Run DM outreach (loads 3,179 handles, skips already-sent)
python scripts/ig-dm.py

# Dry run
python scripts/ig-dm.py --dry-run
```

### Reel Pipeline
```bash
# Produce + post all 10 reels (70 min apart)
python scripts/reel-pipeline.py

# Produce only (don't post)
python scripts/reel-pipeline.py --no-post

# Only reel N
python scripts/reel-pipeline.py --only 3
```

### Scrape More Handles
```bash
# Brave Search scraper (edit queries in script to find more)
python scripts/scrape-of-handles-brave.py
```

---

## Rate Limits & Safety

| Action | Rate | Batch | Pause | Risk |
|--------|------|-------|-------|------|
| Comments | 42s | 100 | 5m | Medium-High (may get action blocked) |
| DMs | 55s | 50 | 5m | High (IG restricts new account DMs) |
| Posts | 70m | 1 | -- | Low (standard new account limit) |
| Scraping | 1.5s | -- | -- | Low (Brave API, not IG directly) |

**If action-blocked:** Stop all bots, wait 24-48 hours, then resume at slower rates.

---

## API Keys & Credentials

| Service | Status | Notes |
|---------|--------|-------|
| Gemini API | **ALL 3 KEYS REVOKED** | Google flagged as leaked. Need new keys from aistudio.google.com |
| Brave Search | Active | Key: in memory/config |
| Apify | **Monthly limit exceeded** | Resets next billing cycle |
| Runway Gen-4.5 | Active | $0.60/scene, key in `keys/runwayapi.txt` |
| Instagram | Logged in | @openfans.online via Playwright profiles |

---

## Brand Guidelines (Quick Reference)

- **Colors:** #00AFF0 (cyan), #F5A623 (orange accent)
- **Tone:** Creator-to-creator. Confident, empowering, provocative. Never corporate.
- **Visual Rule:** Attractive women, CLOTHED, night-out glamour, VIP energy
- **Storytelling Rule:** SHOW don't TELL. Zero text overlays. Story IS the video.
- **Key Messages:**
  - 95% payouts (vs 80% on OnlyFans/Fansly)
  - Instant USDC crypto payouts
  - Can't be deplatformed
  - Referral program: 1% of referred creators' earnings forever
  - Founder spots open (90-day window)

---

## Next Steps

1. **Get fresh Gemini API key** → unblocks reel production pipeline
2. **Run comment + DM bots in parallel** → scale outreach
3. **Post first batch of reels** → build @openfans.online content
4. **Scrape more handles** → add queries to Brave scraper for more niches
5. **Track conversions** → monitor openfans.online signups from IG traffic
