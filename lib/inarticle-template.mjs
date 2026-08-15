/**
 * In-article section-banner template — TradersYard brand (navy + electric blue).
 *
 * A horizontal banner (~680x300, renders at 2x) placed under an H2 heading:
 * the section heading on the left, a topic-matched motif on the right. Same
 * brand system + motif library as the thumbnails, just a wider layout.
 *
 * Pixel-perfect text + real logo-free brand styling, $0, reproducible.
 */

import { BRAND, MOTIFS, seedFromSlug } from './thumbnail-template.mjs';

// Section-heading keyword → motif (50-motif library). Order = specific first.
const SECTION_MOTIF = [
  [/profit.split|allocat|distribut|percentage|\bsplit\b/, 'pie'],
  [/first payout|receiv|get paid|withdraw to/, 'receive'],
  [/payout|withdraw|paid|salary|income|cash.?out/, 'coins'],
  [/activation fee|\bfee\b|cost|price|how much|pay/, 'coin'],
  [/account size|funded account|how much capital|balance/, 'wallet'],
  [/fund|capital|deposit|financ/, 'bank'],
  [/kyc|identity|proof of|id check/, 'lock'],
  [/verif|verified|approv/, 'badge'],
  [/checklist|requirement|steps to|what you need|to-?do/, 'checklist'],
  [/rule|policy|agreement|contract|terms|\bpdf\b|template|consisten|journal|log/, 'doc'],
  [/compliance|safe|secur|protect|guarantee/, 'shield'],
  [/regulat|legal|license|official|country|countries|jurisdiction/, 'globe'],
  [/calculat|formula|math|ratio|measure/, 'gauge'],
  [/leverage|lot size|position siz/, 'sliders'],
  [/statistic|\bdata\b|performance|report|metric|number/, 'stats'],
  [/scal|tier|level.?up|advance/, 'ladder'],
  [/grow|growth|increase|compound|earn more/, 'growth'],
  [/roadmap|journey|path|process|step.by.step|how to get/, 'roadmap'],
  [/minimum.day|days rule|how many days|holding period/, 'calendar'],
  [/how long|timeline|schedule|processing time|duration|wait/, 'hourglass'],
  [/weekend|hold over|overnight|expire|deadline|when do/, 'clock'],
  [/fast|instant|quick|speed|same day/, 'stopwatch'],
  [/automat|\bea\b|expert advisor|\bbot\b|algo|robot/, 'bolt'],
  [/drawdown|max loss|trailing/, 'candles'],
  [/risk|mistake|avoid|danger|warning|don.?t|pitfall|fail/, 'warning'],
  [/stop.?loss|cut loss|protect capital/, 'shield'],
  [/compar|versus|\bvs\b|differ|which is better/, 'scales'],
  [/best|top \d|rating|rank|leaderboard/, 'grid'],
  [/review|honest|pros and cons|\bpros\b|\bcons\b|verdict/, 'scales'],
  [/social|communit|copy trad|together|network|share/, 'network'],
  [/deal|partner|offer|discount|promo|coupon|code/, 'megaphone'],
  [/challenge|evaluation|phase|pass the|first try/, 'target'],
  [/precision|accuracy|entry|setup|sniper/, 'crosshair'],
  [/milestone|reach|achiev|success|\bwin\b|complete|congrat/, 'trophy'],
  [/qualif|get funded|unlock|access|approv|accepted/, 'key'],
  [/retry|second chance|reset|re-?attempt|try again|restart/, 'refresh'],
  [/mindset|psycholog|disciplin|emotion|mental|patience/, 'brain'],
  [/strategy|plan|direction|approach|system|method/, 'compass'],
  [/research|find|choose|select|how to pick|search/, 'search'],
  [/launch|start|begin|get started|kick.?off/, 'rocket'],
  [/bullish|uptrend|going up|momentum|winning streak/, 'bull'],
  [/option|choice|which one|types of|kinds of|variet/, 'layers'],
  [/solve|solution|fit|piece|figure out|understand how/, 'puzzle'],
  [/premium|elite|high.?value|top tier|exclusive|vip/, 'diamond'],
  [/buffer|capacity|room left|how much left|remaining/, 'battery'],
  [/learn|education|understand|what is|basics|introduction|beginner|explain|mean|definition/, 'book'],
  [/chart|trend|market|price|analysis|technical/, 'candles'],
  [/return|profit|\bgains?\b/, 'area'],
  [/agreement|handshake|both parties|sign up/, 'deal'],
  [/configure|setting|customi|adjust|tune/, 'sliders'],
];

// Varied fallback pool so untyped sections still rotate widely.
const FALLBACK_POOL = [
  'candles', 'area', 'gauge', 'bull', 'stats', 'compass', 'roadmap', 'globe',
  'flag', 'network', 'rocket', 'brain', 'puzzle', 'layers', 'diamond', 'badge',
];

function pickSectionMotif(heading = '', seed = 0) {
  const h = heading.toLowerCase();
  for (const [re, m] of SECTION_MOTIF) if (re.test(h)) return m;
  return FALLBACK_POOL[seed % FALLBACK_POOL.length];
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Trim an over-long heading so it fits two lines on the banner.
function fitHeading(h = '') {
  h = h.replace(/[#*_`]/g, '').trim();
  if (h.length > 64) h = h.slice(0, 61).trim() + '…';
  return h;
}

export function buildInArticleHTML({ heading, slug = '', index = 0, label = 'TRADERSYARD' }) {
  const seed = seedFromSlug(slug + ':' + index);
  const motifKey = pickSectionMotif(heading, seed);
  const motifSvg = (MOTIFS[motifKey] || MOTIFS.candles)();
  const text = escapeHtml(fitHeading(heading));

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Geist+Mono:wght@500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:420px; }
  .banner {
    width:1200px; height:420px; position:relative; overflow:hidden; border-radius:18px;
    background:
      radial-gradient(900px 420px at 90% 20%, rgba(66,80,235,0.20), transparent 62%),
      linear-gradient(135deg, ${BRAND.navy1} 0%, ${BRAND.navy3} 60%, ${BRAND.navy2} 100%);
    font-family:'Inter',sans-serif; display:flex; align-items:stretch;
    border:1px solid rgba(66,80,235,0.18);
  }
  .left { flex:1 1 58%; display:flex; flex-direction:column; justify-content:center; padding:48px 0 48px 64px; z-index:2; min-width:0; }
  .kicker { font-family:'Geist Mono',monospace; font-size:16px; font-weight:500; letter-spacing:0.16em;
    color:#9aa3ff; margin-bottom:20px; display:flex; align-items:center; gap:12px; }
  .kicker .dot { width:10px; height:10px; border-radius:999px; background:${BRAND.blue}; display:inline-block; }
  h2 { font-family:'Inter',sans-serif; font-weight:800; font-size:46px; line-height:1.12; letter-spacing:-0.02em;
    color:#f8fafc; margin:0; max-width:18ch; }
  .rule { width:72px; height:4px; background:${BRAND.blue}; border-radius:3px; margin-top:28px; }
  .right { flex:1 1 42%; position:relative; z-index:1; display:flex; align-items:center; justify-content:center; padding:28px 40px 28px 0; min-width:0; }
  .right svg { width:auto; height:300px; max-width:360px; }
</style></head>
<body>
  <div class="banner">
    <div class="left">
      <div class="kicker"><span class="dot"></span>${escapeHtml(label)}</div>
      <h2>${text}</h2>
      <div class="rule"></div>
    </div>
    <div class="right">${motifSvg}</div>
  </div>
</body></html>`;
}
