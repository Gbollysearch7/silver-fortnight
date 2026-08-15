// SE Ranking Data API client
// Docs: docs/SERANKING-API.md  |  Host: https://api.seranking.com
// Auth: Authorization: Token <KEY>   (key in .env as SERANKING_API_KEY)

import { SERANKING_API_KEY } from './config.mjs';

const BASE = 'https://api.seranking.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function requireKey() {
  if (!SERANKING_API_KEY) {
    throw new Error('SERANKING_API_KEY is missing from .env');
  }
}

// Core request with retry on 503 (transient) and 429 (rate limit).
async function request(path, { method = 'GET', body = null, query = null } = {}) {
  requireKey();
  const url = new URL(BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    }
  }

  const headers = { Authorization: `Token ${SERANKING_API_KEY}` };
  const init = { method, headers };
  if (body) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, init);

    // Transient outage / rate limit → backoff and retry
    if ((res.status === 503 || res.status === 429) && attempt < maxAttempts) {
      const wait = res.status === 429 ? 2000 * attempt : 800 * attempt;
      console.warn(`  SE Ranking ${res.status} on ${path} — retry ${attempt}/${maxAttempts} in ${wait}ms`);
      await sleep(wait);
      continue;
    }

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`SE Ranking ${res.status} ${path}: ${text.slice(0, 300)}`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`SE Ranking ${path}: non-JSON response: ${text.slice(0, 200)}`);
    }
  }
}

/**
 * Get metrics (volume/difficulty/cpc/intent/history) for known keywords.
 * 100 credits flat for up to 5,000 keywords. Returns array.
 */
export async function getKeywordMetrics(keywords, { source = 'us', sort = 'volume', sortOrder = 'desc' } = {}) {
  const all = [];
  // API caps at 5,000/request; chunk to be safe.
  for (let i = 0; i < keywords.length; i += 1000) {
    const chunk = keywords.slice(i, i + 1000);
    const data = await request('/v1/keywords/export', {
      method: 'POST',
      query: { source },
      body: { keywords: chunk, sort, sort_order: sortOrder },
    });
    all.push(...(Array.isArray(data) ? data : []));
    await sleep(250);
  }
  return all;
}

/**
 * Discover keywords around a seed.
 * type: 'similar' | 'related' | 'questions' | 'longtail'
 * filters: { volume:[from,to], difficulty:[from,to], cpc:[from,to], competition:[from,to], keyword_count:[from,to], intents:'I,C', serp_features:'...' }
 * Returns { total, keywords: [...] }
 */
export async function discoverKeywords(seed, type = 'similar', {
  source = 'us', limit = 100, offset = 0, sort = 'volume', sortOrder = 'desc',
  historyTrend = false, filters = {},
} = {}) {
  const query = {
    source, keyword: seed, limit, offset, sort, sort_order: sortOrder,
    history_trend: historyTrend ? 'true' : 'false',
  };

  // Encode range/scalar filters into filter[...] params
  for (const [field, val] of Object.entries(filters)) {
    if (Array.isArray(val)) {
      const [from, to] = val;
      if (from !== undefined && from !== null) query[`filter[${field}][from]`] = from;
      if (to !== undefined && to !== null) query[`filter[${field}][to]`] = to;
    } else if (val !== undefined && val !== null) {
      query[`filter[${field}]`] = val;
    }
  }

  if (type === 'longtail') {
    return request('/v1/keywords/longtail', { query: { source, keyword: seed, limit, offset } });
  }
  return request(`/v1/keywords/${type}`, { query });
}

/** Convenience: KGR-style filter for a young/Tier-0 blog. Low difficulty + low-mid volume. */
export async function findWinnableKeywords(seed, {
  source = 'us', type = 'similar', limit = 100,
  volume = [20, 1500], difficulty = [0, 25],
} = {}) {
  const res = await discoverKeywords(seed, type, {
    source, limit, sort: 'volume', sortOrder: 'desc',
    filters: { volume, difficulty },
  });
  return res.keywords || [];
}
