import { readFileSync, writeFileSync } from 'fs';
const calcs=JSON.parse(readFileSync('data/calculators.json','utf8'));
const wrap=(id,inner)=>`<div id="${id}" style="background:#16161f;border:1px solid #2d2d44;border-radius:14px;padding:24px;margin:16px 0;font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#e2e8f0;max-width:560px">${inner}</div>`;
const field=(l,id,v,a='')=>`<label style="display:block;margin:12px 0 4px;font-size:13px;color:#94a3b8;font-weight:600">${l}</label><input id="${id}" type="number" value="${v}" ${a} style="width:100%;padding:10px 12px;border:1px solid #2d2d44;border-radius:8px;background:#12121a;color:#e2e8f0;font-size:15px;box-sizing:border-box">`;
const btn=fn=>`<button onclick="${fn}" style="margin-top:16px;width:100%;padding:12px;background:#4250eb;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer">Calculate</button>`;
const out=id=>`<div style="margin-top:18px;padding:16px;background:#12121a;border:1px solid #4250eb;border-radius:10px"><div id="${id}" style="font-size:15px;line-height:1.7"></div></div>`;

// DRAWDOWN calculator
calcs['drawdown']=wrap('tyCalc',`<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Drawdown Calculator</h3>
${field('Account Size ($)','b',50000)}${field('Max Drawdown %','d',10,'step=0.1')}${field('Daily Loss Limit %','dl',5,'step=0.1')}
${btn('tyDD()')}${out('o')}
<script>function tyDD(){var b=+document.getElementById('b').value,d=+document.getElementById('d').value,dl=+document.getElementById('dl').value,o=document.getElementById('o');if(b<=0||d<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Enter positive values.</span>';return;}var maxLoss=b*d/100,floor=b-maxLoss,daily=b*dl/100;o.innerHTML='<b>Max you can lose:</b> $'+maxLoss.toLocaleString()+'<br><b>Account floor (breach below):</b> $'+floor.toLocaleString()+'<br><b>Daily loss limit:</b> $'+daily.toLocaleString();}tyDD();</script>`);

// PROFIT SPLIT calculator (TY tiered 100/90/80)
calcs['profit-split']=wrap('tyCalc',`<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Profit Split Calculator</h3>
${field('Your Profit ($)','p',1200)}${field('Flat Split % (or use tiered below)','s',80,'step=1')}
${btn('tySplit()')}${out('o')}
<script>function tySplit(){var p=+document.getElementById('p').value,s=+document.getElementById('s').value,o=document.getElementById('o');if(p<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Enter a positive profit.</span>';return;}var flat=p*s/100;var t=0;if(p<=300)t=p;else if(p<=1000)t=300+(p-300)*0.9;else t=300+700*0.9+(p-1000)*0.8;o.innerHTML='<b>At a flat '+s+'% split:</b> $'+flat.toFixed(2)+' to you<br><b>On a tiered 100/90/80 split (e.g. TradersYard):</b> $'+t.toFixed(2)+' to you<br><span style=\\'color:#94a3b8;font-size:13px\\'>Tiered keeps 100% of your first $300, 90% to $1,000, 80% above.</span>';}tySplit();</script>`);

// PROFIT TARGET calculator
calcs['profit-target']=wrap('tyCalc',`<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Profit Target Calculator</h3>
${field('Account Size ($)','b',50000)}${field('Profit Target %','t',8,'step=0.1')}${field('Trading Days Available','d',30)}
${btn('tyPT()')}${out('o')}
<script>function tyPT(){var b=+document.getElementById('b').value,t=+document.getElementById('t').value,d=+document.getElementById('d').value,o=document.getElementById('o');if(b<=0||t<=0||d<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Enter positive values.</span>';return;}var target=b*t/100,perDay=target/d;o.innerHTML='<b>Profit needed to pass:</b> $'+target.toLocaleString()+'<br><b>Avg per trading day:</b> $'+perDay.toFixed(2)+' ('+(perDay/b*100).toFixed(2)+'%/day)';}tyPT();</script>`);

// CONSISTENCY RULE calculator (40% rule)
calcs['consistency']=wrap('tyCalc',`<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Consistency Rule Calculator</h3>
${field('Total Closed Profit ($)','t',10000)}${field('Your Best Day Profit ($)','bd',3000)}${field('Consistency Limit %','c',40,'step=1')}
${btn('tyCons()')}${out('o')}
<script>function tyCons(){var t=+document.getElementById('t').value,bd=+document.getElementById('bd').value,c=+document.getElementById('c').value,o=document.getElementById('o');if(t<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Enter total profit.</span>';return;}var pct=bd/t*100,ok=pct<=c;var needed=bd/(c/100);o.innerHTML='<b>Your best day is</b> '+pct.toFixed(1)+'% of total profit<br><b style=\\'color:'+(ok?'#4ade80':'#fbbf24')+'\\'>'+(ok?'✓ Passes the '+c+'% consistency rule':'⚠ Exceeds '+c+'% — need $'+needed.toFixed(0)+' total profit to comply')+'</b>';}tyCons();</script>`);

// PAYOUT TIMING (informational)
calcs['payout-timing']=wrap('tyCalc',`<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Payout Timeline Estimator</h3>
${field('Payout Cycle (days)','cy',14)}${field('Days Into Current Cycle','di',5)}${field('KYC + Processing (days)','kp',2)}
${btn('tyPay()')}${out('o')}
<script>function tyPay(){var cy=+document.getElementById('cy').value,di=+document.getElementById('di').value,kp=+document.getElementById('kp').value,o=document.getElementById('o');if(cy<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Enter a cycle length.</span>';return;}var left=Math.max(0,cy-di);o.innerHTML='<b>Days until you can request:</b> '+left+'<br><b>Then processing:</b> ~'+kp+' business days<br><b>Estimated total wait:</b> ~'+(left+kp)+' days<br><span style=\\'color:#94a3b8;font-size:13px\\'>Complete KYC early to avoid adding delay.</span>';}tyPay();</script>`);

writeFileSync('data/calculators.json',JSON.stringify(calcs,null,2));
console.log('Calculator library now has:',Object.keys(calcs).length,'types');
Object.keys(calcs).forEach(k=>console.log('  - '+k));
