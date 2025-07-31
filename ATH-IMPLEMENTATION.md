# ATH (All-Time High) Implementation Documentation

## Overview
Implemented a comprehensive 3-tier ATH calculation system using GeckoTerminal/CoinGecko Pro API to find realistic selling points for each token after the call was made.

## Key Bug Fix (July 30, 2025)
### The Problem
The original ATH calculation was looking for daily candles strictly AFTER the call timestamp. This caused it to miss intraday peaks on the call day itself. For example:
- Token called at 9:36 AM
- Token peaked at 6:35 PM same day
- Algorithm skipped to next day's candle (much lower)

### The Solution
1. **Daily candles**: Search from START of call day (midnight) instead of exact call time
2. **Hourly candles**: Include all hours around the daily ATH
3. **Minute candles**: Only consider minutes AFTER the actual call time

## Implementation Details

### 3-Tier OHLCV Approach
1. **Tier 1 - Daily**: Find highest daily candle from call day onwards (1000 days history)
2. **Tier 2 - Hourly**: Zoom to hourly candles around that day (±1 day window, 72 hours)
3. **Tier 3 - Minute**: Zoom to minute candles around that hour (±1 hour window, 120 minutes)

### ATH Price Calculation
- Use `Math.max(open, close)` from the minute with highest peak
- Avoids unrealistic wick extremes while capturing best tradeable price
- Never allow negative ROI (capped at 0%)

### Database Fields
- `ath_price` - The ATH price (max of open/close)
- `ath_timestamp` - When ATH occurred (ISO format with timezone)
- `ath_roi_percent` - ROI at ATH (never negative)
- `ath_market_cap` - Market cap at ATH (not populated yet)
- `ath_fdv` - FDV at ATH (not populated yet)

## API Configuration
- **CoinGecko Pro API**: 500 calls/minute limit
- **API Key**: Stored in GECKO_TERMINAL_API_KEY env var
- **Endpoint**: https://pro-api.coingecko.com/api/v3/onchain
- **Headers**: `{"x-cg-pro-api-key": API_KEY}`

## Processing Scripts

### Edge Function: crypto-ath-historical
Location: `/supabase/functions/crypto-ath-historical/index.ts`
- Processes tokens without ATH data
- Network mapping (ethereum → eth)
- 0.5 second delay between tokens
- Processes oldest coins first (ORDER BY created_at ASC)

### Parallel Processing: fixed-parallel-ath.py
- Uses Python multiprocessing with 6 workers
- Processes 500 tokens per batch
- Achieves ~150-200 tokens/minute
- ORDER BY created_at DESC for newest first

### Monitoring: monitor-fixed-ath.py
- Real-time progress tracking
- Shows tokens processed, rate, and ETA
- Updates every 10 seconds

## Common Issues & Solutions

1. **Timestamp Format Errors**
   - Some tokens have invalid timestamp formats
   - Non-blocking - processing continues
   - Example: "Invalid isoformat string: '2025-05-20 01:18:00+00'"

2. **Float Division by Zero**
   - Occurs when price_at_call is 0
   - Skip these tokens

3. **Rate Limiting**
   - Pro API allows 500 calls/minute
   - We make 3 calls per token (daily, hourly, minute)
   - ~166 tokens per minute maximum

## Verification Examples
Successfully tested on multiple tokens:
- **FIRST**: 50.7% ATH ROI (fixed from negative)
- **SCARCE**: 389.3% ATH ROI
- **COOL**: 166% ATH ROI
- **MEERKAT**: 5,940% ATH ROI (60x return)

## Running ATH Processing

### Full Database Processing
```bash
# Clear all ATH data (if needed)
curl -X POST "https://api.supabase.com/v1/projects/eucfoommxxvqmmwdbkdv/database/query" \
  -H "Authorization: Bearer sbp_97ca99b1a82b9ed514d259a119ea3c19a2e42cd7" \
  -H "Content-Type: application/json" \
  -d '{"query": "UPDATE crypto_calls SET ath_price = NULL, ath_timestamp = NULL, ath_roi_percent = NULL WHERE pool_address IS NOT NULL AND price_at_call IS NOT NULL;"}'

# Run parallel processing
./run-fixed-parallel-ath.sh > fixed-ath-processing.log 2>&1 &

# Monitor progress
python3 monitor-fixed-ath.py
```

### Process Specific Token
```bash
# Clear specific token
UPDATE crypto_calls SET ath_price = NULL WHERE ticker = 'TOKENNAME'

# Process will pick it up in next batch
```

## Important Notes
1. Always backup database before bulk operations
2. Processing ~5,500 tokens takes ~30-40 minutes
3. Some tokens may not have OHLCV data (expected)
4. ATH is calculated AFTER the call was made, not absolute ATH
5. Uses created_at timestamp if buy_timestamp is null