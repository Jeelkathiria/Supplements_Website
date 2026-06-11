#!/bin/bash

# Vercel Deployment Script
# This script automates the deployment process

echo "🚀 Starting Vercel Deployment..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Verify .env variables exist
if [ ! -f .env.local ]; then
    echo "⚠️  WARNING: .env.local not found!"
    echo "   You'll need to set environment variables in Vercel dashboard:"
    echo "   - DATABASE_URL"
    echo "   - FIREBASE_PROJECT_ID"
    echo "   - FIREBASE_PRIVATE_KEY"
    echo "   - FIREBASE_CLIENT_EMAIL"
    echo "   - FIREBASE_STORAGE_BUCKET"
    echo "   - RAZORPAY_KEY_ID"
    echo "   - RAZORPAY_KEY_SECRET"
    echo "   - BREVO_API_KEY"
    echo ""
fi

# Deploy backend
echo "📦 Deploying Backend..."
cd backend
npm install
vercel --prod --confirm

BACKEND_URL=$(vercel list --json | jq -r '.[0].url')
echo "✅ Backend deployed to: $BACKEND_URL"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Deploy frontend
echo ""
echo "🎨 Deploying Frontend..."
cd ../frontend

# Update frontend env if needed
echo "Add to Vercel frontend project environment variables:"
echo "VITE_API_URL=$BACKEND_URL/api"

npm install
vercel --prod --confirm

FRONTEND_URL=$(vercel list --json | jq -r '.[0].url')
echo "✅ Frontend deployed to: $FRONTEND_URL"

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""
echo "Next steps:"
echo "1. Update CORS in backend if needed"
echo "2. Test API endpoints"
echo "3. Verify database connection"
echo "4. Check if images/uploads work"
