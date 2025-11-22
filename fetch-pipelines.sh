#!/bin/bash

# Fetch the OAuth token and location from the running server
echo "Fetching OAuth status..."
OAUTH_DATA=$(curl -s https://pfc-ticketing.replit.app/oauth/status)
echo "OAuth Status: $OAUTH_DATA"
echo ""

# This script is a placeholder - we need the actual access token which isn't exposed via an endpoint
# Instead, let's use the GHL API key as a fallback to check pipelines

echo "Checking pipelines using API key..."
curl -s "https://services.leadconnectorhq.com/opportunities/pipelines?locationId=7p8fgVVr84S9fxsJqMdA" \
  -H "Authorization: Bearer ${GHL_API_KEY}" \
  -H "Version: 2021-07-28" | jq '.'
