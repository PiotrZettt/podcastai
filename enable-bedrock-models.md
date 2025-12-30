# Enable Amazon Bedrock Models

## Current Error

You're getting: **"The provided model identifier is invalid"**

This means Bedrock model access hasn't been enabled yet.

## Solution: Enable Model Access

### Method 1: AWS Console (Recommended)

1. **Open Bedrock Console:**
   https://eu-west-2.console.aws.amazon.com/bedrock/home?region=eu-west-2#/modelaccess

2. **Click "Manage model access"** button (top right)

3. **Find and Enable Claude Models:**
   - Scroll to **Anthropic** section
   - Check the box for **Claude 3.5 Sonnet v2**
   - Also enable **Claude 3.5 Sonnet** (v1 - as backup)
   - Optionally enable **Claude 3 Haiku** (cheaper, faster alternative)

4. **Click "Save changes"** at the bottom

5. **Wait for Access Granted:**
   - Status should change to **"Access granted"** immediately
   - You may need to refresh the page

### Method 2: Check Available Models

After enabling access, you can verify available models in the console:

https://eu-west-2.console.aws.amazon.com/bedrock/home?region=eu-west-2#/models

Look for models with these IDs:
- `anthropic.claude-3-5-sonnet-20241022-v2:0` (newest, what we're using)
- `anthropic.claude-3-5-sonnet-20240620-v1:0` (slightly older)
- `anthropic.claude-3-haiku-20240307-v1:0` (cheaper alternative)

## If Model ID is Wrong

If after enabling access you still get the error, the model ID might be different in your region.

### Check Current Model ID

The app is currently using:
```
anthropic.claude-3-5-sonnet-20241022-v2:0
```

Location: `src/services/bedrock.ts` line 59

### Alternative Model IDs to Try

If the v2 model isn't available, try these (in order):

1. **Claude 3.5 Sonnet v1:**
   ```
   anthropic.claude-3-5-sonnet-20240620-v1:0
   ```

2. **Claude 3 Sonnet:**
   ```
   anthropic.claude-3-sonnet-20240229-v1:0
   ```

3. **Claude 3 Haiku (cheaper):**
   ```
   anthropic.claude-3-haiku-20240307-v1:0
   ```

### Update Model ID (if needed)

If you need to change the model ID:

1. Edit `src/services/bedrock.ts`
2. Find line 59: `modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0'`
3. Replace with alternative model ID
4. Save and rebuild: `npm run build`

## Pricing (for reference)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude 3.5 Sonnet v2 | $3.00 | $15.00 |
| Claude 3.5 Sonnet v1 | $3.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |

For podcast conversation generation (short responses), costs will be minimal.

## Verify Access is Granted

After enabling model access, test the app again:

1. Go to https://dntss134nzlt7.amplifyapp.com
2. Login
3. Set up podcast participants
4. Click "Generate AI Response" for an AI-controlled person
5. Should work now!

## Troubleshooting

### Still getting "invalid model identifier" error?

**Check the exact error message in browser console:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try generating AI response
4. Look for detailed error message

**Common issues:**

1. **Model not enabled:**
   - Go back to Bedrock console and verify status is "Access granted"

2. **Wrong model ID:**
   - Check available models in console
   - Update `src/services/bedrock.ts` with correct ID

3. **Region mismatch:**
   - Verify `.env` has `VITE_AWS_REGION=eu-west-2`
   - Verify Bedrock console is showing eu-west-2 region

4. **Permissions issue:**
   - Verify you're logged in to the app
   - Try signing out and back in to refresh credentials

### Test with curl (Optional)

To test if Bedrock is working, you can use this AWS CLI command (if bedrock commands are available):

```bash
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --region eu-west-2 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Say hello"}]}' \
  /tmp/response.json

cat /tmp/response.json
```

If this fails, model access isn't enabled.

## Quick Fix Script

If you need to change the model ID, here's a quick sed command:

```bash
# Change to Claude 3.5 Sonnet v1
sed -i '' 's/anthropic.claude-3-5-sonnet-20241022-v2:0/anthropic.claude-3-5-sonnet-20240620-v1:0/g' src/services/bedrock.ts

# Or change to Claude 3 Haiku (cheaper)
sed -i '' 's/anthropic.claude-3-5-sonnet-20241022-v2:0/anthropic.claude-3-haiku-20240307-v1:0/g' src/services/bedrock.ts
```

Then rebuild:
```bash
npm run build
```

---

**Next Step:** Go enable model access in the Bedrock console now!
https://eu-west-2.console.aws.amazon.com/bedrock/home?region=eu-west-2#/modelaccess
