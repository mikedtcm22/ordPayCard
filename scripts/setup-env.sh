#!/bin/bash

# SatSpray Membership Card Environment Setup Script

echo "🚀 Setting up SatSpray Membership Card environment..."

# Check if .env files already exist
if [ -f "client/.env.local" ]; then
    echo "⚠️  client/.env.local already exists. Skipping client setup."
else
    echo "📝 Creating client/.env.local..."
    cp client/.env.example client/.env.local
    echo "✅ Client environment file created"
fi

if [ -f "server/.env" ]; then
    echo "⚠️  server/.env already exists. Skipping server setup."
else
    echo "📝 Creating server/.env..."
    cp server/.env.example server/.env
    echo "✅ Server environment file created"
fi

echo ""
echo "🔧 Environment files created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit client/.env.local with your API configuration"
echo "2. Edit server/.env with your server configuration"
echo "3. Update JWT_SECRET and TREASURY_ADDRESS in server/.env"
echo "4. Run 'npm run dev' to start development servers"
echo ""
echo "⚠️  IMPORTANT: Update the following in server/.env:"
echo "   - JWT_SECRET: Generate a secure random string"
echo "   - TREASURY_ADDRESS: Set your Bitcoin testnet address"
echo ""
echo "🎯 You can now start development with: npm run dev" 