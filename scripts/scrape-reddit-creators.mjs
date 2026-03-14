#!/usr/bin/env node
/**
 * Scrape creator subreddits for real usernames discussing OF alternatives/fees.
 * Uses Reddit's public JSON API (no auth needed).
 */

const SUBS = [
  'onlyfansadvice',
  'CreatorsAdvice',
  'adultcreatortips',
  'SellerCircleStage',
];

const SEARCHES = [
  'onlyfans fees',
  'onlyfans alternative',
  'switching platforms',
  'payout delay',
  'better platform',
  'leaving onlyfans',
  'crypto payout',
];

const DELAY = 1200; // ms between requests (Reddit rate limit)

async function fetchReddit(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OpenFansResearch/1.0 (research only)' }
  });
  if (res.status !== 200) {
    console.error(`  HTTP ${res.status} for ${url}`);
    return [];
  }
  const data = await res.json();
  return data?.data?.children || [];
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const creators = [];

  // 1. Search posts in each subreddit
  for (const sub of SUBS) {
    console.error(`\nSearching r/${sub}...`);
    for (const q of SEARCHES) {
      try {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&limit=10&sort=new`;
        const posts = await fetchReddit(url);
        for (const p of posts) {
          const d = p.data;
          if (!d || d.author === '[deleted]' || d.author === 'AutoModerator') continue;
          creators.push({
            author: d.author,
            subreddit: d.subreddit,
            title: (d.title || '').substring(0, 120),
            url: 'https://reddit.com' + d.permalink,
            score: d.score || 0,
            comments: d.num_comments || 0,
            created: new Date((d.created_utc || 0) * 1000).toISOString().split('T')[0],
            type: 'post',
            query: q,
          });
        }
        console.error(`  "${q}" → ${posts.length} posts`);
        await sleep(DELAY);
      } catch (e) {
        console.error(`  Error: ${e.message}`);
      }
    }
  }

  // 2. Also get hot/new posts from these subs (active creators)
  for (const sub of SUBS) {
    console.error(`\nGetting hot posts from r/${sub}...`);
    try {
      const posts = await fetchReddit(`https://www.reddit.com/r/${sub}/hot.json?limit=25`);
      for (const p of posts) {
        const d = p.data;
        if (!d || d.author === '[deleted]' || d.author === 'AutoModerator') continue;
        creators.push({
          author: d.author,
          subreddit: d.subreddit,
          title: (d.title || '').substring(0, 120),
          url: 'https://reddit.com' + d.permalink,
          score: d.score || 0,
          comments: d.num_comments || 0,
          created: new Date((d.created_utc || 0) * 1000).toISOString().split('T')[0],
          type: 'hot',
          query: 'hot',
        });
      }
      console.error(`  Got ${posts.length} hot posts`);
      await sleep(DELAY);
    } catch (e) {
      console.error(`  Error: ${e.message}`);
    }
  }

  // 3. Get comments from key threads about alternatives
  const keyThreads = [
    '/r/onlyfansadvice/comments/new/.json?limit=50',
    '/r/CreatorsAdvice/comments/new/.json?limit=50',
  ];

  for (const thread of keyThreads) {
    console.error(`\nGetting recent comments from ${thread}...`);
    try {
      const comments = await fetchReddit(`https://www.reddit.com${thread}`);
      for (const c of comments) {
        const d = c.data;
        if (!d || d.author === '[deleted]' || d.author === 'AutoModerator') continue;
        const body = (d.body || '').toLowerCase();
        // Only keep comments mentioning fees, alternatives, switching
        if (body.includes('fee') || body.includes('20%') || body.includes('alternative') ||
            body.includes('switch') || body.includes('payout') || body.includes('percent')) {
          creators.push({
            author: d.author,
            subreddit: d.subreddit,
            title: (d.body || '').substring(0, 120),
            url: `https://reddit.com/u/${d.author}`,
            score: d.score || 0,
            comments: 0,
            created: new Date((d.created_utc || 0) * 1000).toISOString().split('T')[0],
            type: 'comment',
            query: 'fee-related-comment',
          });
        }
      }
      await sleep(DELAY);
    } catch (e) {
      console.error(`  Error: ${e.message}`);
    }
  }

  // Deduplicate by author, keep highest engagement entry
  const byAuthor = {};
  for (const c of creators) {
    const key = c.author.toLowerCase();
    if (!byAuthor[key] || (c.score + c.comments) > (byAuthor[key].score + byAuthor[key].comments)) {
      byAuthor[key] = c;
    }
  }

  const unique = Object.values(byAuthor);
  unique.sort((a, b) => (b.score + b.comments) - (a.score + a.comments));

  console.error(`\n=== Found ${unique.length} unique creators ===`);
  console.error(`Top 10 by engagement:`);
  for (const c of unique.slice(0, 10)) {
    console.error(`  u/${c.author} (${c.score} pts, ${c.comments} comments) — r/${c.subreddit}`);
  }

  // Output JSON
  const output = JSON.stringify(unique, null, 2);

  // Save to file
  const fs = await import('fs');
  const path = new URL('../content/reddit-creator-leads.json', import.meta.url);
  fs.writeFileSync(path, output, 'utf-8');
  console.error(`\nSaved ${unique.length} leads to content/reddit-creator-leads.json`);
}

main().catch(e => console.error('Fatal:', e));
