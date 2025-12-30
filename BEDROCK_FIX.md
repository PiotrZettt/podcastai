# Bedrock Model ID Fix - DEPLOYED ✅

## The Problem

You were getting this error:
```
Failed to generate AI response: The provided model identifier is invalid.
```

## The Solution

**Root Cause:** AWS Bedrock requires region-specific model IDs for cross-region inference profiles.

**What Changed:**
- ❌ Old model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- ✅ New model ID: `eu.anthropic.claude-3-5-sonnet-20241022-v2:0`

**Files Updated:**
- `src/services/bedrock.ts` - Changed model ID to EU-specific version
- IAM policy for `PodcastAI-CognitoAuthRole` - Added permission for EU model ID

**Deployment Status:** ✅ DEPLOYED
- Commit: `e7f701a`
- Build Job #5: SUCCEED
- Live at: https://dntss134nzlt7.amplifyapp.com

---

## One More Step Required: Enable Model Access

Even though the model ID is now correct, you still need to **enable model access in the AWS Bedrock console**.

### Quick Steps:

1. **Open Bedrock Console:**
   https://eu-west-2.console.aws.amazon.com/bedrock/home?region=eu-west-2#/modelaccess

2. **Click "Manage model access"** (top right corner)

3. **Enable Claude Models:**
   - Scroll to the **Anthropic** section
   - Check the box for **Claude 3.5 Sonnet v2**
   - (Optional) Also enable **Claude 3 Haiku** as a cheaper alternative

4. **Save changes:**
   - Click **"Save changes"** at the bottom
   - Wait for status to change to **"Access granted"** (usually instant)
   - You may need to refresh the page

### Verify Access is Granted

Look for this in the console:

| Provider | Model | Status |
|----------|-------|--------|
| Anthropic | Claude 3.5 Sonnet v2 | ✅ Access granted |

---

## Test the Fix

Once you've enabled model access:

1. Go to https://dntss134nzlt7.amplifyapp.com
2. Login to your account
3. Set up podcast participants
4. Add an **AI-controlled** person
5. Click **"Generate AI Response"**
6. ✅ Should work now!

---

## How This Works

```
Browser (Frontend)
    │
    ▼
Cognito (Auth) → Get AWS credentials
    │
    ▼
Bedrock Service (EU region)
    │
    ├─→ Model ID: eu.anthropic.claude-3-5-sonnet-20241022-v2:0
    │   (Must be enabled in console)
    │
    ▼
Generate AI response
```

**Why EU prefix?**
- AWS Bedrock uses cross-region inference profiles
- Different regions have different prefixes:
  - `us.` for US regions
  - `eu.` for EU regions (our case)
  - `apac.` for Asia-Pacific regions

**References:**
- [AWS Bedrock Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html)
- [Anthropic Claude Models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-claude.html)

---

## Troubleshooting

### Still getting "invalid model identifier" after enabling access?

1. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or use incognito/private browsing mode

2. **Sign out and back in:**
   - This refreshes your AWS credentials
   - Sometimes needed after IAM policy changes

3. **Check browser console for detailed error:**
   - Press F12 to open DevTools
   - Go to Console tab
   - Try generating AI response
   - Look for full error message

4. **Verify region in console:**
   - Make sure you're in **eu-west-2** region
   - Check top-right corner of AWS console

### Different error message?

**"Access denied"** or **"Not authorized"**
- Sign out and back in to refresh credentials
- Verify the Cognito authenticated role has Bedrock permissions

**"Model not found"**
- Model access might not be enabled yet
- Go back to Bedrock console and verify status

**"Throttling exception"**
- You're hitting rate limits
- Wait a few seconds and try again
- Consider using Claude 3 Haiku (higher rate limits, cheaper)

---

## Alternative: Use a Different Model

If Claude 3.5 Sonnet v2 doesn't work, you can try these alternatives:

### Claude 3 Haiku (Cheaper & Faster)

**Model ID:** `eu.anthropic.claude-3-haiku-20240307-v1:0`

**Pros:**
- Much cheaper ($0.25/1M input tokens vs $3.00)
- Faster responses
- Higher rate limits

**Cons:**
- Slightly less intelligent than Sonnet
- Fine for podcast conversations though!

**To switch:**
```bash
# Edit the file
nano src/services/bedrock.ts

# Change line 59 to:
modelId: 'eu.anthropic.claude-3-haiku-20240307-v1:0',

# Save, then rebuild and deploy
git add -A
git commit -m "Switch to Claude 3 Haiku"
git push
```

---

## Summary Checklist

- ✅ Model ID fixed to use EU-specific prefix
- ✅ IAM permissions updated
- ✅ Code deployed to production
- ⏳ **TODO:** Enable model access in Bedrock console
- ⏳ **TODO:** Test AI generation in the app

---

**Next action:** Go enable model access now!
👉 https://eu-west-2.console.aws.amazon.com/bedrock/home?region=eu-west-2#/modelaccess
