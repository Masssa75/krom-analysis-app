import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GeckoTerminalAPI } from '@/lib/geckoterminal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const geckoTerminal = new GeckoTerminalAPI(process.env.GECKO_TERMINAL_API_KEY!);
const DELAY_BETWEEN_CALLS = 2000; // 2 seconds to respect rate limits

export async function GET(request: Request) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get batch size from query params (default 25)
    const { searchParams } = new URL(request.url);
    const batchSize = parseInt(searchParams.get('count') || '25', 10);

    // Fetch analyzed calls without price data
    const { data: calls, error } = await supabase
      .from('crypto_calls')
      .select('*')
      .not('analysis_score', 'is', null)
      .is('price_at_call', null)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({ 
        message: 'No calls to process',
        processed: 0,
        remaining: 0
      });
    }

    // Process each call
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      
      try {
        // Extract contract address
        const contractAddress = call.raw_data?.token?.ca || call.contract_address;
        if (!contractAddress) {
          results.push({
            krom_id: call.krom_id,
            ticker: call.ticker,
            status: 'skipped',
            reason: 'No contract address'
          });
          continue;
        }

        // Determine network
        const network = call.raw_data?.token?.network === 'solana' ? 'solana' : 'eth';

        // Fetch price data
        console.log(`Fetching price for ${call.ticker} (${i + 1}/${calls.length})...`);
        const timestampInSeconds = Math.floor(new Date(call.buy_timestamp).getTime() / 1000);
        const tokenData = await geckoTerminal.getTokenDataWithMarketCaps(
          network,
          contractAddress,
          timestampInSeconds
        );

        if (tokenData && tokenData.priceAtCall) {
          // Update database with price data
          const { error: updateError } = await supabase
            .from('crypto_calls')
            .update({
              price_at_call: tokenData.priceAtCall,
              current_price: tokenData.currentPrice,
              price_change_percent: tokenData.priceAtCall && tokenData.currentPrice
                ? ((tokenData.currentPrice - tokenData.priceAtCall) / tokenData.priceAtCall) * 100
                : null,
              ath_price: tokenData.ath?.price || null,
              ath_date: tokenData.ath?.timestamp ? new Date(tokenData.ath.timestamp * 1000).toISOString() : null,
              ath_roi: tokenData.priceAtCall && tokenData.ath?.price
                ? ((tokenData.ath.price - tokenData.priceAtCall) / tokenData.priceAtCall) * 100
                : null,
              mcap_at_call: tokenData.marketCapAtCall,
              current_mcap: tokenData.currentMarketCap,
              fdv_at_call: tokenData.fdvAtCall,
              current_fdv: tokenData.currentFDV,
              price_updated_at: new Date().toISOString()
            })
            .eq('krom_id', call.krom_id);

          if (updateError) {
            throw updateError;
          }

          results.push({
            krom_id: call.krom_id,
            ticker: call.ticker,
            status: 'success',
            priceAtCall: tokenData.priceAtCall,
            currentPrice: tokenData.currentPrice,
            roi: tokenData.priceAtCall && tokenData.currentPrice
              ? ((tokenData.currentPrice - tokenData.priceAtCall) / tokenData.priceAtCall) * 100
              : null
          });
          successCount++;
        } else {
          results.push({
            krom_id: call.krom_id,
            ticker: call.ticker,
            status: 'no_data',
            reason: 'No price data available'
          });
        }
      } catch (error) {
        console.error(`Error processing ${call.ticker}:`, error);
        results.push({
          krom_id: call.krom_id,
          ticker: call.ticker,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
      }

      // Delay between calls (except for the last one)
      if (i < calls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CALLS));
      }
    }

    // Get count of remaining calls
    const { count: remainingCount } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('analysis_score', 'is', null)
      .is('price_at_call', null);

    return NextResponse.json({
      message: 'Price fetch completed',
      processed: calls.length,
      success: successCount,
      errors: errorCount,
      skipped: calls.length - successCount - errorCount,
      remaining: remainingCount || 0,
      results
    });

  } catch (error) {
    console.error('Cron price fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}