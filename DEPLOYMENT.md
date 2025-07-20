# Deployment Guide

This guide covers deploying the KROM Analysis Dashboard to Netlify.

## Prerequisites

- Git repository with your code
- Netlify account
- Environment variables ready

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository has all necessary files:
- All source code committed
- `.gitignore` properly configured
- Environment variables NOT committed

### 2. Connect to Netlify

#### Option A: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize new site
netlify init

# Deploy
netlify deploy --prod
```

#### Option B: Netlify Dashboard
1. Log in to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub, GitLab, Bitbucket)
4. Select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Functions directory: `netlify/functions`

### 3. Configure Environment Variables

In Netlify Dashboard:
1. Go to Site Settings → Environment Variables
2. Add the following variables:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STORE_ANALYSIS_RESULTS=true
NODE_ENV=production
```

### 4. Deploy Settings

Ensure these settings in Netlify:

**Build settings:**
- Base directory: (leave empty)
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: `netlify/functions`

**Build environment variables:**
- `NODE_VERSION`: 18 (or higher)
- `NEXT_USE_NETLIFY_EDGE`: true

### 5. Custom Domain (Optional)

1. Go to Domain Settings
2. Add custom domain
3. Configure DNS settings
4. Enable HTTPS (automatic)

## Post-Deployment

### Verify Deployment
- Check build logs for errors
- Test all pages and API endpoints
- Verify environment variables are working
- Test AI analysis features

### Monitoring
- Enable Netlify Analytics
- Set up error notifications
- Monitor function usage

### Performance Optimization
- Enable Next.js Image Optimization
- Configure caching headers (already in netlify.toml)
- Monitor Core Web Vitals

## Troubleshooting

### Build Failures
- Check Node version compatibility
- Verify all dependencies are listed in package.json
- Check for TypeScript errors
- Review build logs

### API Issues
- Verify environment variables are set
- Check API rate limits
- Monitor function logs
- Test CORS configuration

### Performance Issues
- Enable Netlify Edge Functions
- Optimize bundle size
- Use dynamic imports for large components
- Enable caching where appropriate

## Security Considerations

1. **API Keys**: Never commit API keys to repository
2. **CORS**: Configure appropriate CORS headers
3. **CSP**: Consider adding Content Security Policy
4. **Rate Limiting**: Implement rate limiting for API routes

## Continuous Deployment

Netlify automatically deploys when you push to your main branch. For staging:

1. Create a staging branch
2. Set up branch deploys in Netlify
3. Preview deploys for pull requests

## Rollback

If issues occur:
1. Go to Deploys tab in Netlify
2. Find last working deployment
3. Click "Publish deploy"

## Advanced Configuration

### Edge Functions
For better performance, consider moving API routes to Edge Functions:

1. Create `netlify/edge-functions/` directory
2. Move API logic to edge functions
3. Update routes accordingly

### Incremental Static Regeneration
Configure ISR in Next.js for dynamic content:

```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

## Support

For Netlify-specific issues:
- [Netlify Documentation](https://docs.netlify.com)
- [Netlify Community](https://community.netlify.com)
- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/)