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
    
    // Fetch all three price points in parallel
    const [priceAtCall, athData, currentPrice] = await Promise.all([
      geckoTerminal.getTokenPriceAtTimestamp(tokenNetwork, contractAddress, timestampInSeconds),
      geckoTerminal.getATHSinceTimestamp(tokenNetwork, contractAddress, timestampInSeconds),
      geckoTerminal.getCurrentPrice(tokenNetwork, contractAddress)
    ]);
    
    // Calculate ROI and other metrics
    const roi = priceAtCall && currentPrice 
      ? ((currentPrice - priceAtCall) / priceAtCall) * 100 
      : null;
    
    const athROI = priceAtCall && athData?.price 
      ? ((athData.price - priceAtCall) / priceAtCall) * 100 
      : null;
    
    const drawdownFromATH = athData?.price && currentPrice
      ? ((athData.price - currentPrice) / athData.price) * 100
      : null;
    
    const result = {
      contractAddress,
      network: tokenNetwork,
      priceAtCall,
      currentPrice,
      ath: athData?.price || null,
      athTimestamp: athData?.timestamp || null,
      athDate: athData?.timestamp ? new Date(athData.timestamp * 1000).toISOString() : null,
      roi,
      athROI,
      drawdownFromATH,
      callDate: new Date(timestampInSeconds * 1000).toISOString(),
      fetchedAt: new Date().toISOString()
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