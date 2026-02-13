import { CMS_API_KEY, blogConfig } from './config.mjs';
import { readFileSync } from 'fs';
import FormData from 'form-data';

const API_BASE = blogConfig.webflow.apiBase;
const COLLECTION_ID = blogConfig.webflow.blogCollectionId;
const SITE_ID = '68fa557c6e6c4fcedde84957'; // tradersyard-blog-v2 site ID

const headers = {
  'Authorization': `Bearer ${CMS_API_KEY}`,
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

// --- Assets: Upload images ---

export async function uploadAsset(filePath, fileName) {
  // Step 1: Request upload URL
  const form = new FormData();
  form.append('fileName', fileName);
  form.append('fileHash', 'placeholder'); // Webflow doesn't validate this
  form.append('siteId', SITE_ID);

  const uploadUrlRes = await fetch(`${API_BASE}/assets/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CMS_API_KEY}`,
      'accept': 'application/json',
    },
    body: form,
  });

  if (!uploadUrlRes.ok) {
    const text = await uploadUrlRes.text();
    throw new Error(`Failed to get upload URL: ${uploadUrlRes.status} ${text}`);
  }

  const { uploadUrl, uploadDetails } = await uploadUrlRes.json();

  // Step 2: Upload file to S3
  const fileBuffer = readFileSync(filePath);
  const uploadForm = new FormData();

  // Add S3 fields
  Object.entries(uploadDetails.s3Fields).forEach(([key, value]) => {
    uploadForm.append(key, value);
  });
  uploadForm.append('file', fileBuffer, { filename: fileName });

  const s3Res = await fetch(uploadUrl, {
    method: 'POST',
    body: uploadForm,
  });

  if (!s3Res.ok) {
    const text = await s3Res.text();
    throw new Error(`Failed to upload to S3: ${s3Res.status} ${text}`);
  }

  // Return the asset URL
  return uploadDetails.assetUrl || `https://cdn.prod.website-files.com/${SITE_ID}/${fileName}`;
}

// --- Helper: build fieldData from frontmatter ---

export function buildFieldData(frontmatter, htmlBody, thumbnailUrl = null) {
  const mapping = blogConfig.webflow.fieldMapping;
  const fieldData = {
    [mapping.title]: frontmatter.meta_title || frontmatter.title,
    [mapping.slug]: frontmatter.slug,
    [mapping.body]: htmlBody,
    [mapping.summary]: frontmatter.description || frontmatter.meta_description || '',
  };

  // Add thumbnail if provided
  if (thumbnailUrl) {
    fieldData['thumbnail'] = thumbnailUrl; // Adjust field name if different in your CMS
  }

  return fieldData;
}
