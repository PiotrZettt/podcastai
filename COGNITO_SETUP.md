# AWS Cognito Setup Guide

This guide will help you set up AWS Cognito User Pools and Identity Pools for PodcastAI authentication.

## Prerequisites

1. AWS CLI installed and configured with credentials
2. IAM permissions to create Cognito User Pools, Identity Pools, and IAM roles

## Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup-cognito.sh
```

This script will:
1. Create a Cognito User Pool with email-based authentication
2. Create a User Pool Client for your web app
3. Create IAM roles for authenticated and unauthenticated users
4. Create a Cognito Identity Pool
5. Link everything together
6. Output the configuration values you need

After running the script, it will display the environment variables you need to add to your `.env` file.

## Manual Setup (Alternative)

If you prefer to run the commands manually, follow these steps:

### Step 1: Create User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name PodcastAI-UserPool \
  --region eu-west-2 \
  --policies '{"PasswordPolicy": {"MinimumLength": 8, "RequireUppercase": true, "RequireLowercase": true, "RequireNumbers": true, "RequireSymbols": true}}' \
  --auto-verified-attributes email \
  --username-attributes email \
  --account-recovery-setting '{"RecoveryMechanisms": [{"Priority": 1, "Name": "verified_email"}]}' \
  --mfa-configuration OFF \
  --username-configuration CaseSensitive=false
```

Save the `Id` field from the output (this is your User Pool ID).

### Step 2: Create User Pool Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID_FROM_STEP_1> \
  --client-name PodcastAI-WebClient \
  --region eu-west-2 \
  --no-generate-secret \
  --refresh-token-validity 30 \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
  --prevent-user-existence-errors ENABLED
```

Save the `ClientId` field from the output.

### Step 3-6: Create IAM Roles and Identity Pool

Follow the detailed steps in the [implementation plan](/Users/piotrzielinski/.claude/plans/mutable-knitting-token.md).

## Configure Environment Variables

After running the setup (automated or manual), create a `.env` file in the project root:

```bash
VITE_USER_POOL_ID=eu-west-2_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
VITE_IDENTITY_POOL_ID=eu-west-2:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_AWS_REGION=eu-west-2
VITE_API_ENDPOINT=https://your-api-gateway.execute-api.eu-west-2.amazonaws.com
```

## Configure GitHub Secrets

For CI/CD deployment, add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

- `VITE_USER_POOL_ID`
- `VITE_USER_POOL_CLIENT_ID`
- `VITE_IDENTITY_POOL_ID`
- `VITE_AWS_REGION`
- `VITE_API_ENDPOINT`

## Test the Setup

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173 in your browser

3. You should see the custom login screen

4. Test the following flows:
   - Register a new account (you'll receive a verification email)
   - Verify your email with the code
   - Log in with your credentials
   - Test the forgot password flow
   - Test sign out

## Authentication Features

Your custom authentication now includes:

- **Login:** Email and password authentication
- **Registration:** Email verification required
- **Password Reset:** Two-step forgot password flow
- **Password Validation:** Real-time strength indicator
- **Session Management:** Automatic token refresh
- **Protected Routes:** Unauthenticated users redirected to login

## Troubleshooting

### "No credentials available" error
- Make sure your `.env` file has the correct User Pool ID and Client ID
- Verify the Identity Pool is properly configured with the User Pool

### Email verification not received
- Check your spam folder
- Verify the User Pool has email verification enabled
- For testing, you can verify users manually in AWS Console

### "Invalid username or password" error
- Make sure you've verified your email first
- Password must meet the requirements (8+ chars, uppercase, lowercase, number, symbol)

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Clear the build cache: `rm -rf node_modules/.vite`

## Next Steps

1. Deploy your backend API (Lambda + API Gateway) if not done already
2. Update `VITE_API_ENDPOINT` with your actual API Gateway URL
3. Test the full flow including Bedrock and Polly integrations
4. Configure GitHub secrets for automated deployment

## Custom Components Created

The following custom auth components have been implemented:

- `src/components/auth/AuthContainer.tsx` - Shared layout wrapper
- `src/components/auth/Login.tsx` - Login form
- `src/components/auth/Register.tsx` - Registration with email verification
- `src/components/auth/ForgotPassword.tsx` - Password reset flow
- `src/components/AuthWrapper.tsx` - Auth state management and routing

All components follow your existing inline styling patterns and integrate seamlessly with AWS Amplify.
