#!/bin/bash

echo "🔐 V0 API Setup Script"
echo "====================="
echo ""
echo "This script will help you securely set up your V0 API key."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    touch .env.local
fi

# Check if V0_API_KEY already exists
if grep -q "V0_API_KEY" .env.local; then
    echo "⚠️  V0_API_KEY already exists in .env.local"
    echo "Do you want to update it? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "Keeping existing key."
        exit 0
    fi
fi

# Prompt for API key
echo ""
echo "Please enter your V0 API key:"
echo "(It will be hidden as you type)"
read -s api_key

if [ -z "$api_key" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

# Add or update the key
if grep -q "V0_API_KEY" .env.local; then
    # Update existing key
    sed -i.bak "s/V0_API_KEY=.*/V0_API_KEY=$api_key/" .env.local
    rm .env.local.bak
    echo "✅ V0_API_KEY updated in .env.local"
else
    # Add new key
    echo "V0_API_KEY=$api_key" >> .env.local
    echo "✅ V0_API_KEY added to .env.local"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "You can now use the V0 API client:"
echo "  node scripts/v0-api-client.js"
echo ""
echo "Remember:"
echo "  - Never commit .env.local to git"
echo "  - Keep your API key secret"
echo "  - Rotate keys regularly"
echo ""