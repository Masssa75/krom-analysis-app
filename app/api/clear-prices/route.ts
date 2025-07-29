import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { kromIds } = await request.json()
    
    if (!kromIds || !Array.isArray(kromIds) || kromIds.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty kromIds array' }, { status: 400 })
    }
    
    // Clear price data AND timestamps for the specified calls
    const { error } = await supabase
      .from('crypto_calls')
      .update({
        price_at_call: null,
        current_price: null,
        ath_price: null,
        ath_timestamp: null,
        roi_percent: null,
        ath_roi_percent: null,
        price_network: null,
        price_fetched_at: null,    // Already clearing this
        price_updated_at: null,     // IMPORTANT: Also clear this
        market_cap_at_call: null,
        current_market_cap: null,
        ath_market_cap: null,
        fdv_at_call: null,
        current_fdv: null,
        ath_fdv: null,
        token_supply: null
      })
      .in('krom_id', kromIds)
    
    if (error) {
      console.error('Error clearing prices:', error)
      return NextResponse.json({ error: 'Failed to clear prices' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleared prices for ${kromIds.length} calls` 
    })
  } catch (error) {
    console.error('Error in clear-prices route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}