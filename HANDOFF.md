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

### KYC / Age Verification (2026-03-14)
- Creator verification: legal name + DOB (18+) + ID photo + selfie upload
- Admin review page (`/admin/verification`) with approve/reject
- Unverified creators blocked from posting
- Status banners on dashboard + settings

### Social Features (2026-03-14)
- Like toggle with optimistic UI (filled red heart)
- Comments with pagination, add/delete, rate limiting
- Notification center: bell dropdown + full page + unread badges + 30s polling
- DM messaging: split-pane inbox, real-time threads, user search, read receipts

### Infrastructure
- Redis rate limiting via Upstash (in-memory fallback for dev)
- Click tracking (12 event types, analytics_events table, 8+ pages instrumented)
- Email notifications (new sub, tip, PPV, payout — via Resend, silent without key)
- SEO / OpenGraph meta tags on creator profiles + posts + home
- Phantom wallet setup guide (`/help/wallet-setup`)
- Creator onboarding audit fixes (password validation, duplicate buttons, getting started guide)
- Node 20 on Vercel (fixes OAuth + timeout issues)
- Direct Phantom connect (bypass modal if installed)

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
| GET/POST | `/api/verification` | Creator KYC submission + status |
| GET/POST | `/api/admin/verification` | Admin review KYC submissions |
| POST/GET | `/api/posts/[id]/like` | Toggle like / check like status |
| GET/POST | `/api/posts/[id]/comments` | List + add comments |
| DELETE | `/api/posts/[id]/comments/[commentId]` | Delete comment |
| GET/PATCH | `/api/notifications` | Get notifications + mark read |
| GET/POST | `/api/messages/[userId]` | Get/send messages in thread |
| GET | `/api/messages/unread` | Unread message count |
| GET | `/api/users/search` | Search users by name/username |

## Database Schema (18 tables)
users_table, creator_profiles, posts, ppv_purchases, subscriptions, messages, tips, payouts, wallets, wallet_transactions, affiliates, referrals, affiliate_commissions, notifications, contact_messages, analytics_events, likes, comments

---

## ROADMAP — What Still Needs to Be Done

### Blocking (need user action)
- [ ] **Fund hot wallet with SOL** — `4e8YpUSns...niQt` has 0 SOL, can't process payouts
- [ ] **Set up Upstash Redis** — console.upstash.com, free tier, add URL + Token to `.env.local` + Vercel
- [ ] **Set up Resend** — resend.com, get API key, add to `.env.local` + Vercel
- [ ] **Live mainnet wallet test** — deposit → subscribe → payout flow with real USDC

### Critical for Launch
| Task | Status | Effort |
|------|--------|--------|
| ~~KYC / age verification for creators~~ | DONE | ~~Large~~ |
| Content moderation system | TODO | Large |
| Subscription auto-renewal / expiry | TODO | Medium |
| DMCA takedown workflow | TODO | Medium |
| 2257 compliance records | TODO (KYC covers age, need record retention) | Medium |
| Terms of Service enforcement (ban/suspend) | TODO | Medium |

### Revenue & Payments
| Task | Status | Effort |
|------|--------|--------|
| Minimum payout threshold | TODO | Small |
| Payout schedule (weekly/monthly auto) | TODO | Medium |
| Tax reporting / 1099 generation | TODO | Large |
| Subscription pricing tiers | TODO | Medium |

### Creator Experience
| Task | Status | Effort |
|------|--------|--------|
| ~~Like + comment system~~ | DONE | ~~Medium~~ |
| ~~Notification center UI~~ | DONE | ~~Medium~~ |
| ~~DM/messaging UI~~ | DONE | ~~Medium~~ |
| ~~Referral program UI~~ | DONE | ~~Medium~~ |
| ~~Creator analytics dashboard~~ | DONE | ~~Medium~~ |
| ~~Wallet setup guide~~ | DONE | ~~Small~~ |
| ~~Creator verification doc upload~~ | DONE (part of KYC) | ~~Large~~ |
| Scheduled posts | TODO | Medium |
| Mass messaging to subscribers | TODO | Medium |
| Content bundles / promotions | TODO | Medium |
| Live streaming | TODO | Large |
| Stories / disappearing content | TODO | Large |

### Fan Experience
| Task | Status | Effort |
|------|--------|--------|
| ~~Like/unlike API + UI~~ | DONE | ~~Small~~ |
| ~~Comment system UI~~ | DONE | ~~Medium~~ |
| Discover/explore page improvements | TODO | Medium |
| Bookmarks / favorites | TODO | Small |
| Follow without subscribing | TODO | Small |

### Admin & Ops
| Task | Status | Effort |
|------|--------|--------|
| ~~Admin analytics dashboard~~ | DONE | ~~Medium~~ |
| ~~Admin payouts management~~ | DONE | ~~Medium~~ |
| ~~Admin creators management~~ | DONE | ~~Medium~~ |
| ~~Admin KYC verification review~~ | DONE | ~~Medium~~ |
| Content moderation queue | TODO | Medium |
| User management (ban/suspend) | TODO | Medium |
| Support ticket system | TODO | Medium |
| Revenue reports / export | TODO | Small |
| Platform health monitoring | TODO | Medium |

### Marketing & Growth
| Task | Status | Effort |
|------|--------|--------|
| ~~SEO / OpenGraph meta tags~~ | DONE | ~~Small~~ |
| ~~Click/event tracking~~ | DONE | ~~Medium~~ |
| ~~Email notifications~~ | DONE (needs Resend key) | ~~Medium~~ |
| Landing page improvements | TODO | Medium |
| Blog / content marketing | TODO | Medium |
| Creator onboarding email sequence | TODO | Medium |
| Social proof (testimonials, stats) | TODO | Small |
| Mobile app (PWA at minimum) | TODO | Large |

### Infrastructure
| Task | Status | Effort |
|------|--------|--------|
| ~~Redis rate limiting~~ | DONE (needs Upstash credentials) | ~~Small~~ |
| ~~Database migrations~~ | DONE | ~~Small~~ |
| ~~Node 20 on Vercel~~ | DONE | ~~Small~~ |
| Production error monitoring (Sentry) | TODO | Small |
| Database backups verification | TODO | Small |
| CDN for media files | TODO | Medium |
| Video transcoding pipeline | TODO | Large |
| Devnet on-chain test | TODO (faucet rate-limited) | Small |

### Next Priority Order

**This week (before creator onboarding):**
1. Fund hot wallet + live mainnet test
2. Content moderation system
3. Subscription auto-renewal
4. User management (ban/suspend)
5. Minimum payout threshold

**Next week (creator onboarding begins):**
6. Scheduled posts
7. Discover/explore improvements
8. Bookmarks + follow system
9. Set up Resend + Upstash
10. Landing page polish

**Following weeks:**
11. Mass messaging to subscribers
12. Content bundles / promotions
13. Revenue reports / export
14. Mobile responsive audit
15. Video transcoding pipeline
