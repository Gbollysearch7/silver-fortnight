import { readFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
const creds = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH, 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
const sc = google.searchconsole({ version: 'v1', auth });
const site = GSC_SITE_URL || 'sc-domain:tradersyard.com';
const fmt = d => d.toISOString().slice(0, 10);
const start = fmt(new Date(Date.now() - 92 * 864e5)), end = fmt(new Date(Date.now() - 2 * 864e5));

for (const probe of ['calculator', 'crypto', 'tax', 'alternative', 'tick value', 'margin', 'payout method', 'paypal', 'trading hours', 'agenatrader', 'ninjatrader', 'under $', 'cheap']) {
  const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: start, endDate: end, dimensions: ['query'], rowLimit: 6, dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'contains', expression: probe }] }] } });
  const rows = (r.data.rows || []).sort((a, b) => b.impressions - a.impressions);
  const tot = rows.reduce((a, x) => a + x.impressions, 0);
  console.log(`\n"${probe}" — queries:${rows.length}${rows.length===6?'+':''} imp(top6):${tot}`);
  for (const row of rows.slice(0, 4)) console.log(`   ${row.keys[0].slice(0, 60).padEnd(60)} imp:${row.impressions} pos:${row.position.toFixed(0)}`);
}
