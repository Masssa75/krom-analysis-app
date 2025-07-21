import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
) {
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
    const params = await context.params;
    const { batchId } = params;

    // Fetch all calls from the same batch
    const { data: calls, error } = await supabase
      .from('crypto_calls')
      .select('*')
      .eq('analysis_batch_id', batchId)
      .order('analysis_score', { ascending: false });

    if (error) {
      console.error('Database fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch batch calls' }, { status: 500 });
    }

    // Format the results
    const results = calls?.map(call => ({
      krom_id: call.krom_id,
      token: call.ticker || 'Unknown',
      contract: call.raw_data?.token?.ca || null,
      network: call.raw_data?.token?.network || 'unknown',
      score: call.analysis_score,
      legitimacy_factor: call.analysis_legitimacy_factor || 'Unknown',
      tier: call.analysis_score >= 8 ? 'ALPHA' : 
            call.analysis_score >= 6 ? 'SOLID' : 
            call.analysis_score >= 4 ? 'BASIC' : 'TRASH'
    })) || [];

    return NextResponse.json({
      success: true,
      batchId,
      timestamp: calls?.[0]?.analysis_batch_timestamp,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('Error fetching batch calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch calls', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}