# ✅ Complete Publishing Workflow - VERIFIED WORKING

## Publishing Status: LIVE ✅

**Article Published**: Best Prop Firms for Day Trading in 2026
**Live URL**: https://blog.tradersyard.com/blog-posts/best-prop-firms-for-day-trading-in-2026-d6a4d
**Status**: 200 OK ✅
**Thumbnail**: Geometric minimalist (Ideogram v3 DESIGN mode) ✅
**Published**: 2026-02-16 02:31:19 UTC

---

## Complete Publishing Process (2 Steps)

### Step 1: Publish CMS Item
```bash
node scripts/publish.mjs --file content/approved/article.md --live
```

**What this does**:
1. Creates CMS item with `isDraft: false`
2. Publishes item via `POST /v2/collections/{collection_id}/items/publish`
3. Includes geometric minimalist thumbnail URL in `feature-image` field
4. Returns Webflow item ID

### Step 2: Publish Site to Live Domain
```bash
node scripts/publish-site.mjs
```

**What this does**:
1. Publishes entire Webflow site to custom domain
2. Uses `POST /v2/sites/{site_id}/publish`
3. Payload: `{ customDomains: [domain_id] }`
4. Makes CMS changes visible on blog.tradersyard.com

---

## URL Structure

### Webflow Configuration
- **Site ID**: `68fa557c6e6c4fcedde84957` (TradersYard Blog v2)
- **Collection ID**: `68fa557e6e6c4fcedde849e0`
- **Collection Slug**: `blog-posts`
- **Domain**: blog.tradersyard.com

### URL Format
```
https://blog.tradersyard.com/blog-posts/{article-slug}
```

**Example**:
```
https://blog.tradersyard.com/blog-posts/best-prop-firms-for-day-trading-in-2026-d6a4d
```

**Note**: Webflow auto-appends hash (`-d6a4d`) to prevent slug conflicts when same slug is published multiple times.

---

## Configuration (config.json)

```json
{
  "site": {
    "name": "TradersYard",
    "baseUrl": "https://blog.tradersyard.com",
    "blogPath": "blog-posts"
  },
  "webflow": {
    "apiBase": "https://api.webflow.com/v2",
    "blogCollectionId": "68fa557e6e6c4fcedde849e0"
  }
}
```

**Key**: `blogPath` MUST match Webflow collection slug (`blog-posts`)

---

## Geometric Minimalist Images ✨

**Status**: IMPLEMENTED AND LIVE ✅

### Thumbnail Generation
- **Model**: fal.ai Ideogram v3
- **Style**: `DESIGN` (not `AUTO`)
- **Aspect Ratio**: 16:9 (1200x630px)
- **Prompts**: 200+ line sophisticated prompts
- **Aesthetic**: Swiss design + Bauhaus + Bloomberg Terminal

### Visual Quality
- ✅ Vector-quality edges
- ✅ Mathematical precision
- ✅ 40-50% negative space
- ✅ Navy gradient background (#0F172A → #1a1a2e)
- ✅ Electric blue (#4250EB) accents
- ✅ Professional minimalism
- ✅ NO stock photo feel

### Live Example
**Thumbnail URL**: https://v3b.fal.media/files/b/0a8ea688/0yCAfDweFG55N8PoSt1Ho_image.png

**Visible on page**:
- OG image meta tag ✅
- Twitter card image ✅
- Featured post image ✅

---

## Verification Checklist

### Before Publishing
- [ ] Article SEO score ≥ 70/100
- [ ] Geometric minimalist thumbnail generated
- [ ] Thumbnail URL saved in frontmatter
- [ ] Content moved to `content/approved/`

### Publishing
- [ ] Step 1: `publish.mjs --file ... --live` (creates + publishes CMS item)
- [ ] Step 2: `publish-site.mjs` (publishes site to custom domain)

### After Publishing
- [ ] Check HTTP status: `curl -I https://blog.tradersyard.com/blog-posts/{slug}`
- [ ] Verify 200 OK response
- [ ] Confirm thumbnail loads on page
- [ ] Check OG image in page source
- [ ] Submit to Google Indexing API: `node scripts/index.mjs --url ...`

---

## Common Issues & Solutions

### ❌ Issue: 404 Not Found
**Cause**: Collection slug missing from URL
**Solution**: URLs must include `/blog-posts/` path

### ❌ Issue: Duplicate slugs with hash
**Cause**: Publishing same slug multiple times
**Solution**: Delete old duplicates via Webflow API before republishing

### ❌ Issue: Thumbnail not showing
**Cause**: Missing `feature-image` field or incorrect URL
**Solution**: Verify `frontmatter.featured_image.url` is set and passed to `buildFieldData()`

### ❌ Issue: CDN cache delay
**Cause**: Webflow CDN takes time to propagate
**Solution**: Wait 1-5 minutes after site publish, then check again

---

## Full Automation (Pipeline)

For complete end-to-end automation:

```bash
# Generate + thumbnail + images + publish + index
node scripts/pipeline.mjs --file content/drafts/article.md

# Then publish site to live domain
node scripts/publish-site.mjs
```

**Pipeline steps**:
1. SEO check (minimum 70/100)
2. Thumbnail generation (geometric minimalist)
3. In-article images (3-5 images)
4. Publish to Webflow CMS
5. Google Indexing API submission

---

## Success Metrics

**Current Status**:
- ✅ Geometric minimalist images working perfectly
- ✅ CMS publishing working
- ✅ Site publishing working
- ✅ Live URLs accessible (200 OK)
- ✅ Thumbnails displaying on pages
- ✅ OG/Twitter meta tags correct
- ✅ URL structure documented

**Next Steps**:
1. Update CLAUDE.md with URL structure
2. Test cron automation end-to-end
3. Add URL cleanup (remove duplicate items)
4. Deploy to Railway with correct config

---

**Last Verified**: 2026-02-16 02:31 UTC
**Article Count**: 10+ published articles
**Domain**: blog.tradersyard.com
**Status**: ✅ PRODUCTION READY
