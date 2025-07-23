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
    // Get params from query
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';
    const coinsOfInterest = searchParams.get('coinsOfInterest') === 'true';

    // Build query
    let query = supabase
      .from('crypto_calls')
      .select('*', { count: 'exact' })
      .not('analysis_score', 'is', null);
    
    // Add search filter if provided
    if (search) {
      query = query.ilike('ticker', `%${search}%`);
    }
    
    // Add coins of interest filter if requested
    if (coinsOfInterest) {
      query = query.eq('is_coin_of_interest', true);
    }
    
    // Add ordering and pagination
    // Using created_at for chronological ordering
    const { data: calls, error, count } = await query
      .order('created_at', { ascending: false })
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
      token_type: call.analysis_token_type || 'meme',
      legitimacy_factor: call.analysis_legitimacy_factor || 'Unknown',
      analysis_model: call.analysis_model,
      buy_timestamp: call.buy_timestamp,
      call_timestamp: call.raw_data?.timestamp ? new Date(call.raw_data.timestamp * 1000).toISOString() : null,
      analyzed_at: call.analysis_reanalyzed_at || call.analyzed_at || call.created_at,
      // New fields for detailed view
      analysis_reasoning: call.analysis_reasoning,
      analysis_batch_id: call.analysis_batch_id,
      analysis_batch_timestamp: call.analysis_batch_timestamp,
      analysis_prompt_used: call.analysis_prompt_used,
      analysis_duration_ms: call.analysis_duration_ms,
      // Call message
      call_message: call.raw_data?.text || 'No message available',
      group_name: call.raw_data?.groupName || call.raw_data?.group?.name || 'Unknown',
      // X analysis fields
      x_score: call.x_analysis_score,
      x_tier: call.x_analysis_tier,
      x_token_type: call.x_analysis_token_type,
      x_legitimacy_factor: call.x_legitimacy_factor,
      x_analysis_reasoning: call.x_analysis_reasoning,
      x_analysis_prompt_used: call.x_analysis_prompt_used,
      x_best_tweet: call.x_best_tweet,
      x_analyzed_at: call.x_reanalyzed_at || call.x_analyzed_at,
      x_tweet_count: call.x_raw_tweets ? call.x_raw_tweets.length : 0,
      x_raw_tweets: call.x_raw_tweets || [],
      // Comment indicator
      has_comment: call.user_comment ? true : false,
      // Coin of interest indicator
      is_coin_of_interest: call.is_coin_of_interest || false,
      coin_of_interest_notes: call.coin_of_interest_notes || null,
      // Price data
      price_at_call: call.price_at_call,
      current_price: call.current_price,
      ath_price: call.ath_price,
      ath_timestamp: call.ath_timestamp,
      roi_percent: call.roi_percent,
      ath_roi_percent: call.ath_roi_percent,
      price_network: call.price_network,
      price_fetched_at: call.price_fetched_at,
      // Market cap data
      market_cap_at_call: call.market_cap_at_call,
      current_market_cap: call.current_market_cap,
      ath_market_cap: call.ath_market_cap,
      fdv_at_call: call.fdv_at_call,
      current_fdv: call.current_fdv,
      ath_fdv: call.ath_fdv,
      token_supply: call.token_supply
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