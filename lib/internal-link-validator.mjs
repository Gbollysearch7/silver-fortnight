import { WEBFLOW_API_KEY, blogConfig } from './config.mjs';

const API_BASE = blogConfig.webflow.apiBase;
const COLLECTION_ID = blogConfig.webflow.blogCollectionId;

const LINK_PATTERN_RELATIVE = /\bhref=["'](\/blog-posts\/([a-z0-9\-]+))\/?["']/gi;
const LINK_PATTERN_ABSOLUTE = /\bhref=["']https?:\/\/(?:blog\.)?tradersyard\.com\/blog-posts\/([a-z0-9\-]+)\/?["']/gi;
const MARKDOWN_PATTERN = /\]\((\/blog-posts\/([a-z0-9\-]+))\/?\)/gi;
const MARKDOWN_ABS_PATTERN = /\]\(https?:\/\/(?:blog\.)?tradersyard\.com\/blog-posts\/([a-z0-9\-]+)\/?\)/gi;

let cachedSlugs = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchPublishedSlugs() {
  if (cachedSlugs && (Date.now() - cachedAt) < CACHE_TTL_MS) return cachedSlugs;

  const slugs = new Set();
  let offset = 0;
  const limit = 100;
  while (true) {
    const res = await fetch(`${API_BASE}/collections/${COLLECTION_ID}/items?limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${WEBFLOW_API_KEY}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Webflow API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    for (const item of data.items || []) {
      const slug = item.fieldData?.slug;
      if (slug && !item.isArchived) slugs.add(slug);
    }
    const total = data.pagination?.total || 0;
    offset += limit;
    if (offset >= total) break;
  }
  cachedSlugs = slugs;
  cachedAt = Date.now();
  return slugs;
}

export function extractBlogPostLinks(content) {
  const links = [];
  for (const m of content.matchAll(LINK_PATTERN_RELATIVE)) links.push({ slug: m[2], type: 'html-rel', match: m[0] });
  for (const m of content.matchAll(LINK_PATTERN_ABSOLUTE)) links.push({ slug: m[1], type: 'html-abs', match: m[0] });
  for (const m of content.matchAll(MARKDOWN_PATTERN)) links.push({ slug: m[2], type: 'md-rel', match: m[0] });
  for (const m of content.matchAll(MARKDOWN_ABS_PATTERN)) links.push({ slug: m[1], type: 'md-abs', match: m[0] });
  return links;
}

export async function validateInternalLinks(content, { allowSelf = null } = {}) {
  const links = extractBlogPostLinks(content);
  if (links.length === 0) return { valid: true, links: [], ghosts: [] };

  const published = await fetchPublishedSlugs();
  const ghosts = links.filter(l => l.slug !== allowSelf && !published.has(l.slug));
  return { valid: ghosts.length === 0, links, ghosts, totalPublished: published.size };
}
