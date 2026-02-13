# ⚠️ CRITICAL DOMAIN CONFIGURATION

## DO NOT CHANGE THIS CONFIGURATION

### Current Domain (Active)
**PUBLISH TO**: `blog.tradersyard.com` (subdomain)
**Webflow Collection ID**: `68fa557e6e6c4fcedde849e0`

This is the **CORRECT** configuration until the blog migration is complete.

---

## DO NOT Use This Domain (Yet)
**DO NOT PUBLISH TO**: `tradersyard.com/blog/` (subdirectory)
**DO NOT USE Collection ID**: `67b4bd39747043c9b6d29c6e`

This is the **WRONG** domain for now. It will become correct after migration.

---

## Why This Matters

Publishing to the wrong domain will:
- ❌ Lose all SEO authority (Tier 50 → Tier 0)
- ❌ Break existing backlinks
- ❌ Confuse Google Search Console
- ❌ Require deleting and republishing all content
- ❌ Waste weeks of work

---

## When to Change

**ONLY change the collection ID when the user explicitly says:**
- "Migration is complete"
- "Switch to tradersyard.com/blog"
- "Use the new domain now"

**Until then, ALWAYS use:**
```json
{
  "site": {
    "baseUrl": "https://blog.tradersyard.com"
  },
  "webflow": {
    "blogCollectionId": "68fa557e6e6c4fcedde849e0"
  }
}
```

---

## Configuration Files

This setting is in:
- `config.json` (line 10)
- Memory: `~/.claude/projects/.../memory/MEMORY.md`

**NEVER change blogCollectionId without explicit user permission.**

---

## Testing Published Articles

Always verify published articles go to:
✅ `https://blog.tradersyard.com/article-slug`

NOT:
❌ `https://tradersyard.com/blog/article-slug`

---

## If You Made a Mistake

If an article was published to the wrong domain:
1. **STOP IMMEDIATELY** - Do not publish more
2. **Alert the user** - Tell them which articles went to wrong domain
3. **Delete the articles** from wrong collection
4. **Republish** to correct collection (blog.tradersyard.com)
5. **Update config.json** to correct collection ID

---

**This is the MOST IMPORTANT configuration in the entire system. Do not change it.**
