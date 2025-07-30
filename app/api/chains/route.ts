import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    // Fetch all analyzed calls to extract unique chains
    const { data, error } = await supabase
      .from('crypto_calls')
      .select('raw_data, network')
      .not('analysis_score', 'is', null)
      .or('is_invalidated.is.null,is_invalidated.eq.false');
    
    if (error) {
      console.error('Database fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch chains' }, { status: 500 });
    }

    // Extract unique chains from both network field and raw_data
    const chainsSet = new Set<string>();
    
    data?.forEach(call => {
      // Add from network field
      if (call.network) {
        chainsSet.add(call.network.toLowerCase());
      }
      
      // Add from raw_data
      const network = call.raw_data?.token?.network;
      if (network) {
        chainsSet.add(network.toLowerCase());
      }
    });

    // Convert to sorted array and capitalize first letter
    const chains = Array.from(chainsSet)
      .filter(chain => chain && chain !== 'unknown')
      .sort()
      .map(chain => ({
        value: chain,
        label: chain.charAt(0).toUpperCase() + chain.slice(1)
      }));

    return NextResponse.json({
      success: true,
      chains
    });

  } catch (error) {
    console.error('Error fetching chains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chains', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}