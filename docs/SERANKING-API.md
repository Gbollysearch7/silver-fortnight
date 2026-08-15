# SE Ranking API — Reference (Verified Live)

> Documented and verified against live API on **2026-06-18** using the project's key.
> Key location: store in `.env` as `SERANKING_API_KEY`. **Do not commit the raw key.**

---

## 1. Two APIs, Two Hosts

SE Ranking exposes two separate products under the same account/key:

| API | Host | Purpose | Auth |
|-----|------|---------|------|
| **Data API** (new) | `https://api.seranking.com` | Keyword research, domain analysis, SERP, backlinks, AI search. **This is what we use for keyword research.** | `Authorization: Token <KEY>` |
| **Project API** (legacy) | `https://api4.seranking.com` | Rank-tracking projects, keyword groups, competitors, audits | `Authorization: Token <KEY>` or `?apikey=<KEY>` |

For TradersYard blog keyword research, **use the Data API (`api.seranking.com`)**.

> ⚠️ The Data API occasionally returns a transient `503 Service Unavailable`. It is not your key — **retry with backoff** (the client below does this automatically). A successful keyword export returns HTTP **201**; GET discovery endpoints return **200**.

---

## 2. Authentication

```
Authorization: Token 42ece668-696d-0d05-a93d-fd4206696519
```

- Header method is preferred. Query-param fallback: `?apikey=<KEY>`.
- Missing/invalid token → `403 {"message":"No token"}`.

---

## 3. Billing & Rate Limits

- Only successful **2xx** responses consume credits. 4xx/5xx are **not** billed.
- `export`: **100 credits per request** (regardless of how many keywords, 1–5,000).
- `similar` / `related` / `questions`: **10 credits per returned keyword**.
- `longtail`: **1 credit per returned keyword**.
- Rate limit: **5 requests/second**. Exceeding → `429`, 10-minute lockout (escalates on repeat). Keep concurrency low and sleep ~250ms between calls.

> **Cost discipline:** `limit` directly drives cost on discovery endpoints (10 credits each). Always set a sensible `limit` and filter server-side rather than pulling thousands and filtering locally.

---

## 4. Keyword Research Endpoints (Data API)

Base: `https://api.seranking.com`

### 4.1 Get keyword metrics (bulk) — `POST /v1/keywords/export`

Returns volume/difficulty/CPC/intent/history for keywords **you already have**. Cheapest way to score a known list (100 credits flat for up to 5,000 keywords).

**Request**
```
POST https://api.seranking.com/v1/keywords/export?source=us
Content-Type: application/json
```
```json
{
  "keywords": ["prop firm challenge", "best prop firms"],
  "sort": "volume",
  "sort_order": "desc"
}
```

Body fields:
| Field | Type | Notes |
|-------|------|-------|
| `keywords` | string[] | **required**, 1–5,000 |
| `sort` | string | `volume` \| `cpc` \| `difficulty` \| `competition` (default `cpc`) |
| `sort_order` | string | `asc` \| `desc` (default `desc`) |
| `history_from` / `history_to` | `YYYY-MM-DD` | optional, max 12-month window |

**Response** (HTTP 201) — array:
```json
[
  {
    "is_data_found": true,
    "keyword": "prop firm challenge",
    "volume": 390,
    "cpc": 2.21,
    "competition": 0.49,
    "difficulty": 6,
    "intents": ["I"],
    "history_trend": { "2026-06-01": 390 }
  }
]
```

### 4.2 Discover keywords — `GET /v1/keywords/{type}`

`type` ∈ `similar` | `related` | `questions` | `longtail`.

- **similar** — keywords semantically close to the seed (same topic universe).
- **related** — topically related by overlapping SERP results; adds a `relevance` score.
- **questions** — question-phrased queries (great for FAQ/featured-snippet targeting).
- **longtail** — long-tail variations (cheapest, 1 credit each; simpler payload).

**Request**
```
GET https://api.seranking.com/v1/keywords/similar?source=us&keyword=prop%20firm&limit=100&sort=volume&sort_order=desc
Authorization: Token <KEY>
```

Query params:
| Param | Notes |
|-------|-------|
| `source` | **required**, region code (`us`, `uk`, `de`, `ca`, `au`, `in`, …) |
| `keyword` | **required**, seed |
| `limit` / `offset` | pagination (limit drives cost — 10 credits/keyword) |
| `sort` | `keyword` \| `volume` \| `cpc` \| `difficulty` \| `competition` |
| `sort_order` | `asc` \| `desc` |
| `history_trend` | `true`/`false` — include monthly history |

**Server-side filters** (apply these to cut cost & noise):
```
filter[volume][from]=50      filter[volume][to]=2000
filter[difficulty][from]=0   filter[difficulty][to]=20
filter[cpc][from]=0.10       filter[cpc][to]=3.00
filter[competition][from]=0  filter[competition][to]=0.5
filter[keyword_count][from]=3  filter[keyword_count][to]=8
filter[serp_features]=featured_snippets,people_also_ask
filter[intents]=I,C
filter[multi_keyword_included]=[[{"type":"contains","value":"prop firm"}]]
filter[multi_keyword_excluded]=[[{"type":"contains","value":"ftmo"}]]
```

**Response** (HTTP 200):
```json
{
  "total": 1022,
  "keywords": [
    {
      "keyword": "prop trading firms",
      "volume": 4400,
      "cpc": 2.24,
      "difficulty": 58,
      "competition": 0.3,
      "intents": ["I"],
      "serp_features": ["reviews","people_also_ask","sge","related_searches"],
      "relevance": 0,
      "history_trend": null
    }
  ]
}
```
`relevance` is populated only on the `related` endpoint. `longtail` returns a simpler array of strings + total.

---

## 5. Field Glossary

| Field | Meaning |
|-------|---------|
| `volume` | Avg monthly US searches |
| `difficulty` | 0–100 ranking difficulty (lower = easier). **≤20 is a green light for a Tier-0/young blog.** |
| `cpc` | Advertiser cost-per-click (commercial value signal) |
| `competition` | 0–1 Google Ads competition |
| `intents` | Search intent codes (see below) |
| `serp_features` | SERP features present (e.g. `featured_snippets`, `people_also_ask`, `sge`) |

### Search intent codes
| Code | Intent |
|------|--------|
| `I` | Informational |
| `C` | Commercial (research before buying) |
| `T` | Transactional |
| `L` | Local |
| `N` | Navigational |

For a blog chasing traffic first: prioritise **`I`** and **`C`**. Reserve `T`/`N` for money pages.

---

## 6. Common SERP feature codes

`featured_snippets`, `people_also_ask`, `related_searches`, `sge` (AI overview),
`local_pack`, `maps`, `reviews`, `sitelinks`, `video`, `images`, `top_stories`,
`knowledge_graph`, `faq`, `shopping_results`, `tads`/`bads` (ads).

> `featured_snippets` + `people_also_ask` present = snippet/PAA capture opportunity → write a crisp ~50-word answer + FAQ block.

---

## 7. Quick test commands

```bash
# Metrics for a known list
curl -s -X POST 'https://api.seranking.com/v1/keywords/export?source=us' \
  -H "Authorization: Token $SERANKING_API_KEY" -H 'Content-Type: application/json' \
  -d '{"keywords":["prop firm challenge"],"sort":"volume"}'

# Discover low-difficulty questions around a seed
curl -s -G 'https://api.seranking.com/v1/keywords/questions' \
  -H "Authorization: Token $SERANKING_API_KEY" \
  --data-urlencode 'source=us' --data-urlencode 'keyword=prop firm' \
  --data-urlencode 'limit=50' --data-urlencode 'sort=volume' --data-urlencode 'sort_order=desc'
```
