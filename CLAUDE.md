# CLAUDE.md — Nuel Edeh Portfolio & Blog

Context for any fresh session working on this repo. Read this first, then get to work.

## What this is

A one-page portfolio + growing blog for **Nuel Edeh** — Product Manager, AI builder,
and writer in Toronto. Design direction: **"The Monograph, evolved"** — warm,
editorial, with technical instrumentation. Deployed on **Cloudflare Workers** with
static assets. The entire site renders from a single data file.

**Live:** https://nuel-portfolio.nueledeh.workers.dev

## Architecture (know this before editing)

```
public/index.html   ← the whole site: HTML + CSS + vanilla JS. Fetches content.json and renders.
public/content.json ← ✏️ ALL content lives here. Edit this to change anything.
src/index.ts        ← Cloudflare Worker: serves assets; has an unused /contact Resend endpoint.
wrangler.json       ← Cloudflare config (prod + preview envs).
.github/workflows/deploy.yml ← CI: push to main = prod deploy; PR = preview deploy.
docs/writing-topics.md ← the essay backlog.
.claude/skills/publish-essay/ ← the voice-note → published-essay workflow.
```

- No build step, no framework, no npm install. It's intentionally simple.
- `src/content.ts` and `src/posts/` were removed — the site is 100% `content.json`-driven. Don't reintroduce them.

## Design system

- **Palette:** paper `#f2efe6` · ink `#1a1a18` · **terracotta `#b5502e`** (anything important/interactive) · **teal `#3a7d5c`** (live/status ONLY — the clock + availability dots) · panel `#ece8dd` · on-dark accent `#d98a5f`.
  - Rule: if it's terracotta it's important or clickable; if it's teal it's live status. Never mix those meanings.
- **Type:** Newsreader (serif display) · Space Grotesk (body) · IBM Plex Mono (labels/data).
- **Sections:** hero (typewriter + availability) → "Impact — measured" living numbers (count-up + a live-ticking DNS figure) → About → Selected Work → **dark Writing chapter** → Contact. One dark section, on the writing, on purpose.
- Motion respects `prefers-reduced-motion`. Responsive to mobile.

## content.json schema (the parts you'll touch most)

Full reference is in `README.md`. The blog piece:

```json
"posts": [
  {
    "slug": "kebab-case-unique",
    "title": "Title Case",
    "date": "2026-07-10",          // ISO; sorts newest-first
    "dateLabel": "2026.07.10",     // optional display override ("2020" for revisited)
    "label": "Systems",            // category shown on the card
    "featured": true,              // OPTIONAL — exactly one post should have this (the lead card)
    "tags": ["A", "B"],
    "excerpt": "One card line.",
    "body": "Markdown — see reader conventions below.",
    "url": "https://…",            // OPTIONAL — external post; card links out in a new tab
    "revisited": true,             // OPTIONAL — shows "Revisited ↗"
    "reflection": "Looking back — …" // OPTIONAL — the italic house device on republished pieces
  }
]
```

- Only **one** post should have `"featured": true`. When featuring a new one, remove it from the old one.
- Newest post goes at the **top** of the array (order is cosmetic; JS sorts by `date`).

## Reader markdown (in-site reading view)

`body` supports lightweight markdown, rendered by `renderPostBody()` in index.html:
- `## Heading` → section label (terracotta mono)
- `> line` → pull-quote (use once, for the single best line)
- `**bold**`, `*italic*`
- `==highlight==` → skimmable takeaway. **Use sparingly — ~one per section.** These exist to lower cognitive load for fast readers, not to decorate.
- Blank line between blocks = new paragraph. Plain-text bodies pass through unchanged.

## Publish workflow (how every essay ships)

The designated working branch is `claude/portfolio-improvements-blogs-peumzu`. PRs are
merged to `main`, which auto-deploys to production. Because prior PRs are already merged,
**always re-sync before new work:**

```
git fetch origin main
git checkout -B claude/portfolio-improvements-blogs-peumzu origin/main
# edit public/content.json
python3 -c "import json;json.load(open('public/content.json'));print('ok')"   # validate
# (optional) render-check in a browser via Playwright at /opt/pw-browsers/chromium
git add -A && git commit && git push -u origin <branch> --force-with-lease
# open PR → main, squash-merge, then confirm the Deploy action succeeded
```

Deploy confirmation: the `Deploy to production` step in `.github/workflows/deploy.yml`
must conclude `success`. Live URL is printed by wrangler:
`https://nuel-portfolio.nueledeh.workers.dev`.

Note: this sandbox's proxy blocks `workers.dev`, so you can't curl/screenshot the live
URL from here — rely on the CI log + a local Playwright render against `public/`.

## Nuel's voice (match this when shaping drafts)

He writes first drafts as voice notes; the job is to shape them, not replace them.
- **First person, warm, direct, a little discursive** — but tightened. Voice-note drafts spiral and repeat; cut the repetition, keep the phrasings.
- **Systems × human behaviour is his signature seam.** Infrastructure/thermodynamics/process on one side; Alchemy (Rory Sutherland), behavioural design, somatic intuition ("the heat"), the psychology of decisions on the other. The best pieces fuse both.
- **Grounded big swings.** He'll make a philosophical claim, but anchor it in concrete experience (Cloudflare DNS at 60–80B events, Neat, chemical engineering, his cat Oona, a Queen Street rooftop). Keep the swing; keep it grounded.
- **Hindsight-coherence framing** ("looking back, a coherent story forms") and structured sections (Principle/Elaboration/Example, or thematic headings).
- **Bias toward shipping.** Pragmatic, introspective, confident to express regardless of audience.
- **Editing rules:** cut defensive/comparative asides (e.g. ranking disciplines); hold science/claims lightly (analogy, not overclaim); one pull-quote for the single best line; highlights sparingly; anti-corporate, no jargon.

## Published so far (Writing shelf)

1. **What a Chemical Engineer Knows About Product** (featured) — chem-eng → product; ends on "intelligence is rentable now; the heat is not."
2. **Held With Confidence, Never Rigidity** — roadmaps as sequenced hypotheses.
3. Building AI agents at Cloudflare · What Rory Sutherland taught me… · DNS security for PMs · Valentine's Day / Oona.
4. Three republished **Neat**-era essays (link out, with "Looking back —" reflections).

## Open threads

- Unused Resend `/contact` endpoint in `src/index.ts` — strip or wire a real form later.
- Next candidate essays: see `docs/writing-topics.md`. Strong next picks: the Oona/control piece and "Show up. Receive."
