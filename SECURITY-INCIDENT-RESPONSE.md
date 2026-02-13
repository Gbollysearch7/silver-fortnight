# 🔒 Security Incident Response - API Key Exposure

## Incident Summary

**Date**: February 13, 2026
**Issue**: Firecrawl and Resend API keys were briefly exposed in initial git push attempt
**Status**: Repository cleaned, but keys need rotation
**Severity**: Medium (keys were detected and blocked by GitHub, but should be rotated)

---

## What Happened

1. Initial git commit included `.env` file with API keys
2. Push attempt to GitHub was **blocked** by GitHub Secret Scanning
3. Git history was reset and `.env` removed
4. Clean repo was pushed successfully
5. GitHub sent warning email about detected keys

---

## Current Status

✅ **Repository is clean** - No `.env` or sensitive files in current repo
✅ **`.gitignore` configured** - Future commits will exclude `.env`
⚠️ **Keys exposed briefly** - GitHub detected them, recommend rotation

---

## Immediate Actions Required

### 1. Rotate API Keys (Do This Now)

#### Firecrawl API Key
1. Go to: https://firecrawl.dev/app/api-keys
2. Click "Create new API key"
3. Copy the new key
4. Update `.env` file: `FIRECRAWL_API_KEY=new_key_here`
5. **Delete old key** from Firecrawl dashboard

#### Resend API Key
1. Go to: https://resend.com/api-keys
2. Click "Create API Key"
3. Copy the new key
4. Update `.env` file: `RESEND_API_KEY=new_key_here`
5. **Delete old key** from Resend dashboard

#### Update Railway Environment Variables
1. Go to Railway dashboard
2. Find your "TY Blog Automation" project
3. Click "Variables" tab
4. Update both keys with new values
5. Click "Redeploy"

---

## Keys That Were Exposed

Based on GitHub's detection:
- ✅ **Firecrawl API Key** - Detected and should be rotated
- ✅ **Resend API Key** - Detected and should be rotated

**NOTE**: GitHub also detected in first attempt (but blocked):
- OpenAI API Key
- Claude API Key (Anthropic)
- Google Service Account
- Grafana Token

**Recommendation**: Rotate ALL of these keys to be safe.

---

## Keys NOT in Repository (Safe)

The following were never committed:
- Webflow API Key
- FAL_KEY
- Supabase keys
- Omnisend key

---

## Prevention Measures (Already Implemented)

✅ **`.gitignore` created** - Excludes `.env` and all sensitive files
✅ **Repository cleaned** - No secrets in current git history
✅ **GitHub Secret Scanning** - Will block future attempts
✅ **Memory updated** - Permanent warning to never commit secrets

---

## Full Key Rotation Checklist

### Critical (Do Now)
- [ ] Firecrawl API Key - https://firecrawl.dev/app/api-keys
- [ ] Resend API Key - https://resend.com/api-keys

### Recommended (Do Soon)
- [ ] OpenAI API Key - https://platform.openai.com/api-keys
- [ ] Claude API Key - https://console.anthropic.com/settings/keys
- [ ] Google Service Account - Generate new JSON from Google Cloud Console
- [ ] Grafana Service Account Token - Regenerate in Grafana

### Update After Rotation
- [ ] Update local `.env` file with ALL new keys
- [ ] Update Railway environment variables with ALL new keys
- [ ] Test that automation still works
- [ ] Delete ALL old keys from provider dashboards

---

## How to Rotate Each Key

### OpenAI
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "TY Blog Automation"
4. Copy the key (you won't see it again)
5. Update `.env`: `OPENAI_API_KEY=sk-...`
6. Delete old key

### Claude (Anthropic)
1. Go to: https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name it "TY Blog Automation"
4. Copy the key
5. Update `.env`: `CLAUDE_API_KEY=sk-ant-...`
6. Delete old key

### Google Service Account
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Find your service account
3. Click "Keys" tab → "Add Key" → "Create new key"
4. Choose JSON format
5. Download and replace `data/google-service-account.json`
6. Delete old key from Google Cloud Console

### Grafana Token
1. Go to Grafana dashboard
2. Settings → Service accounts
3. Create new token
4. Update `.env`: `GRAFANA_SERVICE_ACCOUNT_TOKEN=...`
5. Delete old token

---

## After Rotating All Keys

### 1. Test Locally
```bash
cd "/Users/gbolahan/Documents/Active-2026/2026-projects/TY Blog Automation"

# Test with new keys
node scripts/generate.mjs --topic "Test" --keyword "test" --template how-to
```

### 2. Update Railway
```bash
# Go to Railway dashboard
# Update ALL environment variables with new keys
# Click "Redeploy"
```

### 3. Verify
- Check Railway logs
- Confirm automation still works
- Test email reports (Resend)
- Test AI generation (Claude/OpenAI)

---

## Long-Term Security Practices

✅ **Never commit secrets** - Always use `.env` files
✅ **Use environment variables** - On Railway and locally
✅ **Rotate keys regularly** - Every 90 days
✅ **Use minimal permissions** - API keys with least privilege
✅ **Monitor for leaks** - GitHub Secret Scanning enabled

---

## Timeline

**February 13, 2026 ~16:00 UTC**:
- First push attempt with `.env` file
- GitHub blocked push (Secret Scanning)
- Keys detected: OpenAI, Claude, Google, Grafana

**February 13, 2026 ~16:10 UTC**:
- Git history reset
- `.env` removed from tracking
- `.gitignore` created
- Clean push successful

**February 13, 2026 ~16:30 UTC**:
- GitHub sends warning email
- User notifies of Firecrawl and Resend exposure

**February 13, 2026 ~16:35 UTC**:
- This security response document created
- Awaiting key rotation

---

## Status: AWAITING KEY ROTATION

**Next steps**:
1. Rotate Firecrawl and Resend keys (critical)
2. Rotate OpenAI, Claude, Google keys (recommended)
3. Update local `.env` file
4. Update Railway environment variables
5. Test and verify

**ETA**: 15-20 minutes

---

**Priority: HIGH - Rotate keys immediately**
