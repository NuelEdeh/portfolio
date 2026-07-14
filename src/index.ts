export interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/contact' && request.method === 'POST') {
      try {
        const body = await request.json() as Record<string, string>;
        const { name, email, company, message } = body;

        if (!name || !email || !message) {
          return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'hello@nueledeh.com',
            to: ['nueledeh92@gmail.com'],
            reply_to: email,
            subject: `New message from ${name}${company ? ` · ${company}` : ''}`,
            text: `Name: ${name}\nEmail: ${email}\nCompany: ${company || '—'}\n\nMessage:\n${message}`,
          }),
        });

        if (res.ok) {
          return Response.json({ ok: true });
        } else {
          const err = await res.text();
          console.error('Resend error:', err);
          return Response.json({ error: 'Failed to send' }, { status: 500 });
        }
      } catch (e) {
        console.error('Contact error:', e);
        return Response.json({ error: 'Server error' }, { status: 500 });
      }
    }

    // Per-post pages: inject that post's meta tags so shared links unfurl
    // with the essay's title/description instead of the site default.
    const postMatch = url.pathname.match(/^\/writing\/([^/?#]+)\/?$/);
    if (postMatch && request.method === 'GET') {
      return renderPost(decodeURIComponent(postMatch[1]), request, env, url);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

interface Post {
  slug?: string;
  title?: string;
  excerpt?: string;
  url?: string;
}

function setAttr(name: string, value: string) {
  return { element(el: Element) { el.setAttribute(name, value); } };
}

async function renderPost(slug: string, request: Request, env: Env, url: URL): Promise<Response> {
  const indexResp = await env.ASSETS.fetch(new URL('/index.html', url.origin).toString());

  let post: Post | null = null;
  try {
    const cjson = await env.ASSETS.fetch(new URL('/content.json', url.origin).toString());
    if (cjson.ok) {
      const data = await cjson.json() as { posts?: Post[] };
      post = (data.posts || []).find((p) => p.slug === slug && !p.url) || null;
    }
  } catch (e) {
    console.error('content.json read failed:', e);
  }

  // Unknown slug: serve the app unchanged (it will fall back to the home view).
  if (!post) return indexResp;

  const title = `${post.title} · Nuel Edeh`;
  const desc = (post.excerpt || 'An essay by Nuel Edeh.').replace(/\s+/g, ' ').trim();
  const canonical = `https://nueledeh.com/writing/${slug}`;

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', setAttr('content', desc))
    .on('meta[property="og:title"]', setAttr('content', title))
    .on('meta[property="og:description"]', setAttr('content', desc))
    .on('meta[property="og:type"]', setAttr('content', 'article'))
    .on('meta[name="twitter:title"]', setAttr('content', title))
    .on('meta[name="twitter:description"]', setAttr('content', desc))
    .on('head', {
      element(el) {
        el.append(
          `<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}">`,
          { html: true }
        );
      },
    })
    .transform(indexResp);
}
