# OpenFans Project Handoff Document

> Auto-updated each session. Paste this into a new Claude Code conversation to resume with full context.

## Last Updated: 2026-03-15

## Project Overview
- **Platform**: OpenFans — Solana-based creator subscription platform (like OnlyFans but crypto-native)
- **Stack**: Next.js 14 (App Router), TypeScript, Tailwind, Drizzle ORM, Supabase (Postgres + Auth), Solana (USDC payments), Sentry (error monitoring)
- **Repo**: `C:\Users\Claud\.openclaw\workspace\openfans` → github.com/alexcarney460-hue/openfans
- **Deploy**: Vercel (auto-deploy from main branch)
- **Supabase**: `qnomimlnkjutldxuxuqj.supabase.co`
- **Status**: Feature-complete, pre-launch. Onboarding creators soon.

## Vercel Config
- **Node version**: 20.x (set via API, NOT env var — env var alone doesn't work)
- **Team**: `team_IhqSL9nW8s0nt3Hgd6cc79cz`
- **Project**: `prj_i3N4AG82BEgntrWJxN7uax8KwhZD`
- **Domain**: openfans.online
- **Hobby plan**: 10s default serverless timeout, `maxDuration` can extend to 60s

## Architecture

### Revenue Model
All payments (subscriptions, tips, PPV) route through the platform hot wallet:
1. User sends USDC on-chain to platform wallet `4e8YpUSns8RoVrPfVayhX4BWQSqecmjFUh1jxx77niQt`
2. Platform verifies on-chain tx via `utils/solana/verify.ts`
3. Creator credited 95% internally, platform keeps 5%
4. Creators withdraw from internal balance → admin approves → platform sends USDC on-chain via `utils/solana/transfer.ts`

### Key Files
| Area | Files |
|------|-------|
| Schema | `utils/db/schema.ts` (18 Drizzle tables + raw SQL tables) |
| Wallet ops | `utils/solana/verify.ts`, `transfer.ts`, `balance.ts` |
| Rate limiting | `utils/rate-limit.ts` (Upstash Redis + in-memory fallback) |
| Auth | `utils/api/auth.ts` (getAuthenticatedUser, getAuthenticatedAdmin) |
| Email | `utils/email.ts`, `utils/email-templates.ts` |
| Tax | `utils/tax-calculations.ts`, `app/api/tax-info/route.ts` |
| Video | `utils/video/storage.ts`, `utils/video/transcoding.ts` |
| Streaming | `utils/streaming/constants.ts` |
| Admin | `app/admin/` (analytics, payouts, creators, videos, streams, stories, health, tax, support) |
| Creator dash | `app/dashboard/` (analytics, wallet, settings, referrals, stories, live, tax, support, posts) |
| Sentry | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |
| PWA | `public/manifest.json`, `public/sw.js`, `public/offline.html` |

### Environment Variables (.env.local)
- `DATABASE_URL` — Supabase Postgres
- `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` + `SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SOLANA_RPC_URL` — Helius mainnet RPC
- `NEXT_PUBLIC_PLATFORM_WALLET` — `4e8YpUSns8RoVrPfVayhX4BWQSqecmjFUh1jxx77niQt`
- `PLATFORM_WALLET_SECRET_KEY` — base58 private key (server-side only)
- `UPSTASH_REDIS_REST_URL` + `TOKEN` — not yet configured
- `RESEND_API_KEY` — not yet configured (emails skip silently without it)
- `NEXT_PUBLIC_SENTRY_DSN` — not yet configured (Sentry disabled without it)
- `TAX_ENCRYPTION_KEY` — 64-char hex string for AES-256-GCM tax ID encryption
- `CRON_SECRET` — Bearer token for cron/webhook endpoints
- `VIDEO_WEBHOOK_SECRET` — Bearer token for video transcoding webhooks

## What's Been Built

### Wallet System
- Wallet connection fix (5 bugs: race condition, CSP, wrong endpoint, backend support, silent errors)
- Direct Phantom connect on settings page
- Hot wallet configured with keypair
- Deposit verification, withdrawal request, admin payout processing
- On-chain USDC transfer utility for payouts
- $5.00 minimum payout threshold (enforced frontend + backend)
- Auto payout schedule (weekly/monthly) with cron endpoint

### Revenue & Security
- All 3 streams (subs, tips, PPV) route through platform wallet with 5% fee
- PPV double-charge fixed
- Deposit double-spend prevention (db.transaction)
- Payout double-processing prevention (atomic processing state)
- Timing-safe secret comparison on all webhook/cron endpoints
- Error sanitization, role checks, withdrawal dedup
- BigInt for all balance calculations (no floating point)

### Tax Reporting (1099 / W-9)
- W-9 tax info collection with AES-256-GCM encrypted SSN/EIN storage
- Tax calculation engine (annual/monthly/quarterly aggregation, shared constants)
- Admin tax dashboard with creator earnings table, threshold filtering
- 1099 CSV export endpoint (IRS-formatted, $600 threshold)
- Creator-facing tax earnings page with monthly breakdown + CSV download
- Extracted TaxInfoForm component with client-side SSN/EIN format validation

### Admin Dashboard
- Platform analytics with async chart loading
- Payouts management with process/approve flow
- Creators management with verify/unverify toggle
- User management with ban/suspend
- Content moderation queue + DMCA takedown workflow
- Revenue CSV export (revenue, users, payouts with date filtering)
- Platform health monitoring (DB + Solana status, auto-refresh)
- Video management dashboard (status, retry, delete)
- Stream management dashboard (force-end, status filters)
- Stories management dashboard (reporting, moderation, removal audit)
- Support ticket management (threaded replies, status updates)
- Tax reporting dashboard (1099 status, CSV export)

### Creator Features
- Analytics dashboard
- Withdrawal request UI with confirmation + payout history
- Post view counts
- Referral program UI with copy link + commission tracking
- Subscription price editing + pricing tiers
- Scheduled posts with publish scheduling
- Mass messaging / broadcast to subscribers
- Content bundles / promotions system
- Payout schedule selector (manual/weekly/monthly)
- Support ticket submission

### Video System
- Video upload API (500MB max, MIME+extension validation, rate limited)
- Supabase Storage integration with path sanitization
- Transcoding worker API with queue (FOR UPDATE SKIP LOCKED)
- Webhook endpoint for transcoding results (multi-quality variants, transactional)
- Custom HTML5 video player (quality switching, lazy loading, keyboard shortcuts, touch controls)
- Video upload preview with drag-drop, progress tracking, processing status
- Video tab in post creation (mutually exclusive with images)
- Video rendering in post feeds and creator profiles
- Locked video posts show blurred thumbnail with subscribe CTA

### Stories / Disappearing Content
- Stories API (create, view, delete, 24h expiration)
- View tracking with atomic CTE (no race conditions)
- Fullscreen story viewer (progress bars, swipe nav, video support, keyboard controls)
- Story ring + bar (gradient rings, horizontal scroll)
- Create story modal (drag-drop, caption, video duration validation)
- Story highlights (persistent collections on creator profiles)
- Creator story management page with viewer list
- Story reporting with rate limiting
- Admin stories dashboard with moderation + removal audit
- View milestone notifications (10, 50, 100, 500 views)
- Cron cleanup of expired stories (48h buffer, safe media deletion)

### Live Streaming
- Stream API (create, schedule, go live, end, chat, viewers)
- Stream viewer page with chat panel, subscriber gate (server-side enforced)
- Creator dashboard (go live, schedule modal, stream control panel)
- Chat system with rate limiting (30 msgs/min), pin/delete moderation
- Live stream cards + banner in feed, explore page, creator profiles
- LiveBadge component with animated pulsing dot
- Admin streams dashboard with force-end capability
- Subscriber notification on go-live (batch insert)
- Stream key shown to creator for OBS/RTMP connection
- Transactional stream ending + DELETE cascade

### KYC / Age Verification
- Creator verification: legal name + DOB (18+) + ID photo + selfie upload
- Admin review page with approve/reject
- Unverified creators blocked from posting
- 2257 compliance record retention

### Social Features
- Like toggle with optimistic UI
- Comments with pagination, add/delete, rate limiting
- Notification center with bell dropdown + full page + unread badges + 30s polling
- DM messaging: split-pane inbox, real-time threads, user search, read receipts
- Bookmarks / favorites
- Follow without subscribing
- Discover/explore page

### PWA (Progressive Web App)
- Web app manifest with icons, shortcuts, share target
- Service worker (cache-first static, network-first nav, network-only API)
- Offline fallback page
- Install prompt banner with iOS instructions
- Mobile bottom navigation (5 tabs, hide-on-scroll, safe area insets)
- Pull-to-refresh using router.refresh()
- Mobile responsive fixes across all key pages
- 44px touch targets on all interactive elements
- Safe area inset support for notched phones

### Infrastructure
- Redis rate limiting via Upstash (in-memory fallback for dev)
- Click tracking (12 event types, analytics_events table)
- Email notifications (new sub, tip, PPV, payout — via Resend)
- Creator onboarding email sequence (5-stage drip, cron endpoint)
- SEO / OpenGraph meta tags on creator profiles + posts + home
- Sentry error monitoring (configured, needs DSN)
- Landing page: comparison table, FAQ accordion, CTA banner, social proof
- i18n: 9 locales (en, es, fr, pt, de, ja, zh, ko, ar, ru)

## Database Schema

### Drizzle-managed (schema.ts — 18 tables)
users_table, creator_profiles, posts, ppv_purchases, subscriptions, messages, tips, payouts, wallets, wallet_transactions, affiliates, referrals, affiliate_commissions, notifications, contact_messages, analytics_events, likes, comments

### Raw SQL tables (via migrations)
video_assets, video_variants, stories, story_views, story_highlights, story_highlight_items, story_reports, story_admin_removals, live_streams, live_stream_viewers, live_chat_messages, support_tickets, support_messages, creator_tax_info

### Migrations (in `migrations/`)
001 — payout_schedule column on creator_profiles
002 — creator_tax_info table
003 — video_asset_id column on posts
003a — video_assets + video_variants tables
004 — stories + story_views tables
005 — story_highlights + story_highlight_items tables
006 — story_reports + story_admin_removals tables
007 — live_streams + live_stream_viewers + live_chat_messages tables

**Run migrations:** `node scripts/run-migrations.mjs`

## API Endpoints (60+)

### Core
| Method | Path | Purpose |
|--------|------|---------|
| GET/PATCH/DELETE | `/api/me` | User profile |
| GET/POST | `/api/wallet` | Wallet balance + deposit |
| POST | `/api/payouts/request` | Creator withdrawal ($5 min) |
| GET | `/api/payouts/mine` | Creator payout history |
| POST | `/api/subscriptions` | Create subscription |
| POST | `/api/tips` | Send tip |
| GET/POST | `/api/posts` | List + create posts |
| POST | `/api/posts/[id]/unlock` | PPV purchase |
| GET | `/api/earnings` | Creator earnings |

### Video
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/upload/video` | Upload video file |
| GET/DELETE | `/api/upload/video/[id]` | Video asset CRUD |
| POST | `/api/video/transcode` | Transcoding webhook |
| GET | `/api/video/transcode/queue` | Transcoding queue (cron) |

### Stories
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/stories` | List + create stories |
| GET/DELETE | `/api/stories/[id]` | View + delete (tracks views) |
| GET | `/api/stories/[id]/viewers` | Viewer list (creator only) |
| POST | `/api/stories/[id]/report` | Report a story |
| GET | `/api/stories/my` | Creator's own stories |

### Highlights
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/highlights` | List + create highlights |
| GET/PATCH/DELETE | `/api/highlights/[id]` | Highlight CRUD |
| POST/DELETE | `/api/highlights/[id]/stories` | Add/remove stories |

### Live Streaming
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/streams` | List + create streams |
| GET/PATCH/DELETE | `/api/streams/[id]` | Stream CRUD + viewer tracking |
| GET/POST | `/api/streams/[id]/chat` | Chat messages |
| DELETE/PATCH | `/api/streams/[id]/chat/[messageId]` | Moderate chat |
| GET | `/api/streams/[id]/viewers` | Viewer count + list |
| POST | `/api/streams/notify` | Notify subscribers |

### Tax
| Method | Path | Purpose |
|--------|------|---------|
| GET/PUT | `/api/tax-info` | Creator W-9 tax info |
| GET | `/api/tax/my-summary` | Creator tax summary |
| GET | `/api/admin/tax/summary` | Admin tax overview |
| GET | `/api/admin/tax/creator/[id]` | Creator tax detail |
| GET | `/api/admin/tax/export` | 1099 CSV export |

### Support
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/support` | User tickets |
| GET/PATCH | `/api/support/[id]` | Ticket detail + status |
| POST | `/api/support/[id]/messages` | Ticket replies |
| GET | `/api/admin/support` | Admin ticket list |

### Cron Endpoints (protected by CRON_SECRET)
| Path | Purpose |
|------|---------|
| `/api/cron/process-payouts` | Auto payout processing |
| `/api/cron/onboarding-emails` | Creator onboarding drip |
| `/api/cron/cleanup-stories` | Delete expired stories |

### Admin
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/analytics` | Platform analytics |
| GET | `/api/admin/charts` | Growth/revenue charts |
| GET | `/api/admin/export` | CSV export |
| GET | `/api/admin/health` | Platform health check |
| GET/POST | `/api/admin/payouts` | Payout management |
| GET | `/api/admin/creators` | Creator list |
| GET | `/api/admin/videos` | Video management |
| GET/DELETE | `/api/admin/streams` | Stream management |
| GET/DELETE | `/api/admin/stories` | Story moderation |
| GET | `/api/admin/support` | Support tickets |

---

## ROADMAP — What Still Needs to Be Done

### Blocking (need user action — not code)
- [ ] **Fund hot wallet with SOL** — `4e8YpUSns...niQt` has 0 SOL, can't process payouts
- [ ] **Set up Upstash Redis** — console.upstash.com, free tier, add URL + Token to `.env.local` + Vercel
- [ ] **Set up Resend** — resend.com, get API key, add to `.env.local` + Vercel
- [ ] **Set up Sentry** — sentry.io, create Next.js project, add DSN to `.env.local` + Vercel
- [ ] **Add TAX_ENCRYPTION_KEY** — generate 64-char hex string, add to `.env.local` + Vercel
- [ ] **Add CRON_SECRET** — generate random string, add to `.env.local` + Vercel
- [ ] **Set up streaming service** — Mux or Cloudflare Stream for RTMP ingest + HLS playback
- [ ] **Live mainnet wallet test** — deposit → subscribe → payout flow with real USDC
- [ ] **Set up Vercel Cron** — configure cron jobs for payout processing, onboarding emails, story cleanup

### Future Enhancements
| Task | Effort |
|------|--------|
| Blog / content marketing | Medium |
| CDN for media files | Medium |
| WebSocket chat (replace polling) | Medium |
| Push notifications (web push API) | Medium |
| Creator analytics v2 (demographics, retention) | Medium |
| Mobile-specific media capture (camera API) | Medium |
| Content recommendation engine | Large |
| Two-factor authentication | Medium |
| Multi-language content support | Medium |
