# PodcastAI Backend Infrastructure Setup

This guide will walk you through setting up the AWS infrastructure for PodcastAI.

## Required AWS Services

1. **Amazon Cognito** - User authentication
2. **AWS Lambda** - Backend API
3. **API Gateway** - REST API endpoints
4. **Amazon S3** - Audio file storage
5. **Amazon Polly** - Text-to-speech conversion
6. **AWS Bedrock** - AI conversation generation (Claude)
7. **IAM Roles** - Permissions management

## Region

All resources should be created in **eu-west-2** (London).

## Setup Steps

### 1. Create S3 Bucket for Audio Storage

```bash
aws s3 mb s3://podcastai-audio-{your-account-id} --region eu-west-2
```

Configure CORS for the bucket:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 2. Set Up Amazon Cognito

1. Create a User Pool:
   - Go to Amazon Cognito in AWS Console (eu-west-2)
   - Click "Create user pool"
   - Configure sign-in options (email)
   - Configure password policy
   - Enable MFA (optional)
   - Complete the wizard

2. Create a User Pool Client:
   - In your User Pool, go to "App integration"
   - Click "Create app client"
   - Name: "PodcastAI-Web"
   - Auth flows: Enable "ALLOW_USER_PASSWORD_AUTH" and "ALLOW_REFRESH_TOKEN_AUTH"
   - No client secret (public client)
   - Save the Client ID

3. Create an Identity Pool:
   - Go to Federated Identities in Cognito
   - Click "Create new identity pool"
   - Name: "PodcastAI-Identity-Pool"
   - Enable "Unauthenticated access" if needed
   - Add authentication provider (Cognito)
   - Enter User Pool ID and App Client ID
   - Create the pool and note the Identity Pool ID

4. Configure IAM Roles:
   - Edit the authenticated role created by Cognito
   - Attach policies for Bedrock and Polly access (see below)

### 3. Create IAM Role for Lambda

Create a new IAM role with the following policies:

**Trust Relationship:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Attached Policies:**
- AWSLambdaBasicExecutionRole (AWS managed)
- Custom policy for Polly and S3:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "polly:StartSpeechSynthesisTask",
        "polly:GetSpeechSynthesisTask",
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::podcastai-audio-{your-account-id}/*"
    }
  ]
}
```

### 4. Update Cognito Authenticated Role

Add these policies to the authenticated role created by Cognito Identity Pool:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:eu-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
```

### 5. Deploy Lambda Function

1. Navigate to the lambda directory:
```bash
cd backend/lambda
npm install
```

2. Create a deployment package:
```bash
zip -r function.zip .
```

3. Create Lambda function:
```bash
aws lambda create-function \
  --function-name PodcastAI-GeneratePodcast \
  --runtime nodejs20.x \
  --role arn:aws:iam::{account-id}:role/{lambda-role-name} \
  --handler generatePodcast.handler \
  --zip-file fileb://function.zip \
  --timeout 300 \
  --memory-size 512 \
  --region eu-west-2 \
  --environment Variables='{PODCAST_BUCKET_NAME=podcastai-audio-{your-account-id}}'
```

Or use the AWS Console:
1. Go to Lambda in AWS Console (eu-west-2)
2. Click "Create function"
3. Name: "PodcastAI-GeneratePodcast"
4. Runtime: Node.js 20.x
5. Use the IAM role created above
6. Upload the function.zip
7. Set environment variable: PODCAST_BUCKET_NAME
8. Set timeout to 5 minutes (300 seconds)
9. Set memory to 512 MB

### 6. Create API Gateway

1. Go to API Gateway in AWS Console (eu-west-2)
2. Click "Create API"
3. Choose "REST API"
4. Name: "PodcastAI-API"
5. Create a resource: `/generate-podcast`
6. Create a POST method:
   - Integration type: Lambda Function
   - Lambda Function: PodcastAI-GeneratePodcast
   - Use Lambda Proxy integration: Yes
7. Add OPTIONS method for CORS:
   - Integration type: Mock
   - Method Response: Add 200 status
   - Integration Response: Add response with CORS headers
8. Enable CORS on the resource
9. Deploy API:
   - Create new stage: "prod"
   - Note the Invoke URL

### 7. Configure Authorization (Optional but Recommended)

1. In API Gateway, create a Cognito User Pool Authorizer:
   - Name: "PodcastAI-Authorizer"
   - Cognito User Pool: Select your user pool
   - Token Source: "Authorization"

2. On the POST method, set:
   - Method Request > Authorization: Select your authorizer

### 8. Enable Bedrock Model Access

1. Go to AWS Bedrock in the Console (eu-west-2)
2. Click "Model access" in the left sidebar
3. Click "Manage model access"
4. Enable access to: "Claude 3.5 Sonnet v2"
5. Submit request

### 9. Update Frontend Configuration

Create a `.env` file in the root of your project:

```env
VITE_USER_POOL_ID=eu-west-2_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=your-client-id
VITE_IDENTITY_POOL_ID=eu-west-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_AWS_REGION=eu-west-2
VITE_API_ENDPOINT=https://xxxxxxxxxx.execute-api.eu-west-2.amazonaws.com/prod
```

## Testing

1. Start the dev server:
```bash
npm run dev
```

2. Sign up a new user
3. Verify the user (check email)
4. Sign in
5. Create a podcast conversation
6. Generate the podcast

## Troubleshooting

### Lambda timeout
- Increase Lambda timeout to 5 minutes
- Check CloudWatch Logs for errors

### CORS errors
- Verify API Gateway CORS configuration
- Check S3 bucket CORS settings
- Ensure Lambda returns proper CORS headers

### Authentication errors
- Verify Cognito configuration
- Check Identity Pool IAM roles
- Ensure Bedrock model access is enabled

### Polly errors
- Check Lambda has correct permissions
- Verify S3 bucket exists and Lambda can write to it
- Check Polly service quotas

## Cost Estimation

Approximate costs per 1000 podcasts (5 minutes each):

- Lambda: ~$0.20
- Polly (Neural voices): ~$20
- S3 Storage: ~$0.12/GB/month
- Bedrock (Claude): ~$15 (varies by usage)
- API Gateway: ~$0.10
- Cognito: Free tier covers up to 50,000 MAUs

**Total: ~$35 per 1000 podcasts + storage**

## Security Best Practices

1. Enable CloudWatch logging for Lambda
2. Use AWS WAF with API Gateway
3. Implement rate limiting
4. Enable S3 bucket versioning
5. Use AWS Secrets Manager for sensitive configuration
6. Regularly rotate credentials
7. Monitor usage with CloudWatch
