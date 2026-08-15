import { readFileSync, writeFileSync } from 'fs';
import { publishItems } from '../lib/webflow.mjs';

const dedup3 = JSON.parse(readFileSync('data/dedup3-plan.json', 'utf8'));
const keepers = new Set(dedup3.map(p => p.keeper).filter(Boolean));
const ko = JSON.parse(readFileSync('data/unpublished-keepout.json', 'utf8'));

// any keep-out entry whose slug is a dedup3 KEEPER is a stale June decision — remove it
const conflicted = ko.items.filter(i => keepers.has(i.slug));
ko.items = ko.items.filter(i => !keepers.has(i.slug));
ko.note += ' CONFLICT RULE: where round-2 and round-3 disagree on a pair, round 3 (02 Jul, fresh GSC) wins; stale round-2 kill entries for round-3 keepers were removed 02 Jul.';
ko.updatedAt = new Date().toISOString();
writeFileSync('data/unpublished-keepout.json', JSON.stringify(ko, null, 1));
console.log('removed stale keep-out entries:', conflicted.map(c => c.slug));

// republish the wrongly-killed keepers (guard now allows them)
const ids = conflicted.map(c => c.id);
if (ids.length) await publishItems(ids);
console.log('republished', ids.length, 'keeper pages');

for (const c of conflicted) {
  const r = await fetch('https://tradersyard.com/blog-posts/' + c.slug, { method: 'HEAD', redirect: 'manual' });
  console.log(r.status, c.slug);
}
console.log('final keep-out size:', ko.items.length);
