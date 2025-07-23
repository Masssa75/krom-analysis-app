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
    const { contractAddress, callTimestamp, network } = await request.json();
    
    if (!contractAddress) {
      return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
    }
    
    // Determine network if not provided
    const tokenNetwork = network || GeckoTerminalAPI.guessNetwork(contractAddress);
    
    // Convert timestamp to seconds if it's in milliseconds
    const timestampInSeconds = callTimestamp > 1000000000000 
      ? Math.floor(callTimestamp / 1000) 
      : callTimestamp;
    
    console.log('Fetching price data for:', {
      contractAddress,
      network: tokenNetwork,
      callTimestamp: new Date(timestampInSeconds * 1000).toISOString()
    });
    
    // Fetch comprehensive token data with market caps
    const tokenData = await geckoTerminal.getTokenDataWithMarketCaps(
      tokenNetwork,
      contractAddress,
      timestampInSeconds
    );
    
    // Calculate ROI and other metrics
    const roi = tokenData.priceAtCall && tokenData.currentPrice 
      ? ((tokenData.currentPrice - tokenData.priceAtCall) / tokenData.priceAtCall) * 100 
      : null;
    
    const athROI = tokenData.priceAtCall && tokenData.ath?.price 
      ? ((tokenData.ath.price - tokenData.priceAtCall) / tokenData.priceAtCall) * 100 
      : null;
    
    const drawdownFromATH = tokenData.ath?.price && tokenData.currentPrice
      ? ((tokenData.ath.price - tokenData.currentPrice) / tokenData.ath.price) * 100
      : null;
    
    const result = {
      contractAddress,
      network: tokenNetwork,
      priceAtCall: tokenData.priceAtCall,
      currentPrice: tokenData.currentPrice,
      ath: tokenData.ath?.price || null,
      athTimestamp: tokenData.ath?.timestamp || null,
      athDate: tokenData.ath?.timestamp ? new Date(tokenData.ath.timestamp * 1000).toISOString() : null,
      roi,
      athROI,
      drawdownFromATH,
      callDate: new Date(timestampInSeconds * 1000).toISOString(),
      fetchedAt: new Date().toISOString(),
      // Market cap data
      marketCapAtCall: tokenData.marketCapAtCall,
      currentMarketCap: tokenData.currentMarketCap,
      athMarketCap: tokenData.athMarketCap,
      fdvAtCall: tokenData.fdvAtCall,
      currentFDV: tokenData.currentFDV,
      athFDV: tokenData.athFDV,
      tokenSupply: tokenData.tokenInfo?.total_supply || null
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching token price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token price data' },
      { status: 500 }
    );
  }
}