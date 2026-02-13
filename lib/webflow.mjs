import { WEBFLOW_API_KEY, blogConfig } from './config.mjs';

const API_BASE = blogConfig.webflow.apiBase;
const COLLECTION_ID = blogConfig.webflow.blogCollectionId;

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

export async function publishItems(itemIds, { collectionId = COLLECTION_ID } = {}) {
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

// --- Helper: build fieldData from frontmatter ---

export function buildFieldData(frontmatter, htmlBody) {
  const mapping = blogConfig.webflow.fieldMapping;
  return {
    [mapping.title]: frontmatter.meta_title || frontmatter.title,
    [mapping.slug]: frontmatter.slug,
    [mapping.body]: htmlBody,
    [mapping.summary]: frontmatter.description || frontmatter.meta_description || '',
  };
}
