# 📝 TradersYard Blog Formatting Guide

## Overview

This document explains the exact HTML formatting used for TradersYard blog posts published to Webflow CMS.

---

## Design System Colors

```javascript
Primary Color: #4250eb (Electric Blue)
Primary RGB: 66, 80, 235

Dark Backgrounds:
- Dark BG 1: #1a1a2e
- Dark BG 2: #16161f
- Dark BG 3: #12121a

Text Colors:
- Text Light: #e2e8f0
- Text Muted: #94a3b8

Other:
- Success Green: #4ade80
- Border Color: #2d2d44
```

---

## Article Structure

Every blog post follows this structure:

```html
1. Table of Contents (if ≥3 H2s)
2. H1 Title
3. Introduction paragraph
4. Main content with H2/H3 sections
5. Conclusion
6. CTA box
```

---

## 1. Table of Contents

**Appears when**: Article has ≥3 H2 headings

**HTML Structure**:
```html
<div style="background: rgba(66, 80, 235, 0.05); border-left: 4px solid #4250eb; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
  <p style="font-weight: 700; font-size: 17px; color: #4250eb; margin: 0 0 12px 0;">
    Table of Contents
  </p>
  <ul style="list-style: none; padding: 0; margin: 0;">
    <li style="margin: 8px 0;">
      <a href="#heading-id" style="color: #4250eb; text-decoration: none; font-size: 15px; transition: opacity 0.2s;">
        Section Title
      </a>
    </li>
    <!-- More items... -->
  </ul>
</div>
```

**Features**:
- Light blue background
- Blue left border
- Clean list without bullets
- Clickable links to H2 sections
- Smooth hover transition

---

## 2. Headings

### H1 (Main Title)
```html
<h1>Article Title Here</h1>
```
**Note**: H1 has no inline styles in Webflow (uses CMS styling)

### H2 (Main Sections)
```html
<h2 id="section-slug" style="font-size: 24px; font-weight: 700; margin: 32px 0 16px 0; color: #e2e8f0;">
  Section Title
</h2>
```

**Features**:
- Auto-generated ID for TOC linking (lowercase, hyphenated)
- 24px font size
- Bold weight (700)
- Light color (#e2e8f0)
- Large top margin (32px) for spacing

### H3 (Subsections)
```html
<h3 style="font-size: 20px; font-weight: 600; margin: 24px 0 12px 0; color: #e2e8f0;">
  Subsection Title
</h3>
```

### H4 (Minor Headings)
```html
<h4 style="font-size: 17px; font-weight: 600; margin: 20px 0 10px 0; color: #e2e8f0;">
  Minor Heading
</h4>
```

---

## 3. Paragraphs

```html
<p style="font-size: 16px; line-height: 1.7; color: #94a3b8; margin: 16px 0;">
  Paragraph text here.
</p>
```

**Features**:
- 16px font size
- 1.7 line height (easy reading)
- Muted color (#94a3b8)
- 16px vertical margins

---

## 4. Links

### Regular Links
```html
<a style="color: #4250eb; text-decoration: underline; font-weight: 500;" href="https://example.com">
  Link Text
</a>
```

**Features**:
- Primary blue color
- Underlined
- Medium weight (500)
- Works for both internal and external links

### Authority Links (Required for SEO)
Same styling, but linked to:
- Investopedia
- TradingView
- CFTC/SEC/FINRA
- BabyPips, DailyFX, MyFXBook
- Forbes, Bloomberg, WSJ, Reuters

**Example**:
```html
<p>
  According to
  <a style="color: #4250eb; text-decoration: underline; font-weight: 500;"
     href="https://www.investopedia.com/terms/p/proprietarytrading.asp">
    Investopedia's definition of proprietary trading
  </a>,
  prop firms provide capital to skilled traders...
</p>
```

---

## 5. Lists

### Unordered Lists
```html
<ul style="padding-left: 24px; margin: 16px 0;">
  <li style="margin: 8px 0; font-size: 15px; line-height: 1.6; color: #94a3b8;">
    List item text
  </li>
</ul>
```

### Ordered Lists
```html
<ol style="padding-left: 24px; margin: 16px 0;">
  <li style="margin: 8px 0; font-size: 15px; line-height: 1.6; color: #94a3b8;">
    Numbered item
  </li>
</ol>
```

**Features**:
- 24px left padding (indentation)
- 15px font size (slightly smaller than paragraphs)
- 8px spacing between items
- Muted text color

---

## 6. Blockquotes

```html
<blockquote style="border-left: 4px solid #4250eb; padding: 12px 20px; margin: 20px 0; background: rgba(66, 80, 235, 0.04); border-radius: 0 8px 8px 0;">
  <p>Quote text here.</p>
</blockquote>
```

**Features**:
- Blue left border (4px)
- Light blue background
- Rounded right corners
- 20px horizontal padding

---

## 7. Code Blocks

### Block Code
```html
<pre style="background: #1a1a2e; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 20px 0;">
  <code style="font-family: 'Fira Code', monospace; font-size: 14px; color: #e2e8f0;">
    // Code here
  </code>
</pre>
```

### Inline Code
```html
<code style="background: rgba(66, 80, 235, 0.1); padding: 2px 6px; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 14px; color: #4250eb;">
  inline code
</code>
```

**Features**:
- Dark background for blocks
- Light blue background for inline
- Monospace font (Fira Code)
- Horizontal scrolling for long code

---

## 8. Images

```html
<img style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;"
     src="image-url.png"
     alt="Descriptive alt text">
```

**Features**:
- Responsive (max-width 100%)
- Rounded corners (8px)
- 20px vertical spacing
- **MUST have descriptive alt text** (SEO requirement)

---

## 9. Tables

```html
<table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; margin: 24px 0;">
  <thead>
    <tr style="background: #1a1a2e;">
      <th style="background: #1a1a2e; color: #e2e8f0; padding: 12px 16px; text-align: left; font-weight: 600; font-size: 14px; border-bottom: 2px solid #4250eb;">
        Header 1
      </th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: #12121a;">
      <td style="padding: 12px 16px; border-bottom: 1px solid #2d2d44; font-size: 14px; color: #94a3b8;">
        Cell content
      </td>
    </tr>
  </tbody>
</table>
```

**Features**:
- Dark header (#1a1a2e)
- Blue bottom border on headers
- Alternating row backgrounds
- Clean borders between rows

---

## 10. Highlight/Callout Boxes

```html
<div style="border-left: 4px solid #4250eb; background: rgba(66, 80, 235, 0.04); border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0;">
  <p>Important information or tip</p>
</div>
```

**Types Available**:
- **Info**: Blue (#4250eb)
- **Success**: Green (#4ade80)
- **Warning**: Yellow (#fbbf24)
- **Tip**: Purple (#8b5cf6)

---

## 11. FAQ Section

```html
<div style="margin: 32px 0;">
  <h2>Frequently Asked Questions</h2>

  <details style="border-bottom: 1px solid #2d2d44; padding: 16px 0;">
    <summary style="font-weight: 600; font-size: 16px; cursor: pointer; color: #e2e8f0; list-style: none; display: flex; justify-content: space-between; align-items: center;">
      Question text here?
      <span style="color: #4250eb; font-size: 20px; transition: transform 0.2s;">+</span>
    </summary>
    <div style="padding: 12px 0 4px 0; color: #94a3b8; font-size: 15px; line-height: 1.7;">
      Answer text here.
    </div>
  </details>
</div>
```

**Features**:
- Collapsible <details> elements
- Blue "+" icon that rotates on open
- Clean borders between questions
- Smooth transitions

---

## 12. CTA (Call-to-Action) Box

**Always appears at end of article**

```html
<div style="background: linear-gradient(135deg, #4250eb, #6366f1); border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
  <p style="color: white; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">
    Start your challenge today
  </p>
  <a href="https://tradersyard.com/#pricing"
     style="display: inline-block; background: white; color: #4250eb; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; transition: transform 0.2s;">
    Get Started Now
  </a>
</div>
```

**Features**:
- Blue gradient background
- White text and button
- Large, centered layout
- Prominent call to action
- Links to TradersYard pricing page

---

## 13. Horizontal Rules

```html
<hr style="border: none; border-top: 1px solid #2d2d44; margin: 32px 0;">
```

**Features**:
- Subtle dark border
- Large vertical spacing
- Used to separate major sections

---

## Complete Article Example

```html
<!-- TABLE OF CONTENTS -->
<div style="background: rgba(66, 80, 235, 0.05); ...">
  <p>Table of Contents</p>
  <ul><li><a href="#section">Section</a></li></ul>
</div>

<!-- H1 TITLE -->
<h1>How to Pass a Prop Firm Challenge</h1>

<!-- INTRO -->
<p style="font-size: 16px; ...">
  Opening paragraph with keyword in first 100 words...
</p>

<!-- MAIN CONTENT -->
<h2 id="what-is" style="font-size: 24px; ...">What is a Prop Firm Challenge?</h2>
<p style="font-size: 16px; ...">Definition and explanation...</p>

<h2 id="how-it-works" style="font-size: 24px; ...">How It Works</h2>
<p style="font-size: 16px; ...">Step-by-step explanation...</p>

<!-- AUTHORITY LINK EXAMPLE -->
<p style="font-size: 16px; ...">
  According to
  <a style="color: #4250eb; ..." href="https://www.investopedia.com/...">
    Investopedia
  </a>,
  prop trading involves...
</p>

<!-- FAQ SECTION -->
<div style="margin: 32px 0;">
  <h2>Frequently Asked Questions</h2>
  <details style="border-bottom: ...">
    <summary>Question?</summary>
    <div>Answer</div>
  </details>
</div>

<!-- CONCLUSION -->
<h2 id="conclusion" style="font-size: 24px; ...">Conclusion</h2>
<p style="font-size: 16px; ...">
  Summary paragraph. Ready to start?
  <a href="https://tradersyard.com/#pricing">Join TradersYard</a>.
</p>

<!-- CTA BOX -->
<div style="background: linear-gradient(...); ...">
  <p style="color: white; ...">Start your challenge today</p>
  <a href="https://tradersyard.com/#pricing" style="...">Get Started Now</a>
</div>
```

---

## SEO Requirements in Formatting

### 1. Title in First 100 Words
The primary keyword must appear naturally in the introduction:
```html
<p>A <strong>prop firm challenge</strong> is the evaluation process...</p>
```

### 2. Keyword in H2s
At least 2 H2 headings should contain the primary or secondary keywords:
```html
<h2 id="...">What is a Prop Firm Challenge?</h2>
<h2 id="...">How to Pass Your Challenge</h2>
```

### 3. Internal Links (Minimum 3)
```html
<a href="https://tradersyard.com/blog/best-prop-firms">best prop firms</a>
<a href="https://tradersyard.com/#pricing">TradersYard pricing</a>
<a href="https://tradersyard.com/blog/prop-firm-rules">prop firm rules</a>
```

### 4. External Authority Links (Minimum 1)
```html
<a href="https://www.investopedia.com/...">Investopedia</a>
<a href="https://www.tradingview.com/...">TradingView</a>
```

### 5. Image Alt Text (All Images)
```html
<img alt="Prop firm challenge rules comparison chart" src="...">
```

### 6. Schema Markup (Auto-Generated)
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "author": {"@type": "Organization", "name": "TradersYard"}
}
```

---

## Webflow CMS Field Mapping

When publishing to Webflow:

```json
{
  "fieldData": {
    "name": "Article Title | TradersYard",
    "slug": "article-slug",
    "post-body": "[Full HTML with inline styles]",
    "post-summary": "Meta description 150-160 chars"
  }
}
```

---

## Key Formatting Rules

1. **All styles are inline** (required for Webflow rich text)
2. **Dark theme colors** (matches TradersYard brand)
3. **Electric blue (#4250eb)** for primary elements
4. **Responsive images** (max-width: 100%)
5. **Consistent spacing** (margins in multiples of 4px/8px)
6. **Clean typography** (16px body, 1.7 line-height)
7. **Accessibility** (alt text, semantic HTML, good contrast)

---

## What the Automation Does

1. **Generates markdown** with AI (Claude/OpenAI)
2. **Converts to HTML** (markdown.mjs)
3. **Applies inline styles** (html-styler.mjs)
4. **Adds TOC** (if ≥3 H2s)
5. **Adds CTA box** (from frontmatter)
6. **Generates schema** (JSON-LD)
7. **Publishes to Webflow** (via API)

---

## ✅ Final Result

A fully-styled, SEO-optimized blog post ready for Webflow CMS that:
- Matches TradersYard brand perfectly
- Scores ≥70/100 on SEO checks
- Includes authority links for E-A-T
- Has proper internal linking
- Converts readers to customers

**This formatting is production-ready and tested!** 🎯
