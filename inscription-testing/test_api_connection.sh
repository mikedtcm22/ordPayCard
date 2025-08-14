#!/bin/bash

# Simple API connection test script

echo "Testing Hiro API connection..."

# Check if API key is set
if [ -z "$HIRO_API_KEY" ]; then
    echo "❌ ERROR: HIRO_API_KEY environment variable is not set"
    echo "Please set it with: export HIRO_API_KEY='your_api_key_here'"
    exit 1
fi

echo "✅ API key is set (${HIRO_API_KEY:0:8}...)"

# Test API connection
response=$(curl -s -w "%{http_code}" -X GET "https://api.hiro.so/ordinals/v1/inscriptions" \
    -H "Accept: application/json" \
    -H "X-API-Key: $HIRO_API_KEY")

http_code="${response: -3}"
body="${response%???}"

echo "HTTP Status Code: $http_code"

if [ "$http_code" = "200" ]; then
    echo "✅ API connection successful!"
    echo "Response preview: ${body:0:200}..."
    exit 0
else
    echo "❌ API connection failed"
    echo "Full response: $body"
    exit 1
fi 