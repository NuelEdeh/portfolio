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

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
