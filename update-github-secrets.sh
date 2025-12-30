#!/bin/bash

# Update GitHub Secrets Script
# This script uses GitHub CLI (gh) to update repository secrets

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "After installing, run: gh auth login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

REPO="PiotrZettt/podcastai"

echo "=== Updating GitHub Secrets for $REPO ==="
echo ""

# Set secrets
echo "Setting VITE_USER_POOL_ID..."
echo "eu-west-2_4ehKaD5Bf" | gh secret set VITE_USER_POOL_ID -R "$REPO"

echo "Setting VITE_USER_POOL_CLIENT_ID..."
echo "cf1l1pdigo9ci468tf3bt7v2v" | gh secret set VITE_USER_POOL_CLIENT_ID -R "$REPO"

echo "Setting VITE_IDENTITY_POOL_ID..."
echo "eu-west-2:3d0f7f2f-766f-4822-befb-f648061fe873" | gh secret set VITE_IDENTITY_POOL_ID -R "$REPO"

echo "Setting VITE_AWS_REGION..."
echo "eu-west-2" | gh secret set VITE_AWS_REGION -R "$REPO"

echo "Setting AMPLIFY_APP_ID..."
echo "dntss134nzlt7" | gh secret set AMPLIFY_APP_ID -R "$REPO"

echo ""
echo "=== GitHub Secrets Updated Successfully! ==="
echo ""
echo "Note: You still need to set VITE_API_ENDPOINT manually after deploying your backend."
echo "To do that, run:"
echo "  echo 'your-api-endpoint' | gh secret set VITE_API_ENDPOINT -R $REPO"
echo ""
