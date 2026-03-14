#!/usr/bin/env node

/**
 * OpenFans Creator Lead Scraper
 * Finds mid-tier OnlyFans creators ($1K-$10K/mo) who might switch platforms.
 * Uses Brave Search API to discover creators promoting OF links,
 * complaining about fees, or seeking alternatives.
 *
 * Usage:
 *   node scripts/scrape-creator-leads.mjs
 *   DRY_RUN=1 node scripts/scrape-creator-leads.mjs
 *   MAX_LEADS=100 node scripts/scrape-creator-leads.mjs
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'content', 'creator-leads.json');

// ── Config ──────────────────────────────────────────────────────────────────
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
if (!BRAVE_API_KEY) {
  console.error('Error: BRAVE_SEARCH_API_KEY environment variable is required');
  process.exit(1);
}
const DRY_RUN = process.env.DRY_RUN === '1';
const MAX_LEADS = Number(process.env.MAX_LEADS) || 200;
const DELAY_MS = 1200; // respect Brave rate limits

// ── Search Queries ──────────────────────────────────────────────────────────
// Grouped by intent: discovery, pain-point, platform-seeking
const SEARCH_QUERIES = [
  // Creators actively seeking alternatives
  { query: 'onlyfans creator looking for alternative', intent: 'seeking_alternative' },
  { query: 'switching from onlyfans to another platform', intent: 'seeking_alternative' },
  { query: 'best onlyfans alternative for creators 2025', intent: 'seeking_alternative' },
  { query: 'onlyfans alternative higher payout', intent: 'seeking_alternative' },
  { query: '"leaving onlyfans" creator', intent: 'seeking_alternative' },

  // Pain points: fees
  { query: 'onlyfans 20% fee unfair', intent: 'fee_complaint' },
  { query: 'onlyfans takes too much money', intent: 'fee_complaint' },
  { query: 'onlyfans commission too high creator', intent: 'fee_complaint' },
  { query: '"onlyfans fees" frustrated creator', intent: 'fee_complaint' },

  // Pain points: payouts
  { query: 'onlyfans payout too slow', intent: 'payout_complaint' },
  { query: 'onlyfans payout issues 2025', intent: 'payout_complaint' },
  { query: 'onlyfans payment delay creator', intent: 'payout_complaint' },
  { query: 'onlyfans payout problems', intent: 'payout_complaint' },

  // Pain points: policies
  { query: 'onlyfans banned my content unfairly', intent: 'policy_complaint' },
  { query: 'onlyfans policy changes hurting creators', intent: 'policy_complaint' },
  { query: 'onlyfans demonetized creator', intent: 'policy_complaint' },

  // Twitter/X specific — creators promoting OF links
  { query: 'site:twitter.com "onlyfans" "link in bio" creator', intent: 'twitter_discovery' },
  { query: 'site:x.com "onlyfans.com" "subscribe" creator', intent: 'twitter_discovery' },
  { query: 'site:twitter.com "onlyfans creator" "DM me"', intent: 'twitter_discovery' },
  { query: 'site:twitter.com "new on onlyfans" "follow"', intent: 'twitter_discovery' },

  // Reddit specific — community discussions
  { query: 'site:reddit.com "onlyfans fees" OR "onlyfans alternative"', intent: 'reddit_discussion' },
  { query: 'site:reddit.com r/onlyfansadvice "switching platforms"', intent: 'reddit_discussion' },
  { query: 'site:reddit.com r/creatorsadvice "better platform"', intent: 'reddit_discussion' },
  { query: 'site:reddit.com "onlyfans" "not worth it" creator', intent: 'reddit_discussion' },
  { query: 'site:reddit.com "onlyfans payout" "too long"', intent: 'reddit_discussion' },

  // Instagram specific
  { query: 'site:instagram.com "onlyfans" "link in bio" creator', intent: 'instagram_discovery' },

  // Crypto/web3 creators (natural fit for Solana payouts)
  { query: 'content creator crypto payments platform', intent: 'crypto_native' },
  { query: 'onlyfans creator cryptocurrency payout', intent: 'crypto_native' },
  { query: 'creator platform solana USDC payout', intent: 'crypto_native' },

  // Content creator forums and blogs
  { query: 'onlyfans creator tips "how much I make"', intent: 'income_discussion' },
  { query: '"onlyfans income" "$1000" OR "$2000" OR "$5000" creator blog', intent: 'income_discussion' },
  { query: 'mid tier onlyfans creator earnings', intent: 'income_discussion' },
];

// ── Brave Search ────────────────────────────────────────────────────────────
async function braveSearch(query, offset = 0) {
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', '20');
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('result_filter', 'web');

  const res = await fetch(url.toString(), {
    headers: { 'X-Subscription-Token': BRAVE_API_KEY, Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[brave] ${res.status}: ${text.slice(0, 200)}`);
    return [];
  }

  const json = await res.json();
  return json.web?.results || [];
}

// ── Platform Detection ──────────────────────────────────────────────────────
function detectPlatform(url) {
  if (!url) return 'unknown';
  const lower = url.toLowerCase();
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('reddit.com')) return 'reddit';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('youtube.com')) return 'youtube';
  if (lower.includes('onlyfans.com')) return 'onlyfans';
  if (lower.includes('medium.com')) return 'blog';
  if (lower.includes('substack.com')) return 'blog';
  return 'web';
}

// ── Extract Creator Info from Search Result ─────────────────────────────────
function parseResult(result, sourceQuery, intent) {
  const { title, url, description } = result;
  if (!title || !url) return null;

  const platform = detectPlatform(url);
  const lower = (title + ' ' + (description || '')).toLowerCase();

  // Skip aggregator/listicle content — we want individual creators
  const skipPatterns = [
    /^top \d+ (best|onlyfans)/i,
    /^\d+ best (onlyfans|creator)/i,
    /best onlyfans alternatives/i,
    /onlyfans alternative.*list/i,
    /^how to (start|make money|grow)/i,
    /review.*onlyfans/i,
    /onlyfans.*review/i,
    /wikipedia/i,
    /investopedia/i,
    /^what is onlyfans/i,
    /news.*onlyfans/i,
  ];
  if (skipPatterns.some(p => p.test(title))) return null;

  // Skip big news/media sites (not individual creators)
  const skipDomains = [
    'wikipedia.org', 'bbc.com', 'cnn.com', 'nytimes.com', 'forbes.com',
    'businessinsider.com', 'techcrunch.com', 'theverge.com', 'vice.com',
    'buzzfeed.com', 'mashable.com', 'wired.com', 'engadget.com',
    'investopedia.com', 'quora.com',
  ];
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    if (skipDomains.some(d => domain.includes(d))) return null;
  } catch {
    return null;
  }

  // Try to extract a creator name/handle
  let name = null;

  // Twitter/X: extract handle from URL
  const twitterMatch = url.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/);
  if (twitterMatch && !['search', 'hashtag', 'i', 'explore', 'home'].includes(twitterMatch[1].toLowerCase())) {
    name = `@${twitterMatch[1]}`;
  }

  // Reddit: extract username or just use subreddit context
  const redditUserMatch = url.match(/reddit\.com\/u(?:ser)?\/([A-Za-z0-9_-]+)/);
  if (redditUserMatch) {
    name = `u/${redditUserMatch[1]}`;
  }
  const redditSubMatch = url.match(/reddit\.com\/r\/([A-Za-z0-9_-]+)/);

  // Instagram: extract handle
  const igMatch = url.match(/instagram\.com\/([A-Za-z0-9_.]+)/);
  if (igMatch && !['p', 'explore', 'reel', 'stories', 'tv'].includes(igMatch[1].toLowerCase())) {
    name = `@${igMatch[1]}`;
  }

  // TikTok: extract handle
  const ttMatch = url.match(/tiktok\.com\/@([A-Za-z0-9_.]+)/);
  if (ttMatch) {
    name = `@${ttMatch[1]}`;
  }

  // OnlyFans: extract handle
  const ofMatch = url.match(/onlyfans\.com\/([A-Za-z0-9_.-]+)/);
  if (ofMatch && !['action', 'terms', 'privacy', 'about'].includes(ofMatch[1].toLowerCase())) {
    name = ofMatch[1];
  }

  // Fallback: use cleaned title
  if (!name) {
    name = title
      .replace(/\s*[-|–—:].*/g, '')
      .replace(/\s*\(.*\)/, '')
      .replace(/onlyfans/gi, '')
      .trim()
      .slice(0, 60);
    if (name.length < 2) name = title.slice(0, 60);
  }

  // Estimate follower tier from context clues
  let followersEst = 'unknown';
  if (lower.includes('k followers') || lower.includes('k subs')) {
    const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\s*(?:followers|subs)/);
    if (kMatch) {
      const count = parseFloat(kMatch[1]) * 1000;
      if (count < 5000) followersEst = '<5K';
      else if (count < 50000) followersEst = '5K-50K';
      else if (count < 500000) followersEst = '50K-500K';
      else followersEst = '500K+';
    }
  }

  // Look for contact info hints
  let contact = null;
  const emailMatch = (description || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) contact = emailMatch[0];
  else if (lower.includes('dm') || lower.includes('message me') || lower.includes('dms open')) {
    contact = 'DMs open';
  } else if (lower.includes('email') || lower.includes('business inquir')) {
    contact = 'Email in bio (check profile)';
  } else if (lower.includes('link in bio') || lower.includes('linktree')) {
    contact = 'Link in bio';
  }

  // Build notes from signals
  const notes = [];
  if (lower.includes('20%') || lower.includes('fee') || lower.includes('commission')) {
    notes.push('Mentioned fees/commission');
  }
  if (lower.includes('payout') || lower.includes('payment') || lower.includes('withdraw')) {
    notes.push('Mentioned payout issues');
  }
  if (lower.includes('alternative') || lower.includes('switching') || lower.includes('leaving')) {
    notes.push('Looking for alternatives');
  }
  if (lower.includes('crypto') || lower.includes('solana') || lower.includes('usdc') || lower.includes('web3')) {
    notes.push('Crypto/web3 interest');
  }
  if (lower.includes('banned') || lower.includes('suspended') || lower.includes('demonetiz')) {
    notes.push('Had account issues');
  }
  if (redditSubMatch) {
    notes.push(`From r/${redditSubMatch[1]}`);
  }

  return {
    name,
    platform,
    url,
    followers_est: followersEst,
    contact,
    notes: notes.join('; ') || `Found via ${intent} search`,
    source_query: sourceQuery,
  };
}

// ── Dedup ───────────────────────────────────────────────────────────────────
function dedup(leads) {
  const seen = new Set();
  return leads.filter(lead => {
    // Dedup by URL and by name+platform combo
    const urlKey = lead.url.toLowerCase().replace(/\/$/, '');
    const nameKey = `${lead.name}::${lead.platform}`.toLowerCase();

    if (seen.has(urlKey) || seen.has(nameKey)) return false;
    seen.add(urlKey);
    seen.add(nameKey);
    return true;
  });
}

// ── Score Leads ─────────────────────────────────────────────────────────────
// Higher score = more likely to convert
function scoreLead(lead) {
  let score = 0;

  // Platform scoring (where we can reach them)
  if (lead.platform === 'twitter') score += 3;   // easiest to DM
  if (lead.platform === 'reddit') score += 2;    // can comment/DM
  if (lead.platform === 'instagram') score += 2; // can DM
  if (lead.platform === 'onlyfans') score += 1;  // harder to reach

  // Intent scoring
  const notes = (lead.notes || '').toLowerCase();
  if (notes.includes('looking for alternatives')) score += 5;
  if (notes.includes('mentioned fees')) score += 4;
  if (notes.includes('mentioned payout')) score += 4;
  if (notes.includes('had account issues')) score += 3;
  if (notes.includes('crypto')) score += 3;  // natural Solana fit

  // Contact info available
  if (lead.contact === 'DMs open') score += 2;
  if (lead.contact && lead.contact.includes('@') && lead.contact.includes('.')) score += 4; // email
  if (lead.contact === 'Email in bio (check profile)') score += 1;

  // Follower estimate (mid-tier is our sweet spot)
  if (lead.followers_est === '5K-50K') score += 3;
  if (lead.followers_est === '<5K') score += 1;
  if (lead.followers_est === '50K-500K') score += 2;
  if (lead.followers_est === '500K+') score -= 2; // too big, won't switch easily

  return score;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== OpenFans Creator Lead Scraper ===');
  console.log(`Searching for mid-tier OnlyFans creators open to switching`);
  console.log(`Max leads: ${MAX_LEADS} | Dry run: ${DRY_RUN}`);
  console.log(`Search queries: ${SEARCH_QUERIES.length}\n`);

  let allLeads = [];
  let queryCount = 0;

  for (const { query, intent } of SEARCH_QUERIES) {
    if (allLeads.length >= MAX_LEADS * 2) break; // collect extra, dedup later

    queryCount++;
    process.stdout.write(`[${queryCount}/${SEARCH_QUERIES.length}] "${query.slice(0, 60)}..." `);

    try {
      const results = await braveSearch(query);
      const parsed = results
        .map(r => parseResult(r, query, intent))
        .filter(Boolean);

      console.log(`${results.length} results -> ${parsed.length} leads`);
      allLeads.push(...parsed);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  // Dedup
  allLeads = dedup(allLeads);
  console.log(`\nUnique leads after dedup: ${allLeads.length}`);

  // Score and sort
  allLeads = allLeads
    .map(lead => ({ ...lead, score: scoreLead(lead) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_LEADS);

  // Stats
  const byPlatform = {};
  const byIntent = {};
  for (const lead of allLeads) {
    byPlatform[lead.platform] = (byPlatform[lead.platform] || 0) + 1;
    const intent = lead.notes.split(';')[0] || 'general';
    byIntent[intent] = (byIntent[intent] || 0) + 1;
  }

  console.log('\nBy platform:', byPlatform);
  console.log('Score distribution:');
  console.log(`  High (8+):   ${allLeads.filter(l => l.score >= 8).length}`);
  console.log(`  Medium (4-7): ${allLeads.filter(l => l.score >= 4 && l.score < 8).length}`);
  console.log(`  Low (0-3):   ${allLeads.filter(l => l.score < 4).length}`);

  // Load existing leads if any, merge
  let existingLeads = [];
  if (existsSync(OUTPUT_PATH)) {
    try {
      existingLeads = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
      console.log(`\nExisting leads file found: ${existingLeads.length} leads`);
    } catch {
      console.log('\nCould not parse existing leads file, starting fresh');
    }
  }

  // Merge: new leads take precedence (by URL)
  const existingUrls = new Set(existingLeads.map(l => l.url.toLowerCase()));
  const newOnly = allLeads.filter(l => !existingUrls.has(l.url.toLowerCase()));
  const merged = [...allLeads, ...existingLeads.filter(l => !allLeads.some(n => n.url.toLowerCase() === l.url.toLowerCase()))];

  console.log(`New leads to add: ${newOnly.length}`);
  console.log(`Total after merge: ${merged.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would save to:', OUTPUT_PATH);
    console.log('\nTop 10 leads:');
    for (const lead of allLeads.slice(0, 10)) {
      console.log(`  [${lead.score}] ${lead.name} (${lead.platform}) — ${lead.notes}`);
      console.log(`       ${lead.url}`);
      if (lead.contact) console.log(`       Contact: ${lead.contact}`);
    }
    return;
  }

  // Save to file
  const output = merged
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map(({ score, ...rest }) => ({ ...rest, score })); // move score to end

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nSaved ${output.length} leads to ${OUTPUT_PATH}`);

  // Print top leads
  console.log('\nTop 15 highest-scoring leads:');
  console.log('─'.repeat(80));
  for (const lead of output.slice(0, 15)) {
    console.log(`  [Score: ${lead.score}] ${lead.name}`);
    console.log(`    Platform: ${lead.platform} | Followers: ${lead.followers_est}`);
    console.log(`    URL: ${lead.url}`);
    console.log(`    Contact: ${lead.contact || 'N/A'}`);
    console.log(`    Notes: ${lead.notes}`);
    console.log();
  }

  console.log('=== Scraper Complete ===');
}

main().catch(console.error);
