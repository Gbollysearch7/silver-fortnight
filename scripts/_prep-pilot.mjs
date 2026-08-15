import { readFileSync, writeFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
const pilotSlugs=['can-you-swing-trade-on-prop-firms-40bab','how-many-prop-firms-are-there','how-many-people-get-payouts-from-prop-firms-a8fe0'];
const targets={'can-you-swing-trade-on-prop-firms-40bab':'prop firms that let you swing trade','how-many-prop-firms-are-there':'how many forex prop firms are there','how-many-people-get-payouts-from-prop-firms-a8fe0':'what percentage of traders get a payout from prop firms'};
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const pilot=[];
for(const slug of pilotSlugs){
  const it=all.find(x=>x.fieldData.slug===slug);if(!it){console.log('missing',slug);continue;}
  const body=it.fieldData['post-body']||'';
  pilot.push({slug,id:it.id,title:(it.fieldData.name||'').replace(/\s*\|\s*TradersYard.*/,''),target:targets[slug],
    words:body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length,body});
}
writeFileSync('data/pilot-posts.json',JSON.stringify(pilot));
console.log('Pilot prepared:',pilot.length,'posts');
pilot.forEach(p=>console.log('  '+p.words+'w · "'+p.target+'" · '+p.slug));
