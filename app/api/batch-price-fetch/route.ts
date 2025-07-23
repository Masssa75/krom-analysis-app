import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GeckoTerminalAPI } from '@/lib/geckoterminal';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const geckoTerminal = new GeckoTerminalAPI(process.env.GECKO_TERMINAL_API_KEY!);

export async function POST(request: Request) {
  try {
    const { count = 10 } = await request.json();
    
    // Get calls that have contracts but no price data
    const { data: calls, error } = await supabase
      .from('crypto_calls')
      .select('krom_id, ticker, raw_data, buy_timestamp, created_at')
      .not('raw_data->token->ca', 'is', null)
      .is('price_at_call', null)
      .or('call_ai_analysis_score.not.is.null,x_ai_analysis_score.not.is.null') // Only fetch prices for analyzed calls
      .order('created_at', { ascending: false })
      .limit(count);
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }
    
    if (!calls || calls.length === 0) {
      return NextResponse.json({ 
        message: 'No calls found that need price data',
        processed: 0 
      });
    }
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };
    
    // Process calls sequentially to avoid rate limits
    for (const call of calls) {
      try {
        const contractAddress = call.raw_data?.token?.ca;
        const network = call.raw_data?.token?.network || GeckoTerminalAPI.guessNetwork(contractAddress);
        
        // Use buy_timestamp if available, otherwise use created_at
        const callTimestamp = call.buy_timestamp || call.created_at;
        const timestampInSeconds = new Date(callTimestamp).getTime() / 1000;
        
        // Fetch comprehensive token data with market caps
        const tokenData = await geckoTerminal.getTokenDataWithMarketCaps(
          network,
          contractAddress,
          timestampInSeconds
        );
        
        // Calculate metrics
        const roi = tokenData.priceAtCall && tokenData.currentPrice 
          ? ((tokenData.currentPrice - tokenData.priceAtCall) / tokenData.priceAtCall) * 100 
          : null;
        
        const athROI = tokenData.priceAtCall && tokenData.ath?.price 
          ? ((tokenData.ath.price - tokenData.priceAtCall) / tokenData.priceAtCall) * 100 
          : null;
        
        // Update database with price data
        const { error: updateError } = await supabase
          .from('crypto_calls')
          .update({
            price_at_call: tokenData.priceAtCall,
            current_price: tokenData.currentPrice,
            ath_price: tokenData.ath?.price || null,
            ath_timestamp: tokenData.ath?.timestamp ? new Date(tokenData.ath.timestamp * 1000).toISOString() : null,
            roi_percent: roi,
            ath_roi_percent: athROI,
            price_network: network,
            price_fetched_at: new Date().toISOString(),
            market_cap_at_call: tokenData.marketCapAtCall,
            current_market_cap: tokenData.currentMarketCap,
            ath_market_cap: tokenData.athMarketCap,
            fdv_at_call: tokenData.fdvAtCall,
            current_fdv: tokenData.currentFDV,
            ath_fdv: tokenData.athFDV,
            token_supply: tokenData.tokenInfo?.total_supply || null
          })
          .eq('krom_id', call.krom_id);
        
        if (updateError) {
          throw updateError;
        }
        
        results.successful++;
        
        // Add delay to respect rate limits (30 calls/minute = 2 seconds between calls)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          ticker: call.ticker,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      results.processed++;
    }
    
    return NextResponse.json({
      message: `Batch price fetch completed`,
      ...results
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process batch price fetch' },
      { status: 500 }
    );
  }
}