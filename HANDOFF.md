# OpenFans Project Handoff Document

> Auto-updated each session. Paste this into a new Claude Code conversation to resume with full context.

## Last Updated: 2026-03-14

## Production Issues Fixed (2026-03-14)
- **Node.js version**: Changed from 24.x to 20.x via Vercel API — fixes OAuth hanging and TimeoutNegativeWarning
- **Analytics timeout**: Broke 30-subquery SQL into 6 sequential small queries + set `maxDuration = 30`
- **Solana RPC timeout**: Moved on-chain balance to separate `/api/admin/wallet-balance` endpoint
- **Missing Vercel env vars**: Added `NEXT_PUBLIC_PLATFORM_WALLET`, `PLATFORM_WALLET_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_VERSION`
- **Google Fonts CSP**: Added `fonts.googleapis.com` and `fonts.gstatic.com` to CSP
- **Charts temporarily removed** from analytics to keep under timeout — user_growth, revenue_by_day, categories, subscription_status return empty arrays. Add back via separate endpoint later.

## Vercel Config
- **Node version**: 20.x (set via API, NOT env var — env var alone doesn't work)
- **Team**: `team_IhqSL9nW8s0nt3Hgd6cc79cz`
- **Project**: `prj_i3N4AG82BEgntrWJxN7uax8KwhZD`
- **Domain**: openfans.online
- **Hobby plan**: 10s default serverless timeout, `maxDuration` can extend to 60s

## Project Overview
- **Platform**: OpenFans — Solana-based creator subscription platform (like OnlyFans but crypto-native)
- **Stack**: Next.js 14 (App Router), TypeScript, Tailwind, Drizzle ORM, Supabase (Postgres + Auth), Solana (USDC payments)
- **Repo**: `C:\Users\Claud\.openclaw\workspace\openfans` → github.com/alexcarney460-hue/openfans
- **Deploy**: Vercel (auto-deploy from main branch)
- **Supabase**: `qnomimlnkjutldxuxuqj.supabase.co`

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
| Schema | `utils/db/schema.ts` (15 tables + analytics_events) |
| Wallet ops | `utils/solana/verify.ts`, `transfer.ts`, `balance.ts` |
| Rate limiting | `utils/rate-limit.ts` (Upstash Redis + in-memory fallback) |
| Auth | `utils/api/auth.ts` (getAuthenticatedUser, getAuthenticatedAdmin) |
| Admin | `app/admin/page.tsx` (analytics), `app/admin/payouts/page.tsx` |
| Creator dash | `app/dashboard/analytics/page.tsx`, `wallet/page.tsx`, `settings/page.tsx` |
| Tracking | `hooks/useTrack.ts`, `app/api/analytics/track/route.ts` |

### Environment Variables (.env.local)
- `DATABASE_URL` — Supabase Postgres
- `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` + `SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SOLANA_RPC_URL` — Helius mainnet RPC
- `NEXT_PUBLIC_PLATFORM_WALLET` — `4e8YpUSns8RoVrPfVayhX4BWQSqecmjFUh1jxx77niQt`
- `PLATFORM_WALLET_SECRET_KEY` — base58 private key (server-side only)
- `UPSTASH_REDIS_REST_URL` + `TOKEN` — not yet configured

## What Was Done (2026-03-13 Session)

### Wallet Connection Fix (5 bugs)
- Race condition: `select()` no-op when wallet already selected → replaced with `useWalletModal`
- CSP: Helius RPC blocked by `connect-src` → added to `next.config.mjs`
- Wrong endpoint: wallet address POSTed to `/api/wallet` → fixed to `PATCH /api/me`
- Backend: `/api/me` didn't support `wallet_address` → added to GET + PATCH
- Silent errors: `.catch(() => {})` → added error feedback

### Revenue Model Fix (was making $0)
- Subscriptions and tips went directly to creator on-chain (0% fee)
- Now ALL payments route through platform wallet with 5% fee
- PPV double-charge fixed (was charging on-chain AND internal wallet)
- Earnings API reflects 95% creator share

### Security Hardening (8 vulnerabilities)
- Deposit double-spend → `db.transaction()` wrapping
- Payout double-processing → atomic `processing` status state
- Non-atomic refund → `sql\`balance + amount\`` + transaction
- Platform wallet as payout address → blocked in 3 endpoints
- Error messages sanitized (no Solana RPC leaks)
- Creator role check on withdrawals
- Withdrawal endpoints deduplicated
- Floating point → BigInt for balance queries

### Admin Dashboard
- Daily platform revenue + creator earnings (actual from ledger)
- On-chain hot wallet balance via Solana RPC
- Revenue chart includes all sources (was subs-only)
- Payouts management page (`/admin/payouts`) with process/approve flow
- Click/engagement tracking section

### Creator Features
- Analytics dashboard (`/dashboard/analytics`)
- Withdrawal request UI with confirmation + payout history
- Post view counts (`views_count` column + API + UI)

### Infrastructure
- Redis rate limiting via Upstash (`@upstash/ratelimit`)
- Click tracking system (12 event types, `analytics_events` table)
- Tracking on 8 pages
- Database migrations applied
- Hot wallet utilities created

## What's Still Pending

### Blocking (need user action)
- [ ] **SOL in hot wallet** — `4e8YpUSns...niQt` has 0 SOL, can't process payouts without gas
- [ ] **Upstash Redis** — create free account at console.upstash.com, add REST URL + Token to `.env.local`
- [ ] **Test wallet connect** — run `npm run dev`, go to settings, click Connect Wallet, verify Phantom popup

### Devnet Testing
- [ ] Solana devnet faucet was rate-limited (429) — retry when available
- [ ] Full on-chain test: deposit → subscribe → payout flow
- [ ] 21/21 unit tests passed (keypair, conversions, fee math, BigInt)

### Future Features
- [ ] Email notifications for payouts (creator gets notified when paid)
- [ ] More click tracking (share, message clicks)
- [ ] Creator-to-creator referral commission tracking (schema exists, no UI)
- [ ] Webhook for subscription expiry (auto-expire after 30 days)
- [ ] Mobile responsive audit
- [ ] Production deploy checklist (env vars, domain, SSL)

## Database Schema (15 + 1 tables)
users_table, creator_profiles, posts, ppv_purchases, subscriptions, messages, tips, payouts, wallets, wallet_transactions, affiliates, referrals, affiliate_commissions, notifications, contact_messages, analytics_events

## API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET/PATCH/DELETE | `/api/me` | User profile (includes wallet_address) |
| GET/POST | `/api/wallet` | Wallet balance + deposit |
| POST | `/api/payouts/request` | Creator requests withdrawal |
| GET | `/api/payouts/mine` | Creator's payout history |
| GET/POST | `/api/admin/payouts` | Admin lists/processes payouts |
| GET | `/api/admin/analytics` | Platform-wide analytics |
| POST | `/api/analytics/track` | Record click/view events |
| POST | `/api/posts/[id]/view` | Increment post view count |
| POST | `/api/subscriptions` | Create subscription |
| POST | `/api/tips` | Send tip |
| POST | `/api/posts/[id]/unlock` | PPV purchase |
| GET | `/api/earnings` | Creator earnings data |
