# Environment Setup Guide

## Required Services (set up in this order)

### 1. Upstash Redis (Rate Limiting)
- Go to console.upstash.com
- Create a free account
- Create a new Redis database (choose closest region)
- Copy the REST URL and Token
- Add to .env.local AND Vercel:
  - UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
  - UPSTASH_REDIS_REST_TOKEN=xxx

### 2. Resend (Email Notifications)
- Go to resend.com
- Create a free account
- Get your API key from the dashboard
- Add to .env.local AND Vercel:
  - RESEND_API_KEY=re_xxx

### 3. Sentry (Error Monitoring)
- Go to sentry.io
- Create a free account
- Create a new Next.js project
- Copy the DSN from project settings
- Add to .env.local AND Vercel:
  - NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

### 4. CRON_SECRET
- Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
- Add to .env.local AND Vercel:
  - CRON_SECRET=<generated-hex>

### 5. TAX_ENCRYPTION_KEY
- Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
- Add to .env.local AND Vercel:
  - TAX_ENCRYPTION_KEY=<generated-hex>

### 6. Fund Hot Wallet
- Send SOL to: 4e8YpUSns8RoVrPfVayhX4BWQSqecmjFUh1jxx77niQt
- Need at least 0.5 SOL for transaction fees
- Send via Phantom, Solflare, or any Solana wallet

### 7. LiveKit (Live Streaming) -- Optional
- Go to livekit.io
- Create a free account (5,000 minutes/month free)
- Create a new project
- Copy API Key, API Secret, and WebSocket URL
- Add to .env.local AND Vercel:
  - LIVEKIT_API_KEY=xxx
  - LIVEKIT_API_SECRET=xxx
  - LIVEKIT_URL=wss://xxx.livekit.cloud

## How to Add to Vercel
1. Go to vercel.com/team_IhqSL9nW8s0nt3Hgd6cc79cz
2. Select the openfans project
3. Settings -> Environment Variables
4. Add each variable for Production + Preview + Development
5. Redeploy to pick up new variables
