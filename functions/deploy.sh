#!/bin/bash

# Kitchen Workflow Firebase Functions Deployment Script

echo "🚀 Deploying Kitchen Workflow to Firebase Functions..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Check if user is logged in to Firebase
echo "🔐 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Firebase. Please run 'firebase login' first."
    exit 1
fi

echo "✅ Firebase authentication confirmed!"

# Deploy only the functions
echo "🚀 Deploying functions to Firebase..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Your Kitchen Workflow is now live on Firebase!"
    echo ""
    echo "📱 To call the function from your client:"
    echo "   import { httpsCallable } from 'firebase/functions';"
    echo "   const kitchenFlow = httpsCallable(functions, 'kitchenFlow');"
echo "   const result = await kitchenFlow({ message: 'Show me the menu' });"
    echo ""
    echo "⚠️  Remember to:"
    echo "   1. Set GOOGLE_GENAI_API_KEY in Firebase Functions environment"
    echo "   2. Configure Firebase Authentication if needed"
    echo "   3. Set up Firestore collections for production data storage"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
