// Native, self-contained calculators (inline JS, no external deps) — Webflow-rich-text safe.
// Style matches TradersYard dark theme via inline styles.
import { writeFileSync } from 'fs';

const wrap = (id, inner) => `<div id="${id}" style="background:#16161f;border:1px solid #2d2d44;border-radius:14px;padding:24px;margin:8px 0 24px;font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#e2e8f0;max-width:560px">${inner}</div>`;
const field = (label, id, val, attrs='') => `<label style="display:block;margin:12px 0 4px;font-size:13px;color:#94a3b8;font-weight:600">${label}</label><input id="${id}" type="number" value="${val}" ${attrs} style="width:100%;padding:10px 12px;border:1px solid #2d2d44;border-radius:8px;background:#12121a;color:#e2e8f0;font-size:15px;box-sizing:border-box">`;
const select = (label, id, opts) => `<label style="display:block;margin:12px 0 4px;font-size:13px;color:#94a3b8;font-weight:600">${label}</label><select id="${id}" style="width:100%;padding:10px 12px;border:1px solid #2d2d44;border-radius:8px;background:#12121a;color:#e2e8f0;font-size:15px">${opts}</select>`;
const out = (id) => `<div style="margin-top:18px;padding:16px;background:#12121a;border:1px solid #4250eb;border-radius:10px"><div id="${id}" style="font-size:15px;line-height:1.7"></div></div>`;
const btn = (fn) => `<button onclick="${fn}" style="margin-top:16px;width:100%;padding:12px;background:#4250eb;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer">Calculate</button>`;

const calcs = {
'forex-lot-size-calculator': wrap('tyCalc', `<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Forex Lot Size Calculator</h3>
${field('Account Balance ($)','b',5000)}${field('Risk %','r',1,'step=0.1')}${field('Stop Loss (pips)','sl',20)}${field('Pip Value per Standard Lot ($)','pv',10)}
${btn('tyLot()')}${out('o')}
<script>function tyLot(){var b=+document.getElementById('b').value,r=+document.getElementById('r').value,sl=+document.getElementById('sl').value,pv=+document.getElementById('pv').value,o=document.getElementById('o');if(b<=0||r<=0||sl<=0||pv<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Enter positive values for all fields.</span>';return;}var risk=b*r/100,lots=risk/(sl*pv);o.innerHTML='<b>Risk amount:</b> $'+risk.toFixed(2)+'<br><b>Position size:</b> '+lots.toFixed(2)+' standard lots ('+(lots*10).toFixed(2)+' mini / '+(lots*100).toFixed(0)+' micro)';}tyLot();</script>`),

'trading-position-size-calculator': wrap('tyCalc', `<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Position Size Calculator</h3>
${field('Account Balance ($)','b',10000)}${field('Risk %','r',1,'step=0.1')}${field('Entry Price','e',100,'step=any')}${field('Stop Loss Price','s',98,'step=any')}
${btn('tyPos()')}${out('o')}
<script>function tyPos(){var b=+document.getElementById('b').value,r=+document.getElementById('r').value,e=+document.getElementById('e').value,s=+document.getElementById('s').value,o=document.getElementById('o');var diff=Math.abs(e-s);if(b<=0||r<=0||diff<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Entry and stop must differ; values positive.</span>';return;}var risk=b*r/100,units=risk/diff;o.innerHTML='<b>Risk amount:</b> $'+risk.toFixed(2)+'<br><b>Risk per unit:</b> $'+diff.toFixed(4)+'<br><b>Position size:</b> '+units.toFixed(2)+' units / shares';}tyPos();</script>`),

'risk-reward-ratio-calculator': wrap('tyCalc', `<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Risk/Reward Ratio Calculator</h3>
${field('Entry Price','e',100,'step=any')}${field('Stop Loss','s',95,'step=any')}${field('Take Profit','t',115,'step=any')}
${btn('tyRR()')}${out('o')}
<script>function tyRR(){var e=+document.getElementById('e').value,s=+document.getElementById('s').value,t=+document.getElementById('t').value,o=document.getElementById('o');var risk=Math.abs(e-s),rew=Math.abs(t-e);if(risk<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Stop loss must differ from entry.</span>';return;}var rr=rew/risk;o.innerHTML='<b>Risk:</b> '+risk.toFixed(2)+' &nbsp; <b>Reward:</b> '+rew.toFixed(2)+'<br><b>Risk/Reward ratio:</b> 1 : '+rr.toFixed(2)+'<br><b>Breakeven win rate:</b> '+(100/(1+rr)).toFixed(1)+'%';}tyRR();</script>`),

'risk-management-calculator': wrap('tyCalc', `<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Risk Management Calculator</h3>
${field('Account Balance ($)','b',10000)}${field('Risk % per trade','r',1,'step=0.1')}${field('Number of open trades','n',3)}
${btn('tyRisk()')}${out('o')}
<script>function tyRisk(){var b=+document.getElementById('b').value,r=+document.getElementById('r').value,n=+document.getElementById('n').value,o=document.getElementById('o');if(b<=0||r<=0||n<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Enter positive values.</span>';return;}var per=b*r/100,total=per*n,pct=r*n;o.innerHTML='<b>Risk per trade:</b> $'+per.toFixed(2)+'<br><b>Total exposure ('+n+' trades):</b> $'+total.toFixed(2)+' ('+pct.toFixed(1)+'% of account)'+(pct>5?'<br><span style=\\'color:#fbbf24\\'>⚠ Over 5% total exposure — high risk.</span>':'<br><span style=\\'color:#4ade80\\'>✓ Within a conservative risk budget.</span>');}tyRisk();</script>`),

'pip-value-converter': wrap('tyCalc', `<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Pip Value Calculator</h3>
${field('Lot Size (standard lots)','l',1,'step=0.01')}${select('Pair type','p','<option value=10>Standard pair (e.g. EUR/USD) — $10/pip per lot</option><option value=9.1>JPY pair (approx)</option><option value=1>Custom (set below)</option>')}${field('Custom pip value per lot ($) — if Custom','c',10)}
${btn('tyPip()')}${out('o')}
<script>function tyPip(){var l=+document.getElementById('l').value,p=+document.getElementById('p').value,c=+document.getElementById('c').value,o=document.getElementById('o');var base=p===1?c:p;if(l<=0||base<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Enter positive values.</span>';return;}var v=l*base;o.innerHTML='<b>Pip value:</b> $'+v.toFixed(2)+' per pip<br><span style=\\'color:#94a3b8;font-size:13px\\'>For '+l+' lot(s). 10 pips = $'+(v*10).toFixed(2)+'.</span>';}tyPip();</script>`),

'trading-profit-calculator': wrap('tyCalc', `<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Trading Profit Calculator</h3>
${field('Entry Price','e',100,'step=any')}${field('Exit Price','x',110,'step=any')}${field('Position Size (units/lots)','q',100,'step=any')}${select('Direction','d','<option value=1>Long (buy)</option><option value=-1>Short (sell)</option>')}
${btn('tyProfit()')}${out('o')}
<script>function tyProfit(){var e=+document.getElementById('e').value,x=+document.getElementById('x').value,q=+document.getElementById('q').value,d=+document.getElementById('d').value,o=document.getElementById('o');if(q<=0||e<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Enter positive values.</span>';return;}var pl=(x-e)*q*d,pct=(x-e)/e*100*d;o.innerHTML='<b>P/L:</b> <span style=\\'color:'+(pl>=0?'#4ade80':'#f87171')+'\\'>'+(pl>=0?'+':'')+'$'+pl.toFixed(2)+'</span><br><b>Return:</b> '+(pct>=0?'+':'')+pct.toFixed(2)+'%';}tyProfit();</script>`),

'trading-performance-analyzer': wrap('tyCalc', `<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Trading Performance Analyzer</h3>
${field('Total trades','n',50)}${field('Winning trades','w',28)}${field('Average win ($)','aw',150)}${field('Average loss ($)','al',90)}
${btn('tyPerf()')}${out('o')}
<script>function tyPerf(){var n=+document.getElementById('n').value,w=+document.getElementById('w').value,aw=+document.getElementById('aw').value,al=+document.getElementById('al').value,o=document.getElementById('o');if(n<=0||w<0||w>n){o.innerHTML='<span style=\\'color:#f87171\\'>Wins must be between 0 and total trades.</span>';return;}var wr=w/n*100,l=n-w,net=w*aw-l*al,pf=(l*al)>0?(w*aw)/(l*al):Infinity,exp=(w*aw-l*al)/n;o.innerHTML='<b>Win rate:</b> '+wr.toFixed(1)+'%<br><b>Net P/L:</b> <span style=\\'color:'+(net>=0?'#4ade80':'#f87171')+'\\'>'+(net>=0?'+':'')+'$'+net.toFixed(2)+'</span><br><b>Profit factor:</b> '+(pf===Infinity?'∞':pf.toFixed(2))+'<br><b>Expectancy:</b> $'+exp.toFixed(2)+'/trade';}tyPerf();</script>`),

'trading-journal-template': wrap('tyCalc', `<h3 style="margin:0 0 4px;font-size:18px;color:#fff">Trade Journal — Quick R-Multiple Logger</h3>
<p style="font-size:13px;color:#94a3b8;margin:4px 0 0">Enter a trade's risk and result to see its R-multiple. (For a full downloadable journal, copy these columns into a spreadsheet: Date, Pair, Direction, Entry, Stop, Exit, Risk $, P/L $, R-multiple, Notes.)</p>
${field('Risk on trade ($)','r',100)}${field('Profit / Loss ($)','p',250,'step=any')}
${btn('tyJrnl()')}${out('o')}
<script>function tyJrnl(){var r=+document.getElementById('r').value,p=+document.getElementById('p').value,o=document.getElementById('o');if(r<=0){o.innerHTML='<span style=\\'color:#f87171\\'>Risk must be positive.</span>';return;}var rm=p/r;o.innerHTML='<b>R-multiple:</b> <span style=\\'color:'+(rm>=0?'#4ade80':'#f87171')+'\\'>'+(rm>=0?'+':'')+rm.toFixed(2)+'R</span><br><span style=\\'color:#94a3b8;font-size:13px\\'>'+(rm>=2?'Strong trade — reward ≥ 2x risk.':rm>=0?'Profitable, but aim for ≥ 2R.':'Loss — review your setup.')+'</span>';}tyJrnl();</script>`),
};

writeFileSync('data/calculators.json', JSON.stringify(calcs,null,2));
console.log('Built',Object.keys(calcs).length,'native calculators');
Object.entries(calcs).forEach(([k,v])=>console.log('  '+k+'  ('+v.length+' chars)'));
