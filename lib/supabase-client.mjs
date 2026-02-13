/**
 * Supabase Data Client
 * Queries real TradersYard data for fact-checking and blog content.
 *
 * Uses the service role key for read-only queries to pull:
 * - Trader statistics (funded traders, pass rates)
 * - Payout data (total payouts, average payout)
 * - Challenge performance metrics
 *
 * Zero dependencies — uses native fetch() (Node 22).
 */

import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.mjs';

const SUPABASE_API = `${SUPABASE_URL}/rest/v1`;

/**
 * Get TradersYard statistics for blog content.
 * Returns aggregated, anonymized data safe for public consumption.
 */
export async function getTradersYardStats() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[supabase] No SUPABASE_SERVICE_ROLE_KEY set — skipping data fetch');
    return null;
  }

  try {
    // Query multiple tables in parallel
    const [traderStats, payoutStats] = await Promise.all([
      queryTraderStats(),
      queryPayoutStats(),
    ]);

    return {
      traders: traderStats,
      payouts: payoutStats,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[supabase] Failed to fetch stats: ${err.message}`);
    return null;
  }
}

/**
 * Query trader statistics (funded traders, pass rates, etc.)
 */
async function queryTraderStats() {
  try {
    // Adjust table name based on your actual Supabase schema
    // This is a placeholder — update with your real table structure
    const res = await fetch(`${SUPABASE_API}/traders?select=status,created_at`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!res.ok) {
      console.warn(`[supabase] Trader stats query failed: ${res.status}`);
      return null;
    }

    const traders = await res.json();

    // Aggregate stats
    const total = traders.length;
    const funded = traders.filter(t => t.status === 'funded').length;
    const passRate = total > 0 ? Math.round((funded / total) * 100) : 0;

    return {
      totalTraders: total,
      fundedTraders: funded,
      passRate: `${passRate}%`,
    };
  } catch (err) {
    console.warn(`[supabase] Trader stats error: ${err.message}`);
    return null;
  }
}

/**
 * Query payout statistics (total payouts, average, etc.)
 */
async function queryPayoutStats() {
  try {
    // Adjust table name based on your actual Supabase schema
    const res = await fetch(`${SUPABASE_API}/payouts?select=amount,created_at`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!res.ok) {
      console.warn(`[supabase] Payout stats query failed: ${res.status}`);
      return null;
    }

    const payouts = await res.json();

    // Aggregate payout data
    const amounts = payouts.map(p => parseFloat(p.amount || 0));
    const totalPayouts = amounts.reduce((sum, amt) => sum + amt, 0);
    const avgPayout = amounts.length > 0 ? totalPayouts / amounts.length : 0;

    return {
      totalPayouts: Math.round(totalPayouts),
      totalPayoutCount: payouts.length,
      averagePayout: Math.round(avgPayout),
      currency: 'USD',
    };
  } catch (err) {
    console.warn(`[supabase] Payout stats error: ${err.message}`);
    return null;
  }
}

/**
 * Get specific prop firm data from TradersYard's own challenge data.
 * This can include TradersYard's challenge rules, pricing, etc.
 */
export async function getTradersYardChallengeData() {
  // Placeholder — update with your actual challenge/pricing data structure
  // This might come from Supabase or be hardcoded if it doesn't change often

  return {
    challenges: [
      {
        name: 'Standard Challenge',
        accountSize: 100000,
        profitTarget: 10000,
        maxDrawdown: 10000,
        dailyLossLimit: 5000,
        tradingPeriod: 'unlimited',
        price: 499,
      },
      {
        name: 'Rapid Challenge',
        accountSize: 50000,
        profitTarget: 3000,
        maxDrawdown: 2500,
        dailyLossLimit: 1500,
        tradingPeriod: '30 days',
        price: 299,
      },
    ],
    rules: {
      profitSplit: '80/20',
      minTradingDays: 5,
      newsTrading: 'allowed',
      weekendHolding: 'allowed',
      expertAdvisors: 'allowed',
    },
  };
}

/**
 * Format stats for use in blog content prompts.
 */
export function formatStatsForPrompt(stats) {
  if (!stats) return '';

  let text = 'TRADERSYARD VERIFIED DATA (use these exact numbers):\n';

  if (stats.traders) {
    text += `- Total traders: ${stats.traders.totalTraders}\n`;
    text += `- Funded traders: ${stats.traders.fundedTraders}\n`;
    text += `- Pass rate: ${stats.traders.passRate}\n`;
  }

  if (stats.payouts) {
    text += `- Total payouts: $${stats.payouts.totalPayouts.toLocaleString()}\n`;
    text += `- Total payout count: ${stats.payouts.totalPayoutCount}\n`;
    text += `- Average payout: $${stats.payouts.averagePayout.toLocaleString()}\n`;
  }

  text += `- Data last updated: ${new Date(stats.lastUpdated).toLocaleDateString()}\n`;

  return text;
}
