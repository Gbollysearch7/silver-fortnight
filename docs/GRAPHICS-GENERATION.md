# In-Article Graphics Generation

Auto-generate professional comparison charts, diagrams, and visual assets for blog posts using fal.ai Ideogram v3.

## Quick Start

```bash
# Generate comparison chart
npm run graphics -- --type comparison --topic "FTMO vs Funded Trader"

# Generate all graphics for a post
npm run graphics -- --file content/drafts/post.md --all-graphics

# Preview prompt without generating
npm run graphics -- --type comparison --topic "FTMO vs MyFundedFX" --dry-run
```

## Supported Graphic Types

### 1. Comparison Charts
**Best for:** "X vs Y" articles, comparison posts

```bash
npm run graphics -- --type comparison --topic "FTMO vs The Funded Trader"
```

**Auto-includes:**
- Pricing comparison
- Drawdown rules
- Profit split
- Scaling plans
- Payout speed

**Output:** Square format (1:1), perfect for in-article use

---

### 2. Process Flowcharts
**Best for:** How-to guides, step-by-step tutorials

```bash
npm run graphics -- --type process --topic "How to Pass a Prop Firm Challenge"
```

**Auto-includes:**
- Numbered steps
- Clear flow arrows
- Easy-to-follow layout

---

### 3. Data Visualizations
**Best for:** Statistics, success rates, research data

```bash
npm run graphics -- --type data --topic "Prop Firm Success Rates 2026"
```

**Auto-includes:**
- Clean charts/graphs
- Clear labels
- Professional grid layout

---

### 4. Concept Diagrams
**Best for:** Educational content, explaining complex topics

```bash
npm run graphics -- --type concept --topic "What is Maximum Drawdown?"
```

**Auto-includes:**
- Simple illustrations
- Clear labels
- Visual explanations

---

## Design System

All graphics use **TradersYard brand identity**:

- **Background:** Navy `#0F172A`
- **Accent:** Electric blue `#4250EB`
- **Style:** Professional fintech, modern minimalist
- **Typography:** Clean, high contrast for readability

---

## Auto-Detection from Blog Posts

The script can **automatically detect** what graphics are needed based on:

1. **Template type** (comparison, how-to, etc.)
2. **Content patterns** ("vs", "Step 1:", statistics, "What is...")
3. **Headings and structure**

```bash
# Auto-detect and generate all needed graphics
npm run graphics -- --file content/drafts/ftmo-vs-funded-trader.md --all-graphics
```

**Example detection:**
- Comparison post → Generates comparison chart
- How-to with "Step 1:" → Generates process flowchart
- Post with statistics → Generates data visualization
- Post with "What is..." → Generates concept diagram

---

## Workflow Integration

### Option 1: Standalone (Current)
Generate graphics separately from main pipeline:

```bash
# 1. Generate draft
npm run generate -- --topic "FTMO vs Funded Trader" --template comparison

# 2. Generate comparison graphic
npm run graphics -- --file content/drafts/ftmo-vs-funded-trader.md

# 3. Continue with SEO + publish
npm run pipeline -- --file content/drafts/ftmo-vs-funded-trader.md
```

### Option 2: Integrated (Future)
Add graphics generation to the main pipeline in `scripts/pipeline.mjs`:

```javascript
// After thumbnail generation
await generateGraphics(file);  // Auto-detect and generate
```

---

## Output Structure

Generated graphics are saved to:

```
output/graphics/
├── ftmo-vs-funded-trader-comparison.png
├── how-to-pass-challenge-process.png
├── success-rates-data.png
└── what-is-drawdown-concept.png
```

**Naming:** `{slug}-{type}.png`

---

## Cost

**Model:** fal.ai Ideogram v3
**Cost per image:** ~$0.04 USD
**Format:** Square (1:1 ratio)

**Monthly estimate** (2 posts/day with 1 graphic each):
- 60 graphics/month × $0.04 = **$2.40/month**

---

## Markdown Usage

After generation, insert into blog posts:

```markdown
## FTMO vs The Funded Trader

![Comparison Chart](../../output/graphics/ftmo-vs-funded-trader-comparison.png)

Here's a detailed breakdown...
```

---

## Advanced: Custom Prompts

For specific requirements, you can extend the prompt builders in `scripts/graphics.mjs`:

```javascript
function buildComparisonPrompt(topic, details) {
  // Custom comparison with specific data points
  return `${topic}

Comparison points:
- Challenge cost: $X vs $Y
- Max drawdown: X% vs Y%
- Profit split: X% vs Y%

Professional fintech style...`;
}
```

---

## CLI Options

```bash
--file <path>         Markdown file to generate graphics for
--type <type>         Graphic type (comparison, process, data, concept)
--topic <text>        Topic for manual generation
--all-graphics        Auto-detect and generate all needed graphics
--dry-run            Preview prompts without generating
--help               Show help message
```

---

## Next Steps

1. **Integration:** Add to main pipeline for automatic generation
2. **A/B Testing:** Generate variants and track which performs better
3. **Social Media:** Generate additional sizes (16:9, 4:5) for different platforms
4. **Templates:** Pre-built prompts for common comparisons (top 10 firms, challenge types, etc.)
