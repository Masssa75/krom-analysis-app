# Deployment Instructions for KROM Analysis App

## Step 1: Initialize Git and Push to GitHub

Run these commands in your terminal:

```bash
cd /Users/marcschwyn/Desktop/projects/KROMV12/krom-analysis-app

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: KROM Analysis App for historical crypto analysis"

# Create GitHub repository using GitHub CLI
gh repo create krom-analysis-app --public --source=. --remote=origin --push
```

## Step 2: Deploy to Netlify

### Option A: Using Netlify CLI
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Create new site and link to GitHub repo
netlify init

# Deploy to production
netlify deploy --prod
```

### Option B: Using Netlify Web UI

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Select "GitHub" as your Git provider
4. Search for and select "krom-analysis-app"
5. Configure build settings (should auto-detect from netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Click "Deploy site"

## Step 3: Add Environment Variables in Netlify

1. Go to Site settings → Environment variables
2. Add the following variables from your parent `.env` file:

```
SUPABASE_URL=https://eucfoommxxvqmmwdbkdv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your service role key]
ANTHROPIC_API_KEY=[your anthropic key]
GEMINI_API_KEY=[your gemini key]
```

## Step 4: Update Deployment Badge

After deployment, update the README.md with your Netlify deployment badge:

1. Go to Site settings → General → Status badges
2. Copy the markdown code
3. Replace `YOUR-BADGE-ID` in README.md

## Step 5: Test Your Deployment

1. Visit your Netlify URL: `https://[your-site-name].netlify.app`
2. Test the analysis functionality
3. Verify environment variables are working

## Troubleshooting

If deployment fails:
- Check build logs in Netlify
- Verify all dependencies are in package.json
- Ensure Node version is 18+ in netlify.toml
- Check that environment variables are set correctly

## Success!

Your app should now be live and accessible without CORS issues!