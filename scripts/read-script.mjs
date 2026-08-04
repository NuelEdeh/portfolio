#!/usr/bin/env node
/**
 * Build a performance script for reading an essay aloud.
 *
 * Different job from `narrate.mjs`'s toNarration(), which flattens an essay into
 * one clean block for a TTS engine. A human needs the opposite: short lines so the
 * eye never loses its place, explicit breath marks, and the emphasis kept rather
 * than stripped, because the highlights in the source are exactly the lines that
 * should land.
 *
 *   node scripts/read-script.mjs <slug> [--wpm 145] [--out <path>]
 *
 * Marks in the output:
 *   /     breath, don't stop
 *   //    beat, about a second
 *   ///   full stop, about two seconds
 *   *x*   lean in — came from a ==highlight== in the source
 *   >>    pull-quote — slow down, this is the line of the essay
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPLIT = '\u0001'; // sentinel, never appears in prose

const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i === -1 ? fallback : argv[i + 1];
};
const WPM = Number(flag('wpm', 145));

if (!slug) {
  console.error('usage: node scripts/read-script.mjs <slug> [--wpm 145] [--out <path>]');
  process.exit(1);
}

/* Source is normally the published content.json, but --draft <path> reads an
   unpublished draft instead: everything after the first `---` line is the body,
   and the `# Title` heading is the title. Lets an essay be rehearsed and recorded
   before it ships. */
const draftPath = flag('draft', null);
let post;
if (draftPath) {
  const raw = fs.readFileSync(draftPath, 'utf8');
  const i = raw.indexOf('\n---\n');
  if (i === -1) {
    console.error(`${draftPath}: expected a "---" line separating front matter from the body`);
    process.exit(1);
  }
  const titleMatch = raw.slice(0, i).match(/^#\s+(?:DRAFT\s*[—-]\s*)?(.+)$/m);
  post = {
    title: (titleMatch ? titleMatch[1] : path.basename(draftPath, '.md')).trim(),
    body: raw.slice(i + 5).trim(),
  };
} else {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/content.json'), 'utf8'));
  post = (data.posts || []).find((p) => p.slug === slug);
  if (!post) {
    console.error(`no post with slug "${slug}"`);
    console.error('available: ' + (data.posts || []).map((p) => p.slug).join(', '));
    process.exit(1);
  }
}

/* Strip link syntax to its text; keep emphasis, convert highlights to *…*. */
function inline(s) {
  return s
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/==([^=]+)==/g, '*$1*')
    .replace(/\*\*([^*]+)\*\*/g, '*$1*')
    .trim();
}

/* Split into sentences. The optional * in the pattern matters: a highlight that
   ends a sentence puts the marker between the full stop and the next capital, and
   without allowing for it the landing line stays glued to whatever follows. */
function sentences(text) {
  return text
    .replace(/([.!?]\*?)\s+(?=\*?["'“‘(]?[A-Z])/g, '$1' + SPLIT)
    .split(SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* Wrap a long sentence for the eye, preferring a break just after a clause
   boundary so every line is a speakable unit. Continuations carry no mark,
   because a wrap is not a breath. */
function wrap(sentence, width = 72) {
  if (sentence.length <= width) return [sentence];
  const lines = [];
  let line = '';
  sentence.split(' ').forEach((w) => {
    const candidate = line ? line + ' ' + w : w;
    if (candidate.length > width && line) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
    if (/[,;:]$/.test(line) && line.length > width * 0.5) {
      lines.push(line);
      line = '';
    }
  });
  if (line) lines.push(line);
  return lines;
}

/* Emit one sentence as its own indented unit, wrapped, with the mark on the
   final physical line only. */
function emit(body, sentence, mark) {
  const parts = wrap(sentence);
  parts.forEach((p, i) => {
    const isLast = i === parts.length - 1;
    const indent = i === 0 ? '   ' : '      ';
    body.push(indent + p + (isLast && mark ? ' ' + mark : ''));
  });
}

const blocks = (post.body || '').split('\n\n').map((b) => b.trim()).filter(Boolean);

const rule = '─'.repeat(64);
const body = [];
let words = 0;
let para = 0;

blocks.forEach((block) => {
  if (block.startsWith('## ')) {
    const h = inline(block.slice(3));
    body.push('', '///', '', `[ ${h.toUpperCase()} ]`,
      '    new section — full breath, drop your pitch, start slower', '');
    words += h.split(/\s+/).length;
    return;
  }

  if (block.startsWith('> ')) {
    const q = inline(block.replace(/^>\s?/gm, ''));
    body.push('', '>>  PULL-QUOTE — this is the line. Slow right down.');
    sentences(q).forEach((s) => emit(body, s, ''));
    body.push('>>', '', '///');
    words += q.split(/\s+/).length;
    return;
  }

  para += 1;
  const text = inline(block);
  words += text.split(/\s+/).length;
  const ss = sentences(text);

  body.push(`[${String(para).padStart(2, '0')}]`);
  ss.forEach((s, j) => {
    // A landing line arrives out of a small silence rather than mid-run.
    if (/^\*/.test(s) && j > 0) body.push('   //');
    emit(body, s, j === ss.length - 1 ? '' : '/');
  });
  body.push('   //', '');
});

const mins = words / WPM;
const clock = `${Math.floor(mins)}:${String(Math.round((mins - Math.floor(mins)) * 60)).padStart(2, '0')}`;

const out = [
  post.title.toUpperCase(),
  rule,
  `${words} words  ·  about ${clock} at ${WPM} wpm  ·  ${para} paragraphs`,
  '',
  'MARKS',
  '  /      breath, keep going',
  '  //     beat, about a second',
  '  ///    full stop, about two seconds',
  '  *x*    lean in, this one lands',
  '  [nn]   paragraph number, for finding your place on a retake',
  '         indented continuation = same sentence, no pause',
  '',
  'BEFORE YOU START',
  '  Record 15 seconds of silence first. It gets used to subtract the room.',
  '  Read the whole thing out loud once before recording anything.',
  '  If you fumble, stop, say the paragraph number, take it again.',
  '  Water nearby. Phone off the desk, not just silenced.',
  rule,
  '',
  ...body,
];

const outPath = flag('out', path.join(process.env.HOME, 'Desktop', 'read-scripts', `${slug}.txt`));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out.join('\n').replace(/\n{4,}/g, '\n\n\n') + '\n');

console.log(`wrote ${outPath}`);
console.log(`${words} words · ~${clock} at ${WPM} wpm · ${para} paragraphs`);
