# Nuel Edeh — Portfolio & Blog

Built on Cloudflare Workers with Static Assets. Deploy in minutes, update from any editor.

## Project Structure

```
portfolio/
├── public/
│   ├── index.html       ← The full site (don't need to touch this often)
│   └── content.json     ← ✏️  EDIT THIS to update everything
├── src/
│   └── index.ts         ← Cloudflare Worker (routing)
├── wrangler.jsonc        ← Cloudflare config
└── README.md
```

## Setup & Deploy

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Deploy
wrangler deploy
```

That's it. Your site will be live at `nuel-portfolio.your-subdomain.workers.dev`.

To add a custom domain, go to Cloudflare Dashboard → Workers → your worker → Custom Domains.

## Updating Your Portfolio

**Everything you'd ever want to change lives in `public/content.json`.**

### Change your bio
Edit the `"about"` field.

### Add a new job
Add an object to the `"experience"` array:
```json
{
  "title": "Your Title",
  "company": "Company Name",
  "location": "City",
  "period": "Jan 2026 – Present",
  "tags": ["Tag1", "Tag2"],
  "summary": "One line summary of the role.",
  "highlights": [
    "Bullet one",
    "Bullet two"
  ]
}
```

### Write a new blog post
Add an object to the `"posts"` array:
```json
{
  "slug": "my-post-slug",
  "title": "Your Post Title",
  "date": "2026-03-01",
  "tags": ["Tag1", "Tag2"],
  "excerpt": "One or two sentences shown on the card.",
  "body": "Full post content here.\n\nSeparate paragraphs with a blank line (\\n\\n)."
}
```

### Toggle open-to-work banner
```json
"openToWork": true,
"openToWorkNote": "Available for Senior PM roles in security or fintech."
```
Set `openToWork` to `false` to hide the banner.

### Update skills
Edit the `"skills"` array — just a flat list of strings.

## Deploy after editing

```bash
wrangler deploy
```

Or if you're using the Cloudflare dashboard, just push to your connected GitHub repo.

## Local Development

```bash
wrangler dev
```

Opens at `http://localhost:8787`. Live-reloads on file changes.
