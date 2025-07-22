import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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
    // Get limit from query params, default to 50
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch analyzed calls ordered by most recent analysis
    const { data: calls, error, count } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact' })
      .not('analysis_score', 'is', null)
      .order('buy_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch analyzed calls' }, { status: 500 });
    }

    // Format the results
    const results = calls?.map(call => ({
      krom_id: call.krom_id,
      token: call.ticker || 'Unknown',
      contract: call.raw_data?.token?.ca || null,
      network: call.raw_data?.token?.network || 'unknown',
      score: call.analysis_score,
      legitimacy_factor: call.analysis_legitimacy_factor || 'Unknown',
      analysis_model: call.analysis_model,
      buy_timestamp: call.buy_timestamp,
      analyzed_at: call.analysis_reanalyzed_at || call.analyzed_at || call.created_at,
      // New fields for detailed view
      analysis_reasoning: call.analysis_reasoning,
      analysis_batch_id: call.analysis_batch_id,
      analysis_batch_timestamp: call.analysis_batch_timestamp,
      analysis_prompt_used: call.analysis_prompt_used,
      analysis_duration_ms: call.analysis_duration_ms,
      // Comment indicator
      has_comment: call.user_comment ? true : false
    })) || [];

    return NextResponse.json({
      success: true,
      count: count || 0,
      limit,
      offset,
      results
    });

  } catch (error) {
    console.error('Error fetching analyzed calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyzed calls', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}