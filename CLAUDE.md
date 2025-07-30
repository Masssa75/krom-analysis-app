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

### Price Fetching Endpoints
- `POST /api/refresh-prices` - Smart on-demand price refresh with caching
- `POST /api/batch-price-fetch` - Legacy batch price fetching
- `POST /api/token-price` - Single token price fetch
- `GET /api/price-stats` - Price fetching statistics

## Database Schema Extensions
The app uses and extends the complete `crypto_calls` table (70 columns total).

### Core App Fields Used
```sql
-- Essential Fields (from core schema)
id UUID PRIMARY KEY
krom_id TEXT UNIQUE
ticker TEXT
network TEXT
contract_address TEXT
buy_timestamp TIMESTAMPTZ
raw_data JSONB
created_at TIMESTAMPTZ

-- Call Analysis Fields (13 total)
analysis_score INTEGER               -- 1-10 legitimacy score
analysis_tier TEXT                   -- ALPHA/SOLID/BASIC/TRASH
analysis_token_type TEXT             -- meme/utility classification
analysis_legitimacy_factor TEXT      -- High/Medium/Low
analysis_model TEXT                  -- AI model used (gpt-4, kimi-k2, etc.)
analysis_reasoning TEXT              -- Detailed analysis explanation
analysis_prompt_used TEXT            -- Full prompt sent to AI
analysis_batch_id UUID               -- Batch processing identifier
analysis_batch_timestamp TIMESTAMPTZ -- When batch was processed
analysis_duration_ms INTEGER         -- Processing time in milliseconds
analysis_confidence NUMERIC          -- AI confidence level (0-1)
analysis_reanalyzed_at TIMESTAMPTZ   -- Last re-analysis timestamp
analysis_description TEXT            -- Legacy analysis summary

-- X Analysis Fields (18 total)
x_analysis_score INTEGER             -- 1-10 social media score
x_analysis_tier TEXT                 -- X research rating
x_analysis_token_type TEXT           -- Token type from social analysis
x_legitimacy_factor TEXT             -- Legitimacy from social presence
x_analysis_legitimacy_factor TEXT    -- Enhanced legitimacy assessment
x_analysis_model TEXT                -- AI model for X analysis
x_best_tweet TEXT                    -- Most relevant tweet
x_analysis_best_tweet TEXT           -- Alternative best tweet field
x_analysis_reasoning TEXT            -- Detailed X analysis reasoning
x_analysis_prompt_used TEXT          -- Prompt used for X analysis
x_analysis_batch_id UUID             -- X analysis batch identifier
x_analysis_batch_timestamp TIMESTAMPTZ -- X batch processing time
x_analysis_duration_ms INTEGER       -- X analysis processing time
x_reanalyzed_at TIMESTAMPTZ          -- Last X re-analysis timestamp
x_analysis_key_observations JSONB    -- Key social media insights
x_analysis_summary TEXT              -- X analysis summary
x_raw_tweets JSONB                   -- Raw tweet data
x_analyzed_at TIMESTAMPTZ             -- When X analysis completed

-- Price & ROI Fields (13 total) - Used for performance tracking
price_at_call NUMERIC                -- Token price when call was made
price_current NUMERIC                -- Current token price
current_price NUMERIC                -- Alternative current price
price_updated_at TIMESTAMPTZ         -- When price was last updated
price_fetched_at TIMESTAMPTZ         -- When price data was fetched
price_change_percent NUMERIC         -- Price change percentage
price_network TEXT                   -- Network used for price fetching
ath_price NUMERIC                    -- All-time high price
ath_timestamp TIMESTAMPTZ            -- When ATH was reached
ath_roi_percent NUMERIC              -- ROI percentage from ATH
ath_market_cap NUMERIC               -- Market cap at ATH
ath_fdv NUMERIC                      -- Fully diluted value at ATH
roi_percent NUMERIC                  -- Current ROI percentage

-- Market Data Fields (7 total) - Enhanced metrics
market_cap_at_call NUMERIC           -- Market cap when call was made
current_market_cap NUMERIC           -- Current market capitalization
fdv_at_call NUMERIC                  -- Fully diluted value at call time
current_fdv NUMERIC                  -- Current fully diluted value
token_supply NUMERIC                 -- Total token supply
pool_address TEXT                    -- DEX pool address for accurate pricing

-- User Interaction Fields (5 total)
is_coin_of_interest BOOLEAN          -- User-marked interesting tokens
coin_of_interest_marked_at TIMESTAMPTZ -- When marked as interesting
coin_of_interest_notes TEXT          -- User notes for interesting coins
user_comment TEXT                    -- User comments on the call
user_comment_updated_at TIMESTAMPTZ  -- When comment was last updated
```

### App-Specific Features
- **Batch Processing**: Uses `analysis_batch_id` and `x_analysis_batch_id` for tracking
- **Model Selection**: Supports GPT-4, Kimi K2, Claude Haiku, Gemini 2.5 Pro
- **Re-analysis**: Tracks when calls are re-analyzed with different models
- **Performance Metrics**: Duration tracking for optimization
- **Price Integration**: Real-time price fetching via Supabase Edge Functions
- **User Interactions**: Comments and "coins of interest" marking

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

## Strategic Roadmap

### Signal Architecture Vision
The app will evolve into a multi-signal cryptocurrency analysis platform:

#### 1. **Coin of Interest Signals** (Sources)
- ✅ **KROM API** - Current primary source
- 🔄 **DexScreener API** - Trending tokens, new listings
- 📊 **Other Sources** (Future):
  - Whale wallet tracking
  - Social media trending (Reddit, Discord)
  - DEX volume spikes
  - New contract deployments

#### 2. **Quality Signals** (Analysis)
- ✅ **Call Analysis** - Legitimacy scoring (1-10)
- ✅ **X Analysis** - Social presence quality (1-10)
- 🔄 **On-chain Analysis** (Planned):
  - Holder distribution metrics
  - Liquidity depth & locks
  - Transaction patterns
  - Smart contract security
- 🔄 **Project Analysis** (Planned):
  - Website quality assessment
  - Team verification
  - Documentation completeness
  - Roadmap feasibility

#### 3. **Signal Aggregation**
- Combine multiple signals into composite scores
- Weight signals based on historical performance
- Machine learning for signal optimization

### Immediate Priorities
1. **Complete price migration** (in progress)
2. **Telegram notifications** for X scores 5+ via Edge Functions
3. **DexScreener integration** as second coin source
4. **Data analysis** on completed dataset

### DexScreener Integration Architecture

#### Database Design - Unified Table Approach
Using the existing `crypto_calls` table with source differentiation:

```sql
-- New columns for multi-source support
source TEXT DEFAULT 'krom' -- 'krom', 'dexscreener', 'whale_tracker', etc.
source_id TEXT -- Original ID from the source
source_data JSONB -- Source-specific data that doesn't fit standard schema
contract_address TEXT -- Normalized contract address field
chain TEXT -- 'ethereum', 'solana', 'arbitrum', etc.
```

#### Why Unified Table?
- **Unified Analysis**: All quality signals work regardless of source
- **Deduplication**: Track same token from multiple sources as one
- **Comparison**: Easy performance metrics per source
- **Simpler Architecture**: One table, one UI, filtered views

#### DexScreener Data Mapping
```typescript
// DexScreener trending token → crypto_calls record
{
  source: 'dexscreener',
  source_id: dexScreenerTokenId,
  ticker: token.symbol,
  contract_address: token.address,
  chain: token.chainId,
  buy_timestamp: discovered_at,
  raw_data: null, // No KROM-style raw data
  source_data: {
    priceUsd: token.priceUsd,
    volume24h: token.volume24h,
    liquidity: token.liquidity,
    fdv: token.fdv,
    trending_score: token.trendingScore
  }
}
```

### Notification System Plan
- Threshold: X analysis score ≥ 5
- Delivery: Telegram via Supabase Edge Functions
- Features:
  - Real-time alerts for high-quality tokens
  - Include scores, contract address, DexScreener link
  - Rate limiting to prevent spam
  - Separate channels for different score tiers

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

## 🚧 PRICE FETCHING DEVELOPMENT (REMOVE WHEN COMPLETE) 🚧

### Overview
The price fetching feature is complex to verify due to:
- Difficulty visually confirming correct entry/ATH prices
- Context window limitations during debugging sessions
- Multiple edge cases (different networks, missing data, etc.)

### Current State of Edge Functions

#### crypto-price-single (v3 - Last updated: July 26, 2025)
**What's Fixed:**
- ✅ Network parameter now passed from frontend (was defaulting to ETH)
- ✅ Historical price calculation fixed - removed `beforeOffset` that was fetching future prices
  - Was: `before_timestamp=${timestamp + beforeOffset}` (getting prices AFTER the call)
  - Now: `before_timestamp=${timestamp}` (getting prices AT/BEFORE the call)
- ✅ Deployment successful and working

**Known Issues:**
- Historical prices may be null for very old timestamps (limited OHLCV data)
- Some tokens may not have pool data on GeckoTerminal
- Need to add date information to response for hover tooltips

**Test Results:**
- T token (Arbitrum): Was returning $0.0737, now correctly returns $0.0152
- BUNKER token (Solana): Correctly identified entry at $0.00230 on June 24, 2025

### Development Plan

#### Phase 1: Visual Verification Tools
**Goal**: Add visual markers to charts to easily verify entry/ATH prices

**Chart Provider Research Needed:**
1. **GeckoTerminal** (current)
   - Check if URL params support markers/annotations
   - Investigate embed options for customization
   - API capabilities for overlay data

2. **DexScreener**
   - Research URL parameter options
   - Check for annotation/marker support
   - Compare embed capabilities

3. **DexTools**
   - Explore API/URL customization
   - Check marker injection possibilities
   - Evaluate as alternative provider

4. **Other Options**
   - TradingView widgets (if they support crypto)
   - Custom chart libraries (Chart.js, Recharts)
   - Other DEX aggregators

**Implementation Ideas:**
- URL parameters to highlight specific timestamps
- Overlay div with absolute positioning over iframe
- Custom chart component if no provider supports markers
- Side panel showing entry/ATH points with visual indicators

#### Phase 2: Enhanced Tooltips ✅ COMPLETED
**Requirements:**
- ✅ Add entry date/time to price display hover
- ✅ Add ATH date/time to price display hover
- ✅ Show timezone (Thai time preferred by user)
- ✅ Format: "Jun 24, 2025, 01:00 AM (Thai Time)"

**Implementation Details:**
- Added `formatThaiDate()` helper function in edge function
- Edge function returns `callDateFormatted` and `athDateFormatted` fields
- PriceDisplay component updated to show dates in tooltips
- **Note**: Only works for newly fetched prices (existing data lacks formatted dates)

#### Phase 3: Edge Function Improvements
**Completed Updates:**
1. ✅ Add date fields to response - Now returns:
   - `callDateFormatted`: "Jun 24, 2025, 01:00 AM (Thai Time)"
   - `athDateFormatted`: "Jun 27, 2025, 07:00 AM (Thai Time)"

**Still Planned:**
2. Add validation for edge cases:
   - Handle pre-pool creation calls
   - Better error messages for missing data
   - Network detection improvements
3. Consider batch update for existing price data to add formatted dates

### Testing Checklist
- [ ] Test token with known entry/ATH (T token on Arbitrum)
- [x] Test token with different timezone considerations (BUNKER - Thai time)
- [ ] Test token with missing historical data
- [ ] Test cross-chain tokens
- [ ] Verify visual markers match database values
- [x] Confirm tooltip dates are accurate (verified with BUNKER token)

### Session Progress Tracking

#### Session: July 26, 2025
- Fixed edge function historical price calculation
- Discovered T token was returning wrong price ($0.0737 instead of ~$0.0029)
- Fixed by removing timestamp offset in OHLCV queries
- Tested BUNKER token - correctly identified June 24 entry at $0.00230
- Identified need for visual verification tools
- Created this development plan
- ✅ Implemented entry/ATH date tooltips with Thai timezone
  - Added `formatThaiDate()` helper to edge function
  - Edge function now returns `callDateFormatted` and `athDateFormatted`
  - Updated PriceDisplay component to show dates on hover
  - Format: "Jun 24, 2025, 01:00 AM (Thai Time)"
  - NOTE: Only works for newly fetched prices (existing data won't have formatted dates)

#### Session: July 28, 2025
- **Critical Discovery**: App was reading from wrong database column!
  - Batch processor writes to `historical_price_usd`
  - App reads from `price_at_call`
  - This is why prices weren't showing in the interface
- Fixed by copying 413 records from `historical_price_usd` to `price_at_call`
- Entry prices now display correctly in the UI
- **Action Required**: Update batch processors to write to `price_at_call` instead

#### Next Session TODO:
1. Update batch processor to populate `price_at_call` column
2. Research chart provider URL parameters for markers
3. Test GeckoTerminal embed customization options  
4. Create simple test page with visual price verification
5. Consider adding migration to update existing price data with formatted dates

### Important Test Tokens
1. **T Token** (Arbitrum)
   - Contract: `0x30a538eFFD91ACeFb1b12CE9Bc0074eD18c9dFc9`
   - Call: July 15, 2025 17:24 UTC
   - Entry: ~$0.0029-0.0152
   - ATH: $0.3301 on July 24

2. **BUNKER Token** (Solana)
   - Contract: `8NCievmJCg2d9Vc2TWgz2HkE6ANeSX7kwvdq5AL7pump`
   - Call: June 24, 2025 01:00 Thai (June 23 18:00 UTC)
   - Entry: $0.00230
   - ATH: $0.009786 on June 27

## Price Fetching System (July 30, 2025)

### Overview
The app implements a sophisticated smart on-demand price fetching system that automatically refreshes stale prices when users load the page. This ensures users always see relatively fresh data while minimizing API calls.

### Smart Caching Strategy
- **New tokens** (< 24 hours old): **5-minute cache** - Catches high volatility period
- **Older tokens** (≥ 24 hours old): **1-hour cache** - Balances freshness with efficiency

### How It Works

#### 1. **On Page Load**
When the analyzed calls page loads (`/api/analyzed`), it returns token data including `price_updated_at` timestamps.

#### 2. **Background Refresh**
The frontend (`app/page.tsx`) automatically:
- Checks each displayed token's price age
- Batches stale tokens based on cache rules
- Calls `/api/refresh-prices` in the background
- Updates UI seamlessly as fresh prices arrive

#### 3. **Batch Processing**
The refresh endpoint (`/api/refresh-prices/route.ts`):
```typescript
// Processes up to 30 tokens per DexScreener API call
const addresses = batch.map(t => t.contract_address).join(',');
const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses}`);
```

### Price Data Sources

#### Primary: DexScreener API
- **Endpoint**: `https://api.dexscreener.com/latest/dex/tokens/{addresses}`
- **Batch Support**: Up to 30 tokens per request (comma-separated)
- **Rate Limits**: None documented
- **Coverage**: Excellent for popular tokens across all chains
- **Response Time**: ~1-2 seconds for batch requests

#### Fallback: GeckoTerminal API
- **Endpoint**: `https://api.geckoterminal.com/api/v2/networks/{network}/tokens/{address}/pools`
- **Batch Support**: No - single token only
- **Rate Limits**: Aggressive (requires delays)
- **Coverage**: Good for tokens missing from DexScreener
- **Network Mapping Required**:
  ```typescript
  const NETWORK_MAP = {
    'ethereum': 'eth',    // KROM uses 'ethereum', GT needs 'eth'
    'solana': 'solana',
    'bsc': 'bsc',
    'polygon': 'polygon',
    'arbitrum': 'arbitrum',
    'base': 'base'
  };
  ```

### API Response Processing

#### DexScreener Response
```json
{
  "pairs": [{
    "baseToken": {
      "address": "0x123...",
      "symbol": "TOKEN"
    },
    "priceUsd": "0.12345",
    "liquidity": { "usd": 50000 },
    "volume": { "h24": 10000 }
  }]
}
```

#### GeckoTerminal Response
```json
{
  "data": [{
    "attributes": {
      "token_price_usd": "0.12345",
      "pool_address": "0xabc..."
    }
  }]
}
```

### Database Updates
Successfully fetched prices update:
- `current_price`: Latest token price
- `price_updated_at`: Timestamp of update
- `roi_percent`: Recalculated if `price_at_call` exists

### Performance Metrics
- **Page Load**: Instant (shows cached prices)
- **Batch Refresh**: 2-3 seconds for 20 tokens
- **Success Rate**: ~82% (from production data)
- **API Efficiency**: 20-30x faster than individual requests

### Error Handling
- Network mismatches gracefully handled
- Missing tokens silently skipped
- Rate limits trigger fallback to GeckoTerminal
- Failed updates preserve existing data

### Visual Feedback
- Loading spinner during refresh (`isFetchingPrices` state)
- Prices update in real-time without page reload
- ROI percentages recalculate automatically

### Edge Function Integration
For individual token price fetches, the app also uses:
- **Supabase Edge Function**: `crypto-price-single`
- **Features**: Current price, historical price, ATH calculation
- **Used by**: PriceDisplay component for detailed views

---
**Last Updated**: July 30, 2025
**Version**: 1.2.0