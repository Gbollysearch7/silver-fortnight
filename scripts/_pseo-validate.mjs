import { getKeywordMetrics } from '../lib/seranking.mjs';
import { writeFileSync } from 'fs';

// candidate keywords per NEW programmatic type (sample per type to validate the pattern)
const TYPES = {
  'payout-method (firm pays via X)': [
    'prop firm crypto payout','prop firms that pay in crypto','prop firm payout methods',
    'prop firm bitcoin payout','prop firm usdt payout','prop firm bank transfer payout',
  ],
  'calculator-per-symbol (tool pages)': [
    'nas100 lot size calculator','gold lot size calculator','us30 lot size calculator',
    'es futures position size calculator','nq position size calculator','eurusd lot size calculator',
    'futures tick value calculator','risk of ruin calculator trading',
  ],
  'futures-contract-specs (symbol pages)': [
    'nq futures margin requirements','es futures tick value','mnq tick value',
    'gold futures contract size','crude oil futures margin','micro futures contract specs',
  ],
  'price-point (challenges under $X)': [
    'prop firm challenge under 50','cheap prop firm challenges','prop firms under 100 dollars',
    'most affordable prop firm','prop firm discounts',
  ],
  'tax-by-country (YMYL, careful)': [
    'prop firm taxes germany','prop trading taxes uk','funded trader taxes usa',
    'prop firm income tax','do prop traders pay tax',
  ],
  'competitor-alternatives (decision needed)': [
    'ftmo alternatives','topstep alternatives','apex trader funding alternatives',
    'prop firms like ftmo','best ftmo alternative',
  ],
  'legality-by-country (extend geo)': [
    'are prop firms legal in india','are prop firms legal in usa','prop trading legal in uk',
    'are prop firms legal in canada','are prop firms legal in australia',
  ],
  'question-mining (PAA long tail)': [
    'can prop firms see your strategy','do prop firms copy your trades','why do prop firms exist',
    'can you have multiple prop firm accounts','do prop firms work with swing traders',
  ],
};

const allKw = Object.values(TYPES).flat();
console.log('querying', allKw.length, 'keywords via SE Ranking...');
const metrics = await getKeywordMetrics(allKw);
const bySlug = {};
for (const m of metrics || []) bySlug[(m.keyword || '').toLowerCase()] = m;

const out = {};
for (const [type, kws] of Object.entries(TYPES)) {
  out[type] = kws.map(k => {
    const m = bySlug[k.toLowerCase()] || {};
    return { kw: k, vol: m.volume ?? null, kd: m.difficulty ?? null, cpc: m.cpc ?? null };
  });
  console.log('\n== ' + type);
  for (const r of out[type]) console.log(`   ${r.kw.padEnd(46)} vol:${String(r.vol).padStart(6)} kd:${String(r.kd).padStart(4)}`);
}
writeFileSync('data/pseo-expansion-validation.json', JSON.stringify(out, null, 1));
console.log('\nsaved data/pseo-expansion-validation.json');
