#!/usr/bin/env node
/**
 * narrate.mjs — pre-generate ElevenLabs voice narration for essays.
 *
 * Reads public/content.json, converts each internal essay's markdown body to
 * clean narration text, sends it to ElevenLabs once, and writes the MP3 to
 * public/audio/<slug>.mp3. A hash of the narration text is stored in
 * scripts/narration-manifest.json so unchanged essays are skipped and you are
 * never re-billed for an essay you didn't edit.
 *
 * The API key never leaves your machine: it is read from the environment or
 * from a git-ignored .dev.vars file. It is never written to content.json,
 * the Worker, or the browser.
 *
 * Usage:
 *   node scripts/narrate.mjs                 # all essays, skip unchanged
 *   node scripts/narrate.mjs <slug> [slug…]  # only these
 *   node scripts/narrate.mjs --force <slug>  # regenerate even if unchanged
 *   node scripts/narrate.mjs --dry           # show chars + est. credits, no API calls
 *
 * Config via env or .dev.vars:
 *   ELEVENLABS_API_KEY   (required to generate)
 *   ELEVENLABS_VOICE_ID  (required to generate — your cloned voice)
 *   ELEVENLABS_MODEL_ID  (optional, default eleven_v3)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'public', 'content.json');
const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
const MANIFEST = path.join(ROOT, 'scripts', 'narration-manifest.json');

// ---- tiny .dev.vars loader (KEY=value lines) --------------------------------
// Must run before ANY other module-level code reads process.env — every
// config constant below (model, chunk cap, R2 bucket) depends on this having
// already populated the environment. A previous version of this script called
// loadDevVars() from inside main(), which ran too late: MODEL_ID and
// R2_BUCKET below were already frozen from an empty environment, so changes
// to .dev.vars were silently ignored (wrong model used, nothing uploaded).
function loadDevVars() {
  const p = path.join(ROOT, '.dev.vars');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadDevVars();
function envOr(name, fallback) { return process.env[name] || fallback; }

const MODEL_ID = envOr('ELEVENLABS_MODEL_ID', 'eleven_multilingual_v2');
const OUTPUT_FORMAT = 'mp3_44100_128';

// Per-request character caps by model. The convert endpoint rejects anything
// over the model's limit ("text_too_long"), so longer essays are split into
// chunks on paragraph boundaries and stitched back together. v2 fits every
// current essay in one request; v3 is stricter and will chunk.
const MODEL_CAPS = {
  eleven_multilingual_v2: 9500,
  eleven_monolingual_v1: 9500,
  eleven_multilingual_v1: 9500,
  eleven_turbo_v2: 29000,
  eleven_turbo_v2_5: 29000,
  eleven_flash_v2_5: 29000,
  eleven_v3: 2900,
};
const MAX_CHARS = Number(process.env.ELEVENLABS_MAX_CHARS) || MODEL_CAPS[MODEL_ID] || 4500;

// When set (in .dev.vars), every generated MP3 is uploaded to this R2 bucket
// via the wrangler CLI — to remote (production) and local (wrangler dev sim).
const R2_BUCKET = process.env.AUDIO_R2_BUCKET || '';
function uploadToR2(localFile, key) {
  if (!R2_BUCKET) return;
  for (const scope of ['--remote', '--local']) {
    try {
      execFileSync('wrangler', ['r2', 'object', 'put', `${R2_BUCKET}/${key}`,
        '--file', localFile, '--content-type', 'audio/mpeg', scope], { stdio: 'pipe' });
    } catch (e) {
      // Local sim is best-effort; a remote failure is worth surfacing.
      if (scope === '--remote') throw new Error(`R2 upload failed for ${key}: ${e.stderr?.toString() || e.message}`);
    }
  }
}
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.85,
  style: 0.15,
  use_speaker_boost: true,
};


// ---- markdown -> clean spoken text ------------------------------------------
export function toNarration(post) {
  const out = [];
  if (post.title) out.push(post.title.trim().replace(/[.?!:]+$/, '') + '.');
  for (const raw of (post.body || '').split(/\n\n+/)) {
    let b = raw.trim();
    if (!b) continue;
    if (b.slice(0, 3) === '## ') b = b.slice(3).trim().replace(/[.?!:]+$/, '') + '.';
    else if (b[0] === '>') b = b.replace(/^>\s?/gm, '').trim();
    b = b.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url) -> text
    b = b.replace(/==([^=]+)==/g, '$1');            // highlight
    b = b.replace(/\*\*([^*]+)\*\*/g, '$1');        // bold
    b = b.replace(/\*([^*]+)\*/g, '$1');            // italic
    b = b.replace(/\s+/g, ' ').trim();
    if (b) out.push(b);
  }
  return out.join('\n\n');
}

export function hashOf(text) {
  // Voice + model + text: changing any of them yields a new hash, which both
  // triggers regeneration and busts the immutable audio cache via ?v=.
  return crypto.createHash('sha256')
    .update(`${MODEL_ID}\n${process.env.ELEVENLABS_VOICE_ID || ''}\n${text}`)
    .digest('hex').slice(0, 16);
}
export const NARRATION_MODEL = MODEL_ID;
// Content-addressed storage: the render's hash (voice + model + text) is baked
// into the filename, so a different voice or model produces a different file
// that never overwrites the old one. Switching back to a voice you've already
// rendered is then free — the file is still there, and the manifest remembers
// it, so no ElevenLabs call is made.
export function audioFile(slug, hash) { return `${slug}.${(hash || '').slice(0, 8)}.mp3`; }
function audioUrl(slug, hash) { return `/audio/${audioFile(slug, hash)}`; }

// ---- chunking (only used when an essay exceeds the model's cap) -------------
function chunkText(text, max) {
  if (text.length <= max) return [text];
  const chunks = [];
  let cur = '';
  const flush = () => { if (cur.trim()) chunks.push(cur.trim()); cur = ''; };
  for (const para of text.split('\n\n')) {
    if ((cur + '\n\n' + para).trim().length <= max) {
      cur = cur ? cur + '\n\n' + para : para;
    } else if (para.length <= max) {
      flush(); cur = para;
    } else {
      // A single paragraph longer than the cap: split on sentence boundaries.
      flush();
      const sentences = para.match(/[^.!?]+[.!?]+(\s|$)|\S[^.!?]*$/g) || [para];
      for (const s of sentences) {
        if ((cur + ' ' + s).trim().length <= max) cur = (cur + ' ' + s).trim();
        else { flush(); cur = s.trim(); }
      }
    }
  }
  flush();
  return chunks;
}

// ---- ElevenLabs call --------------------------------------------------------
async function synthesizeChunk(text, apiKey, voiceId, ctx) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`;
  const body = { text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS };
  // eleven_v3 rejects previous/next text (and request-id) stitching. Other
  // models use them to keep prosody continuous across chunk boundaries.
  const stitch = !/^eleven_v3/.test(MODEL_ID);
  if (stitch && ctx.previousText) body.previous_text = ctx.previousText;
  if (stitch && ctx.nextText) body.next_text = ctx.nextText;
  if (stitch && ctx.previousRequestIds?.length) body.previous_request_ids = ctx.previousRequestIds.slice(-3);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const requestId = res.headers.get('request-id');
  return { audio: Buffer.from(await res.arrayBuffer()), requestId };
}

async function synthesize(text, apiKey, voiceId, onChunk) {
  const parts = chunkText(text, MAX_CHARS);
  const buffers = [];
  const previousRequestIds = [];
  for (let i = 0; i < parts.length; i++) {
    if (onChunk) onChunk(i + 1, parts.length);
    const { audio, requestId } = await synthesizeChunk(parts[i], apiKey, voiceId, {
      previousText: i > 0 ? parts[i - 1].slice(-500) : undefined,
      nextText: i < parts.length - 1 ? parts[i + 1].slice(0, 500) : undefined,
      previousRequestIds,
    });
    if (requestId) previousRequestIds.push(requestId);
    buffers.push(audio);
  }
  // Same-codec MP3 frames concatenate cleanly by bytes; no ffmpeg needed.
  return Buffer.concat(buffers);
}

// ---- main -------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2); // .dev.vars already loaded at module scope, before config consts above
  const force = args.includes('--force');
  const dry = args.includes('--dry');
  const syncR2 = args.includes('--sync-r2');
  const slugs = args.filter((a) => !a.startsWith('--'));

  const data = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};

  let targets = (data.posts || []).filter((p) => p.slug && p.body && !p.url);
  if (slugs.length) targets = targets.filter((p) => slugs.includes(p.slug));
  if (!targets.length) { console.error('No matching essays.'); process.exit(1); }

  // Point content.json at each essay's currently-selected render.
  const persist = () => {
    for (const p of data.posts || []) {
      const cur = manifest[p.slug]?.current;
      const url = cur && manifest[p.slug].renders?.[cur]?.file;
      if (url && !p.url && p.audio !== url) p.audio = url;
    }
    fs.writeFileSync(CONTENT, JSON.stringify(data, null, 2) + '\n');
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  };

  // Push every local render up to R2 (keys are the hash-named filenames).
  if (syncR2) {
    if (!R2_BUCKET) { console.error('Set AUDIO_R2_BUCKET in .dev.vars first.'); process.exit(1); }
    const files = fs.existsSync(AUDIO_DIR) ? fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith('.mp3')) : [];
    for (const f of files) { process.stdout.write(`sync  ${f} → R2… `); uploadToR2(path.join(AUDIO_DIR, f), f); console.log('ok'); }
    console.log(`\nUploaded ${files.length} file(s) to R2 bucket "${R2_BUCKET}".`);
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!dry && (!apiKey || !voiceId)) {
    console.error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID (set in .dev.vars or env).');
    process.exit(1);
  }

  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  let changed = false, totalChars = 0;

  try {
    for (const post of targets) {
      const text = toNarration(post);
      const hash = hashOf(text); // captures voice + model + text
      const entry = manifest[post.slug] || { current: null, renders: {} };
      const done = entry.renders[hash];

      if (dry) {
        console.log(`${done && !force ? 'skip ' : 'gen  '} ${post.slug.padEnd(34)} ${String(text.length).padStart(6)} chars, ${MODEL_ID}${done && !force ? '  (already rendered)' : ''}`);
        totalChars += done && !force ? 0 : text.length;
        continue;
      }

      // Already rendered this exact voice+model+text: just select it. Free.
      if (done && !force) {
        entry.current = hash;
        manifest[post.slug] = entry;
        changed = true;
        persist();
        console.log(`use   ${post.slug} (already rendered — selected, no credits)`);
        continue;
      }

      const nChunks = chunkText(text, MAX_CHARS).length;
      process.stdout.write(`gen   ${post.slug} (${text.length} chars${nChunks > 1 ? `, ${nChunks} chunks` : ''}, ${MODEL_ID})… `);
      const audio = await synthesize(text, apiKey, voiceId);
      const key = audioFile(post.slug, hash);
      const abs = path.join(AUDIO_DIR, key);
      fs.writeFileSync(abs, audio);
      uploadToR2(abs, key);
      entry.renders[hash] = { file: audioUrl(post.slug, hash), model: MODEL_ID, voice: voiceId, chars: text.length, generatedAt: new Date().toISOString() };
      entry.current = hash;
      manifest[post.slug] = entry;
      changed = true; totalChars += text.length;
      persist(); // save this essay before moving to the next
      console.log(`${(audio.length / 1024).toFixed(0)} KB → public/audio/${key}`);
    }
  } catch (e) {
    if (changed) { persist(); console.error('\nSaved completed essays before failing.'); }
    throw e;
  }

  if (dry) {
    console.log(`\n~${totalChars.toLocaleString()} characters ≈ ${totalChars.toLocaleString()} credits to render at this voice/model.`);
    return;
  }
  console.log(changed ? '\nUpdated content.json and narration-manifest.json.' : '\nNothing to do — all narrations current.');
}

// Only generate when run directly as a CLI. Importing this module (e.g. for
// tests) must never trigger API calls.
import { pathToFileURL } from 'node:url';
const isCLI = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (isCLI) main().catch((e) => { console.error('\n' + e.message); process.exit(1); });
