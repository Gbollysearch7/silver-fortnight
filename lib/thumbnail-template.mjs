/**
 * Thumbnail HTML template — TradersYard brand (navy + electric blue).
 *
 * Renders a self-contained HTML string that Puppeteer screenshots into a
 * pixel-perfect 1200x630 (16:9) thumbnail. Text uses real web fonts, the logo
 * is the real PNG embedded as base64 — zero AI drift.
 *
 * Variation: a category-keyed SVG motif library + slug-seeded accent rotation.
 */

// --- Brand tokens ---
export const BRAND = {
  navy1: '#0F172A',
  navy2: '#16161f',
  navy3: '#1a1a2e',
  blue: '#4250eb',
  blueSoft: '#5b67ee',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  border: '#2d2d44',
  green: '#4ade80',
};

// --- Deterministic seed from slug ---
export function seedFromSlug(slug = '') {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

// --- Category → label + a POOL of motifs (slug seed picks one) ---
// Pools mix topical motifs with universal trading motifs so even a 26-post
// category never repeats the same illustration. A topic-keyword override
// (below) still wins when the title clearly signals a specific motif.
const CATEGORY = {
  'prop-firm-guides':     { label: 'PROP FIRM GUIDE', motifs: ['bars', 'candles', 'area', 'gauge', 'steps'] },
  'prop-firm-reviews':    { label: 'REVIEW',          motifs: ['grid', 'gauge', 'bars'] },
  'prop-firm-challenges': { label: 'CHALLENGE',       motifs: ['target', 'steps', 'candles'] },
  'funded-trading':       { label: 'FUNDED TRADING',  motifs: ['coins', 'area', 'steps', 'bars'] },
  'prop-firm-rules':      { label: 'RULES',           motifs: ['shield', 'gauge', 'grid'] },
  'trading-education':    { label: 'EDUCATION',       motifs: ['book', 'candles', 'area', 'gauge'] },
  default:                { label: 'TRADERSYARD',     motifs: ['bars', 'candles', 'area'] },
};

// Strong topic keywords → force a specific motif regardless of category, so a
// "calculator"/"payout"/"checklist" post always gets the right picture.
const KEYWORD_MOTIF = [
  [/payout|withdrawal|profit.split|earning|discount|refund|paid/, 'coins'],
  [/checklist|rule|kyc|verification|document|consistency/, 'shield'],
  [/calculator|spreadsheet|excel|template|journal|log|leverage|lot.size/, 'gauge'],
  [/scaling|grow|growth|tier|avalanche/, 'steps'],
  [/drawdown|loss.limit|risk|mistake/, 'candles'],
  [/vs |comparison|compare|review|myths|best /, 'grid'],
  [/skill|learn|education|guide|what.is|explained|how.to/, 'book'],
  [/challenge|evaluation|pass|fail/, 'target'],
];

function pickMotif(category, slug, title) {
  const text = `${slug} ${title}`.toLowerCase();
  for (const [re, m] of KEYWORD_MOTIF) if (re.test(text)) return m;
  const cat = CATEGORY[category] || CATEGORY.default;
  const pool = cat.motifs;
  return pool[seedFromSlug(slug) % pool.length];
}

// ---------------------------------------------------------------------------
// SVG motif library — clean isometric/line art in brand blue.
// Each returns an <svg> sized to sit in the right ~42% column.
// ---------------------------------------------------------------------------

const stroke = 'rgba(226,232,240,0.10)';

// Isometric ascending bars (guides) — last bar in blue = the goal
function motifBars() {
  return `<svg width="430" height="400" viewBox="-104 -188 464 420" preserveAspectRatio="xMidYMid meet">
  <g stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round">
    <polygon fill="#1f2540" points="64,32 0,64 0,8.8 64,-23.2"/><polygon fill="#283058" points="0,64 -64,32 -64,-23.2 0,8.8"/><polygon fill="#323c6e" points="0,-55.2 64,-23.2 0,8.8 -64,-23.2"/>
    <polygon fill="#1f2540" points="128,64 64,96 64,-0.6 128,-32.6"/><polygon fill="#283058" points="64,96 0,64 0,-32.6 64,-0.6"/><polygon fill="#323c6e" points="64,-64.6 128,-32.6 64,-0.6 0,-32.6"/>
    <polygon fill="#1f2540" points="192,96 128,128 128,-14.6 192,-46.6"/><polygon fill="#283058" points="128,128 64,96 64,-46.6 128,-14.6"/><polygon fill="#323c6e" points="128,-78.6 192,-46.6 128,-14.6 64,-46.6"/>
    <polygon fill="#1f2540" points="256,128 192,160 192,-37.8 256,-69.8"/><polygon fill="#283058" points="192,160 128,128 128,-69.8 192,-37.8"/><polygon fill="#323c6e" points="192,-101.8 256,-69.8 192,-37.8 128,-69.8"/>
    <polygon fill="#2f3ac4" points="320,160 256,192 256,-84 320,-116"/><polygon fill="#4250eb" points="256,192 192,160 192,-116 256,-84"/><polygon fill="#5b67ee" points="256,-148 320,-116 256,-84 192,-116"/>
  </g>
  <polyline points="0,-23.2 64,-32.6 128,-46.6 192,-69.8 256,-116" fill="none" stroke="#4250eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 9" opacity="0.9"/>
  <circle cx="256" cy="-148" r="22" fill="#0F172A" stroke="#4250eb" stroke-width="3"/>
  <text x="256" y="-148" text-anchor="middle" dominant-baseline="central" font-family="'Geist Mono',monospace" font-size="22" font-weight="600" fill="#4250eb">$</text>
</svg>`;
}

// Stacked coins + arrow (funded / payout)
function motifCoins() {
  const coin = (cx, cy) => `<ellipse cx="${cx}" cy="${cy}" rx="60" ry="26" fill="#1f2540" stroke="#4250eb" stroke-width="2"/><ellipse cx="${cx}" cy="${cy - 10}" rx="60" ry="26" fill="#283058" stroke="#4250eb" stroke-width="2"/>`;
  return `<svg width="420" height="400" viewBox="-40 -40 420 400" preserveAspectRatio="xMidYMid meet">
  ${coin(150, 300)}${coin(150, 250)}${coin(150, 200)}
  <ellipse cx="150" cy="140" rx="60" ry="26" fill="#2f3ac4"/><ellipse cx="150" cy="130" rx="60" ry="26" fill="#4250eb" stroke="#5b67ee" stroke-width="2"/>
  <text x="150" y="130" text-anchor="middle" dominant-baseline="central" font-family="'Geist Mono',monospace" font-size="30" font-weight="600" fill="#fff">$</text>
  <path d="M240 220 L300 120 L320 150 M300 120 L268 138" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Concentric target + dart (challenge)
function motifTarget() {
  return `<svg width="400" height="400" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
  <circle cx="200" cy="200" r="150" fill="none" stroke="#283058" stroke-width="18"/>
  <circle cx="200" cy="200" r="105" fill="none" stroke="#323c6e" stroke-width="18"/>
  <circle cx="200" cy="200" r="60" fill="none" stroke="#4250eb" stroke-width="18"/>
  <circle cx="200" cy="200" r="16" fill="#4250eb"/>
  <path d="M340 70 L210 195" stroke="#5b67ee" stroke-width="6" stroke-linecap="round"/>
  <path d="M340 70 L318 92 M340 70 L318 78 M340 70 L332 92" stroke="#5b67ee" stroke-width="5" stroke-linecap="round"/>
</svg>`;
}

// Shield + check (rules)
function motifShield() {
  return `<svg width="380" height="400" viewBox="0 0 380 400" preserveAspectRatio="xMidYMid meet">
  <path d="M190 40 L320 90 V210 C320 300 260 345 190 372 C120 345 60 300 60 210 V90 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <path d="M190 70 L292 110 V208 C292 280 244 318 190 342 C136 318 88 280 88 208 V110 Z" fill="none" stroke="#283058" stroke-width="2"/>
  <path d="M138 200 L178 242 L256 156" fill="none" stroke="#4250eb" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Open book + lightbulb (education)
function motifBook() {
  return `<svg width="420" height="380" viewBox="0 0 420 380" preserveAspectRatio="xMidYMid meet">
  <circle cx="210" cy="92" r="46" fill="none" stroke="#4250eb" stroke-width="4"/>
  <path d="M192 150 h36 M196 166 h28" stroke="#4250eb" stroke-width="4" stroke-linecap="round"/>
  <path d="M210 60 v18 M168 92 h-18 M252 92 h18 M180 62 l-12 -12 M240 62 l12 -12" stroke="#5b67ee" stroke-width="3" stroke-linecap="round"/>
  <path d="M60 230 C110 210 170 210 210 234 C250 210 310 210 360 230 V340 C310 320 250 320 210 344 C170 320 110 320 60 340 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <path d="M210 234 V344" stroke="#283058" stroke-width="3"/>
  <path d="M90 256 h90 M90 282 h90 M240 256 h90 M240 282 h90" stroke="#323c6e" stroke-width="3" stroke-linecap="round"/>
</svg>`;
}

// Comparison grid + stars (reviews)
function motifGrid() {
  const star = (cx, cy, f) => `<path transform="translate(${cx},${cy}) scale(0.9)" d="M0,-16 L4.7,-4.9 16,-4.9 6.6,2 10.3,13.2 0,6.4 -10.3,13.2 -6.6,2 -16,-4.9 -4.7,-4.9 Z" fill="${f}"/>`;
  return `<svg width="420" height="380" viewBox="0 0 420 380" preserveAspectRatio="xMidYMid meet">
  <rect x="60" y="70" width="300" height="240" rx="16" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <line x1="60" y1="130" x2="360" y2="130" stroke="#283058" stroke-width="2"/>
  <line x1="210" y1="70" x2="210" y2="310" stroke="#283058" stroke-width="2"/>
  <line x1="60" y1="190" x2="360" y2="190" stroke="#283058" stroke-width="2"/>
  <line x1="60" y1="250" x2="360" y2="250" stroke="#283058" stroke-width="2"/>
  ${star(120, 160, '#4250eb')}${star(160, 160, '#4250eb')}${star(120, 220, '#4250eb')}${star(160, 220, '#323c6e')}
  ${star(270, 160, '#4250eb')}${star(310, 160, '#4250eb')}${star(270, 220, '#4250eb')}${star(310, 220, '#4250eb')}
</svg>`;
}

// Candlestick chart (uptrend) — universal trading motif
function motifCandles() {
  const candle = (x, hi, lo, oTop, oBot, up) => {
    const c = up ? '#4250eb' : '#283058';
    return `<line x1="${x}" y1="${hi}" x2="${x}" y2="${lo}" stroke="${c}" stroke-width="3"/><rect x="${x - 14}" y="${oTop}" width="28" height="${oBot - oTop}" rx="3" fill="${c}"/>`;
  };
  return `<svg width="420" height="380" viewBox="0 0 420 380" preserveAspectRatio="xMidYMid meet">
  <line x1="40" y1="340" x2="400" y2="340" stroke="#283058" stroke-width="2"/>
  ${candle(80, 250, 320, 270, 305, false)}
  ${candle(140, 210, 300, 230, 285, true)}
  ${candle(200, 180, 260, 200, 250, false)}
  ${candle(260, 120, 230, 140, 210, true)}
  ${candle(320, 70, 180, 90, 160, true)}
  <polyline points="80,288 140,258 200,225 260,175 320,125" fill="none" stroke="#5b67ee" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round" opacity="0.8"/>
</svg>`;
}

// Area / line chart rising
function motifArea() {
  return `<svg width="430" height="360" viewBox="0 0 430 360" preserveAspectRatio="xMidYMid meet">
  <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4250eb" stop-opacity="0.45"/><stop offset="1" stop-color="#4250eb" stop-opacity="0"/></linearGradient></defs>
  <path d="M40,300 L110,250 L180,270 L250,180 L320,150 L390,80 L390,320 L40,320 Z" fill="url(#ag)"/>
  <polyline points="40,300 110,250 180,270 250,180 320,150 390,80" fill="none" stroke="#4250eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="390" cy="80" r="9" fill="#5b67ee" stroke="#0F172A" stroke-width="3"/>
  <line x1="40" y1="320" x2="400" y2="320" stroke="#283058" stroke-width="2"/>
</svg>`;
}

// Speed gauge (performance / metrics)
function motifGauge() {
  return `<svg width="400" height="360" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet">
  <path d="M70 250 A130 130 0 1 1 330 250" fill="none" stroke="#283058" stroke-width="22" stroke-linecap="round"/>
  <path d="M70 250 A130 130 0 0 1 200 120" fill="none" stroke="#4250eb" stroke-width="22" stroke-linecap="round"/>
  <line x1="200" y1="250" x2="270" y2="160" stroke="#5b67ee" stroke-width="7" stroke-linecap="round"/>
  <circle cx="200" cy="250" r="14" fill="#4250eb"/>
  <circle cx="70" cy="250" r="5" fill="#323c6e"/><circle cx="330" cy="250" r="5" fill="#323c6e"/>
</svg>`;
}

// Scaling steps (growth / scaling plan)
function motifSteps() {
  const step = (x, y, w, h, blue) => {
    const top = blue ? '#5b67ee' : '#323c6e', l = blue ? '#4250eb' : '#283058', r = blue ? '#2f3ac4' : '#1f2540';
    return `<polygon points="${x},${y} ${x + w},${y - w / 2} ${x + w * 2},${y} ${x + w},${y + w / 2}" fill="${top}"/><polygon points="${x},${y} ${x + w},${y + w / 2} ${x + w},${y + w / 2 + h} ${x},${y + h}" fill="${l}"/><polygon points="${x + w},${y + w / 2} ${x + w * 2},${y} ${x + w * 2},${y + h} ${x + w},${y + w / 2 + h}" fill="${r}"/>`;
  };
  return `<svg width="420" height="380" viewBox="0 0 420 380" preserveAspectRatio="xMidYMid meet">
  ${step(40, 300, 60, 40, false)}
  ${step(110, 255, 60, 40, false)}
  ${step(180, 210, 60, 40, false)}
  ${step(250, 165, 60, 40, true)}
  <path d="M70 280 L320 150" stroke="#4ade80" stroke-width="3" stroke-dasharray="3 8" stroke-linecap="round" opacity="0.85"/>
</svg>`;
}

const MOTIFS = {
  bars: motifBars, coins: motifCoins, target: motifTarget, shield: motifShield,
  book: motifBook, grid: motifGrid, candles: motifCandles, area: motifArea,
  gauge: motifGauge, steps: motifSteps,
};

// ---------------------------------------------------------------------------
// Headline cleanup — strip brand tails & parenthetical marketing
// ---------------------------------------------------------------------------
export function toHeadline(title = '') {
  let h = title.replace(/\s*[-–|:]\s*TradersYard.*$/i, '').trim();
  h = h.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return h;
}

// ---------------------------------------------------------------------------
// Build the full HTML document
// ---------------------------------------------------------------------------
export function buildThumbnailHTML({ title, slug, category, logoDataUri, readTime = '6 min read' }) {
  const cat = CATEGORY[category] || CATEGORY.default;
  const headline = toHeadline(title);
  const motifKey = pickMotif(category, slug, headline);
  const motifSvg = (MOTIFS[motifKey] || motifBars)();
  const seed = seedFromSlug(slug);
  // slug-seeded subtle hue shift on the floor grid so neighbours differ
  const gridOpacity = (0.06 + (seed % 5) * 0.012).toFixed(3);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@400;500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; }
  .card {
    width:1200px; height:630px; position:relative; overflow:hidden;
    background:
      radial-gradient(900px 500px at 88% 18%, rgba(66,80,235,0.18), transparent 60%),
      linear-gradient(135deg, ${BRAND.navy1} 0%, ${BRAND.navy3} 55%, ${BRAND.navy2} 100%);
    font-family:'Inter',sans-serif; display:flex; align-items:stretch;
  }
  .floor { position:absolute; inset:0; pointer-events:none; }
  .left { flex:1 1 56%; display:flex; flex-direction:column; justify-content:center; padding:70px 0 70px 84px; position:relative; z-index:2; min-width:0; }
  .brandrow { display:flex; align-items:center; gap:16px; margin-bottom:34px; }
  .logo { height:34px; width:auto; display:block; }
  .chip { font-family:'Geist Mono',monospace; font-size:13px; font-weight:500; letter-spacing:0.14em;
    color:#c7ccff; background:rgba(66,80,235,0.16); border:1px solid rgba(66,80,235,0.45);
    padding:7px 14px; border-radius:999px; white-space:nowrap; }
  h1 { font-family:'Inter',sans-serif; font-weight:800; font-size:58px; line-height:1.05; letter-spacing:-0.025em;
    color:#f8fafc; margin:0; max-width:16ch; }
  h1 em { font-style:normal; color:${BRAND.blueSoft}; }
  .rule { width:64px; height:3px; background:${BRAND.blue}; border-radius:2px; margin:30px 0 24px; }
  .sub { font-size:19px; line-height:1.5; color:${BRAND.textMuted}; margin:0; max-width:34ch; }
  .meta { margin-top:34px; font-family:'Geist Mono',monospace; font-size:13px; letter-spacing:0.04em; color:#6b7280; }
  .right { flex:1 1 44%; position:relative; z-index:1; display:flex; align-items:center; justify-content:center; padding:24px 40px 24px 0; min-width:0; }
</style></head>
<body>
  <div class="card">
    <svg class="floor" width="1200" height="630" viewBox="0 0 1200 630" aria-hidden="true">
      <g stroke="${BRAND.blue}" stroke-width="1" fill="none" opacity="${gridOpacity}">
        <polygon points="900,470 964,502 900,534 836,502"/><polygon points="964,438 1028,470 964,502 900,470"/>
        <polygon points="836,438 900,470 836,502 772,470"/><polygon points="900,406 964,438 900,470 836,438"/>
      </g>
    </svg>
    <div class="left">
      <div class="brandrow">
        <img class="logo" src="${logoDataUri}" alt="tradersyard"/>
        <span class="chip">${cat.label}</span>
      </div>
      <h1>${escapeHtml(headline)}</h1>
      <div class="rule"></div>
      <div class="meta">${escapeHtml(readTime)} · TradersYard Blog</div>
    </div>
    <div class="right">${motifSvg}</div>
  </div>
</body></html>`;
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
