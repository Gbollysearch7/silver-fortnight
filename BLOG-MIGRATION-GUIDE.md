# Blog Migration Guide: Subdomain → Subdirectory

## Overview

Migrate from `blog.tradersyard.com` to `tradersyard.com/blog/` to inherit main domain's Tier 50 authority instantly.

**Current Setup**:
- Blog: `blog.tradersyard.com` (separate subdomain, Tier 0)
- Main: `tradersyard.com` (Tier 50)

**Target Setup**:
- Blog: `tradersyard.com/blog/` (subdirectory, inherits Tier 50)
- Main: `tradersyard.com` (Tier 50)

**Benefit**: Skip 12 months of tier progression, compete for 50-100 monthly search volume keywords immediately.

---

## Prerequisites Check

### 1. Verify Webflow Setup

**Check if blog can be moved to subdirectory:**

- [ ] Is blog on a separate Webflow site/project from main site?
  - If YES → Migration requires Webflow plan upgrade or restructuring
  - If NO → Migration is straightforward

- [ ] Does main site Webflow plan support CMS collections?
  - If YES → Can host blog at `/blog/`
  - If NO → Need to upgrade plan

- [ ] How many blog posts exist currently?
  - Count: _____ posts
  - These will all need 301 redirects

### 2. DNS Access

- [ ] Access to DNS settings (Cloudflare, Namecheap, etc.)
- [ ] Ability to remove `blog` subdomain CNAME record
- [ ] Ability to add new DNS records if needed

### 3. Google Search Console Access

- [ ] Access to GSC for both properties
- [ ] Ability to add new property for `tradersyard.com/blog/`

---

## Migration Plan

### Phase 1: Technical Setup (1-2 days)

#### Step 1: Webflow Configuration

**If blog is separate Webflow site:**
1. Export all blog posts from current site
2. Create CMS collection in main Webflow site
3. Import posts to new collection
4. Set up blog template at `/blog/` path
5. Configure collection list page at `/blog/`
6. Configure collection item pages at `/blog/[slug]`

**If blog is same Webflow site:**
1. Change blog pages path from subdomain to `/blog/` subdirectory
2. Update Webflow site settings to remove subdomain
3. Republish all blog pages

#### Step 2: URL Mapping

Create a complete URL mapping spreadsheet:

| Old URL | New URL | Status |
|---------|---------|--------|
| `blog.tradersyard.com/post-1` | `tradersyard.com/blog/post-1` | Pending |
| `blog.tradersyard.com/post-2` | `tradersyard.com/blog/post-2` | Pending |
| ... | ... | ... |

Export this from Webflow CMS or create manually.

#### Step 3: 301 Redirects Setup

**Option A: Webflow Hosting (Recommended)**
1. Go to Webflow project settings → Hosting → 301 Redirects
2. Add redirects for each blog post:
   ```
   /post-1 → /blog/post-1
   /post-2 → /blog/post-2
   ...
   ```
3. Add wildcard redirect if Webflow supports:
   ```
   /* → /blog/$1
   ```

**Option B: Cloudflare (If using Cloudflare)**
1. Use Cloudflare Bulk Redirects
2. Upload CSV with old → new URL mappings
3. Set redirect type to 301 (permanent)

**Option C: Custom redirects.txt (If Webflow supports)**
Create `redirects.txt` file:
```
/post-1 /blog/post-1 301
/post-2 /blog/post-2 301
```

#### Step 4: DNS Changes

1. **Remove subdomain CNAME**:
   - Delete `blog` CNAME record pointing to Webflow

2. **Verify main domain A record**:
   - Ensure `tradersyard.com` points to Webflow IP

3. **Wait for DNS propagation** (up to 48 hours, usually 1-2 hours)

---

### Phase 2: Content Migration (1 day)

#### Step 1: Backup Everything

- [ ] Export all blog posts from Webflow CMS
- [ ] Download all blog images/assets
- [ ] Save current sitemap
- [ ] Take screenshots of current blog homepage, archive, individual posts

#### Step 2: Migrate Content

**If using same Webflow project:**
1. Update page paths to `/blog/[slug]`
2. Republish all pages

**If moving to new Webflow project:**
1. Create CMS collection in main site
2. Import blog posts (CSV or manual)
3. Re-upload images to new project
4. Verify all internal links work

#### Step 3: Update Internal Links

**In blog posts:**
- Find/replace: `blog.tradersyard.com` → `tradersyard.com/blog`
- Update navigation links
- Update category/tag links

**On main site:**
- Update any links to blog from homepage, footer, etc.
- Change from `blog.tradersyard.com` → `/blog/`

---

### Phase 3: SEO Migration (1 day)

#### Step 1: Google Search Console

1. **Add new property**: `tradersyard.com` (if not already added)
2. **Verify ownership** via DNS or meta tag
3. **Submit sitemap**: `tradersyard.com/sitemap.xml` (should include `/blog/` URLs)
4. **Request re-indexing** for all migrated blog posts

#### Step 2: Change of Address (Optional but Recommended)

1. Go to old GSC property (`blog.tradersyard.com`)
2. Settings → Change of Address
3. Select new property: `tradersyard.com`
4. This tells Google you've moved

#### Step 3: Submit Sitemap

1. Ensure Webflow generates sitemap with new URLs
2. Submit to GSC: `https://tradersyard.com/sitemap.xml`
3. Monitor indexing in GSC

#### Step 4: Analytics Update

**Google Analytics:**
1. Update GA4 property if needed
2. Verify tracking code works on `/blog/` pages
3. Set up filters if tracking main site + blog separately

---

### Phase 4: Testing & Validation (1 day)

#### Pre-Launch Checklist

- [ ] All blog posts accessible at `tradersyard.com/blog/[slug]`
- [ ] Old URLs redirect to new URLs with 301
- [ ] Sitemap includes new blog URLs
- [ ] Internal navigation works
- [ ] Images load correctly
- [ ] Meta tags/SEO fields preserved
- [ ] Social sharing works (OG tags)
- [ ] Analytics tracking works
- [ ] Search functionality works (if applicable)

#### Test Redirects

Use this tool: `curl -I https://blog.tradersyard.com/old-post`

Should return:
```
HTTP/1.1 301 Moved Permanently
Location: https://tradersyard.com/blog/old-post
```

#### Monitor for Issues

**Week 1 after launch:**
- [ ] Check GSC for crawl errors daily
- [ ] Monitor organic traffic (expect 5-10% dip initially)
- [ ] Verify redirects working in GSC Coverage report
- [ ] Check for broken links

**Week 2-4:**
- [ ] Traffic should recover to previous levels
- [ ] New URLs should start appearing in GSC
- [ ] Old URLs should show "Redirected" status

---

### Phase 5: Cleanup (1 week after launch)

#### Step 1: Verify Migration Success

- [ ] All old URLs redirect correctly
- [ ] New URLs indexed in Google (check GSC)
- [ ] Traffic recovered or growing
- [ ] No major crawl errors

#### Step 2: Update External Links (If Possible)

- [ ] Update social media bio links
- [ ] Update email signatures
- [ ] Update newsletter links
- [ ] Contact sites linking to old URLs (optional)

#### Step 3: Keep Redirects Permanent

**IMPORTANT**: Never remove 301 redirects
- Google needs them to transfer ranking signals
- Users with old bookmarks need them
- External sites linking to old URLs need them
- Keep redirects for minimum 1 year (ideally forever)

---

## Expected Outcomes

### Immediate (Week 1)
- All blog content accessible at new URLs
- 301 redirects preserve link equity
- Minor traffic dip (5-10%) is normal

### Short-term (Week 2-4)
- Traffic recovers to pre-migration levels
- New URLs appear in search results
- Google recognizes blog as part of main domain

### Long-term (Month 2-3)
- **Blog inherits Tier 50 authority**
- Can compete for 50-100 monthly search volume keywords
- Rankings improve for existing content
- New content ranks faster

---

## Rollback Plan (If Migration Fails)

If critical issues occur within first 48 hours:

1. **Revert DNS**: Re-add `blog` CNAME to Webflow
2. **Remove redirects**: Delete 301 redirects (or reverse them)
3. **Restore old site**: Re-publish blog at subdomain
4. **Inform Google**: Submit old sitemap again

**Cost**: Lose 2-3 days of SEO signals (minimal impact)

---

## Migration Checklist Summary

### Pre-Migration
- [ ] Verify Webflow setup compatibility
- [ ] Create URL mapping spreadsheet
- [ ] Backup all content and assets
- [ ] Set up staging environment (if possible)

### Migration Day
- [ ] Configure Webflow paths to `/blog/`
- [ ] Set up 301 redirects
- [ ] Update DNS settings
- [ ] Republish all content
- [ ] Update internal links

### Post-Migration
- [ ] Submit sitemap to GSC
- [ ] Test all redirects
- [ ] Monitor for errors
- [ ] Request re-indexing
- [ ] Track traffic/rankings

### Week 1-4 After
- [ ] Monitor GSC Coverage report daily
- [ ] Track organic traffic
- [ ] Fix any broken links
- [ ] Verify redirect preservation

---

## Cost-Benefit Analysis

### Costs
- **Time**: 3-5 days of focused work
- **Risk**: Temporary traffic dip (5-10% for 1-2 weeks)
- **Webflow**: Possible plan upgrade if needed (~$0-200)

### Benefits
- **Authority**: Instant Tier 50 inheritance (skip 12 months)
- **Rankings**: Compete for 50-100 monthly search volume immediately
- **Compound growth**: All blog content builds main domain authority
- **Long-term**: Every article strengthens tradersyard.com overall

**ROI**: If successful, you save 12 months of building from Tier 0 → Tier 50. That's ~360 low-value articles you don't need to publish first.

---

## Alternative: If Migration Not Possible

If Webflow limitations prevent subdirectory setup, see [TIER-0-KEYWORD-STRATEGY.md](./TIER-0-KEYWORD-STRATEGY.md) for the SEO Avalanche approach starting at Tier 0.
