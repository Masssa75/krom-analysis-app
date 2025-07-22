#!/bin/bash

# Deploy krom-analysis-app to GitHub and Netlify

echo "🚀 Starting deployment process for krom-analysis-app..."

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: KROM Analysis App for historical crypto analysis"

# Create GitHub repository using GitHub CLI
echo "🐙 Creating GitHub repository..."
gh repo create krom-analysis-app --public --source=. --remote=origin --push

echo "✅ GitHub repository created and code pushed!"
echo ""
echo "🔗 Next steps for Netlify deployment:"
echo "1. Go to https://app.netlify.com"
echo "2. Click 'Add new site' → 'Import an existing project'"
echo "3. Connect to GitHub and select 'krom-analysis-app'"
echo "4. Deploy settings should auto-configure from netlify.toml"
echo "5. Add environment variables from parent .env file"
echo ""
echo "📋 Required environment variables:"
echo "- SUPABASE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- ANTHROPIC_API_KEY"
echo "- GEMINI_API_KEY"