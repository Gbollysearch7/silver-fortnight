# TradersYard Docs — Local Snapshot

Authoritative product facts for content verification. **Use these instead of generic prop-firm assumptions.**

## Files
- `llms.txt` — index of all TradersYard documentation pages (from docs.tradersyard.com/llms.txt)
- `faqs.md` — full FAQ snapshot: funding model, profit split, payouts, prohibited practices, rules, country restrictions, fees

## Live source
- Docs: https://docs.tradersyard.com/ (GitBook)
- Rules: https://tradersyard.com/rules
- About: https://tradersyard.com/about
- Sitemap: https://tradersyard.com/sitemap.xml

## Querying docs live (no re-scrape needed)
Append `?ask=<question>` to any docs `.md` URL for a direct answer:
```
GET https://docs.tradersyard.com/traderchallenge/faqs.md?ask=Does TradersYard accept traders from Nigeria?
```

## Refresh
Re-scrape with Firecrawl when docs change. Snapshot taken 2026-06-21.

## Critical facts (the ones that trip up content)
1. **SIM model** — all accounts are demo/virtual; trader is a "signal provider," TY copies signals to its own account. NOT "you trade real firm capital."
2. **Copy trading is BANNED** (prohibited-practices list). Never write that TY allows it.
3. **No pre-challenge demo/practice account.** Only free Tournaments.
4. **Nigeria, Kenya, Pakistan are RESTRICTED** (+ many others). TY has live blog pages ranking itself in these markets — strategic conflict.
5. **Profit split is tiered: 100% / 90% / 80%** — not flat.
6. **Payouts: 4–6 business hours typical**, min $50, 14-day cycle.
7. EU entity: **TradersYard GmbH, Vienna, Austria**.
