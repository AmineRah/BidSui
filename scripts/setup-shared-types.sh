#!/bin/bash

# Script to setup shared types package and link it to frontend and backend

echo "🔧 Setting up shared types package..."

# Navigate to shared-types directory
cd shared-types

# Install dependencies
echo "📦 Installing shared-types dependencies..."
npm install

# Build the package
echo "🏗️ Building shared-types package..."
npm run build

# Go back to root
cd ..

# Install shared-types in frontend
echo "🔗 Linking shared-types to frontend..."
cd frontend
npm install ../shared-types
cd ..

# Install shared-types in backend
echo "🔗 Linking shared-types to backend..."
cd backend
npm install ../shared-types
cd ..

echo "✅ Shared types setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update your imports in frontend: import { CreateAuctionRequest } from '@bidsui/shared-types'"
echo "2. Update your imports in backend: import { CreateAuctionRequest } from '@bidsui/shared-types'"
echo "3. Remove duplicate type definitions from both projects"
echo ""
echo "🎯 Benefits:"
echo "- ✅ No more type duplication"
echo "- ✅ Single source of truth"
echo "- ✅ Better type safety"
echo "- ✅ Easier maintenance"
