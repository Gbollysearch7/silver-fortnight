#!/usr/bin/env node

/**
 * Render a contact sheet of ALL motifs in the library for visual review.
 *   node scripts/render-motif-sheet.mjs
 */

import { resolve } from 'path';
import { statSync } from 'fs';
import puppeteer from 'puppeteer';
import { ROOT_DIR } from '../lib/config.mjs';
import { printHeader, printSuccess, printInfo, ensureDir } from '../lib/utils.mjs';
import { MOTIFS, BRAND } from '../lib/thumbnail-template.mjs';

const OUT_DIR = resolve(ROOT_DIR, 'output');
ensureDir(OUT_DIR);

const keys = Object.keys(MOTIFS);
const cols = 5;
const cellW = 280, cellH = 240;
const rows = Math.ceil(keys.length / cols);

const cells = keys.map(k => `
  <div class="cell">
    <div class="art">${MOTIFS[k]()}</div>
    <div class="name">${k}</div>
  </div>`).join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${BRAND.navy1}; padding:24px;
    display:grid; grid-template-columns:repeat(${cols}, ${cellW}px); gap:14px; width:${cols * cellW + 24 * 2 + 14 * (cols - 1)}px; }
  .cell { background:linear-gradient(135deg, #141a30, #0d1120); border:1px solid #232a44; border-radius:14px;
    height:${cellH}px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
  .art { flex:1; display:flex; align-items:center; justify-content:center; }
  .art svg { width:auto; height:150px; max-width:200px; }
  .name { font-family:'Geist Mono',monospace; font-size:13px; color:#7c84a8; letter-spacing:0.06em; padding-bottom:14px; }
</style></head><body>${cells}</body></html>`;

printHeader(`Motif Library Contact Sheet (${keys.length} motifs)`);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'] });
try {
  const page = await browser.newPage();
  const fullW = cols * cellW + 24 * 2 + 14 * (cols - 1);
  const fullH = rows * cellH + 24 * 2 + 14 * (rows - 1);
  await page.setViewport({ width: fullW, height: fullH, deviceScaleFactor: 1.5 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await document.fonts.ready; });
  const out = resolve(OUT_DIR, 'motif-library.jpg');
  await page.screenshot({ path: out, type: 'jpeg', quality: 90, fullPage: true });
  await page.close();
  printSuccess(`${(statSync(out).size / 1024).toFixed(0)}KB → ${out}`);
} finally {
  await browser.close();
}
