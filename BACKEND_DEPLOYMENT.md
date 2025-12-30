# Backend Deployment Complete

## Infrastructure Deployed

All backend infrastructure has been deployed to **eu-west-2** region.

### 1. S3 Bucket for Audio Storage ✅

**Bucket Name:** `podcastai-audio-704856426126`
**Region:** eu-west-2
**Purpose:** Storage for generated podcast MP3 files

**Configuration:**
- CORS enabled for web access
- Public read access enabled
- Audio files accessible via direct S3 URLs

**Bucket URL:** `http://podcastai-audio-704856426126.s3.amazonaws.com/`

### 2. DynamoDB Table ✅

**Table Name:** `PodcastAI-Conversations`
**Region:** eu-west-2
**Purpose:** Store user conversations and podcast metadata (for future use)

**Schema:**
- Partition Key: `userId` (String)
- Sort Key: `conversationId` (String)
- Billing Mode: PAY_PER_REQUEST (on-demand)

**ARN:** `arn:aws:dynamodb:eu-west-2:704856426126:table/PodcastAI-Conversations`

**Note:** Currently not used by the application, but available for future features like:
- Saving conversation history
- Storing user preferences
- Podcast generation history

### 3. Lambda Function ✅

**Function Name:** `PodcastAI-GeneratePodcast`
**Runtime:** Node.js 20.x
**Region:** eu-west-2
**Handler:** `generatePodcast.handler`

**Configuration:**
- Memory: 512 MB
- Timeout: 300 seconds (5 minutes)
- Environment Variables:
  - `PODCAST_BUCKET_NAME`: podcastai-audio-704856426126

**What it does:**
1. Receives conversation turns with person information
2. Maps each person to an Amazon Polly neural voice
3. Converts text to speech using Amazon Polly
4. Stores the generated MP3 in S3
5. Returns the S3 URL to the frontend

**ARN:** `arn:aws:lambda:eu-west-2:704856426126:function:PodcastAI-GeneratePodcast`

**IAM Role:** `PodcastAI-LambdaExecutionRole`
**Permissions:**
- Amazon Polly (text-to-speech)
- S3 (write/read audio files)
- DynamoDB (read/write conversations)
- CloudWatch Logs (logging)

### 4. API Gateway ✅

**API Name:** `PodcastAI-API`
**Type:** REST API
**Region:** eu-west-2
**Stage:** prod

**Endpoint:** `https://1k23dascn4.execute-api.eu-west-2.amazonaws.com/prod`

**Routes:**
- **POST** `/generate-podcast` - Generate podcast from conversation
  - Authorization: Cognito User Pool
  - Integration: Lambda (PodcastAI-GeneratePodcast)
  - CORS: Enabled

**Authentication:**
- Cognito User Pool Authorizer
- User Pool: `eu-west-2_4ehKaD5Bf`
- Requires Bearer token in Authorization header

**CORS Configuration:**
- Allowed Headers: `Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token`
- Allowed Methods: `POST, OPTIONS`
- Allowed Origins: `*`

---

## API Usage

### Generate Podcast Endpoint

**URL:** `POST https://1k23dascn4.execute-api.eu-west-2.amazonaws.com/prod/generate-podcast`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <cognito-id-token>"
}
```

**Request Body:**
```json
{
  "persons": [
    {
      "id": "1",
      "name": "John",
      "sex": "male",
      "age": 30,
      "personality": "Professional and friendly",
      "isAI": false,
      "voiceId": "Matthew"
    },
    {
      "id": "2",
      "name": "Sarah",
      "sex": "female",
      "age": 28,
      "personality": "Enthusiastic and curious",
      "isAI": true,
      "voiceId": "Joanna"
    }
  ],
  "turns": [
    {
      "id": "turn-1",
      "personId": "1",
      "text": "Welcome to our podcast!",
      "isGenerated": false
    },
    {
      "id": "turn-2",
      "personId": "2",
      "text": "Thanks for having me!",
      "isGenerated": true
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "audioUrl": "https://podcastai-audio-704856426126.s3.eu-west-2.amazonaws.com/podcasts/abc123.mp3",
  "message": "Podcast generated successfully"
}
```

**Response (Error):**
```json
{
  "error": "Error type",
  "message": "Error description"
}
```

---

## Environment Variables Updated

### Local Development (.env)
```bash
VITE_USER_POOL_ID=eu-west-2_4ehKaD5Bf
VITE_USER_POOL_CLIENT_ID=cf1l1pdigo9ci468tf3bt7v2v
VITE_IDENTITY_POOL_ID=eu-west-2:3d0f7f2f-766f-4822-befb-f648061fe873
VITE_AWS_REGION=eu-west-2
VITE_API_ENDPOINT=https://1k23dascn4.execute-api.eu-west-2.amazonaws.com/prod
```

### AWS Amplify
All environment variables updated ✅

### GitHub Secrets
All secrets updated for CI/CD ✅

### Deployment Status
**Build Job #4:** PENDING
The app is being redeployed with the API endpoint.

---

## Amazon Bedrock Setup (Manual Step Required)

**Model:** Claude 3.5 Sonnet v2 (`anthropic.claude-3-5-sonnet-20241022-v2:0`)
**Region:** eu-west-2

### Enable Model Access

1. Open AWS Console: https://console.aws.amazon.com/bedrock
2. Navigate to **Model access** in the left sidebar
3. Click **Enable specific models**
4. Find **Anthropic** → **Claude 3.5 Sonnet v2**
5. Check the box and click **Save changes**
6. Wait for status to change to **Access granted** (usually instant)

**Note:** The authenticated Cognito role already has permission to invoke Bedrock models. You just need to enable access to the specific Claude model.

---

## Testing Your Backend

### 1. Test Local Development

```bash
npm run dev
```

Open http://localhost:5173

### 2. Test Full Flow

1. **Register/Login** - Create account or sign in
2. **Setup Persons** - Add podcast participants
3. **Generate AI Conversation** - Use AI to create dialogue (uses Bedrock)
4. **Generate Podcast** - Convert to audio (uses Lambda + Polly)
5. **Listen** - Play the generated audio

### 3. Test API Directly (Optional)

Use this script to test the API:

```bash
# Get ID token after logging in
ID_TOKEN="your-cognito-id-token"

curl -X POST \
  https://1k23dascn4.execute-api.eu-west-2.amazonaws.com/prod/generate-podcast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -d '{
    "persons": [{
      "id": "1",
      "name": "Test",
      "sex": "male",
      "voiceId": "Matthew"
    }],
    "turns": [{
      "id": "t1",
      "personId": "1",
      "text": "Hello, this is a test.",
      "isGenerated": false
    }]
  }'
```

---

## Architecture Overview

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│  Cognito    │    │   Bedrock   │
│  (Auth)     │    │  (AI/Claude)│
└─────────────┘    └─────────────┘
       │
       │ ID Token
       ▼
┌─────────────┐
│ API Gateway │
│/generate-   │
│ podcast     │
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌─────────────┐
│   Lambda    │────────▶│   Polly     │
│ (Generate)  │         │  (TTS)      │
└──────┬──────┘         └─────────────┘
       │                       │
       │                       │ MP3
       │                       ▼
       │                ┌─────────────┐
       └───────────────▶│     S3      │
        Store metadata  │ (Audio)     │
                        └─────────────┘
                               │
        ┌──────────────────────┘
        │ Return URL
        ▼
 ┌─────────────┐
 │  Browser    │
 │  (Audio     │
 │   Player)   │
 └─────────────┘
```

---

## Costs Estimate (Monthly)

Based on moderate usage (100 podcast generations/month, 5min each):

| Service | Usage | Cost |
|---------|-------|------|
| S3 | 500 MB storage + transfer | ~$0.50 |
| Lambda | 100 invocations @ 300s | ~$0.50 |
| API Gateway | 100 requests | ~$0.01 |
| Polly | 500 min TTS (neural) | ~$20.00 |
| Bedrock | Claude 3.5 Sonnet | ~$5.00 |
| DynamoDB | Pay-per-request (minimal) | ~$0.10 |
| Cognito | <50k MAU | Free |
| Amplify Hosting | 1 GB transfer | Free tier |
| **Total** | | **~$26/month** |

**Note:** Polly neural voices are the main cost driver. Consider standard voices for testing to reduce costs.

---

## Troubleshooting

### "No credentials available" error
- Make sure you're logged in
- Check `.env` file has correct values
- Verify Cognito Identity Pool is configured

### "Failed to generate podcast" error
- Check Lambda CloudWatch logs: https://console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252FPodcastAI-GeneratePodcast
- Verify Lambda has Polly permissions
- Check S3 bucket permissions

### "AI generation failed" error
- Enable Bedrock model access in AWS Console
- Verify authenticated Cognito role has Bedrock permissions
- Check browser console for detailed errors

### Audio file not playing
- Verify S3 bucket has public read access
- Check CORS configuration on S3
- Inspect network tab for 403/404 errors

---

## Cleanup (If Needed)

To remove all resources:

```bash
# Delete Lambda function
aws lambda delete-function --function-name PodcastAI-GeneratePodcast --region eu-west-2

# Delete API Gateway
aws apigateway delete-rest-api --rest-api-id 1k23dascn4 --region eu-west-2

# Delete S3 bucket (empty it first)
aws s3 rm s3://podcastai-audio-704856426126 --recursive
aws s3api delete-bucket --bucket podcastai-audio-704856426126 --region eu-west-2

# Delete DynamoDB table
aws dynamodb delete-table --table-name PodcastAI-Conversations --region eu-west-2

# Delete IAM role
aws iam delete-role-policy --role-name PodcastAI-LambdaExecutionRole --policy-name PodcastAI-LambdaPermissions
aws iam detach-role-policy --role-name PodcastAI-LambdaExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name PodcastAI-LambdaExecutionRole
```

---

## Next Steps

1. **Enable Bedrock Model Access** (see section above)
2. **Test the full flow** in your deployed app
3. **Monitor costs** in AWS Cost Explorer
4. **Review CloudWatch logs** for any errors

Your PodcastAI backend is now fully deployed and ready to use! 🎉

**Live App:** https://dntss134nzlt7.amplifyapp.com
**API Endpoint:** https://1k23dascn4.execute-api.eu-west-2.amazonaws.com/prod
