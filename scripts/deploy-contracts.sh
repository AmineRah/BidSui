#!/bin/bash

# BidSui Smart Contracts Deployment Script

echo "🚀 Deploying BidSui Smart Contracts..."

# Check if Sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI is not installed. Please install it first."
    echo "Visit: https://docs.sui.io/build/install"
    exit 1
fi

echo "✅ Sui CLI found"

# Check if we're in the right directory
if [ ! -f "move/Move.toml" ]; then
    echo "❌ Move.toml not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Move.toml found"

# Check if wallet is configured
if ! sui client active-address &> /dev/null; then
    echo "❌ No active wallet address found. Please configure your wallet:"
    echo "sui client new-address ed25519"
    echo "sui client switch --address <your-address>"
    exit 1
fi

ACTIVE_ADDRESS=$(sui client active-address)
echo "✅ Active wallet address: $ACTIVE_ADDRESS"

# Check if wallet has enough SUI for deployment
BALANCE=$(sui client balance | grep -o '[0-9]*' | head -1)
if [ "$BALANCE" -lt 1000000000 ]; then
    echo "⚠️  Low balance detected. You may need more SUI for deployment."
    echo "Current balance: $(echo $BALANCE | awk '{print $1/1000000000}') SUI"
    echo "Request testnet tokens: https://faucet.devnet.sui.io/"
fi

# Build the package
echo "🔨 Building Move package..."
cd move
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Deploy the package
echo "🚀 Deploying package..."
DEPLOYMENT_RESULT=$(sui client publish --gas-budget 100000000)

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Deployment successful"

# Extract package IDs from deployment result
PACKAGE_ID=$(echo "$DEPLOYMENT_RESULT" | grep -o '"packageId": "[^"]*"' | cut -d'"' -f4)
AUCTION_PACKAGE_ID=$(echo "$DEPLOYMENT_RESULT" | grep -o '"objectId": "[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "Package ID: $PACKAGE_ID"
echo ""
echo "📝 Update your backend .env file with these values:"
echo "AUCTION_PACKAGE_ID=$PACKAGE_ID"
echo "SELLER_PACKAGE_ID=$PACKAGE_ID"
echo "BIDDER_PACKAGE_ID=$PACKAGE_ID"
echo ""
echo "📝 Update your frontend constants.ts file:"
echo "export const DEVNET_AUCTION_PACKAGE_ID = \"$PACKAGE_ID\";"
echo ""
echo "🔗 View on Sui Explorer:"
echo "https://explorer.sui.io/object/$PACKAGE_ID?network=devnet"

# Save deployment info to file
cat > ../deployment-info.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "network": "devnet",
  "packageId": "$PACKAGE_ID",
  "deployer": "$ACTIVE_ADDRESS",
  "explorerUrl": "https://explorer.sui.io/object/$PACKAGE_ID?network=devnet"
}
EOF

echo ""
echo "📄 Deployment info saved to deployment-info.json"

cd ..
