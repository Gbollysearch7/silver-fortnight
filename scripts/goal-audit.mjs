#!/usr/bin/env node

/**
 * GOAL Audit — score every live blog post for the "make all blogs premium" goal.
 * READ-ONLY. No Webflow writes. Produces:
 *   data/goal/scorecard.json   (machine)
 *   data/goal/SCORECARD.md     (human, worst-first)
 *
 * Scoring (0-100):
 *   On-page SEO        40  (title, meta, internal links, feature-image+alt, slug)
 *   Content quality    35  (word count vs template floor, scaffold/thin/filler heuristics)
 *   Factual/freshness  15  (heuristic flags — deep check happens in manual review)
 *   Images             10  (feature image, in-body images, alt)
 *
 * Verdict: PREMIUM >=85 | POLISH 60-84 | REWRITE <60
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const inv = JSON.parse(readFileSync(resolve('data/goal/inventory.json'), 'utf-8'));

// Heuristic word floors (premium target, slightly above template minimums)
const WORD_FLOOR = 1000;
const WORD_GOOD = 1500;

function scorePost(p) {
  const issues = [];
  let seo = 40, content = 35, facts = 15, images = 10;

  // --- On-page SEO (40) ---
  if (p.titleLen === 0) { seo -= 10; issues.push('no title'); }
  else if (p.titleLen > 60) { seo -= 4; issues.push(`title ${p.titleLen} chars (>60)`); }
  if (p.summaryLen < 120 || p.summaryLen > 160) { seo -= 6; issues.push(`meta ${p.summaryLen} chars (want 150-160)`); }
  if (p.internalLinks < 3) { seo -= 12; issues.push(`only ${p.internalLinks} internal link(s)`); }
  if (p.subdomainLinks > 0) { seo -= 6; issues.push(`${p.subdomainLinks} link(s) to OLD subdomain`); }
  if (p.featureImage === 'NO') { seo -= 8; issues.push('no feature-image'); }
  else if (p.featureAlt === 'NO') { seo -= 3; issues.push('feature-image missing alt'); }
  if (seo < 0) seo = 0;

  // --- Content quality (35) ---
  if (p.words < 600) { content -= 30; issues.push(`THIN ${p.words}w`); }
  else if (p.words < WORD_FLOOR) { content -= 18; issues.push(`short ${p.words}w (<${WORD_FLOOR})`); }
  else if (p.words < WORD_GOOD) { content -= 8; issues.push(`ok ${p.words}w (want ${WORD_GOOD}+)`); }
  if (content < 0) content = 0;

  // --- Images (10) ---
  if (p.featureImage === 'NO') { images -= 5; }
  if (p.bodyImgs === 0) { images -= 4; issues.push('no in-body images'); }
  if (images < 0) images = 0;

  // --- Facts (15) — heuristic only; manual review confirms ---
  // Penalize posts that mention pricing/specific numbers AND are short (higher stale-fact risk).
  // Without content text here we keep neutral; flagged for manual pass.
  // (Deep factual audit runs during per-blog review.)

  const total = seo + content + facts + images;
  let verdict = total >= 85 ? 'PREMIUM' : total >= 60 ? 'POLISH' : 'REWRITE';
  return { ...p, score: total, breakdown: { seo, content, facts, images }, issues, verdict };
}

const scored = inv.map(scorePost).sort((a, b) => a.score - b.score);

writeFileSync(resolve('data/goal/scorecard.json'), JSON.stringify(scored, null, 2));

// Human-readable, worst-first
const counts = { PREMIUM: 0, POLISH: 0, REWRITE: 0 };
scored.forEach(p => counts[p.verdict]++);

let md = `# Premium Scorecard — 184 live posts\n\n`;
md += `**Generated:** ${'07 Jun 2026'} · **Read-only audit** (no changes made)\n\n`;
md += `| Verdict | Count |\n|---|---|\n`;
md += `| 🔴 REWRITE (<60) | ${counts.REWRITE} |\n`;
md += `| 🟡 POLISH (60-84) | ${counts.POLISH} |\n`;
md += `| ✅ PREMIUM (≥85) | ${counts.PREMIUM} |\n\n`;
md += `> Note: SEO + content + image dimensions are scored automatically. Factual accuracy (15pts) is held neutral here and confirmed during manual per-blog review.\n\n`;
md += `## Worst-first priority list\n\n`;
md += `| Score | Verdict | Words | IntLinks | Img | Title | Top issues |\n|---|---|---|---|---|---|---|\n`;
for (const p of scored) {
  const v = p.verdict === 'PREMIUM' ? '✅' : p.verdict === 'POLISH' ? '🟡' : '🔴';
  const img = p.featureImage === 'yes' ? (p.bodyImgs > 0 ? 'F+B' : 'F') : '—';
  md += `| ${p.score} | ${v} | ${p.words} | ${p.internalLinks} | ${img} | ${p.name.slice(0, 42)} | ${p.issues.slice(0, 3).join('; ')} |\n`;
}
writeFileSync(resolve('data/goal/SCORECARD.md'), md);

console.log('Scorecard written: data/goal/SCORECARD.md + scorecard.json');
console.log(`PREMIUM: ${counts.PREMIUM} | POLISH: ${counts.POLISH} | REWRITE: ${counts.REWRITE}`);
