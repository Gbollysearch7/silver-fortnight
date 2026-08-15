import { WEBFLOW_API_KEY, blogConfig } from './config.mjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const API_BASE = blogConfig.webflow.apiBase;
const COLLECTION_ID = blogConfig.webflow.blogCollectionId;
const SITE_ID = blogConfig.webflow.siteId; // loaded from config.json

const headers = {
  'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
  'Content-Type': 'application/json',
  'accept': 'application/json',
};

// --- Rate limit handling ---

let rateLimitRemaining = 60;
let rateLimitReset = 0;

async function webflowFetch(url, opts = {}) {
  // Wait if we're near the rate limit
  if (rateLimitRemaining <= 2) {
    const waitMs = Math.max(0, (rateLimitReset * 1000) - Date.now()) + 1000;
    if (waitMs > 0) {
      console.log(`  Rate limit near, waiting ${Math.ceil(waitMs / 1000)}s...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  const res = await fetch(url, { headers, ...opts });

  // Track rate limits
  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = res.headers.get('x-ratelimit-reset');
  if (remaining) rateLimitRemaining = parseInt(remaining, 10);
  if (reset) rateLimitReset = parseInt(reset, 10);

  // Retry on 429
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '60', 10);
    console.log(`  Rate limited. Retrying in ${retryAfter}s...`);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    return webflowFetch(url, opts);
  }

  return res;
}

// --- Collection operations ---

export async function listCollections(siteId) {
  const res = await webflowFetch(`${API_BASE}/sites/${siteId}/collections`);
  if (!res.ok) throw new Error(`Failed to list collections: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getCollectionFields(collectionId = COLLECTION_ID) {
  const res = await webflowFetch(`${API_BASE}/collections/${collectionId}`);
  if (!res.ok) throw new Error(`Failed to get collection: ${res.status} ${await res.text()}`);
  return res.json();
}

// --- Item CRUD ---

export async function createItem(fieldData, { isDraft = false, collectionId = COLLECTION_ID } = {}) {
  const payload = {
    isArchived: false,
    isDraft,
    fieldData,
  };

  const res = await webflowFetch(`${API_BASE}/collections/${collectionId}/items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create item: ${res.status} ${text}`);
  }

  return res.json();
}

export async function updateItem(itemId, fieldData, { collectionId = COLLECTION_ID } = {}) {
  const payload = {
    isArchived: false,
    isDraft: false,
    fieldData,
  };

  const res = await webflowFetch(`${API_BASE}/collections/${collectionId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update item: ${res.status} ${text}`);
  }

  return res.json();
}

// Items deliberately unpublished from live (dedup kills). Publishing them re-creates
// duplicate-content cannibalization — this already happened once (23 Jun banner batch).
// To re-publish one on purpose, remove it from data/unpublished-keepout.json first.
function loadKeepout() {
  try {
    const raw = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'unpublished-keepout.json'), 'utf8');
    return new Set(JSON.parse(raw).items.map((i) => i.id));
  } catch {
    return new Set();
  }
}

export async function publishItems(itemIds, { collectionId = COLLECTION_ID } = {}) {
  const keepout = loadKeepout();
  const blocked = itemIds.filter((id) => keepout.has(id));
  if (blocked.length) {
    console.warn(`[webflow] publishItems: refusing ${blocked.length} keep-out item(s) (dedup-killed): ${blocked.join(', ')}`);
    itemIds = itemIds.filter((id) => !keepout.has(id));
    if (!itemIds.length) return { publishedItemIds: [], blocked };
  }
  const res = await webflowFetch(`${API_BASE}/collections/${collectionId}/items/publish`, {
    method: 'POST',
    body: JSON.stringify({ itemIds }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to publish items: ${res.status} ${text}`);
  }

  return res.json();
}

export async function listItems({ collectionId = COLLECTION_ID, limit = 100, offset = 0 } = {}) {
  const res = await webflowFetch(`${API_BASE}/collections/${collectionId}/items?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`Failed to list items: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getItem(itemId, { collectionId = COLLECTION_ID } = {}) {
  const res = await webflowFetch(`${API_BASE}/collections/${collectionId}/items/${itemId}`);
  if (!res.ok) throw new Error(`Failed to get item: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function deleteItem(itemId, { collectionId = COLLECTION_ID } = {}) {
  const res = await webflowFetch(`${API_BASE}/collections/${collectionId}/items/${itemId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete item: ${res.status} ${text}`);
  }

  return true;
}

// --- Assets: Webflow CMS accepts external image URLs ---
// No upload needed - just pass fal.ai URLs directly to CMS fields

// --- Helper: build fieldData from frontmatter ---

export function buildFieldData(frontmatter, htmlBody, thumbnailUrl = null, { excludeSlug = false, isFeaturePost = false } = {}) {
  const mapping = blogConfig.webflow.fieldMapping;
  const fieldData = {
    [mapping.title]: frontmatter.meta_title || frontmatter.title,
    [mapping.body]: htmlBody,
    [mapping.summary]: frontmatter.description || frontmatter.meta_description || '',
    // Webflow "feature-post" Switch field (verified live 06 Jun 2026)
    'feature-post': isFeaturePost,
  };

  // Only include slug when creating new items, not when updating
  if (!excludeSlug) {
    fieldData[mapping.slug] = frontmatter.slug;
  }

  // Featured image. Verified live: the Image field slug is 'feature-image'
  // (NOT 'main-image' — that field does not exist and was silently dropped).
  // Webflow Image fields accept { url, alt }; alt is required for SEO + accessibility.
  if (thumbnailUrl) {
    const altText =
      frontmatter.featured_image?.alt ||
      `${frontmatter.title} - TradersYard`;
    fieldData['feature-image'] = { url: thumbnailUrl, alt: altText };
  }

  return fieldData;
}

// --- Helper: un-feature previous featured post and feature the new one ---

export async function setFeaturedPost(newItemId) {
  // Find the current featured post. Verified live: the Switch field slug is
  // 'feature-post' (NOT 'featured' — that field does not exist).
  const { items } = await listItems({ limit: 100 });
  const currentFeatured = items?.filter(item =>
    item.fieldData?.['feature-post'] === true && item.id !== newItemId
  ) || [];

  // Un-feature old ones
  for (const item of currentFeatured) {
    await updateItem(item.id, { 'feature-post': false });
  }

  // Feature the new one
  await updateItem(newItemId, { 'feature-post': true });

  // Publish all changed items
  const idsToPublish = [newItemId, ...currentFeatured.map(i => i.id)];
  await publishItems(idsToPublish);

  return { unfeatured: currentFeatured.length, featured: newItemId };
}
