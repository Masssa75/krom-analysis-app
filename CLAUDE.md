# KROM Analysis App Documentation

## Overview
Next.js 15 application for analyzing cryptocurrency calls from the KROM database. Part of the KROMV12 monorepo, this app provides batch AI analysis with scoring, contract extraction, and CSV exports.

**Live URL**: https://lively-torrone-8199e0.netlify.app

## Key Features
- **Batch Historical Analysis**: Process 5-100 calls at a time
- **AI Scoring**: 1-10 scale using Claude, GPT-4, Kimi K2, or Gemini
- **Dual Analysis Types**:
  - Call Analysis: Evaluates legitimacy based on call content
  - X (Twitter) Analysis: Evaluates social media presence
- **Contract Extraction**: Automatic extraction with DexScreener links
- **CSV Export**: Download analyzed data for external processing
- **Coins of Interest**: Mark promising tokens for tracking

## Tech Stack
- **Framework**: Next.js 15.1.3 with App Router
- **Database**: Supabase (PostgreSQL)
- **AI Models**: OpenRouter (Kimi K2), Anthropic (Claude), OpenAI (GPT-4), Google (Gemini)
- **Deployment**: Netlify with automatic builds
- **Styling**: Tailwind CSS with shadcn/ui components

## Environment Variables
Get values from `/KROMV12/.env` and add to Netlify dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPEN_ROUTER_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `CRON_SECRET` (for automated processing)

## API Endpoints

### Analysis Endpoints
- `POST /api/analyze` - Batch call analysis (5 calls default)
- `POST /api/x-batch` - Batch X/Twitter analysis
- `POST /api/reanalyze-call` - Re-analyze single call
- `POST /api/reanalyze-x` - Re-analyze X data for single call

### Cron Endpoints (for automation)
- `GET /api/cron/analyze?auth={CRON_SECRET}` - Automated call analysis
- `GET /api/cron/x-analyze?auth={CRON_SECRET}` - Automated X analysis

### Data Endpoints
- `GET /api/analyzed` - Fetch analyzed calls with pagination
- `GET /api/download-csv` - Export data as CSV
- `POST /api/mark-coin-of-interest` - Toggle coin tracking
- `POST /api/comment` - Add/update user comments
- `DELETE /api/delete-analysis` - Remove analysis data

## Database Schema Extensions
The app adds these columns to the `crypto_calls` table:
```sql
-- Call Analysis Fields
analysis_score INTEGER (1-10)
analysis_tier TEXT (ALPHA/SOLID/BASIC/TRASH)
analysis_token_type TEXT (meme/utility)
analysis_legitimacy_factor TEXT (High/Medium/Low)
analysis_model TEXT
analysis_reasoning TEXT
analysis_prompt_used TEXT
analysis_batch_id UUID
analysis_duration_ms INTEGER
analysis_reanalyzed_at TIMESTAMPTZ

-- X Analysis Fields  
x_analysis_score INTEGER (1-10)
x_analysis_tier TEXT
x_analysis_token_type TEXT
x_legitimacy_factor TEXT
x_analysis_model TEXT
x_best_tweet TEXT
x_analysis_reasoning TEXT
x_analysis_batch_id UUID
x_analysis_duration_ms INTEGER
x_reanalyzed_at TIMESTAMPTZ

-- User Fields
is_coin_of_interest BOOLEAN
user_comment TEXT
user_comment_updated_at TIMESTAMPTZ
```

## Deployment & Development

### Local Development
```bash
cd krom-analysis-app
npm install
npm run dev  # Runs on http://localhost:3000
```

### Deployment Process
```bash
# Make changes
git add -A && git commit -m "feat: description" && git push origin main

# Monitor deployment (builds automatically on push)
netlify logs:deploy

# Verify deployment
netlify api listSiteDeploys --data '{"site_id": "8ff019b3-29ef-4223-b6ad-2cc46e91807e"}' | jq '.[0].state'
```

### Testing
```bash
# Run Playwright tests on deployed site
npx playwright test --headed  # Use --headless for CI

# Test specific features
npx playwright test test-x-analysis
```

## AI Model Configuration

### Available Models
1. **Kimi K2** (Default - Best for utility detection)
   - Model: `moonshotai/kimi-k2` (paid version)
   - Best at identifying legitimate utility tokens
   - Rate limit: 100 requests/10 seconds

2. **GPT-4**
   - Model: `gpt-4-0125-preview`
   - Good general performance
   - More expensive than Kimi K2

3. **Claude Haiku**
   - Model: `claude-3-haiku-20240307`
   - Fast and affordable
   - Original model (now secondary)

4. **Gemini 2.5 Pro**
   - Model: `google/gemini-2.5-pro`
   - Supports batch processing for cost savings
   - Requires 4000 max tokens

### Rate Limiting
- All endpoints include 100ms delays between API calls
- Prevents 429 errors with OpenRouter
- Use paid models to avoid upstream rate limits

## Automation Setup

### Cron Job Configuration
The app has cron endpoints ready for scheduled processing:

1. **Call Analysis Cron**
   - Endpoint: `/api/cron/analyze`
   - Processes: 5 oldest unanalyzed calls
   - Frequency: Every 1-5 minutes recommended

2. **X Analysis Cron**
   - Endpoint: `/api/cron/x-analyze`
   - Processes: 5 calls with tweets needing analysis
   - Frequency: Every 1-5 minutes recommended

### Setting Up with cron-job.org
```bash
# Call Analysis
URL: https://lively-torrone-8199e0.netlify.app/api/cron/analyze?auth=YOUR_CRON_SECRET
Schedule: */5 * * * * (every 5 minutes)

# X Analysis  
URL: https://lively-torrone-8199e0.netlify.app/api/cron/x-analyze?auth=YOUR_CRON_SECRET
Schedule: */5 * * * * (every 5 minutes)
```

## Current State (July 2025)
- ✅ All features operational
- ✅ Paid Kimi K2 model configured (no rate limits)
- ✅ Call analysis: 150 completed
- ✅ X analysis: 149 completed
- ✅ Cron endpoints ready (not scheduled)
- 📊 ~5,000+ calls awaiting analysis

## Common Issues & Solutions

### Rate Limiting
- **Problem**: 429 errors with free models
- **Solution**: Use paid models (remove `:free` suffix)
- **Example**: `moonshotai/kimi-k2` not `moonshotai/kimi-k2:free`

### Deployment Timeouts
- **Problem**: Netlify 10-second function timeout
- **Solution**: Keep batch sizes small (5 calls max)
- **Alternative**: Use Supabase Edge Functions for longer tasks

### Missing Database Columns
- **Problem**: New analysis fields not recognized
- **Solution**: Use Supabase Management API to add columns
```bash
curl -X POST "https://api.supabase.com/v1/projects/PROJECT_ID/database/query" \
  -H "Authorization: Bearer MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE crypto_calls ADD COLUMN IF NOT EXISTS new_column TYPE;"}'
```

## Future Enhancements
- [ ] Historical price tracking with GeckoTerminal API
- [ ] ROI calculations based on call timing
- [ ] Advanced filtering and search
- [ ] Real-time analysis dashboard
- [ ] Webhook notifications for high-score tokens

## Recent Updates (July 26, 2025)

### UI Enhancements
1. **Date Column Added** - Shows call date in table (format: "Jul 26")
   - Thai timezone on hover (e.g., "Jul 26, 2025, 09:10 AM (Thai Time)")
   - Dotted underline indicates hoverable

2. **GeckoTerminal Chart Improvements**
   - Removed transactions section (`swaps=0`)
   - Maximized chart space (90vh height, 7xl width)
   - Added price info grid: Entry, ATH, Now with market caps
   - Shows call date/time in Thai timezone in header
   - Removed redundant bottom bar and external link button

### Price Fetching Migration (CRITICAL)
Successfully migrated from Netlify API to Supabase Edge Function:

**Current State:**
- ✅ `crypto-price-single` edge function deployed and working
- ✅ PriceDisplay component now uses Supabase by default
- ✅ ATH calculation implemented and deployed
- ✅ Fixed .env parsing issues (uncommented headers)

**Edge Function Details:**
- URL: `https://eucfoommxxvqmmwdbkdv.supabase.co/functions/v1/crypto-price-single`
- Timeout: 150 seconds (vs Netlify's 10 seconds)
- Features: Current price, historical price, ATH since call, market caps, ROI

**Known Issues:**
- Historical prices may be null for older timestamps (expected - limited OHLCV data)
- Some tokens may not have pool data on GeckoTerminal

**Next Steps:**
1. Monitor edge function performance
2. Consider batch price fetching migration to edge function
3. Add fallback for tokens without GeckoTerminal data

---
**Last Updated**: July 26, 2025
**Version**: 1.1.0