# Nuel Edeh — Portfolio & Blog

"The Monograph, evolved" — a warm, editorial portfolio with technical instrumentation.
Built on Cloudflare Workers with Static Assets. Deploy in minutes, update from any editor.

## Project Structure

```
portfolio/
├── public/
│   ├── index.html       ← The full site (design + logic; rarely need to touch)
│   └── content.json     ← ✏️  EDIT THIS to update everything
├── src/
│   └── index.ts         ← Cloudflare Worker (serves the site; handles /contact)
├── wrangler.json        ← Cloudflare config
└── README.md
```

**Everything you'd ever want to change lives in `public/content.json`.** The page
reads it at load and renders itself — so you never have to touch HTML or CSS to
update copy, add a job, or publish a post.

## Setup & Deploy

```bash
npm install -g wrangler   # 1. Install Wrangler
wrangler login            # 2. Log in to Cloudflare
wrangler deploy           # 3. Ship it
```

Your site goes live at `nuel-portfolio.your-subdomain.workers.dev`. Add a custom
domain from Cloudflare Dashboard → Workers → your worker → Custom Domains.

## Local Development

```bash
wrangler dev
```

Opens at `http://localhost:8787` and live-reloads on file changes.

---

## Editing `content.json`

### Header / meta
```json
"meta": {
  "name": "Nuel Edeh",
  "eyebrow": "Product Manager · AI Builder · Writer",
  "email": "hello@nueledeh.com",
  "linkedin": "https://www.linkedin.com/in/eedeh/",
  "github": "https://github.com/nueledeh",
  "location": "Toronto, Canada",
  "openToWork": true,
  "availability": "Available — Senior / Principal PM · AI Product"
}
```
Set `openToWork` to `false` to hide the availability pill in the hero.

### Hero
```json
"hero": {
  "name": "Nuel",
  "nameAccent": "Edeh",          // the italic terracotta half of the name
  "typewriter": [                 // rotating italic line under the name
    "I build platforms at scale.",
    "I write to figure out what I think."
  ],
  "paragraph": "An engineer's rigor with a writer's eye — …"
}
```

### Impact numbers
Each stat counts up on load and draws a meter bar. Add `"live": true` to make a
value fluctuate like a running system (used for the DNS-events figure).
```json
"stats": [
  { "count": 2.3, "decimals": 1, "unit": "×", "meter": 82,
    "label": "ARR growth", "context": "Cloudflare · in under two years" },
  { "count": 80, "decimals": 0, "unit": "B", "meter": 100, "live": true,
    "label": "Daily DNS events", "context": "Gateway DNS · at peak, and climbing" },
  { "count": 4.6, "decimals": 1, "prefix": "$", "tail": "M", "meter": 64,
    "label": "Enterprise TCV sponsored", "context": "Enterprise · government · Fortune 500" }
]
```
- `unit` / `prefix` render in terracotta; `tail` renders in ink. `meter` is the bar width (0–100).

### About
```json
"aboutLead": "The big serif opening line.",
"about": "The supporting paragraph. The word Alchemy is auto-italicised.",
"skills": ["Platform & Systems Thinking", "AI Agent Design (MCP / LLMs)", "…"]
```

### Experience
```json
"experience": [
  {
    "company": "Cloudflare",
    "role": "Product Manager · DNS Security & Secure Web Gateway",
    "period": "Feb 2024 — Jan 2026",
    "summary": "One-line summary of the role.",
    "highlights": ["Bullet one.", "Bullet two."]
  }
]
```

### Writing

Posts render as a first-class **Writing** shelf: one **featured** lead card plus a
grid built to hold as many as you like. Add newest posts to the top of the `posts`
array. Cards sort newest-first automatically (by `date`).

**A normal (internal) post** — opens in an in-site reading view:
```json
{
  "slug": "my-post-slug",
  "title": "Your Post Title",
  "date": "2026-03-01",           // ISO date, used for sorting
  "dateLabel": "2026.03.01",      // optional display override
  "label": "AI / MCP",            // category shown in the card tag
  "featured": true,               // optional — pins it as the big lead card
  "tags": ["Tag1", "Tag2"],
  "excerpt": "One short line shown on the card.",
  "body": "Full post.\n\nSeparate paragraphs with a blank line (\\n\\n)."
}
```

**A republished / older post** — links out to the original and carries a
"Looking back —" reflection (the house device for revisiting old writing):
```json
{
  "slug": "psychological-safety-innovative-behaviour",
  "title": "Psychological safety and innovative behaviour",
  "date": "2020-01-01",
  "dateLabel": "2020",
  "label": "Neat · Leadership",
  "tags": ["Leadership", "Teams"],
  "url": "https://medium.com/…",   // presence of `url` = opens in a new tab
  "revisited": true,               // shows the "Revisited ↗" marker
  "excerpt": "One short line shown on the card.",
  "reflection": "Looking back — how this connects to how I build now."
}
```

Field notes:
- `featured` — the lead card. If none is set, the newest internal post is used.
- `url` — if present, the card links out (new tab) instead of opening the reader.
- `reflection` — renders the italic "Looking back —" line; pairs with `revisited`.

## Design tokens

Terracotta `#b5502e` marks anything important or interactive. Teal `#3a7d5c` is
used **only** for live/status cues (the availability + clock dots). Paper is warm
cream `#f2efe6`; the Writing section is the one dark chapter `#1a1a18`.
Fonts: Newsreader (serif display), Space Grotesk (body), IBM Plex Mono (labels).

## Deploy after editing

```bash
wrangler deploy
```

Or, if your GitHub repo is connected to Cloudflare, just push — CI deploys for you.
