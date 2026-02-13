#!/usr/bin/env node

/**
 * Weekly Report Generator
 * Sends a summary email via Resend API with blog publishing stats.
 *
 * Usage:
 *   node scripts/report.mjs                    # Send weekly report
 *   node scripts/report.mjs --preview          # Print report without sending
 *   node scripts/report.mjs --to me@email.com  # Custom recipient
 */

import { resolve } from 'path';
import { DATA_DIR, TRACKER_PATH, blogConfig } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, readJsonFile, loadTracker, formatDate, formatDateShort } from '../lib/utils.mjs';

const args = parseArgs();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REPORT_TO = args.to || process.env.REPORT_EMAIL || 'gbolahan@tradersyard.com';
const QUEUE_PATH = resolve(DATA_DIR, 'keyword-queue.json');
const LOG_PATH = resolve(DATA_DIR, 'cron-log.json');

printHeader('Weekly Report');

// --- Gather stats ---

const tracker = loadTracker(TRACKER_PATH);
const queue = readJsonFile(QUEUE_PATH) || { queue: [] };
const cronLog = readJsonFile(LOG_PATH) || { events: [] };

// Last 7 days
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const weekEvents = cronLog.events.filter(e => e.timestamp >= weekAgo);
const published = weekEvents.filter(e => e.type === 'published');
const failed = weekEvents.filter(e => e.type === 'failed');

const allPosts = Object.values(tracker.posts);
const publishedPosts = allPosts.filter(p => p.status === 'published' || p.webflowPublished);
const totalClicks = publishedPosts.reduce((s, p) => s + (p.gscClicks || 0), 0);
const totalImpressions = publishedPosts.reduce((s, p) => s + (p.gscImpressions || 0), 0);

const queuedCount = queue.queue.filter(i => i.status === 'queued').length;
const queuePublished = queue.queue.filter(i => i.status === 'published').length;
const queueFailed = queue.queue.filter(i => i.status === 'failed').length;

const { primaryColor } = blogConfig.design;

// --- Build report ---

const reportDate = formatDateShort();
const weekAgoDate = formatDateShort(weekAgo);

const recentPublishes = published.map(e =>
  `<tr><td style="padding:8px 12px;border-bottom:1px solid #2d2d44;color:#94a3b8;">${e.slug || '-'}</td><td style="padding:8px 12px;border-bottom:1px solid #2d2d44;color:#94a3b8;">${e.keyword}</td><td style="padding:8px 12px;border-bottom:1px solid #2d2d44;color:#94a3b8;">${e.duration || '-'}</td></tr>`
).join('\n');

const failedRows = failed.map(e =>
  `<tr><td style="padding:8px 12px;border-bottom:1px solid #2d2d44;color:#ef4444;">${e.keyword}</td><td style="padding:8px 12px;border-bottom:1px solid #2d2d44;color:#ef4444;">${(e.error || '').slice(0, 60)}</td></tr>`
).join('\n');

// Top performers
const topPosts = publishedPosts
  .filter(p => p.gscClicks > 0)
  .sort((a, b) => (b.gscClicks || 0) - (a.gscClicks || 0))
  .slice(0, 5);

const topRows = topPosts.map(p =>
  `<tr><td style="padding:8px 12px;border-bottom:1px solid #2d2d44;color:#94a3b8;">${(p.title || p.slug || '').slice(0, 40)}</td><td style="padding:8px 12px;border-bottom:1px solid #2d2d44;color:#94a3b8;">${p.gscClicks}</td><td style="padding:8px 12px;border-bottom:1px solid #2d2d44;color:#94a3b8;">${p.gscImpressions}</td><td style="padding:8px 12px;border-bottom:1px solid #2d2d44;color:#94a3b8;">${p.gscCtr || '-'}%</td></tr>`
).join('\n');

const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0f0f1a;">
<tr><td align="center" style="padding:20px 16px;">
<table width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="padding:32px 0;text-align:center;">
<span style="font-size:24px;font-weight:800;color:${primaryColor};">TradersYard Blog</span>
<span style="font-size:14px;color:#94a3b8;display:block;margin-top:4px;">Weekly Automation Report</span>
</td></tr>

<!-- Stats -->
<tr><td style="background:#1a1a2e;border-radius:16px;padding:32px;border:1px solid rgba(66,80,235,0.15);">
<p style="color:#94a3b8;font-size:13px;margin:0 0 20px 0;">${weekAgoDate} — ${reportDate}</p>

<table width="100%" cellspacing="0" cellpadding="0">
<tr>
<td style="text-align:center;padding:12px;">
<span style="font-size:32px;font-weight:800;color:${primaryColor};display:block;">${published.length}</span>
<span style="font-size:12px;color:#94a3b8;">Published This Week</span>
</td>
<td style="text-align:center;padding:12px;">
<span style="font-size:32px;font-weight:800;color:#4ade80;display:block;">${queuedCount}</span>
<span style="font-size:12px;color:#94a3b8;">In Queue</span>
</td>
<td style="text-align:center;padding:12px;">
<span style="font-size:32px;font-weight:800;color:#e2e8f0;display:block;">${publishedPosts.length}</span>
<span style="font-size:12px;color:#94a3b8;">Total Published</span>
</td>
</tr>
</table>

${failed.length > 0 ? `<p style="color:#ef4444;font-size:14px;margin:16px 0 0 0;">Failed: ${failed.length} post(s)</p>` : ''}
</td></tr>

<tr><td style="height:16px;"></td></tr>

<!-- Published this week -->
${published.length > 0 ? `
<tr><td style="background:#16161f;border-radius:12px;padding:24px;border:1px solid rgba(255,255,255,0.06);">
<h2 style="color:#e2e8f0;font-size:16px;margin:0 0 12px 0;">Published This Week</h2>
<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
<tr><th style="text-align:left;padding:8px 12px;border-bottom:2px solid ${primaryColor};color:#e2e8f0;font-size:13px;">Slug</th><th style="text-align:left;padding:8px 12px;border-bottom:2px solid ${primaryColor};color:#e2e8f0;font-size:13px;">Keyword</th><th style="text-align:left;padding:8px 12px;border-bottom:2px solid ${primaryColor};color:#e2e8f0;font-size:13px;">Time</th></tr>
${recentPublishes}
</table>
</td></tr>
<tr><td style="height:16px;"></td></tr>
` : ''}

<!-- Failed -->
${failed.length > 0 ? `
<tr><td style="background:#16161f;border-radius:12px;padding:24px;border:1px solid rgba(239,68,68,0.2);">
<h2 style="color:#ef4444;font-size:16px;margin:0 0 12px 0;">Failed</h2>
<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
<tr><th style="text-align:left;padding:8px 12px;border-bottom:2px solid #ef4444;color:#e2e8f0;font-size:13px;">Keyword</th><th style="text-align:left;padding:8px 12px;border-bottom:2px solid #ef4444;color:#e2e8f0;font-size:13px;">Error</th></tr>
${failedRows}
</table>
</td></tr>
<tr><td style="height:16px;"></td></tr>
` : ''}

<!-- Performance -->
${topPosts.length > 0 ? `
<tr><td style="background:#16161f;border-radius:12px;padding:24px;border:1px solid rgba(255,255,255,0.06);">
<h2 style="color:#e2e8f0;font-size:16px;margin:0 0 4px 0;">Top Performers</h2>
<p style="color:#94a3b8;font-size:12px;margin:0 0 12px 0;">Total: ${totalClicks} clicks, ${totalImpressions} impressions</p>
<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
<tr><th style="text-align:left;padding:8px 12px;border-bottom:2px solid ${primaryColor};color:#e2e8f0;font-size:13px;">Post</th><th style="text-align:left;padding:8px 12px;border-bottom:2px solid ${primaryColor};color:#e2e8f0;font-size:13px;">Clicks</th><th style="text-align:left;padding:8px 12px;border-bottom:2px solid ${primaryColor};color:#e2e8f0;font-size:13px;">Impr.</th><th style="text-align:left;padding:8px 12px;border-bottom:2px solid ${primaryColor};color:#e2e8f0;font-size:13px;">CTR</th></tr>
${topRows}
</table>
</td></tr>
<tr><td style="height:16px;"></td></tr>
` : ''}

<!-- Queue status -->
<tr><td style="background:#16161f;border-radius:12px;padding:24px;border:1px solid rgba(255,255,255,0.06);">
<h2 style="color:#e2e8f0;font-size:16px;margin:0 0 12px 0;">Queue Status</h2>
<p style="color:#94a3b8;font-size:14px;margin:4px 0;">Queued: <strong style="color:#e2e8f0;">${queuedCount}</strong></p>
<p style="color:#94a3b8;font-size:14px;margin:4px 0;">Published: <strong style="color:#4ade80;">${queuePublished}</strong></p>
<p style="color:#94a3b8;font-size:14px;margin:4px 0;">Failed: <strong style="color:#ef4444;">${queueFailed}</strong></p>
<p style="color:#94a3b8;font-size:13px;margin:12px 0 0 0;">At 2 posts/day, the queue has <strong style="color:${primaryColor};">${Math.ceil(queuedCount / 2)} days</strong> of content remaining.</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 0;text-align:center;">
<p style="color:#64748b;font-size:11px;margin:0;">Blog Automation System | TradersYard</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

// --- Preview or send ---

if (args.preview) {
  printSection('Report Preview');
  console.log(`  To: ${REPORT_TO}`);
  console.log(`  Period: ${weekAgoDate} — ${reportDate}`);
  console.log(`  Published this week: ${published.length}`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Queue remaining: ${queuedCount}`);
  console.log(`  Total published: ${publishedPosts.length}`);
  console.log(`  Total clicks: ${totalClicks}`);
  console.log(`  Total impressions: ${totalImpressions}`);

  if (published.length > 0) {
    console.log('\n  Recent publishes:');
    for (const e of published) console.log(`    - ${e.slug} (${e.keyword})`);
  }
  if (failed.length > 0) {
    console.log('\n  Failures:');
    for (const e of failed) console.log(`    - ${e.keyword}: ${e.error?.slice(0, 60)}`);
  }
  console.log('');
  process.exit(0);
}

// Send via Resend
if (!RESEND_API_KEY) {
  printError('RESEND_API_KEY not set in .env');
  printInfo('Add RESEND_API_KEY to your .env file');
  printInfo('Get one at https://resend.com');
  process.exit(1);
}

try {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Blog Automation <blog@tradersyard.com>',
      to: [REPORT_TO],
      subject: `Blog Report: ${published.length} published, ${queuedCount} queued (${reportDate})`,
      html: emailHtml,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    printSuccess(`Report sent to ${REPORT_TO}`);
    printInfo(`Resend ID: ${data.id}`);
  } else {
    const text = await res.text();
    printError(`Resend API error ${res.status}: ${text.slice(0, 200)}`);
  }
} catch (err) {
  printError(`Send failed: ${err.message}`);
}

console.log('');
