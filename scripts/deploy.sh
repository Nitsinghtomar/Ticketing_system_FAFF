#!/bin/bash

echo "🚀 Deploying FAFF v0..."

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy client to Vercel
echo "🌐 Deploying client to Vercel..."
cd client
npx vercel --prod
cd ..

# Deploy server to Railway
echo "🖥️  Deploying server to Railway..."
cd server
railway deploy
cd ..

echo "✅ Deployment complete!"