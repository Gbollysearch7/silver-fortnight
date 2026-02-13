import { blogConfig } from './config.mjs';
import { extractHeadings, extractLinks, countWords } from './markdown.mjs';

const { seo: seoConfig, templates } = blogConfig;

// --- Main check function ---

export function check(frontmatter, content) {
  const issues = [];
  const passed = [];
  let totalPoints = 0;
  let earnedPoints = 0;

  const headings = extractHeadings(content);
  const links = extractLinks(content);
  const wordCount = countWords(content);
  const primaryKeyword = frontmatter.keywords?.primary || frontmatter.primary_keyword || '';
  const secondaryKeywords = frontmatter.keywords?.secondary || frontmatter.secondary_keywords || [];
  const template = frontmatter.template || 'how-to';
  const templateConfig = templates[template] || templates['how-to'];

  // --- Rule checks ---

  // 1. Title (10 pts)
  totalPoints += 10;
  if (!frontmatter.title) {
    issues.push({ severity: 'error', rule: 'title', message: 'Title is missing', points: 10 });
  } else if (frontmatter.title.length > seoConfig.titleMaxLength) {
    issues.push({ severity: 'warning', rule: 'title-length', message: `Title is ${frontmatter.title.length} chars (max ${seoConfig.titleMaxLength})`, points: 5 });
    earnedPoints += 5;
  } else if (primaryKeyword && !frontmatter.title.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    issues.push({ severity: 'warning', rule: 'title-keyword', message: `Title doesn't contain primary keyword "${primaryKeyword}"`, points: 5 });
    earnedPoints += 5;
  } else {
    passed.push('Title: good length and contains keyword');
    earnedPoints += 10;
  }

  // 2. Meta description (10 pts)
  totalPoints += 10;
  const desc = frontmatter.meta_description || frontmatter.description || '';
  if (!desc) {
    issues.push({ severity: 'error', rule: 'meta-description', message: 'Meta description is missing', points: 10 });
  } else if (desc.length < seoConfig.descriptionMinLength) {
    issues.push({ severity: 'warning', rule: 'meta-description-short', message: `Meta description is ${desc.length} chars (min ${seoConfig.descriptionMinLength})`, points: 5 });
    earnedPoints += 5;
  } else if (desc.length > seoConfig.descriptionMaxLength) {
    issues.push({ severity: 'warning', rule: 'meta-description-long', message: `Meta description is ${desc.length} chars (max ${seoConfig.descriptionMaxLength})`, points: 3 });
    earnedPoints += 7;
  } else {
    passed.push('Meta description: good length');
    earnedPoints += 10;
  }

  // 3. Slug (5 pts)
  totalPoints += 5;
  if (!frontmatter.slug) {
    issues.push({ severity: 'error', rule: 'slug', message: 'Slug is missing', points: 5 });
  } else if (frontmatter.slug.length > seoConfig.slugMaxLength) {
    issues.push({ severity: 'warning', rule: 'slug-length', message: `Slug is ${frontmatter.slug.length} chars (max ${seoConfig.slugMaxLength})`, points: 3 });
    earnedPoints += 2;
  } else if (/[A-Z]/.test(frontmatter.slug)) {
    issues.push({ severity: 'warning', rule: 'slug-case', message: 'Slug contains uppercase characters', points: 2 });
    earnedPoints += 3;
  } else {
    passed.push('Slug: clean and short');
    earnedPoints += 5;
  }

  // 4. H1 contains keyword (10 pts)
  totalPoints += 10;
  const h1 = headings.find(h => h.level === 1);
  if (!h1) {
    issues.push({ severity: 'warning', rule: 'h1-missing', message: 'No H1 heading found', points: 10 });
  } else if (primaryKeyword && !h1.text.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    issues.push({ severity: 'warning', rule: 'h1-keyword', message: `H1 doesn't contain primary keyword "${primaryKeyword}"`, points: 5 });
    earnedPoints += 5;
  } else {
    passed.push('H1: contains primary keyword');
    earnedPoints += 10;
  }

  // 5. Keyword in first 100 words (10 pts)
  totalPoints += 10;
  if (primaryKeyword) {
    const first100 = content.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
    if (first100.includes(primaryKeyword.toLowerCase())) {
      passed.push('Keyword in first 100 words');
      earnedPoints += 10;
    } else {
      issues.push({ severity: 'warning', rule: 'keyword-intro', message: 'Primary keyword not found in first 100 words', points: 10 });
    }
  } else {
    issues.push({ severity: 'info', rule: 'keyword-missing', message: 'No primary keyword defined', points: 5 });
    earnedPoints += 5;
  }

  // 6. H2s contain secondary keywords (10 pts)
  totalPoints += 10;
  const h2Texts = headings.filter(h => h.level === 2).map(h => h.text.toLowerCase());
  if (h2Texts.length === 0) {
    issues.push({ severity: 'warning', rule: 'h2-missing', message: 'No H2 headings found', points: 10 });
  } else if (secondaryKeywords.length === 0) {
    issues.push({ severity: 'info', rule: 'secondary-keywords', message: 'No secondary keywords defined to check H2s against', points: 5 });
    earnedPoints += 5;
  } else {
    const matchCount = secondaryKeywords.filter(kw =>
      h2Texts.some(h2 => h2.includes(kw.toLowerCase()))
    ).length;
    const ratio = matchCount / secondaryKeywords.length;
    if (ratio >= 0.5) {
      passed.push(`H2s: ${matchCount}/${secondaryKeywords.length} secondary keywords in headings`);
      earnedPoints += 10;
    } else if (ratio > 0) {
      issues.push({ severity: 'info', rule: 'h2-keywords', message: `Only ${matchCount}/${secondaryKeywords.length} secondary keywords in H2s`, points: 5 });
      earnedPoints += 5;
    } else {
      issues.push({ severity: 'warning', rule: 'h2-keywords', message: 'No secondary keywords found in H2 headings', points: 10 });
    }
  }

  // 7. Word count (10 pts)
  totalPoints += 10;
  if (wordCount < seoConfig.minWordCount) {
    issues.push({ severity: 'error', rule: 'word-count', message: `Word count is ${wordCount} (min ${seoConfig.minWordCount})`, points: 10 });
  } else if (wordCount < templateConfig.minWords) {
    issues.push({ severity: 'warning', rule: 'word-count-template', message: `Word count is ${wordCount} (template "${template}" recommends ${templateConfig.minWords}+)`, points: 5 });
    earnedPoints += 5;
  } else {
    passed.push(`Word count: ${wordCount} words`);
    earnedPoints += 10;
  }

  // 8. Internal links (10 pts)
  totalPoints += 10;
  const internalLinks = links.filter(l => l.isInternal);
  const linksPerK = (internalLinks.length / wordCount) * 1000;
  if (internalLinks.length < seoConfig.minInternalLinks) {
    issues.push({ severity: 'warning', rule: 'internal-links', message: `Only ${internalLinks.length} internal links (min ${seoConfig.minInternalLinks})`, points: 10 });
  } else {
    passed.push(`Internal links: ${internalLinks.length} found`);
    earnedPoints += 10;
  }

  // 9. Images have alt text (5 pts)
  totalPoints += 5;
  const imgRegex = /!\[([^\]]*)\]\([^)]+\)/g;
  const images = [...content.matchAll(imgRegex)];
  if (images.length === 0) {
    issues.push({ severity: 'info', rule: 'no-images', message: 'No images found in content', points: 3 });
    earnedPoints += 2;
  } else {
    const missingAlt = images.filter(m => !m[1].trim());
    if (missingAlt.length > 0) {
      issues.push({ severity: 'warning', rule: 'image-alt', message: `${missingAlt.length} image(s) missing alt text`, points: 5 });
    } else {
      passed.push(`Images: ${images.length} with alt text`);
      earnedPoints += 5;
    }
  }

  // 10. Schema type (5 pts)
  totalPoints += 5;
  if (frontmatter.schema_type) {
    passed.push(`Schema type: ${frontmatter.schema_type}`);
    earnedPoints += 5;
  } else {
    issues.push({ severity: 'info', rule: 'schema', message: 'No schema_type defined in frontmatter', points: 5 });
  }

  // 11. FAQ section (5 pts)
  totalPoints += 5;
  const hasFAQ = headings.some(h => h.text.toLowerCase().includes('faq') || h.text.toLowerCase().includes('frequently asked'));
  if (hasFAQ) {
    passed.push('FAQ section present');
    earnedPoints += 5;
  } else if (['ultimate-guide', 'how-to'].includes(template)) {
    issues.push({ severity: 'info', rule: 'faq', message: 'No FAQ section (recommended for guides)', points: 5 });
  } else {
    earnedPoints += 3; // Partial for non-guide templates
  }

  // 12. CTA defined (5 pts)
  totalPoints += 5;
  if (frontmatter.cta?.text && frontmatter.cta?.url) {
    passed.push('CTA defined');
    earnedPoints += 5;
  } else {
    issues.push({ severity: 'warning', rule: 'cta', message: 'No CTA defined in frontmatter', points: 5 });
  }

  // 13. Short paragraphs (5 pts)
  totalPoints += 5;
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim() && !p.startsWith('#') && !p.startsWith('-') && !p.startsWith('|'));
  const longParagraphs = paragraphs.filter(p => p.split(/[.!?]+/).filter(s => s.trim()).length > 5);
  if (longParagraphs.length > paragraphs.length * 0.3) {
    issues.push({ severity: 'info', rule: 'paragraphs', message: `${longParagraphs.length}/${paragraphs.length} paragraphs are too long (>5 sentences)`, points: 5 });
  } else {
    passed.push('Paragraph length: good');
    earnedPoints += 5;
  }

  // 14. External authority links (5 pts) - NEW RULE
  totalPoints += 5;
  const externalLinks = links.filter(l => !l.isInternal);
  const authorityDomains = [
    'investopedia.com', 'tradingview.com', 'forbes.com', 'bloomberg.com',
    'wsj.com', 'reuters.com', 'cftc.gov', 'sec.gov', 'finra.org',
    'babypips.com', 'dailyfx.com', 'myfxbook.com'
  ];
  const authorityLinks = externalLinks.filter(l =>
    authorityDomains.some(domain => l.url.includes(domain))
  );

  if (authorityLinks.length >= 1) {
    passed.push(`External authority links: ${authorityLinks.length} found`);
    earnedPoints += 5;
  } else if (externalLinks.length >= 1) {
    issues.push({ severity: 'info', rule: 'authority-links', message: `Has ${externalLinks.length} external link(s) but none from authority sources`, points: 3 });
    earnedPoints += 2;
  } else {
    issues.push({ severity: 'warning', rule: 'authority-links', message: 'No external authority links (recommended for E-A-T)', points: 5 });
  }

  // Calculate score
  const score = Math.round((earnedPoints / totalPoints) * 100);

  return {
    score,
    totalPoints,
    earnedPoints,
    issues: issues.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    passed,
    stats: {
      wordCount,
      headingCount: headings.length,
      h2Count: headings.filter(h => h.level === 2).length,
      internalLinkCount: internalLinks.length,
      externalLinkCount: links.filter(l => !l.isInternal).length,
      imageCount: images.length,
    },
  };
}

function severityOrder(s) {
  return { error: 0, warning: 1, info: 2 }[s] || 3;
}

// --- Format report ---

export function formatReport(result, slug = '') {
  const lines = [];
  lines.push(`# SEO Check: ${slug || 'Report'}`);
  lines.push(`\nScore: **${result.score}/100**\n`);

  lines.push('## Stats');
  lines.push(`- Words: ${result.stats.wordCount}`);
  lines.push(`- Headings: ${result.stats.headingCount} (${result.stats.h2Count} H2s)`);
  lines.push(`- Internal links: ${result.stats.internalLinkCount}`);
  lines.push(`- External links: ${result.stats.externalLinkCount}`);
  lines.push(`- Images: ${result.stats.imageCount}`);

  if (result.issues.length > 0) {
    lines.push('\n## Issues');
    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');
    const infos = result.issues.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      lines.push('\n### Errors (must fix)');
      for (const i of errors) lines.push(`- ${i.message}`);
    }
    if (warnings.length > 0) {
      lines.push('\n### Warnings (should fix)');
      for (const i of warnings) lines.push(`- ${i.message}`);
    }
    if (infos.length > 0) {
      lines.push('\n### Suggestions');
      for (const i of infos) lines.push(`- ${i.message}`);
    }
  }

  if (result.passed.length > 0) {
    lines.push('\n## Passed');
    for (const p of result.passed) lines.push(`- ${p}`);
  }

  return lines.join('\n');
}
