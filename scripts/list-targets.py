import json

leads = json.load(open("content/reddit-creator-leads.json", encoding="utf-8"))

actionable = [
    l for l in leads
    if l["query"] != "hot"
    or "fee" in l["title"].lower()
    or "alternative" in l["title"].lower()
    or "switch" in l["title"].lower()
]

top = actionable[:30]

print("=== TOP 30 OUTREACH TARGETS ===\n")
for i, c in enumerate(top):
    print(f"{i+1}. u/{c['author']}")
    print(f"   Sub: r/{c['subreddit']} | Score: {c['score']} | Comments: {c['comments']}")
    print(f"   Topic: {c['title'][:80]}")
    print(f"   Query: {c['query']}")
    print(f"   Profile: https://reddit.com/u/{c['author']}")
    print()
