# Loop 1 — CTR Rewrite Node Prompt (v1)

Purpose-built prompt for the title/meta rewrite node. Different job than article writing:
the article already ranks; only the SNIPPET is failing. Inputs come from a ticket in
`data/ctr-tickets.json` (built by `scripts/monitor.mjs` with guardrails enforced).

---

## PROMPT TEMPLATE

You are rewriting the SERP snippet (title tag + meta description) for a page that
already ranks but is not earning clicks. You are NOT rewriting the article.

THE PAGE
- URL: {page}
- Current title: "{current_title}" · current meta: "{current_meta}"
- Position {position} · {impressions} impressions/28d · CTR {ctr}% (benchmark for this position: {benchmark}%)
- Attempt #{attempt} of max 3.
{if attempt > 1}: Previous rewrite on {prior_date} moved CTR {ctr_before}% → {ctr_after}%.
That angle did not work. You MUST take a materially different angle this time, not a
wording tweak. If the last title led with a question, lead with a number or an outcome.
If it led with the keyword bare, lead with the differentiator.

WHAT SEARCHERS ACTUALLY TYPE (top queries by impressions, 28d):
{top_queries table: query | impressions | position}

RULES (all hard)
1. The title must speak to the TOP-IMPRESSION queries above, which may differ from the
   page's original target keyword. Serve the demand that exists, not the plan.
2. Keyword-honest, never clickbait: every promise in the snippet must be kept by the
   page content. No invented numbers, superlatives, or claims (the content gate will
   check you against the source-of-truth rules).
3. title: under 60 chars. meta_title: under 60 chars INCLUDING " | TY". meta description:
   150-160 chars, contains the main query phrase, and gives a concrete reason to click
   (a specific thing the reader will learn or get, not "learn more").
4. No em dashes. No banned terms. Never name competitor prop firms.
5. One deliberate CTR device per title, pick what fits the query intent: a number,
   the current year, a concrete outcome, a contrarian-but-true stance, or a
   specificity upgrade ("...explained" → "...the 3 rules that decide it"). Never
   stack devices; that reads as spam to humans and to Google.

OUTPUT (JSON only)
{
  "page": "...",
  "new_title": "...",            // with char count in a comment field
  "new_meta_title": "... | TY",
  "new_meta_description": "...",
  "angle": "one line: the CTR device used and why it fits the top queries",
  "kept_promises": "one line: why the page content backs every claim in the snippet"
}

SELF-CHECK before returning: recount all three char limits; confirm the top query's
words appear in the title; confirm nothing promised is absent from the page.

---

## PIPELINE CONTRACT (how the output is used)
1. Rewrite output → content gate (adversarial review, same as articles).
2. On approve: backup current Webflow fields → patch title/meta_title/meta_description →
   republish → verify live → resubmit URL to Google Indexing.
3. Append to `data/rewrite-ledger.json`: {page, date, attempt, ctr_before, title_after}.
   (`monitor.mjs` fills ctr_after automatically once the cooldown elapses.)
4. Guardrails live in the monitor, not here: cooldown 42d, data-gated repeats, max 3
   attempts then depth loop. This node only ever sees tickets that passed them.
