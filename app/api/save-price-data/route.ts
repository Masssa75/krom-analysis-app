import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { 
      kromId, 
      priceAtCall,
      currentPrice,
      ath,
      athTimestamp,
      roi,
      athROI,
      network,
      marketCapAtCall,
      currentMarketCap,
      athMarketCap,
      fdvAtCall,
      currentFDV,
      athFDV,
      tokenSupply
    } = await request.json();
    
    if (!kromId) {
      return NextResponse.json({ error: 'kromId is required' }, { status: 400 });
    }
    
    // Update the database with the fetched price data
    const { error } = await supabase
      .from('crypto_calls')
      .update({
        price_at_call: priceAtCall,
        current_price: currentPrice,
        ath_price: ath,
        ath_timestamp: athTimestamp,
        roi_percent: roi,
        ath_roi_percent: athROI,
        price_network: network,
        price_fetched_at: new Date().toISOString(),
        market_cap_at_call: marketCapAtCall,
        current_market_cap: currentMarketCap,
        ath_market_cap: athMarketCap,
        fdv_at_call: fdvAtCall,
        current_fdv: currentFDV,
        ath_fdv: athFDV,
        token_supply: tokenSupply
      })
      .eq('krom_id', kromId);
    
    if (error) {
      console.error('Failed to save price data:', error);
      return NextResponse.json({ error: 'Failed to save price data' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving price data:', error);
    return NextResponse.json(
      { error: 'Failed to save price data' },
      { status: 500 }
    );
  }
}