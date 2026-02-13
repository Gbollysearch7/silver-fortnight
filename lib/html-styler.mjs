import { blogConfig } from './config.mjs';

const { primaryColor, primaryRgb, darkBg1, darkBg2, darkBg3, successGreen, textLight, textMuted, borderColor } = blogConfig.design;

// --- Main wrapper ---

export function wrapInArticle(htmlContent, frontmatter, headings = []) {
  const toc = headings.length >= 3 ? generateTOC(headings) : '';
  const cta = frontmatter.cta ? generateCTA(frontmatter.cta.text, frontmatter.cta.url) : '';

  return `${toc}\n${htmlContent}\n${cta}`;
}

// --- Table of Contents ---

export function generateTOC(headings) {
  const h2s = headings.filter(h => h.level === 2);
  if (h2s.length < 3) return '';

  const items = h2s.map(h => {
    const id = h.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `<li style="margin: 8px 0;"><a href="#${id}" style="color: ${primaryColor}; text-decoration: none; font-size: 15px; transition: opacity 0.2s;">${h.text}</a></li>`;
  }).join('\n');

  return `<div style="background: rgba(${primaryRgb}, 0.05); border-left: 4px solid ${primaryColor}; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
<p style="font-weight: 700; font-size: 17px; color: ${primaryColor}; margin: 0 0 12px 0;">Table of Contents</p>
<ul style="list-style: none; padding: 0; margin: 0;">
${items}
</ul>
</div>`;
}

// --- Styled comparison table ---

export function styleTable(tableHtml) {
  // Wrap table in a styled container
  let styled = tableHtml;

  // Style the table element
  styled = styled.replace('<table>', `<table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; margin: 24px 0;">`);

  // Style header cells
  styled = styled.replace(/<th>/g, `<th style="background: ${darkBg1}; color: ${textLight}; padding: 12px 16px; text-align: left; font-weight: 600; font-size: 14px; border-bottom: 2px solid ${primaryColor};">`);

  // Style body cells
  styled = styled.replace(/<td>/g, `<td style="padding: 12px 16px; border-bottom: 1px solid ${borderColor}; font-size: 14px; color: ${textMuted};">`);

  // Style body rows with alternating backgrounds
  styled = styled.replace(/<tr>/g, `<tr style="background: ${darkBg3};">`);

  // Override header row
  styled = styled.replace(/<thead>\n<tr style="[^"]*">/, `<thead>\n<tr style="background: ${darkBg1};">`);

  return styled;
}

// --- CTA box ---

export function generateCTA(text, url) {
  return `<div style="background: linear-gradient(135deg, ${primaryColor}, #6366f1); border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
<p style="color: white; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">${text}</p>
<a href="${url}" style="display: inline-block; background: white; color: ${primaryColor}; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; transition: transform 0.2s;">Get Started Now</a>
</div>`;
}

// --- FAQ section ---

export function generateFAQ(faqItems) {
  if (!faqItems || faqItems.length === 0) return '';

  const items = faqItems.map(({ question, answer }) => `
<details style="border-bottom: 1px solid ${borderColor}; padding: 16px 0;">
<summary style="font-weight: 600; font-size: 16px; cursor: pointer; color: ${textLight}; list-style: none; display: flex; justify-content: space-between; align-items: center;">
${question}
<span style="color: ${primaryColor}; font-size: 20px; transition: transform 0.2s;">+</span>
</summary>
<div style="padding: 12px 0 4px 0; color: ${textMuted}; font-size: 15px; line-height: 1.7;">
${answer}
</div>
</details>`).join('\n');

  return `<div style="margin: 32px 0;">
<h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Frequently Asked Questions</h2>
${items}
</div>`;
}

// --- Highlight/callout box ---

export function generateHighlightBox(content, type = 'info') {
  const colors = {
    info: primaryColor,
    success: successGreen,
    warning: '#fbbf24',
    tip: '#8b5cf6',
  };
  const color = colors[type] || primaryColor;

  return `<div style="border-left: 4px solid ${color}; background: rgba(${primaryRgb}, 0.04); border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0;">
${content}
</div>`;
}

// --- Apply inline styles to raw HTML ---

export function applyStyles(html) {
  let styled = html;

  // Style headings with IDs for TOC linking
  styled = styled.replace(/<h2>(.+?)<\/h2>/g, (_, text) => {
    const id = text.replace(/<[^>]+>/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `<h2 id="${id}" style="font-size: 24px; font-weight: 700; margin: 32px 0 16px 0; color: ${textLight};">${text}</h2>`;
  });

  styled = styled.replace(/<h3>(.+?)<\/h3>/g,
    `<h3 style="font-size: 20px; font-weight: 600; margin: 24px 0 12px 0; color: ${textLight};">$1</h3>`);

  styled = styled.replace(/<h4>(.+?)<\/h4>/g,
    `<h4 style="font-size: 17px; font-weight: 600; margin: 20px 0 10px 0; color: ${textLight};">$1</h4>`);

  // Style paragraphs
  styled = styled.replace(/<p>/g, `<p style="font-size: 16px; line-height: 1.7; color: ${textMuted}; margin: 16px 0;">`);

  // Style links
  styled = styled.replace(/<a href="/g, `<a style="color: ${primaryColor}; text-decoration: underline; font-weight: 500;" href="`);

  // Style lists
  styled = styled.replace(/<ul>/g, `<ul style="padding-left: 24px; margin: 16px 0;">`);
  styled = styled.replace(/<ol>/g, `<ol style="padding-left: 24px; margin: 16px 0;">`);
  styled = styled.replace(/<li>/g, `<li style="margin: 8px 0; font-size: 15px; line-height: 1.6; color: ${textMuted};">`);

  // Style blockquotes
  styled = styled.replace(/<blockquote>/g, `<blockquote style="border-left: 4px solid ${primaryColor}; padding: 12px 20px; margin: 20px 0; background: rgba(${primaryRgb}, 0.04); border-radius: 0 8px 8px 0;">`);

  // Style code blocks
  styled = styled.replace(/<pre>/g, `<pre style="background: ${darkBg1}; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 20px 0;">`);
  styled = styled.replace(/<code>/g, `<code style="font-family: 'Fira Code', monospace; font-size: 14px; color: ${textLight};">`);

  // Style inline code (not in pre)
  styled = styled.replace(/(?<!<pre[^>]*>[\s\S]*?)<code style="[^"]*">/g, `<code style="background: rgba(${primaryRgb}, 0.1); padding: 2px 6px; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 14px; color: ${primaryColor};">`);

  // Style images
  styled = styled.replace(/<img /g, `<img style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" `);

  // Style tables
  if (styled.includes('<table>')) {
    styled = styleTable(styled);
  }

  // Style horizontal rules
  styled = styled.replace(/<hr>/g, `<hr style="border: none; border-top: 1px solid ${borderColor}; margin: 32px 0;">`);

  return styled;
}

// --- Full pipeline: markdown HTML → styled Webflow HTML ---

export function styleForWebflow(rawHtml, frontmatter, headings = []) {
  const styled = applyStyles(rawHtml);
  return wrapInArticle(styled, frontmatter, headings);
}

// --- Generate JSON-LD schema ---

export function generateArticleSchema(frontmatter) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.title,
    description: frontmatter.description || frontmatter.meta_description,
    author: {
      '@type': 'Organization',
      name: frontmatter.author || 'TradersYard',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TradersYard',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tradersyard.com/logo.png',
      },
    },
    datePublished: frontmatter.published_at || frontmatter.created_at,
    dateModified: frontmatter.updated_at || frontmatter.created_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tradersyard.com/blog/${frontmatter.slug}`,
    },
  };
}
