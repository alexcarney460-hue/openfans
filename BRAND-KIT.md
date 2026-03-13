# OpenFans Brand Kit & Tone Guide

> **Version:** 1.0 — Founder Launch Phase
> **Last Updated:** 2026-03-13
> **Platform:** openfans.online
> **Instagram:** @openfans.online

---

## 1. Brand Foundation

### Brand Purpose

OpenFans exists to give creators real ownership over their work, their audience, and their money. No middlemen skimming 20%. No banks deciding what content is "acceptable." No payout delays while someone else earns interest on your earnings. Creators built the internet — it's time the internet paid them properly.

### Brand Vision

A creator economy where every dollar earned goes where it belongs: to the person who made the content. Built on open infrastructure that no corporation can shut down, slow down, or shake down.

### Brand Mission

To be the highest-paying, most creator-friendly subscription platform in existence — powered by Solana, settled in USDC, and designed by people who actually respect creators.

### Brand Values

1. **Creator Sovereignty** — Your content, your rules, your money. We don't get a vote.
2. **Radical Transparency** — 95% payouts. 5% platform fee. That's it. No hidden charges, no "processing fees," no surprises.
3. **Speed Over Bureaucracy** — Instant USDC payouts on Solana. You earned it at 2am, you have it at 2am.
4. **Unapologetic Empowerment** — We don't police legal content. We don't moralize. We build tools and get out of the way.
5. **Community Over Competition** — Creators who bring in other creators earn 1% commission. Rising tides, bigger wallets.

### Brand Personality

If OpenFans were a person, she'd be:

- **Confident** — Knows her worth and isn't afraid to state it plainly
- **Sharp** — Understands money, tech, and culture; never talks down to anyone
- **Warm but direct** — Supportive without being sycophantic; honest without being harsh
- **A little provocative** — Not afraid to call out industry BS or make competitors uncomfortable
- **Digitally native** — Speaks internet fluently; memes, trends, and cultural references come naturally
- **International** — Comfortable in any timezone, any language, any aesthetic

### Brand Promise

You keep 95%. You get paid instantly. Nobody tells you what to post.

---

## 2. Color Palette

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **OpenFans Blue** | `#00AFF0` | 0, 175, 240 | Primary brand color. CTAs, logos, links, key UI elements |
| **Deep Blue** | `#009AD6` | 0, 154, 214 | Hover states, secondary buttons, gradient endpoints |
| **Signal Orange** | `#F5A623` | 245, 166, 35 | Accents, highlights, notifications, urgency, earnings displays |

### Extended Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Midnight** | `#0A0E1A` | Dark backgrounds, dark mode base |
| **Charcoal** | `#1A1F2E` | Card backgrounds, elevated surfaces |
| **Slate** | `#2D3348` | Secondary text, borders |
| **Silver** | `#8892A8` | Muted text, placeholders |
| **Cloud** | `#E8ECF2` | Light backgrounds, dividers |
| **Snow** | `#F7F8FA` | Light mode background |
| **Pure White** | `#FFFFFF` | Text on dark, cards on light |
| **Success Green** | `#00D68F` | Payout confirmations, positive metrics |
| **Hot Pink** | `#FF3B8B` | Limited use — special promotions, Valentine's, creator spotlights |

### Color Rules

**Do:**
- Use OpenFans Blue as the dominant brand identifier in all materials
- Pair Blue with Midnight/Charcoal for a premium crypto-native feel
- Use Signal Orange sparingly — it's the "money color" (earnings, payouts, revenue stats)
- Use gradients from `#00AFF0` to `#009AD6` for hero sections and key UI
- Maintain minimum 4.5:1 contrast ratio for all text

**Don't:**
- Use Orange as a background color — it's an accent only
- Combine Hot Pink and Orange in the same composition (visual clash)
- Use Blue on Blue without sufficient contrast
- Apply brand colors at low opacity where they become muddy
- Use red for errors — use a desaturated warm red `#E5534B` to avoid clashing with Hot Pink

### Dark Mode (Default)

OpenFans is a dark-mode-first brand. The primary presentation is light text on Midnight/Charcoal backgrounds with Blue and Orange accents. This aligns with:
- Crypto/Web3 aesthetic conventions
- Creator preference (most creators browse at night)
- Premium, high-end visual positioning

### Gradient Definitions

```css
/* Primary brand gradient */
--gradient-brand: linear-gradient(135deg, #00AFF0 0%, #009AD6 100%);

/* Earnings/money gradient */
--gradient-earnings: linear-gradient(135deg, #F5A623 0%, #FF8A00 100%);

/* Hero/premium gradient */
--gradient-hero: linear-gradient(180deg, #0A0E1A 0%, #1A1F2E 60%, #0A0E1A 100%);

/* Accent glow (for cards, hover states) */
--glow-blue: 0 0 20px rgba(0, 175, 240, 0.3);
--glow-orange: 0 0 20px rgba(245, 166, 35, 0.3);
```

---

## 3. Typography

### Font Stack

| Role | Font | Weight(s) | Usage |
|------|------|-----------|-------|
| **Display / Headlines** | Plus Jakarta Sans | 700 (Bold), 800 (ExtraBold) | Hero text, section headers, marketing headlines |
| **Body / UI** | Inter | 400 (Regular), 500 (Medium), 600 (SemiBold) | Paragraphs, UI labels, buttons, navigation |
| **Monospace / Data** | JetBrains Mono | 400, 500 | Wallet addresses, transaction IDs, code, payout amounts |

### Type Scale

```
Display XL:  48px / 56px line-height / Plus Jakarta Sans ExtraBold
Display:     36px / 44px line-height / Plus Jakarta Sans Bold
H1:          30px / 38px line-height / Plus Jakarta Sans Bold
H2:          24px / 32px line-height / Plus Jakarta Sans Bold
H3:          20px / 28px line-height / Inter SemiBold
Body Large:  18px / 28px line-height / Inter Regular
Body:        16px / 24px line-height / Inter Regular
Body Small:  14px / 20px line-height / Inter Regular
Caption:     12px / 16px line-height / Inter Medium
Mono:        14px / 20px line-height / JetBrains Mono Regular
```

### Typography Rules

**Do:**
- Use Plus Jakarta Sans for anything that needs to feel bold, confident, and headline-worthy
- Use Inter for everything that needs to be readable and functional
- Display payout amounts in JetBrains Mono with Signal Orange — money should look like money
- Use sentence case for headlines (not Title Case, not ALL CAPS in body copy)
- ALL CAPS is acceptable for short labels, buttons, and badges only (max 3 words)

**Don't:**
- Mix more than 2 fonts in a single composition (mono exception for data)
- Use light/thin weights — OpenFans is bold and confident, not delicate
- Set body text below 14px
- Use justified alignment — left-align everything

---

## 4. Brand Voice & Tone

### Voice Characteristics

OpenFans speaks like a **smart, successful creator who also understands crypto and business** — not like a tech company, not like a bank, and absolutely not like a corporate press release.

| Trait | What It Sounds Like | What It Doesn't Sound Like |
|-------|---------------------|---------------------------|
| **Confident** | "You keep 95%. Period." | "We strive to offer competitive creator compensation..." |
| **Direct** | "OnlyFans takes 20%. We take 5%." | "Our fee structure is designed to maximize creator value..." |
| **Empowering** | "Your content. Your rules. Your money." | "We empower content creators to leverage their brand..." |
| **Warm** | "Welcome to the team, babe." | "Thank you for registering on our platform." |
| **Provocative** | "Why are you still letting someone else keep your money?" | "Consider the financial benefits of switching platforms." |
| **Playful** | "Get paid faster than you can say 'blockchain.'" | "Leveraging Solana's high-throughput architecture..." |

### Tone Spectrum

The tone shifts depending on context, but the voice stays consistent:

**Hype / Marketing / Social Media**
- Boldest, most provocative, most fun
- Short punchy sentences. Questions that hit. Emojis welcome.
- "95% payouts. Instant. On-chain. You're welcome."

**Onboarding / Product UI**
- Warm, clear, helpful
- Guides without condescending. Assumes intelligence but not crypto expertise.
- "Connect your wallet to start receiving instant USDC payouts."

**Support / Help**
- Patient, human, solution-oriented
- Never robotic. Never blame the user.
- "Let's get this sorted. Can you share your wallet address?"

**Legal / Compliance**
- Clear and plain-language
- Still sounds like OpenFans, just more measured
- "Creators must be 18+ and comply with local laws regarding their content."

### Voice Do's and Don'ts

**DO say:**
- "Your money, instantly" (not "rapid disbursement of creator funds")
- "Switch in 5 minutes" (not "onboarding process typically takes...")
- "We built this for you" (not "the platform was designed with creators in mind")
- "Earn off your hot friends" (not "our referral program offers commission-based incentives")
- "No banks. No delays. No BS." (not "we've eliminated traditional banking intermediaries")
- "let's go" / "obsessed" / "ate that" / "main character energy" (when appropriate for social)

**DON'T say:**
- "Leverage" / "Synergy" / "Ecosystem" / "Web3" (unless absolutely necessary)
- "Content monetization solution" — we're a platform, not a "solution"
- "Decentralized" in marketing copy to creators — say "censorship-resistant" or "no middlemen" instead
- "Blockchain" in headlines — save it for explainers
- "Dear valued creator" — we don't talk like a bank
- Anything that sounds like it was written by a committee

### Swear Policy

- Light profanity is on-brand in social/marketing: "No BS" / "F*** 20% fees"
- Never in product UI, legal text, support, or investor materials
- Never punch down. Profanity is for emphasis and attitude, not aggression.

### Emoji Usage

Emojis are part of the brand voice on social media and creator-facing communications:

| Emoji | Usage |
|-------|-------|
| `money bag / dollar` | Payouts, earnings, revenue |
| `lightning bolt` | Speed, Solana, instant |
| `blue heart` | Community, support, brand love |
| `fire` | Hype, launches, milestones |
| `crown` | Founder creators, top earners |
| `link` | Link in bio, referrals |
| `sparkles` | New features, announcements |

Avoid: Generic smiley faces, corporate thumbs-up, prayer hands (overused), 100 emoji.

---

## 5. Visual Style Direction (Social Media)

### Aesthetic Summary

**Glamorous crypto.** Think: high-end fashion campaign meets fintech dashboard meets late-night Instagram scroll. The visual language should feel premium but accessible — never cold or corporate.

### Photography / Imagery Direction

- **Creator-centric**: Real creators (diverse, international, confident) — not stock photos
- **Lifestyle over product**: Show the life that 95% payouts enable, not just the app
- **Lighting**: Warm tones, golden hour, neon accents, studio-quality
- **Diverse representation**: The audience is global — Eastern European, Latin American, Asian, Western, Black creators all represented equally
- **Aspirational but real**: Penthouse views AND bedroom ring-light setups. Both are valid.

### Graphic Design Direction

- **Dark backgrounds** as default canvas (Midnight `#0A0E1A`)
- **Blue glow effects** for emphasis and premium feel
- **Orange accents** for CTAs and monetary figures
- **Clean, generous whitespace** — don't overcrowd
- **Subtle grid patterns or mesh gradients** for tech feel without being "crypto bro"
- **Glassmorphism** for cards and overlays (frosted glass, subtle blur)
- **No stock illustrations.** No generic "blockchain" graphics. No clip art.

### Instagram Grid Strategy

Maintain a cohesive grid that alternates between:

1. **Bold text posts** — Single statement on dark background with brand gradient text
2. **Creator spotlights** — Photography/portraits with branded overlay
3. **Data cards** — Stats, payout comparisons, earnings displays
4. **Carousel education** — "How it works" / "Why switch" slide decks
5. **Memes / culture** — Internet-native humor relevant to creator economy
6. **Founder program promos** — Urgency-driven, crown-themed

Ratio aim: 40% educational/value, 30% social proof/creator stories, 20% promotional, 10% culture/memes.

### Instagram Stories / Reels Direction

- **Stories**: Behind-the-scenes, quick tips, polls ("Would you switch for 95%?"), countdowns
- **Reels**: Trending audio + creator economy messaging, comparison hooks, "day in the life" of an OpenFans creator, payout reaction videos
- **Consistent branded elements**: Always include logo watermark, use brand colors in text overlays
- **Captions**: Hook in first 3 words. Keep under 2200 chars. Include CTA and hashtags.

---

## 6. Key Messaging Pillars

These are the five core themes that all OpenFans communications should ladder up to:

### Pillar 1: "Keep What You Earn"
The economic argument. 95% payouts vs. industry standard 80%. Instant USDC settlement. No bank holds.

**Key proof points:**
- 95% standard payout (5% fee) / 90% adult content (10% fee)
- Instant USDC on Solana — no 7-day holds, no minimum thresholds
- No "processing fees" or hidden deductions
- Creator keeps ownership of all content and subscriber relationships

### Pillar 2: "Your Content, Your Rules"
The freedom argument. Censorship resistance. No arbitrary deplatforming. No content policing beyond legal compliance.

**Key proof points:**
- Decentralized infrastructure — no single point of failure or censorship
- Clear, consistent content policy (legal content = allowed content)
- No surprise TOS changes that nuke your business overnight
- Creator controls their own subscription tiers, pricing, and access

### Pillar 3: "Built for Creators, Not VCs"
The trust argument. Platform design decisions prioritize creator needs over investor returns.

**Key proof points:**
- 5% fee is sustainable, not a loss-leader that'll increase later
- No venture-backed pressure to squeeze creators for growth metrics
- Creator advisory board influences product roadmap
- Open, transparent fee structure with no planned increases

### Pillar 4: "The Future is On-Chain"
The innovation argument. Crypto-native infrastructure enables things traditional platforms can't.

**Key proof points:**
- Instant settlement (not "fast" — instant)
- Global by default — any creator, any country, no banking restrictions
- Transparent, verifiable transactions on Solana
- No currency conversion fees — USDC is USDC worldwide

### Pillar 5: "Grow Together"
The community argument. Affiliate program, Founder benefits, collective success.

**Key proof points:**
- 1% lifetime commission on referred creator revenue
- Founder tier with exclusive benefits for early adopters
- Community-driven feature development
- Creator-to-creator support network

---

## 7. Taglines & Slogans

### Primary Tagline

> **"Your content. Your money. Finally."**

### Campaign Slogans

| Slogan | Context |
|--------|---------|
| **"95% is yours."** | Core value prop — works everywhere |
| **"Get paid like you deserve."** | Empowerment angle for switching campaigns |
| **"No banks. No delays. No BS."** | Crypto-native speed messaging |
| **"The platform that actually pays you."** | Competitive comparison |
| **"Switch once. Earn forever."** | Retention and switching messaging |
| **"Why are you still giving away 20%?"** | Provocative — social media and ads |
| **"Earn off your hot friends."** | Affiliate program — playful and memorable |
| **"Creators don't need permission."** | Censorship resistance / freedom angle |
| **"Built different. Pays different."** | Gen-Z native phrasing |
| **"The bag is yours. All of it."** | Casual, money-focused, social media native |

### Tagline Usage Rules

- Primary tagline appears on website hero, email signatures, pitch decks
- Campaign slogans rotate based on content theme and platform
- Never use more than one slogan in a single piece of content
- All slogans must be legally defensible — avoid absolute claims without qualification

---

## 8. Hashtag Strategy

### Branded Hashtags

| Hashtag | Usage |
|---------|-------|
| `#OpenFans` | Primary brand tag — every post |
| `#OpenFansCreator` | Creator spotlights and testimonials |
| `#OpenFansFounder` | Founder program content |
| `#95IsYours` | Core value prop campaign tag |
| `#YourContentYourMoney` | Brand mission tag |
| `#SwitchToOpenFans` | Migration/switching campaign |
| `#EarnOffYourFriends` | Affiliate program |

### Community / Engagement Hashtags

| Hashtag | Usage |
|---------|-------|
| `#CreatorEconomy` | Industry conversation |
| `#ContentCreator` | Broad creator reach |
| `#PayCreators` | Advocacy and industry stance |
| `#CryptoCreators` | Crypto-native creator audience |
| `#GetPaid` | Earnings and payout content |
| `#MainCharacterEnergy` | Lifestyle and empowerment posts |
| `#BossUp` | Entrepreneurial creator content |

### Hashtag Rules

- **Instagram posts**: 8-15 hashtags. Branded (2-3) + community (5-8) + niche (3-5)
- **Stories/Reels**: 3-5 hashtags max, use sticker or small text
- **Twitter/X**: 1-3 hashtags max, integrated naturally into copy
- First comment strategy on Instagram for cleaner captions
- Track hashtag performance monthly, rotate underperformers
- Never use banned or shadowbanned hashtags — audit quarterly

---

## 9. Content Themes for Instagram

### Weekly Content Calendar Framework

| Day | Theme | Content Type | Pillar |
|-----|-------|-------------|--------|
| **Monday** | Money Monday | Payout stats, earnings comparisons, financial tips | Keep What You Earn |
| **Tuesday** | Creator Spotlight | Feature a creator, their story, their success | Grow Together |
| **Wednesday** | How It Works | Educational carousel, platform walkthrough, FAQ | Built for Creators |
| **Thursday** | Why Switch | Competitor comparison, switching testimonials | Keep What You Earn |
| **Friday** | Culture / Meme | Trending meme format with OpenFans messaging | Your Content Your Rules |
| **Saturday** | Founder Focus | Founder program benefits, countdown, exclusivity | Grow Together |
| **Sunday** | Vision / Values | Brand storytelling, mission content, community | The Future is On-Chain |

### Content Series Ideas

**"The Math Ain't Mathing"**
Side-by-side comparisons of earnings on OnlyFans vs. OpenFans. Same subscriber count, same price, dramatically different take-home. Carousel format.

**"Founder Files"**
Profiles of Founder-tier creators. Who they are, why they switched, what they're building. Humanizes the platform and creates social proof.

**"Payout Drop"**
Weekly or monthly graphic showing total creator payouts. Builds credibility and FOMO. Use the earnings gradient and JetBrains Mono for dollar figures.

**"Creator Math"**
Quick mental math: "If you have 500 subscribers at $10/month, that's $47,500/year on OpenFans vs. $40,000 on OnlyFans. You're leaving $7,500 on the table."

**"No Permission Needed"**
Stories of creators who were deplatformed, demonetized, or restricted on other platforms. OpenFans as the alternative where that doesn't happen.

**"60 Seconds to Switch"**
Quick tutorial Reels showing how fast onboarding is. Remove friction, reduce fear.

**"Earn Off Your Friends"**
Affiliate program content. Playful, friend-group oriented. "Tag a creator who needs to hear this."

---

## 10. Founder Program Messaging Framework

### Founder Positioning

The Founder program is positioned as **exclusive, time-limited, and high-status**. It's not a discount — it's early access to something big, with permanent benefits for those who believed first.

### Key Messages

| Message | Context |
|---------|---------|
| "The first 90 days decide everything." | Urgency — limited window |
| "Founders get remembered. Everyone else gets the waitlist." | Exclusivity and status |
| "Tier 1 creators switching from OnlyFans get Founder benefits." | Clear qualification criteria |
| "This isn't early access. This is ownership." | Elevated positioning |
| "The crown isn't given. It's earned in the first 90 days." | Achievement framing |

### Founder Tier Visual Treatment

- Crown icon/emoji as consistent visual marker
- Gold/amber accent color `#F5A623` for Founder-specific content
- "FOUNDER" badge in ALL CAPS, Plus Jakarta Sans ExtraBold
- Darker, more premium visual treatment than standard content
- Subtle particle or glow effects to convey exclusivity

### Founder Program Content Sequence

**Week 1-2: Awareness**
"OpenFans is live. Founder spots are open. 90 days. That's it."

**Week 3-4: Education**
"Here's what Founders get that nobody else will." (Benefits breakdown)

**Week 5-6: Social Proof**
"[Creator Name] just locked in their Founder spot. Have you?"

**Week 7-8: Urgency**
"60 days left. The window is closing."

**Week 9-10: Scarcity**
"Over [X] Founders onboarded. Spots are filling."

**Week 11-12: Final Push**
"Last call. Founder window closes [date]. No exceptions."

### Founder Outreach DM Template (for creator recruitment)

> hey [name]! we've been watching your content and you're exactly the type of creator OpenFans was built for.
>
> quick version: 95% payouts, instant USDC on Solana, and we're onboarding Tier 1 creators as Founders right now (next 90 days only).
>
> Founders get permanent benefits that won't be available after launch. you'd also earn 1% on any creator you refer — forever.
>
> no pressure, but wanted you to hear about it from us before the window closes. link is in our bio if you want to check it out.
>
> [blue heart emoji]

**Tone notes for DMs:**
- Lowercase opener ("hey" not "Hey" or "Hi")
- Casual but respectful — never thirsty or desperate
- Lead with what THEY get, not what WE are
- Keep it under 100 words
- One clear CTA
- No attachments or links in first message (looks spammy)

---

## 11. Affiliate Program Messaging

### Positioning

The affiliate program is positioned as the **most fun way to make passive income** — not as a corporate referral scheme. The angle is creator-to-creator: your network is your net worth.

### Primary Tagline

> **"Earn off your hot friends."**

### Supporting Messages

| Message | Tone |
|---------|------|
| "Your friend makes money. You make money. Everyone's happy." | Straightforward |
| "1% of everything. Forever. Just for making an intro." | Value-focused |
| "Your group chat is a revenue stream." | Playful |
| "The best affiliate program is the one where your friends win too." | Community |
| "Link up. Cash out." | Punchy, social-native |
| "You probably know 10 creators who need this. That's 10 income streams." | Math-based urgency |

### Affiliate Visual Treatment

- Chain link or handshake iconography (stylized, not corporate)
- Split-screen or duo compositions showing two creators
- Earnings ticker/counter aesthetic for commission displays
- Use both Blue and Orange together — Blue for the platform, Orange for the earnings

### Affiliate Content Ideas

**"Tag a Creator"**
Simple engagement post: "Tag a creator who deserves 95% payouts." Drives awareness and uses social pressure positively.

**"The Referral Receipt"**
Mockup of a referral earnings notification. "You just earned $47.50 because @[friend] had a good month." Makes the passive income tangible.

**"Your Network = Your Net Worth"**
Carousel explaining how 1% adds up across multiple referrals over time. Include realistic projections.

**"Better Than a Link Tree"**
Position the OpenFans referral link as the most valuable link in anyone's bio.

---

## 12. Competitor Positioning

### How We Talk About Competitors

**General rule:** Name them when the comparison serves the creator. Don't trash-talk — let the numbers do the talking.

| Competitor | Our Angle |
|-----------|-----------|
| **OnlyFans** | "They take 20%. We take 5%. That's the whole pitch." |
| **Fansly** | "Similar concept, but we're on-chain with instant payouts. No waiting." |
| **Patreon** | "Great for podcasters. We're built for creators who want to get paid faster." |
| **Traditional banks** | "Banks decide what's 'appropriate.' We don't." |

**Never:**
- Use derogatory language about competitor platforms
- Imply competitor creators are making a mistake (they're potential switchers)
- Make unverifiable claims about competitor outages, policies, or financials
- Compare features we haven't shipped yet

---

## 13. Legal & Compliance Tone

Even legal copy should sound like OpenFans wrote it.

**Standard legal disclaimer (marketing):**
> OpenFans charges a 5% platform fee on standard content and 10% on adult content. Payouts are in USDC on the Solana blockchain. Creators must be 18+ and are responsible for compliance with local laws. Past earnings on other platforms do not guarantee results on OpenFans.

**Age verification (UI):**
> You must be 18 or older to create or subscribe on OpenFans. This isn't negotiable.

**Content policy (summary):**
> If it's legal, it's allowed. If it's not, it's not. We don't do gray areas and we don't make moral judgments. Check our full content policy for specifics.

---

## 14. Brand Asset Specifications

### Logo Usage

- **Primary**: Full wordmark "OpenFans" in Plus Jakarta Sans Bold
- **Mark**: Stylized "OF" monogram for profile pictures, favicons, watermarks
- **Clear space**: Minimum padding equal to the height of the "O" in OpenFans on all sides
- **Minimum size**: 120px wide (digital), 1 inch (print)
- **Background rules**: Primary logo on Midnight background. Reversed (white) logo on photography. Never on busy backgrounds without a scrim.

### Logo Don'ts

- Don't rotate, stretch, or distort
- Don't change the colors outside of approved variations
- Don't add drop shadows, outlines, or effects
- Don't place on low-contrast backgrounds
- Don't recreate or approximate — always use the source file

### File Formats to Maintain

| Format | Usage |
|--------|-------|
| SVG | Web, UI, scalable applications |
| PNG (transparent) | Social media, overlays, presentations |
| PNG (on dark background) | Social media profile pictures |
| PDF | Print, formal documents |
| Favicon (ICO/PNG) | Browser tabs, bookmarks |

---

## 15. CSS Design Tokens

```css
:root {
  /* Primary Brand Colors */
  --of-blue: #00AFF0;
  --of-blue-dark: #009AD6;
  --of-orange: #F5A623;

  /* Neutral Palette */
  --of-midnight: #0A0E1A;
  --of-charcoal: #1A1F2E;
  --of-slate: #2D3348;
  --of-silver: #8892A8;
  --of-cloud: #E8ECF2;
  --of-snow: #F7F8FA;
  --of-white: #FFFFFF;

  /* Semantic Colors */
  --of-success: #00D68F;
  --of-error: #E5534B;
  --of-warning: #F5A623;
  --of-info: #00AFF0;
  --of-pink: #FF3B8B;

  /* Gradients */
  --of-gradient-brand: linear-gradient(135deg, #00AFF0 0%, #009AD6 100%);
  --of-gradient-earnings: linear-gradient(135deg, #F5A623 0%, #FF8A00 100%);
  --of-gradient-hero: linear-gradient(180deg, #0A0E1A 0%, #1A1F2E 60%, #0A0E1A 100%);

  /* Typography */
  --of-font-display: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  --of-font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --of-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --of-space-xs: 0.25rem;   /* 4px */
  --of-space-sm: 0.5rem;    /* 8px */
  --of-space-md: 1rem;      /* 16px */
  --of-space-lg: 1.5rem;    /* 24px */
  --of-space-xl: 2rem;      /* 32px */
  --of-space-2xl: 3rem;     /* 48px */
  --of-space-3xl: 4rem;     /* 64px */

  /* Border Radius */
  --of-radius-sm: 6px;
  --of-radius-md: 12px;
  --of-radius-lg: 16px;
  --of-radius-xl: 24px;
  --of-radius-full: 9999px;

  /* Shadows & Glows */
  --of-glow-blue: 0 0 20px rgba(0, 175, 240, 0.3);
  --of-glow-orange: 0 0 20px rgba(245, 166, 35, 0.3);
  --of-shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3);
}
```

---

## 16. Brand Protection & Monitoring

### Trademark Strategy

- Register "OpenFans" wordmark in relevant classes (technology platforms, entertainment services)
- Register the OF monogram as a design mark
- Monitor for confusingly similar marks in the creator platform space
- Secure domain variations: openfans.online (primary), openfans.com, openfans.io, openfans.app

### Social Media Protection

- Secure @openfans and @openfansonline handles across all major platforms
- Monitor for impersonation accounts — especially during Founder launch phase
- Establish verified/official account badges where available
- Report and document any unauthorized use of brand assets

### Brand Compliance Checklist

For any branded content (internal or creator-generated):

- [ ] Correct logo usage (right version, clear space, minimum size)
- [ ] On-brand color palette (no off-brand colors introduced)
- [ ] Correct fonts (Plus Jakarta Sans for headlines, Inter for body)
- [ ] Voice and tone consistent with guidelines
- [ ] No unapproved claims about payouts, features, or competitor comparison
- [ ] Legal disclaimers included where required
- [ ] Accessible contrast ratios met (4.5:1 minimum)

---

## 17. Quick Reference Card

**For when you're writing a caption at 2am and just need the basics:**

| Element | Answer |
|---------|--------|
| **We are** | The highest-paying creator subscription platform |
| **We're not** | A blockchain company. A fintech startup. A "solution." |
| **Our voice** | Confident, direct, warm, a little provocative |
| **Our colors** | Blue `#00AFF0` + Dark background + Orange accents |
| **Our fonts** | Plus Jakarta Sans (headlines) + Inter (body) |
| **Our tagline** | "Your content. Your money. Finally." |
| **Our flex** | 95% payouts. Instant. On-chain. |
| **Our CTA** | "Switch to OpenFans" or "Claim your Founder spot" |
| **Our hashtags** | #OpenFans #95IsYours #YourContentYourMoney |
| **Our vibe** | Glamorous crypto. Premium but accessible. Boss energy. |

---

*This document is the single source of truth for OpenFans brand expression. Every piece of content, every social post, every DM, every UI string should feel like it came from the same confident, creator-first voice. When in doubt, ask: "Would a creator we're trying to recruit think this sounds real, or would they think it sounds corporate?" If it sounds corporate, rewrite it.*
