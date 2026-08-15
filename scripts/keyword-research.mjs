#!/usr/bin/env node
// SE Ranking keyword research — discover traffic-winnable keywords for the blog.
//
// Usage:
//   node scripts/keyword-research.mjs --seeds "prop firm,funded account,forex trading" \
//        --types similar,questions --limit 100 --max-difficulty 25 --min-volume 30 --out data/keyword-research.json
//
// Defaults are tuned for a young blog chasing traffic: low difficulty, low-mid volume,
// informational/commercial intent. Outputs a ranked JSON file + a console summary.

import { resolve } from 'path';
import { discoverKeywords, getKeywordMetrics } from '../lib/seranking.mjs';
import { ROOT_DIR } from '../lib/config.mjs';
import {
  parseArgs, writeJsonFile, slugify,
  printHeader, printSection, printSuccess, printInfo, printWarning, printTable,
} from '../lib/utils.mjs';

const args = parseArgs();

const DEFAULT_SEEDS = [
  'prop firm', 'prop trading', 'funded account', 'funded trader',
  'trading challenge', 'forex prop firm', 'futures prop firm',
];

const seeds = (args.seeds ? String(args.seeds).split(',') : DEFAULT_SEEDS).map((s) => s.trim()).filter(Boolean);
const types = (args.types ? String(args.types).split(',') : ['similar', 'questions', 'related']).map((s) => s.trim());
const source = args.source || 'us';
const limit = parseInt(args.limit || '100', 10);
const maxDifficulty = parseInt(args['max-difficulty'] || '25', 10);
const minVolume = parseInt(args['min-volume'] || '30', 10);
const maxVolume = parseInt(args['max-volume'] || '3000', 10);
const outPath = resolve(ROOT_DIR, args.out || 'data/keyword-research.json');

// Score a keyword for "traffic-winnability". Higher = better.
// Reward volume, punish difficulty hard, slight bonus for snippet/PAA opportunities and I/C intent.
function score(kw) {
  const vol = kw.volume || 0;
  const diff = kw.difficulty ?? 100;
  const intentBonus = (kw.intents || []).some((i) => i === 'I' || i === 'C') ? 1.15 : 1.0;
  const features = kw.serp_features || [];
  const snippetBonus = features.includes('featured_snippets') || features.includes('people_also_ask') ? 1.1 : 1.0;
  // volume / (difficulty+5) is the core ratio; +5 avoids divide-by-zero blow-ups on diff=0
  return Math.round((vol / (diff + 5)) * intentBonus * snippetBonus * 10) / 10;
}

async function main() {
  printHeader('SE Ranking Keyword Research');
  printInfo(`Seeds: ${seeds.join(', ')}`);
  printInfo(`Types: ${types.join(', ')} | source=${source} | limit=${limit}/call`);
  printInfo(`Filter: difficulty ≤ ${maxDifficulty}, volume ${minVolume}–${maxVolume}`);

  const seen = new Map(); // keyword -> best record

  for (const seed of seeds) {
    for (const type of types) {
      try {
        const res = await discoverKeywords(seed, type, {
          source, limit, sort: 'volume', sortOrder: 'desc',
          filters: { volume: [minVolume, maxVolume], difficulty: [0, maxDifficulty] },
        });
        const found = res.keywords || [];
        printInfo(`  ${seed} → ${type}: ${found.length} kept (of ${res.total ?? '?'} total)`);
        for (const k of found) {
          const key = k.keyword.toLowerCase().trim();
          const enriched = { ...k, seed, type, score: score(k) };
          // Keep the highest-scoring version if the same keyword surfaces from multiple seeds
          if (!seen.has(key) || enriched.score > seen.get(key).score) seen.set(key, enriched);
        }
      } catch (err) {
        printWarning(`  ${seed} → ${type} failed: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 300)); // stay under 5 req/s
    }
  }

  let results = [...seen.values()].sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    printWarning('No keywords passed the filters. Loosen --max-difficulty or --min-volume.');
    return;
  }

  // Output
  const payload = {
    generated_at: new Date().toISOString(),
    source,
    seeds,
    filters: { maxDifficulty, minVolume, maxVolume },
    total: results.length,
    keywords: results.map((k) => ({
      keyword: k.keyword,
      slug: slugify(k.keyword),
      volume: k.volume,
      difficulty: k.difficulty,
      cpc: k.cpc,
      competition: k.competition,
      intents: k.intents,
      serp_features: k.serp_features,
      seed: k.seed,
      discovered_via: k.type,
      score: k.score,
    })),
  };
  writeJsonFile(outPath, payload);

  printSection(`Top 30 traffic-winnable keywords (of ${results.length})`);
  printTable(
    ['Keyword', 'Vol', 'Diff', 'Intent', 'Score'],
    results.slice(0, 30).map((k) => [
      k.keyword.slice(0, 45),
      String(k.volume),
      String(k.difficulty),
      (k.intents || []).join('/'),
      String(k.score),
    ]),
  );

  const totalVol = results.reduce((s, k) => s + (k.volume || 0), 0);
  printSuccess(`Saved ${results.length} keywords to ${outPath}`);
  printInfo(`Combined monthly search volume: ${totalVol.toLocaleString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
