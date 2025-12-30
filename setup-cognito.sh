#!/bin/bash

# PodcastAI Cognito Setup Script
# This script creates all necessary AWS Cognito resources

set -e

REGION="eu-west-2"
POOL_NAME="PodcastAI-UserPool"
CLIENT_NAME="PodcastAI-WebClient"
IDENTITY_POOL_NAME="PodcastAI_IdentityPool"

echo "=== PodcastAI Cognito Setup ==="
echo ""

# Step 1: Create User Pool
echo "Step 1: Creating User Pool..."
USER_POOL_OUTPUT=$(aws cognito-idp create-user-pool \
  --pool-name "$POOL_NAME" \
  --region "$REGION" \
  --policies '{"PasswordPolicy": {"MinimumLength": 8, "RequireUppercase": true, "RequireLowercase": true, "RequireNumbers": true, "RequireSymbols": true}}' \
  --auto-verified-attributes email \
  --username-attributes email \
  --account-recovery-setting '{"RecoveryMechanisms": [{"Priority": 1, "Name": "verified_email"}]}' \
  --mfa-configuration OFF \
  --username-configuration CaseSensitive=false)

USER_POOL_ID=$(echo "$USER_POOL_OUTPUT" | grep -o '"Id": "[^"]*' | sed 's/"Id": "//')
echo "User Pool ID: $USER_POOL_ID"
echo ""

# Step 2: Create User Pool Client
echo "Step 2: Creating User Pool Client..."
CLIENT_OUTPUT=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-name "$CLIENT_NAME" \
  --region "$REGION" \
  --no-generate-secret \
  --refresh-token-validity 30 \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
  --prevent-user-existence-errors ENABLED)

CLIENT_ID=$(echo "$CLIENT_OUTPUT" | grep -o '"ClientId": "[^"]*' | sed 's/"ClientId": "//')
echo "Client ID: $CLIENT_ID"
echo ""

# Step 3: Create IAM Trust Policy for Authenticated Role (placeholder)
echo "Step 3: Creating IAM roles..."
cat > /tmp/cognito-trust-policy-placeholder.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "PLACEHOLDER"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
EOF

# Create Authenticated Role
AUTH_ROLE_OUTPUT=$(aws iam create-role \
  --role-name PodcastAI-CognitoAuthRole \
  --assume-role-policy-document file:///tmp/cognito-trust-policy-placeholder.json \
  --description "IAM role for authenticated PodcastAI users" || echo '{"Role": {"Arn": "EXISTS"}}')

AUTH_ROLE_ARN=$(aws iam get-role --role-name PodcastAI-CognitoAuthRole --query 'Role.Arn' --output text)
echo "Authenticated Role ARN: $AUTH_ROLE_ARN"

# Create Permissions Policy for Authenticated Users
cat > /tmp/cognito-auth-permissions.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:eu-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name PodcastAI-CognitoAuthRole \
  --policy-name PodcastAI-AuthUserPermissions \
  --policy-document file:///tmp/cognito-auth-permissions.json

# Create Unauthenticated Role
cat > /tmp/cognito-unauth-trust-policy-placeholder.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "PLACEHOLDER"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "unauthenticated"
        }
      }
    }
  ]
}
EOF

UNAUTH_ROLE_OUTPUT=$(aws iam create-role \
  --role-name PodcastAI-CognitoUnauthRole \
  --assume-role-policy-document file:///tmp/cognito-unauth-trust-policy-placeholder.json \
  --description "IAM role for unauthenticated PodcastAI users" || echo '{"Role": {"Arn": "EXISTS"}}')

UNAUTH_ROLE_ARN=$(aws iam get-role --role-name PodcastAI-CognitoUnauthRole --query 'Role.Arn' --output text)
echo "Unauthenticated Role ARN: $UNAUTH_ROLE_ARN"
echo ""

# Step 4: Create Identity Pool
echo "Step 4: Creating Identity Pool..."
IDENTITY_POOL_OUTPUT=$(aws cognito-identity create-identity-pool \
  --identity-pool-name "$IDENTITY_POOL_NAME" \
  --region "$REGION" \
  --allow-unauthenticated-identities \
  --cognito-identity-providers ProviderName=cognito-idp.$REGION.amazonaws.com/$USER_POOL_ID,ClientId=$CLIENT_ID,ServerSideTokenCheck=false)

IDENTITY_POOL_ID=$(echo "$IDENTITY_POOL_OUTPUT" | grep -o '"IdentityPoolId": "[^"]*' | sed 's/"IdentityPoolId": "//')
echo "Identity Pool ID: $IDENTITY_POOL_ID"
echo ""

# Step 5: Update IAM Trust Policies with actual Identity Pool ID
echo "Step 5: Updating IAM trust policies..."
cat > /tmp/cognito-trust-policy-updated.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "$IDENTITY_POOL_ID"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
EOF

aws iam update-assume-role-policy \
  --role-name PodcastAI-CognitoAuthRole \
  --policy-document file:///tmp/cognito-trust-policy-updated.json

cat > /tmp/cognito-unauth-trust-policy-updated.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "$IDENTITY_POOL_ID"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "unauthenticated"
        }
      }
    }
  ]
}
EOF

aws iam update-assume-role-policy \
  --role-name PodcastAI-CognitoUnauthRole \
  --policy-document file:///tmp/cognito-unauth-trust-policy-updated.json

# Step 6: Attach Roles to Identity Pool
echo "Step 6: Attaching roles to Identity Pool..."
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id "$IDENTITY_POOL_ID" \
  --region "$REGION" \
  --roles authenticated=$AUTH_ROLE_ARN,unauthenticated=$UNAUTH_ROLE_ARN

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Add these values to your .env file:"
echo ""
echo "VITE_USER_POOL_ID=$USER_POOL_ID"
echo "VITE_USER_POOL_CLIENT_ID=$CLIENT_ID"
echo "VITE_IDENTITY_POOL_ID=$IDENTITY_POOL_ID"
echo "VITE_AWS_REGION=$REGION"
echo "VITE_API_ENDPOINT=<your-api-gateway-endpoint>"
echo ""
echo "Also add these as GitHub secrets for deployment."
echo ""

# Clean up temp files
rm -f /tmp/cognito-*.json

echo "Setup script completed successfully!"
