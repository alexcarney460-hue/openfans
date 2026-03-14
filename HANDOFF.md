# OpenFans Project Handoff Document

> Auto-updated each session. Paste this into a new Claude Code conversation to resume with full context.

## Last Updated: 2026-03-14

## Project Overview
- **Platform**: OpenFans — Solana-based creator subscription platform (like OnlyFans but crypto-native)
- **Stack**: Next.js 14 (App Router), TypeScript, Tailwind, Drizzle ORM, Supabase (Postgres + Auth), Solana (USDC payments)
- **Repo**: `C:\Users\Claud\.openclaw\workspace\openfans` → github.com/alexcarney460-hue/openfans
- **Deploy**: Vercel (auto-deploy from main branch)
- **Supabase**: `qnomimlnkjutldxuxuqj.supabase.co`
- **Status**: Investor-focused, onboarding creators in 1-2 weeks

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
| Schema | `utils/db/schema.ts` (16 tables incl. analytics_events) |
| Wallet ops | `utils/solana/verify.ts`, `transfer.ts`, `balance.ts` |
| Rate limiting | `utils/rate-limit.ts` (Upstash Redis + in-memory fallback) |
| Auth | `utils/api/auth.ts` (getAuthenticatedUser, getAuthenticatedAdmin) |
| Email | `utils/email.ts` (Resend API, fire-and-forget) |
| Admin | `app/admin/page.tsx`, `payouts/`, `creators/` |
| Creator dash | `app/dashboard/analytics/`, `wallet/`, `settings/`, `referrals/` |
| Tracking | `hooks/useTrack.ts`, `app/api/analytics/track/route.ts` |
| SEO | `generateMetadata` in `app/[username]/page.tsx`, `app/[username]/post/[postId]/page.tsx` |

### Environment Variables (.env.local)
- `DATABASE_URL` — Supabase Postgres
- `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` + `SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SOLANA_RPC_URL` — Helius mainnet RPC
- `NEXT_PUBLIC_PLATFORM_WALLET` — `4e8YpUSns8RoVrPfVayhX4BWQSqecmjFUh1jxx77niQt`
- `PLATFORM_WALLET_SECRET_KEY` — base58 private key (server-side only)
- `UPSTASH_REDIS_REST_URL` + `TOKEN` — not yet configured
- `RESEND_API_KEY` — not yet configured (emails skip silently without it)

## What's Been Built (2026-03-13 + 2026-03-14 Sessions)

### Wallet System
- Wallet connection fix (5 bugs: race condition, CSP, wrong endpoint, backend support, silent errors)
- Direct Phantom connect on settings page (bypasses modal if Phantom installed)
- Hot wallet configured with keypair
- Deposit verification, withdrawal request, admin payout processing
- On-chain USDC transfer utility for payouts

### Revenue & Security
- All 3 streams (subs, tips, PPV) route through platform wallet with 5% fee
- PPV double-charge fixed
- Deposit double-spend prevention (db.transaction)
- Payout double-processing prevention (atomic processing state)
- Non-atomic refund fix, platform wallet as payout blocked
- Error sanitization, role checks, withdrawal dedup
- BigInt for all balance calculations (no floating point)

### Admin Dashboard
- Platform analytics (tiles load fast, charts load async via `/api/admin/charts`)
- Payouts management page with process/approve flow
- Creators management page with verify/unverify toggle
- Click/engagement tracking section
- On-chain wallet balance (separate endpoint to avoid timeout)

### Creator Features
- Analytics dashboard (`/dashboard/analytics`)
- Withdrawal request UI with confirmation + payout history
- Post view counts (views_count column + API + Eye icon)
- Referral program UI (`/dashboard/referrals`) with copy link + commission tracking
- Copy Profile Link buttons on dashboard, settings, analytics
- Subscription price editing in settings

### Infrastructure
- Redis rate limiting via Upstash (in-memory fallback for dev)
- Click tracking (12 event types, analytics_events table, 8+ pages instrumented)
- Email notifications (new sub, tip, PPV, payout — via Resend, silent without key)
- SEO / OpenGraph meta tags on creator profiles + posts + home
- Phantom wallet setup guide (`/help/wallet-setup`)
- Creator onboarding audit fixes (password validation, duplicate buttons, getting started guide)
- Node 20 on Vercel (fixes OAuth + timeout issues)

### Production Fixes
- Analytics timeout: consolidated queries + maxDuration 30s
- Date serialization: ISO strings for raw SQL
- Google Fonts CSP: added to style-src + font-src

## API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET/PATCH/DELETE | `/api/me` | User profile (includes wallet_address) |
| GET/POST | `/api/wallet` | Wallet balance + deposit |
| POST | `/api/payouts/request` | Creator requests withdrawal |
| GET | `/api/payouts/mine` | Creator's payout history |
| GET/POST | `/api/admin/payouts` | Admin lists/processes payouts |
| GET | `/api/admin/analytics` | Platform-wide analytics |
| GET | `/api/admin/charts` | Growth/revenue charts (async) |
| GET | `/api/admin/wallet-balance` | On-chain hot wallet USDC balance |
| GET | `/api/admin/creators` | List all creators |
| POST | `/api/admin/creators/[id]/verify` | Toggle creator verified status |
| POST | `/api/analytics/track` | Record click/view events |
| POST | `/api/posts/[id]/view` | Increment post view count |
| POST | `/api/subscriptions` | Create subscription |
| POST | `/api/tips` | Send tip |
| POST | `/api/posts/[id]/unlock` | PPV purchase |
| GET | `/api/earnings` | Creator earnings data |
| GET | `/api/affiliates` | Creator's referral data |

## Database Schema (16 tables)
users_table, creator_profiles, posts, ppv_purchases, subscriptions, messages, tips, payouts, wallets, wallet_transactions, affiliates, referrals, affiliate_commissions, notifications, contact_messages, analytics_events

---

## ROADMAP — What Still Needs to Be Done

### Blocking (need user action)
- [ ] **Fund hot wallet with SOL** — `4e8YpUSns...niQt` has 0 SOL, can't process payouts
- [ ] **Set up Upstash Redis** — console.upstash.com, free tier, add URL + Token to `.env.local` + Vercel
- [ ] **Set up Resend** — resend.com, get API key, add to `.env.local` + Vercel
- [ ] **Live mainnet wallet test** — deposit → subscribe → payout flow with real USDC

### Critical for Launch
| Task | Why | Effort |
|------|-----|--------|
| KYC / age verification for creators | Legal requirement for adult content — age verification at minimum | Large |
| Content moderation system | Review/flag/remove content — DMCA, illegal content | Large |
| Subscription auto-renewal / expiry | Subs expire after 30 days but no auto-charge or renewal flow | Medium |
| DMCA takedown workflow | `/dmca` page exists but no actual takedown process | Medium |
| 2257 compliance records | Required for adult content — age verification records | Medium |
| Terms of Service enforcement | Ability to suspend/ban creators and users from admin | Medium |

### Revenue & Payments
| Task | Why | Effort |
|------|-----|--------|
| Minimum payout threshold | Prevent tiny withdrawals eating gas fees ($5-10 minimum) | Small |
| Payout schedule (weekly/monthly auto) | Creators shouldn't have to manually request every time | Medium |
| Tax reporting / 1099 generation | Required for US creators earning >$600/year | Large |
| Subscription pricing tiers | Multiple tier levels with different content access | Medium |

### Creator Experience
| Task | Why | Effort |
|------|-----|--------|
| Like + comment system | Makes platform feel alive (likes_count exists, no API/UI) | Medium |
| Notification center UI | In-app notifications (schema exists, no UI) | Medium |
| DM/messaging UI | Schema exists (messages table), needs frontend | Medium |
| Scheduled posts | Creators want to queue content | Medium |
| Mass messaging to subscribers | Creators need to announce things | Medium |
| Content bundles / promotions | Discount codes, free trials | Medium |
| Creator verification doc upload | Part of KYC — ID upload + selfie | Large |
| Live streaming | Major differentiator from OnlyFans | Large |
| Stories / disappearing content | Common creator platform feature | Large |

### Fan Experience
| Task | Why | Effort |
|------|-----|--------|
| Discover/explore page improvements | Better search, filters, trending | Medium |
| Bookmarks / favorites | Save posts for later | Small |
| Comment system UI | Schema has comments_count but no comments table/UI | Medium |
| Like/unlike API + UI | likes_count exists but no like/unlike endpoint | Small |
| Follow without subscribing | Free follow for updates | Small |

### Admin & Ops
| Task | Why | Effort |
|------|-----|--------|
| Content moderation queue | Admin page to review flagged content | Medium |
| User management (ban/suspend) | Admin needs to handle bad actors | Medium |
| Support ticket system | Users need to contact support | Medium |
| Revenue reports / export | CSV/PDF export for accounting | Small |
| Platform health monitoring | Uptime, error rates, performance | Medium |

### Marketing & Growth
| Task | Why | Effort |
|------|-----|--------|
| Landing page improvements | Better conversion for investors + creators | Medium |
| Blog / content marketing | SEO traffic | Medium |
| Creator onboarding email sequence | Drip emails after signup | Medium |
| Social proof (testimonials, stats) | Build trust on landing page | Small |
| Mobile app (PWA at minimum) | Most creators use mobile | Large |

### Infrastructure
| Task | Why | Effort |
|------|-----|--------|
| Production error monitoring (Sentry) | Catch errors before users report them | Small |
| Database backups verification | Make sure Supabase backups are working | Small |
| CDN for media files | Fast image/video delivery | Medium |
| Video transcoding pipeline | Handle uploaded videos properly | Large |
| Devnet on-chain test | Faucet was rate-limited — retry when available | Small |

### Suggested Priority Order

**This week (investor-ready + creator onboarding prep):**
1. KYC / age verification for creators
2. Like + comment system
3. Notification center UI
4. DM/messaging UI
5. Fund hot wallet + live test

**Next week (before onboarding creators):**
6. Content moderation queue
7. Subscription auto-renewal
8. Scheduled posts
9. Resend email setup
10. Minimum payout threshold

**Following weeks:**
11. User management (ban/suspend)
12. Explore page improvements
13. Bookmarks + follow system
14. Landing page polish
15. Mobile responsive audit
