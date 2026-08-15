#!/usr/bin/env node

/**
 * Render sample in-article section banners (680x300) for design review.
 *   node scripts/render-inarticle-samples.mjs
 */

import { resolve } from 'path';
import { statSync } from 'fs';
import puppeteer from 'puppeteer';
import { ROOT_DIR } from '../lib/config.mjs';
import { printHeader, printSuccess, printInfo, ensureDir } from '../lib/utils.mjs';
import { buildInArticleHTML } from '../lib/inarticle-template.mjs';

const OUT_DIR = resolve(ROOT_DIR, 'output', 'inarticle-samples');
ensureDir(OUT_DIR);

const SAMPLES = [
  { slug: 'split', heading: 'How the Profit Split Is Calculated' },          // pie
  { slug: 'payout', heading: 'When Do You Get Your First Payout?' },          // coins
  { slug: 'funding', heading: 'Choosing Your Funded Account Size' },          // wallet
  { slug: 'kyc', heading: 'KYC Verification: Documents You Need' },           // lock
  { slug: 'rulesdoc', heading: 'The Full Rulebook and Terms' },              // doc
  { slug: 'leverage', heading: 'Calculating Your Max Lot Size' },            // gauge
  { slug: 'scaling', heading: 'Scaling Your Account After You Pass' },        // steps
  { slug: 'mindays', heading: 'The Minimum Trading Days Rule' },             // calendar
  { slug: 'weekend', heading: 'Can You Hold Trades Over the Weekend?' },     // clock
  { slug: 'ea', heading: 'Using Expert Advisors and Bots' },                 // bolt
  { slug: 'drawdown', heading: 'How Maximum Drawdown Actually Works' },       // candles
  { slug: 'vs', heading: 'FTMO vs The5ers: Key Differences' },               // grid
  { slug: 'review', heading: 'Honest Pros and Cons' },                       // scales
  { slug: 'social', heading: 'Social Trading and Copy Trading' },            // network
  { slug: 'challenge', heading: 'Passing the Evaluation Phase' },            // target
  { slug: 'success', heading: 'Reaching Your First Milestone' },             // flag
  { slug: 'basics', heading: 'What Is a Prop Firm Challenge?' },             // book
  { slug: 'strategy', heading: 'Building a Winning Trading Strategy' },       // candles
];

printHeader('In-Article Banner Samples');
printInfo('680x300 @ 2x | JPEG q88\n');

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'] });
try {
  for (let i = 0; i < SAMPLES.length; i++) {
    const s = SAMPLES[i];
    const html = buildInArticleHTML({ heading: s.heading, slug: s.slug, index: i, label: 'TRADERSYARD' });
    const page = await browser.newPage();
    await page.setViewport({ width: 680, height: 300, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluate(async () => { await document.fonts.ready; });
    const out = resolve(OUT_DIR, `${s.slug}.jpg`);
    await page.screenshot({ path: out, type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 680, height: 300 } });
    await page.close();
    printSuccess(`${(statSync(out).size / 1024).toFixed(0)}KB → ${s.slug}.jpg  ["${s.heading}"]`);
  }
} finally {
  await browser.close();
}
printInfo(`\nOutput: ${OUT_DIR}`);
