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

// Clock / timeline (when, how long, schedule, processing time)
function motifClock() {
  return `<svg width="380" height="380" viewBox="0 0 380 380" preserveAspectRatio="xMidYMid meet">
  <circle cx="190" cy="190" r="140" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <circle cx="190" cy="190" r="112" fill="none" stroke="#283058" stroke-width="2"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => { const a = i * Math.PI / 6; const x1 = 190 + Math.sin(a) * 120, y1 = 190 - Math.cos(a) * 120, x2 = 190 + Math.sin(a) * 132, y2 = 190 - Math.cos(a) * 132; return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#323c6e" stroke-width="3"/>`; }).join('')}
  <line x1="190" y1="190" x2="190" y2="110" stroke="#5b67ee" stroke-width="6" stroke-linecap="round"/>
  <line x1="190" y1="190" x2="248" y2="220" stroke="#4250eb" stroke-width="6" stroke-linecap="round"/>
  <circle cx="190" cy="190" r="11" fill="#4250eb"/>
</svg>`;
}

// Balance scales (rules vs reward, comparison, fairness)
function motifScales() {
  return `<svg width="400" height="360" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet">
  <line x1="200" y1="60" x2="200" y2="300" stroke="#4250eb" stroke-width="6" stroke-linecap="round"/>
  <line x1="90" y1="90" x2="310" y2="90" stroke="#4250eb" stroke-width="6" stroke-linecap="round"/>
  <rect x="150" y="300" width="100" height="18" rx="6" fill="#323c6e"/>
  <path d="M90 90 L60 160 L120 160 Z" fill="#1f2540" stroke="#5b67ee" stroke-width="2.5"/>
  <path d="M310 90 L280 160 L340 160 Z" fill="#1f2540" stroke="#5b67ee" stroke-width="2.5"/>
  <line x1="90" y1="90" x2="90" y2="62" stroke="#323c6e" stroke-width="2.5"/>
  <line x1="310" y1="90" x2="310" y2="62" stroke="#323c6e" stroke-width="2.5"/>
  <circle cx="200" cy="60" r="10" fill="#5b67ee"/>
</svg>`;
}

// Lock / security (KYC, account safety, protection)
function motifLock() {
  return `<svg width="360" height="380" viewBox="0 0 360 380" preserveAspectRatio="xMidYMid meet">
  <path d="M120 170 V120 a60 60 0 0 1 120 0 V170" fill="none" stroke="#4250eb" stroke-width="14" stroke-linecap="round"/>
  <rect x="86" y="170" width="188" height="160" rx="22" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <circle cx="180" cy="240" r="22" fill="#4250eb"/>
  <rect x="172" y="252" width="16" height="44" rx="8" fill="#4250eb"/>
</svg>`;
}

// Flag on a peak (milestone, goal reached, first try)
function motifFlag() {
  return `<svg width="400" height="380" viewBox="0 0 400 380" preserveAspectRatio="xMidYMid meet">
  <polygon points="60,330 200,120 340,330" fill="#1f2540" stroke="#283058" stroke-width="2"/>
  <polygon points="200,120 250,200 150,200" fill="#5b67ee"/>
  <line x1="200" y1="120" x2="200" y2="60" stroke="#4250eb" stroke-width="5" stroke-linecap="round"/>
  <path d="M200 64 L268 84 L200 108 Z" fill="#4250eb"/>
  <line x1="60" y1="330" x2="340" y2="330" stroke="#323c6e" stroke-width="3"/>
</svg>`;
}

// Pie / allocation (profit split %, distribution)
function motifPie() {
  return `<svg width="360" height="360" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid meet">
  <circle cx="180" cy="180" r="130" fill="#1f2540" stroke="#283058" stroke-width="2"/>
  <path d="M180 180 L180 50 A130 130 0 0 1 293 245 Z" fill="#4250eb"/>
  <path d="M180 180 L293 245 A130 130 0 0 1 240 290 Z" fill="#5b67ee"/>
  <circle cx="180" cy="180" r="54" fill="#0F172A"/>
  <text x="180" y="180" text-anchor="middle" dominant-baseline="central" font-family="'Geist Mono',monospace" font-size="34" font-weight="600" fill="#4250eb">%</text>
</svg>`;
}

// Document / contract (rules doc, agreement, policy, PDF)
function motifDoc() {
  return `<svg width="340" height="380" viewBox="0 0 340 380" preserveAspectRatio="xMidYMid meet">
  <path d="M80 50 H220 L268 98 V330 H80 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <path d="M220 50 V98 H268" fill="none" stroke="#4250eb" stroke-width="3"/>
  <line x1="112" y1="150" x2="236" y2="150" stroke="#323c6e" stroke-width="4" stroke-linecap="round"/>
  <line x1="112" y1="185" x2="236" y2="185" stroke="#323c6e" stroke-width="4" stroke-linecap="round"/>
  <line x1="112" y1="220" x2="200" y2="220" stroke="#323c6e" stroke-width="4" stroke-linecap="round"/>
  <path d="M120 270 L150 298 L228 250" fill="none" stroke="#4250eb" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Lightning bolt (speed, fast payout, instant funding, EA/automation)
function motifBolt() {
  return `<svg width="320" height="380" viewBox="0 0 320 380" preserveAspectRatio="xMidYMid meet">
  <circle cx="160" cy="190" r="140" fill="none" stroke="#283058" stroke-width="2"/>
  <polygon points="190,50 90,210 160,210 130,330 250,160 175,160" fill="#4250eb" stroke="#5b67ee" stroke-width="3" stroke-linejoin="round"/>
</svg>`;
}

// Network / community (social trading, traders, copy trading)
function motifNetwork() {
  return `<svg width="400" height="360" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet">
  <line x1="200" y1="180" x2="90" y2="90" stroke="#323c6e" stroke-width="2.5"/>
  <line x1="200" y1="180" x2="310" y2="90" stroke="#323c6e" stroke-width="2.5"/>
  <line x1="200" y1="180" x2="90" y2="280" stroke="#323c6e" stroke-width="2.5"/>
  <line x1="200" y1="180" x2="310" y2="280" stroke="#323c6e" stroke-width="2.5"/>
  <circle cx="200" cy="180" r="34" fill="#4250eb"/>
  <circle cx="90" cy="90" r="22" fill="#1f2540" stroke="#5b67ee" stroke-width="3"/>
  <circle cx="310" cy="90" r="22" fill="#1f2540" stroke="#5b67ee" stroke-width="3"/>
  <circle cx="90" cy="280" r="22" fill="#1f2540" stroke="#5b67ee" stroke-width="3"/>
  <circle cx="310" cy="280" r="22" fill="#1f2540" stroke="#5b67ee" stroke-width="3"/>
</svg>`;
}

// Calendar (minimum days, schedule, timeline rule)
function motifCalendar() {
  return `<svg width="380" height="360" viewBox="0 0 380 360" preserveAspectRatio="xMidYMid meet">
  <rect x="60" y="80" width="260" height="220" rx="18" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <rect x="60" y="80" width="260" height="56" rx="18" fill="#4250eb"/>
  <line x1="110" y1="64" x2="110" y2="104" stroke="#5b67ee" stroke-width="8" stroke-linecap="round"/>
  <line x1="270" y1="64" x2="270" y2="104" stroke="#5b67ee" stroke-width="8" stroke-linecap="round"/>
  ${[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(c => { const on = (r * 5 + c) % 7 === 3; return `<rect x="${92 + c * 42}" y="${158 + r * 34}" width="20" height="20" rx="5" fill="${on ? '#4250eb' : '#323c6e'}"/>`; }).join('')).join('')}
</svg>`;
}

// Wallet / funded account (funding, capital, account)
function motifWallet() {
  return `<svg width="400" height="340" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet">
  <rect x="70" y="100" width="260" height="180" rx="22" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <path d="M70 140 H300 a20 20 0 0 1 20 20 V200 H250 a30 30 0 0 1 0 -60 H320" fill="#283058"/>
  <rect x="248" y="158" width="86" height="46" rx="12" fill="#4250eb"/>
  <circle cx="291" cy="181" r="11" fill="#5b67ee"/>
  <path d="M70 130 L260 70 L300 118" fill="none" stroke="#5b67ee" stroke-width="3" stroke-linejoin="round"/>
</svg>`;
}

// === BATCH 3 — reaching a 50-motif library ===

// Rocket (launch, growth, fast start)
function motifRocket() {
  return `<svg width="360" height="380" viewBox="0 0 360 380" preserveAspectRatio="xMidYMid meet">
  <path d="M180 50 C230 100 250 170 250 230 L110 230 C110 170 130 100 180 50 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <circle cx="180" cy="150" r="26" fill="#0F172A" stroke="#5b67ee" stroke-width="3"/>
  <path d="M110 210 L70 270 L120 250 Z" fill="#4250eb"/>
  <path d="M250 210 L290 270 L240 250 Z" fill="#4250eb"/>
  <path d="M150 250 Q180 330 210 250" fill="#5b67ee" opacity="0.6"/>
  <path d="M165 250 Q180 300 195 250" fill="#4ade80"/>
</svg>`;
}

// Bull (bullish market, going up)
function motifBull() {
  return `<svg width="420" height="360" viewBox="0 0 420 360" preserveAspectRatio="xMidYMid meet">
  <polyline points="50,300 130,300 130,230 200,230 200,150 280,150 280,90 360,90" fill="none" stroke="#4250eb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M360 90 L330 80 M360 90 L350 120" stroke="#4250eb" stroke-width="6" stroke-linecap="round"/>
  <circle cx="360" cy="90" r="12" fill="#5b67ee"/>
  <line x1="50" y1="320" x2="380" y2="320" stroke="#283058" stroke-width="2"/>
</svg>`;
}

// Hourglass (time limit, deadline, processing)
function motifHourglass() {
  return `<svg width="320" height="380" viewBox="0 0 320 380" preserveAspectRatio="xMidYMid meet">
  <rect x="80" y="50" width="160" height="16" rx="6" fill="#4250eb"/>
  <rect x="80" y="314" width="160" height="16" rx="6" fill="#4250eb"/>
  <path d="M100 66 L100 110 L160 190 L220 110 L220 66 Z" fill="#1f2540" stroke="#5b67ee" stroke-width="2.5"/>
  <path d="M100 314 L100 270 L160 190 L220 270 L220 314 Z" fill="#1f2540" stroke="#5b67ee" stroke-width="2.5"/>
  <path d="M122 90 L160 140 L198 90 Z" fill="#4250eb"/>
  <path d="M150 250 L160 190 L170 250 a10 10 0 0 1 -20 0 Z" fill="#4250eb"/>
</svg>`;
}

// Key (access, unlock funding, getting in)
function motifKey() {
  return `<svg width="400" height="320" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
  <circle cx="120" cy="160" r="70" fill="#1f2540" stroke="#4250eb" stroke-width="14"/>
  <circle cx="120" cy="160" r="26" fill="#0F172A" stroke="#5b67ee" stroke-width="4"/>
  <rect x="185" y="146" width="170" height="28" rx="6" fill="#4250eb"/>
  <rect x="300" y="174" width="22" height="40" rx="5" fill="#4250eb"/>
  <rect x="340" y="174" width="22" height="28" rx="5" fill="#4250eb"/>
</svg>`;
}

// Magnifier (research, analysis, find the best, review)
function motifSearch() {
  return `<svg width="360" height="360" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid meet">
  <circle cx="160" cy="150" r="100" fill="#1f2540" stroke="#4250eb" stroke-width="12"/>
  <line x1="232" y1="222" x2="310" y2="300" stroke="#4250eb" stroke-width="20" stroke-linecap="round"/>
  <polyline points="115,170 145,140 175,160 210,115" fill="none" stroke="#5b67ee" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Trophy (winning, success, top performer)
function motifTrophy() {
  return `<svg width="360" height="380" viewBox="0 0 360 380" preserveAspectRatio="xMidYMid meet">
  <path d="M110 70 H250 V150 a70 70 0 0 1 -140 0 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <path d="M110 90 H70 V120 a40 40 0 0 0 40 40" fill="none" stroke="#5b67ee" stroke-width="3"/>
  <path d="M250 90 H290 V120 a40 40 0 0 1 -40 40" fill="none" stroke="#5b67ee" stroke-width="3"/>
  <rect x="165" y="218" width="30" height="50" fill="#323c6e"/>
  <rect x="120" y="268" width="120" height="22" rx="6" fill="#4250eb"/>
  <rect x="140" y="290" width="80" height="18" rx="5" fill="#283058"/>
  <path d="M150 110 L172 128 L210 96" fill="none" stroke="#4250eb" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Globe (regulation, countries, global firms)
function motifGlobe() {
  return `<svg width="360" height="360" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid meet">
  <circle cx="180" cy="180" r="130" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <ellipse cx="180" cy="180" rx="55" ry="130" fill="none" stroke="#283058" stroke-width="2.5"/>
  <ellipse cx="180" cy="180" rx="110" ry="130" fill="none" stroke="#283058" stroke-width="2.5"/>
  <line x1="50" y1="180" x2="310" y2="180" stroke="#283058" stroke-width="2.5"/>
  <path d="M70 130 H290 M70 230 H290" stroke="#283058" stroke-width="2.5"/>
  <circle cx="180" cy="180" r="130" fill="none" stroke="#5b67ee" stroke-width="3"/>
</svg>`;
}

// Funnel (filtering, qualifying, selection)
function motifFunnel() {
  return `<svg width="360" height="380" viewBox="0 0 360 380" preserveAspectRatio="xMidYMid meet">
  <path d="M60 70 H300 L210 200 V300 L150 330 V200 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <line x1="90" y1="110" x2="270" y2="110" stroke="#5b67ee" stroke-width="4" stroke-linecap="round"/>
  <line x1="120" y1="150" x2="240" y2="150" stroke="#323c6e" stroke-width="4" stroke-linecap="round"/>
  <circle cx="180" cy="345" r="14" fill="#4250eb"/>
</svg>`;
}

// Coin flip / single coin (fee, cost, single payment)
function motifCoin() {
  return `<svg width="320" height="360" viewBox="0 0 320 360" preserveAspectRatio="xMidYMid meet">
  <ellipse cx="160" cy="180" rx="120" ry="120" fill="#1f2540" stroke="#4250eb" stroke-width="4"/>
  <ellipse cx="160" cy="180" rx="92" ry="92" fill="none" stroke="#283058" stroke-width="3"/>
  <text x="160" y="180" text-anchor="middle" dominant-baseline="central" font-family="'Geist Mono',monospace" font-size="90" font-weight="600" fill="#4250eb">$</text>
</svg>`;
}

// Roadmap / path (journey, steps to funded, process)
function motifRoadmap() {
  return `<svg width="420" height="340" viewBox="0 0 420 340" preserveAspectRatio="xMidYMid meet">
  <path d="M50 280 C120 280 120 180 190 180 C260 180 260 80 360 80" fill="none" stroke="#283058" stroke-width="6" stroke-dasharray="2 14" stroke-linecap="round"/>
  <circle cx="50" cy="280" r="18" fill="#1f2540" stroke="#5b67ee" stroke-width="3"/>
  <circle cx="190" cy="180" r="18" fill="#1f2540" stroke="#5b67ee" stroke-width="3"/>
  <circle cx="360" cy="80" r="22" fill="#4250eb"/>
  <path d="M352 80 L358 86 L370 72" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// Bar+line combo (statistics, data, performance report)
function motifStats() {
  return `<svg width="420" height="340" viewBox="0 0 420 340" preserveAspectRatio="xMidYMid meet">
  <rect x="60" y="200" width="44" height="100" rx="5" fill="#283058"/>
  <rect x="130" y="150" width="44" height="150" rx="5" fill="#323c6e"/>
  <rect x="200" y="170" width="44" height="130" rx="5" fill="#283058"/>
  <rect x="270" y="110" width="44" height="190" rx="5" fill="#4250eb"/>
  <polyline points="82,180 152,130 222,150 292,90 350,70" fill="none" stroke="#5b67ee" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="350" cy="70" r="9" fill="#4ade80"/>
  <line x1="50" y1="300" x2="370" y2="300" stroke="#283058" stroke-width="2"/>
</svg>`;
}

// Warning triangle (risk, mistakes, avoid, danger)
function motifWarning() {
  return `<svg width="380" height="360" viewBox="0 0 380 360" preserveAspectRatio="xMidYMid meet">
  <path d="M190 60 L330 300 H50 Z" fill="#1f2540" stroke="#4250eb" stroke-width="4" stroke-linejoin="round"/>
  <rect x="178" y="150" width="24" height="80" rx="10" fill="#4250eb"/>
  <circle cx="190" cy="262" r="14" fill="#4250eb"/>
</svg>`;
}

// Handshake-ish / deal (partnership, agreement, funded deal)
function motifDeal() {
  return `<svg width="400" height="340" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet">
  <circle cx="200" cy="170" r="120" fill="none" stroke="#283058" stroke-width="2"/>
  <path d="M110 200 L160 150 L210 190 L180 220 Z" fill="#4250eb"/>
  <path d="M290 200 L240 150 L195 188 L222 218 Z" fill="#5b67ee"/>
  <rect x="170" y="180" width="60" height="24" rx="8" fill="#1f2540" stroke="#4250eb" stroke-width="2"/>
</svg>`;
}

// Battery / capacity (account balance, buffer, room left)
function motifBattery() {
  return `<svg width="400" height="300" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
  <rect x="60" y="100" width="260" height="120" rx="20" fill="#1f2540" stroke="#4250eb" stroke-width="4"/>
  <rect x="320" y="135" width="24" height="50" rx="8" fill="#4250eb"/>
  <rect x="82" y="122" width="62" height="76" rx="8" fill="#4250eb"/>
  <rect x="152" y="122" width="62" height="76" rx="8" fill="#4250eb"/>
  <rect x="222" y="122" width="62" height="76" rx="8" fill="#283058"/>
</svg>`;
}

// Compass (strategy, direction, finding your way)
function motifCompass() {
  return `<svg width="360" height="360" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid meet">
  <circle cx="180" cy="180" r="130" fill="#1f2540" stroke="#4250eb" stroke-width="4"/>
  <circle cx="180" cy="180" r="100" fill="none" stroke="#283058" stroke-width="2"/>
  <polygon points="180,90 205,180 180,160 155,180" fill="#4250eb"/>
  <polygon points="180,270 155,180 180,200 205,180" fill="#323c6e"/>
  <circle cx="180" cy="180" r="12" fill="#5b67ee"/>
</svg>`;
}

// === BATCH 4 — final stretch to 50 ===

// Brain / mindset (psychology, discipline, mental)
function motifBrain() {
  return `<svg width="380" height="360" viewBox="0 0 380 360" preserveAspectRatio="xMidYMid meet">
  <path d="M190 70 C120 70 90 120 100 160 C70 180 80 240 130 250 C140 300 240 300 250 250 C300 240 310 180 280 160 C290 120 260 70 190 70 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <path d="M190 90 V250 M150 140 C170 150 170 170 150 180 M230 140 C210 150 210 170 230 180 M150 210 H230" fill="none" stroke="#5b67ee" stroke-width="3" stroke-linecap="round"/>
</svg>`;
}

// Ladder (climbing tiers, levels, progression)
function motifLadder() {
  return `<svg width="320" height="380" viewBox="0 0 320 380" preserveAspectRatio="xMidYMid meet">
  <line x1="110" y1="60" x2="110" y2="340" stroke="#4250eb" stroke-width="8" stroke-linecap="round"/>
  <line x1="210" y1="60" x2="210" y2="340" stroke="#4250eb" stroke-width="8" stroke-linecap="round"/>
  ${[90, 150, 210, 270, 330].map((y, i) => `<line x1="110" y1="${y}" x2="210" y2="${y}" stroke="${i === 0 ? '#5b67ee' : '#323c6e'}" stroke-width="7" stroke-linecap="round"/>`).join('')}
  <circle cx="160" cy="78" r="14" fill="#4ade80"/>
</svg>`;
}

// Stopwatch (fast payout, quick, timing)
function motifStopwatch() {
  return `<svg width="360" height="380" viewBox="0 0 360 380" preserveAspectRatio="xMidYMid meet">
  <circle cx="180" cy="210" r="130" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <line x1="150" y1="50" x2="210" y2="50" stroke="#4250eb" stroke-width="10" stroke-linecap="round"/>
  <line x1="180" y1="50" x2="180" y2="80" stroke="#4250eb" stroke-width="8"/>
  <line x1="290" y1="120" x2="312" y2="98" stroke="#4250eb" stroke-width="8" stroke-linecap="round"/>
  <line x1="180" y1="210" x2="180" y2="120" stroke="#5b67ee" stroke-width="6" stroke-linecap="round"/>
  <line x1="180" y1="210" x2="240" y2="240" stroke="#4250eb" stroke-width="6" stroke-linecap="round"/>
  <circle cx="180" cy="210" r="11" fill="#4250eb"/>
</svg>`;
}

// Bank / institution (firm, regulated, official)
function motifBank() {
  return `<svg width="400" height="340" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet">
  <polygon points="200,60 340,130 60,130" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <circle cx="200" cy="105" r="14" fill="#5b67ee"/>
  ${[90, 160, 230, 300].map(x => `<rect x="${x - 14}" y="150" width="28" height="120" fill="#283058" stroke="#4250eb" stroke-width="2"/>`).join('')}
  <rect x="50" y="280" width="300" height="24" rx="6" fill="#4250eb"/>
</svg>`;
}

// Checklist (steps, requirements, to-do)
function motifChecklist() {
  return `<svg width="380" height="360" viewBox="0 0 380 360" preserveAspectRatio="xMidYMid meet">
  <rect x="80" y="60" width="220" height="240" rx="16" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  ${[110, 175, 240].map((y, i) => `<rect x="108" y="${y}" width="34" height="34" rx="8" fill="${i < 2 ? '#4250eb' : '#283058'}" stroke="#4250eb" stroke-width="2"/>${i < 2 ? `<path d="M114 ${y + 18} L124 ${y + 27} L138 ${y + 9}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}<line x1="160" y1="${y + 17}" x2="266" y2="${y + 17}" stroke="#323c6e" stroke-width="5" stroke-linecap="round"/>`).join('')}
</svg>`;
}

// Diamond / premium (high value, top tier, elite)
function motifDiamond() {
  return `<svg width="360" height="340" viewBox="0 0 360 340" preserveAspectRatio="xMidYMid meet">
  <polygon points="110,90 250,90 320,160 180,300 40,160" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <polygon points="110,90 180,160 40,160" fill="#283058"/>
  <polygon points="250,90 320,160 180,160" fill="#323c6e"/>
  <polygon points="40,160 180,160 180,300" fill="#4250eb" opacity="0.55"/>
  <polygon points="320,160 180,160 180,300" fill="#5b67ee" opacity="0.7"/>
  <line x1="110" y1="90" x2="180" y2="160" stroke="#5b67ee" stroke-width="2"/>
  <line x1="250" y1="90" x2="180" y2="160" stroke="#5b67ee" stroke-width="2"/>
</svg>`;
}

// Refresh / retry (re-attempt, reset, second chance)
function motifRefresh() {
  return `<svg width="360" height="360" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid meet">
  <path d="M180 70 a110 110 0 1 0 100 64" fill="none" stroke="#4250eb" stroke-width="16" stroke-linecap="round"/>
  <polygon points="180,40 180,110 130,75" fill="#5b67ee"/>
</svg>`;
}

// Layers / stack (account sizes, tiers, options)
function motifLayers() {
  const layer = (y, c) => `<polygon points="180,${y} 300,${y + 36} 180,${y + 72} 60,${y + 36}" fill="${c}" stroke="#5b67ee" stroke-width="2"/>`;
  return `<svg width="400" height="360" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet">
  ${layer(210, '#1f2540')}${layer(150, '#283058')}${layer(90, '#4250eb')}
</svg>`;
}

// Megaphone (announcement, promo, news, deals)
function motifMegaphone() {
  return `<svg width="400" height="320" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
  <path d="M80 130 L240 80 V240 L80 190 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <rect x="50" y="130" width="40" height="60" rx="8" fill="#283058"/>
  <path d="M240 110 V210 L300 240 V80 Z" fill="#4250eb"/>
  <path d="M320 120 q30 40 0 80 M345 100 q50 60 0 120" fill="none" stroke="#5b67ee" stroke-width="4" stroke-linecap="round"/>
  <line x1="120" y1="200" x2="120" y2="270" stroke="#283058" stroke-width="8" stroke-linecap="round"/>
</svg>`;
}

// Puzzle (fit, solution, how pieces work)
function motifPuzzle() {
  return `<svg width="360" height="340" viewBox="0 0 360 340" preserveAspectRatio="xMidYMid meet">
  <path d="M70 80 H150 a22 22 0 0 1 44 0 H260 V160 a22 22 0 0 1 0 44 V280 H180 a22 22 0 0 0 -44 0 H70 V200 a22 22 0 0 0 0 -44 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <path d="M260 80 H180 a22 22 0 0 0 -22 22 V160" fill="none" stroke="#5b67ee" stroke-width="2.5"/>
  <circle cx="225" cy="225" r="30" fill="#4250eb"/>
</svg>`;
}

// Dollar growth arrow (earnings up, income)
function motifGrowth() {
  return `<svg width="400" height="360" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet">
  <text x="90" y="200" text-anchor="middle" dominant-baseline="central" font-family="'Geist Mono',monospace" font-size="150" font-weight="600" fill="#4250eb">$</text>
  <path d="M180 260 L260 180 L300 220 L360 120" fill="none" stroke="#4ade80" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M360 120 L330 122 M360 120 L358 150" stroke="#4ade80" stroke-width="6" stroke-linecap="round"/>
</svg>`;
}

// Filter sliders (settings, configuration, customize)
function motifSliders() {
  return `<svg width="380" height="340" viewBox="0 0 380 340" preserveAspectRatio="xMidYMid meet">
  ${[90, 170, 250].map((y, i) => { const cx = [250, 150, 290][i]; return `<line x1="70" y1="${y}" x2="310" y2="${y}" stroke="#283058" stroke-width="6" stroke-linecap="round"/><circle cx="${cx}" cy="${y}" r="22" fill="#4250eb" stroke="#5b67ee" stroke-width="3"/>`; }).join('')}
</svg>`;
}

// Coins falling into hand-ish bowl (receiving payout)
function motifReceive() {
  return `<svg width="400" height="360" viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet">
  <path d="M80 220 a120 70 0 0 0 240 0 Z" fill="#1f2540" stroke="#4250eb" stroke-width="3"/>
  <ellipse cx="160" cy="120" rx="34" ry="15" fill="#4250eb"/>
  <ellipse cx="160" cy="110" rx="34" ry="15" fill="#5b67ee"/>
  <ellipse cx="250" cy="150" rx="30" ry="13" fill="#283058"/>
  <ellipse cx="250" cy="141" rx="30" ry="13" fill="#4250eb"/>
  <path d="M120 170 L130 150 M280 175 L270 155" stroke="#5b67ee" stroke-width="3" stroke-linecap="round"/>
</svg>`;
}

// Crosshair / precision (accuracy, hitting targets, sniper entry)
function motifCrosshair() {
  return `<svg width="360" height="360" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid meet">
  <circle cx="180" cy="180" r="120" fill="none" stroke="#4250eb" stroke-width="4"/>
  <circle cx="180" cy="180" r="70" fill="none" stroke="#283058" stroke-width="3"/>
  <line x1="180" y1="40" x2="180" y2="120" stroke="#4250eb" stroke-width="4" stroke-linecap="round"/>
  <line x1="180" y1="240" x2="180" y2="320" stroke="#4250eb" stroke-width="4" stroke-linecap="round"/>
  <line x1="40" y1="180" x2="120" y2="180" stroke="#4250eb" stroke-width="4" stroke-linecap="round"/>
  <line x1="240" y1="180" x2="320" y2="180" stroke="#4250eb" stroke-width="4" stroke-linecap="round"/>
  <circle cx="180" cy="180" r="16" fill="#5b67ee"/>
</svg>`;
}

// Badge / certified (verified, official, qualified)
function motifBadge() {
  return `<svg width="340" height="380" viewBox="0 0 340 380" preserveAspectRatio="xMidYMid meet">
  <circle cx="170" cy="150" r="110" fill="#1f2540" stroke="#4250eb" stroke-width="4"/>
  <circle cx="170" cy="150" r="82" fill="none" stroke="#283058" stroke-width="3"/>
  <path d="M132 150 L162 180 L214 122" fill="none" stroke="#4250eb" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M120 240 L100 340 L170 300 L240 340 L220 240 Z" fill="#5b67ee"/>
</svg>`;
}

export const MOTIFS = {
  bars: motifBars, coins: motifCoins, target: motifTarget, shield: motifShield,
  book: motifBook, grid: motifGrid, candles: motifCandles, area: motifArea,
  gauge: motifGauge, steps: motifSteps,
  // batch 2
  clock: motifClock, scales: motifScales, lock: motifLock, flag: motifFlag,
  pie: motifPie, doc: motifDoc, bolt: motifBolt, network: motifNetwork,
  calendar: motifCalendar, wallet: motifWallet,
  // batch 3
  rocket: motifRocket, bull: motifBull, hourglass: motifHourglass, key: motifKey,
  search: motifSearch, trophy: motifTrophy, globe: motifGlobe, funnel: motifFunnel,
  coin: motifCoin, roadmap: motifRoadmap, stats: motifStats, warning: motifWarning,
  deal: motifDeal, battery: motifBattery, compass: motifCompass,
  // batch 4
  brain: motifBrain, ladder: motifLadder, stopwatch: motifStopwatch, bank: motifBank,
  checklist: motifChecklist, diamond: motifDiamond, refresh: motifRefresh, layers: motifLayers,
  megaphone: motifMegaphone, puzzle: motifPuzzle, growth: motifGrowth, sliders: motifSliders,
  receive: motifReceive, crosshair: motifCrosshair, badge: motifBadge,
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
export function buildThumbnailHTML({ title, slug, category, logoDataUri, readTime }) {
  // Coalesce null/empty/whitespace (Webflow read-time is often blank) → default.
  readTime = (readTime && String(readTime).trim()) || '6 min read';
  // If it's a bare number, make it "N min read".
  if (/^\d+$/.test(readTime)) readTime = `${readTime} min read`;
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
