---
name: publish-essay
description: Turn one of Nuel's raw voice notes, drafts, or topic sparks into a finished blog post on his portfolio (nuel-portfolio.nueledeh.workers.dev) and ship it live. Use whenever Nuel shares writing to "clean up and post", a voice-note transcript to shape into an essay, or asks to publish/feature a new piece. Handles shaping in his voice, adding to content.json, and the full PR → merge → deploy loop.
---

# Publish an essay

Nuel writes first drafts as voice notes and hands them over to shape and ship. Your job:
keep it unmistakably *his*, make it smart, fit it into the site, and get it live fast.

## 1. Intake

- Take the raw note/draft/topic as the source of truth for ideas and phrasing.
- If there's no title, propose 3–6 creative options and recommend one. Let him pick.
- If it's just a topic (not a draft), offer to draft from scratch in his voice — but prefer
  he provides the raw material; that's what keeps it his.

## 2. Shape it (voice rules)

Read `CLAUDE.md` → "Nuel's voice" for the full guide. In short:
- First person, warm, direct, a little discursive — but **tighten**. Voice notes spiral and
  repeat; cut repetition, keep his actual phrasings and big swings.
- His seam is **systems × human behaviour** (infrastructure/thermodynamics/process ×
  Alchemy/behavioural/somatic intuition). The best pieces fuse both.
- Ground philosophical claims in concrete experience (Cloudflare, Neat, chem eng, Oona, Toronto).
- Cut defensive/comparative asides (e.g. ranking disciplines). Hold science lightly (analogy,
  not overclaim). Anti-corporate, no jargon.
- Structure with real section headings (thematic, or Principle / Elaboration / Example).
- Target ~800–1100 words for a flagship; shorter is fine.
- **Show him the shaped version before publishing** if it's substantially reworked or personal.
  Flag any line that sounds like you, not him.

## 3. Format for the reader

Write `body` in the lightweight markdown the reader supports (see `CLAUDE.md`):
`## Heading`, `> pull-quote` (once, best line only), `**bold**`, `*italic*`,
`==highlight==` (skimmable takeaway — ~one per section, no more). Blank line = new paragraph.

## 4. Add to content.json

Prepend a new object to `public/content.json` → `posts`:
- `slug` (kebab-case), `title`, `date` (ISO, today unless noted), `dateLabel`, `label`, `tags`, `excerpt`, `body`.
- To feature it: set `"featured": true` **and remove `featured` from the previously featured post** (exactly one lead card).
- Validate: `python3 -c "import json;json.load(open('public/content.json'));print('ok')"`

## 5. Verify (optional but preferred)

Render `public/` locally and drive it with Playwright (`/opt/pw-browsers/chromium`):
confirm the featured card + reader render, section headings/highlights/pull-quote counts look
right, and there's **no leftover `**`/`==`/`##`** in the reader text.

## 6. Ship

Re-sync first (prior PRs are merged to main):
```
git fetch origin main
git checkout -B claude/portfolio-improvements-blogs-peumzu origin/main
# edit + validate + verify
git add -A && git commit && git push -u origin claude/portfolio-improvements-blogs-peumzu --force-with-lease
```
Then via the GitHub tools: open a PR → `main`, squash-merge, and confirm the **Deploy to
production** step concludes `success`. Report the live URL:
`https://nuel-portfolio.nueledeh.workers.dev` and the deep link `/#read-<slug>`.

(The sandbox proxy blocks `workers.dev`, so verify via the CI log + local render, not by
curling the live URL.)

## 7. Offer the short version

After shipping, offer a short paste-able version (LinkedIn-sized, ~120 words) that links back
to the full essay. Don't add it as a second site card — keep the shelf clean.

## Scope

Just the write → publish loop. No other signals or automation unless Nuel asks.
