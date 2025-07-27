import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { contractAddress, ticker } = await request.json();
    
    if (!contractAddress && !ticker) {
      return NextResponse.json({ error: 'Contract address or ticker is required' }, { status: 400 });
    }
    
    // Query by contract address if available, otherwise by ticker
    let data, error;
    
    if (contractAddress) {
      // First try contract_address column
      const result = await supabase
        .from('crypto_calls')
        .select(`
          price_at_call,
          current_price,
          ath_price,
          ath_timestamp,
          roi_percent,
          ath_roi_percent,
          market_cap_at_call,
          current_market_cap,
          ath_market_cap,
          fdv_at_call,
          current_fdv,
          ath_fdv,
          price_network,
          price_fetched_at
        `)
        .eq('contract_address', contractAddress)
        .limit(1)
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('crypto_calls')
        .select(`
          price_at_call,
          current_price,
          ath_price,
          ath_timestamp,
          roi_percent,
          ath_roi_percent,
          market_cap_at_call,
          current_market_cap,
          ath_market_cap,
          fdv_at_call,
          current_fdv,
          ath_fdv,
          price_network,
          price_fetched_at
        `)
        .eq('ticker', ticker)
        .limit(1)
        .single();
      
      data = result.data;
      error = result.error;
    }
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ 
        priceData: null,
        message: 'No price data found' 
      });
    }
    
    // Format the response
    const priceData = {
      priceAtCall: data.price_at_call,
      currentPrice: data.current_price,
      ath: data.ath_price,
      athDate: data.ath_timestamp,
      roi: data.roi_percent,
      athROI: data.ath_roi_percent,
      marketCapAtCall: data.market_cap_at_call,
      currentMarketCap: data.current_market_cap,
      athMarketCap: data.ath_market_cap,
      fdvAtCall: data.fdv_at_call,
      currentFdv: data.current_fdv,
      athFdv: data.ath_fdv,
      network: data.price_network,
      lastFetched: data.price_fetched_at
    };
    
    return NextResponse.json({ priceData });
    
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
}