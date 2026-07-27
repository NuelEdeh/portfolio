export interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  AUDIO?: R2Bucket;
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

    // Pre-generated narration audio, served from the R2 bucket. Falls back to
    // static assets when the bucket isn't bound yet (e.g. plain local dev).
    if (url.pathname.startsWith('/audio/') && (request.method === 'GET' || request.method === 'HEAD')) {
      return serveAudio(request, env, url);
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

async function serveAudio(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.AUDIO) return env.ASSETS.fetch(request); // no bucket bound yet
  const key = decodeURIComponent(url.pathname.slice('/audio/'.length));

  // Honour Range requests so seeking/scrubbing streams instead of re-downloading.
  const rangeHeader = request.headers.get('range');
  let range: R2Range | undefined;
  let start = 0, end = 0, isRange = false;
  if (rangeHeader) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (m && (m[1] || m[2])) {
      isRange = true;
      if (m[1]) { start = parseInt(m[1], 10); range = { offset: start, length: m[2] ? parseInt(m[2], 10) - start + 1 : undefined }; }
      else { range = { suffix: parseInt(m[2], 10) }; }
    }
  }

  const obj = await env.AUDIO.get(key, { range, onlyIf: request.headers });
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  if (!headers.has('content-type')) headers.set('content-type', 'audio/mpeg');
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('etag', obj.httpEtag);

  if (request.method === 'HEAD') { headers.set('content-length', String(obj.size)); return new Response(null, { headers }); }
  if (!('body' in obj) || !obj.body) return new Response(null, { status: 304, headers }); // onlyIf matched

  if (isRange && obj.range) {
    const r = obj.range as { offset?: number; length?: number; suffix?: number };
    const s = r.suffix != null ? obj.size - r.suffix : (r.offset || 0);
    const len = r.suffix != null ? r.suffix : (r.length != null ? r.length : obj.size - s);
    headers.set('content-range', `bytes ${s}-${s + len - 1}/${obj.size}`);
    headers.set('content-length', String(len));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set('content-length', String(obj.size));
  return new Response(obj.body, { headers });
}

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
