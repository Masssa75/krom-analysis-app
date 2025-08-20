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
    
    // Get filter params
    const minCallScore = searchParams.get('minCallScore') ? parseInt(searchParams.get('minCallScore')!, 10) : null;
    const minXScore = searchParams.get('minXScore') ? parseInt(searchParams.get('minXScore')!, 10) : null;
    const tokenTypes = searchParams.get('tokenTypes') ? searchParams.get('tokenTypes')!.split(',') : [];
    const networks = searchParams.get('networks') ? searchParams.get('networks')!.split(',') : [];
    const groups = searchParams.get('groups') ? searchParams.get('groups')!.split(',') : [];
    const onlyProfitable = searchParams.get('onlyProfitable') === 'true';
    const minROI = searchParams.get('minROI') ? parseFloat(searchParams.get('minROI')!) : null;
    const minAthROI = searchParams.get('minAthROI') ? parseFloat(searchParams.get('minAthROI')!) : null;
    const minCurrentMcap = searchParams.get('minCurrentMcap') ? parseFloat(searchParams.get('minCurrentMcap')!) : null;
    const minBuyMcap = searchParams.get('minBuyMcap') ? parseFloat(searchParams.get('minBuyMcap')!) : null;
    const maxBuyMcap = searchParams.get('maxBuyMcap') ? parseFloat(searchParams.get('maxBuyMcap')!) : null;
    const includeDeadTokens = searchParams.get('includeDeadTokens') === 'true';
    
    // Get sort params - default to analyzed_at so newest analyzed calls appear first
    const sortBy = searchParams.get('sortBy') || 'analyzed_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = supabase
      .from('crypto_calls')
      .select('*', { count: 'exact' })
      .not('analysis_score', 'is', null)
      .or('is_invalidated.is.null,is_invalidated.eq.false'); // Exclude invalidated tokens
    
    // Only exclude dead tokens if includeDeadTokens is false
    if (!includeDeadTokens) {
      query = query.or('is_dead.is.null,is_dead.eq.false');
    }
    
    // Add search filter if provided
    if (search) {
      // Check if search looks like a contract address (starts with 0x and has 42 chars)
      if (search.toLowerCase().startsWith('0x') && search.length === 42) {
        // Case-insensitive match for contract addresses
        query = query.ilike('contract_address', search);
      } else {
        // For other searches, check both ticker and contract address
        query = query.or(`ticker.ilike.%${search}%,contract_address.ilike.%${search}%`);
      }
    }
    
    // Add coins of interest filter if requested
    if (coinsOfInterest) {
      query = query.eq('is_coin_of_interest', true);
    }
    
    // Add score filters
    if (minCallScore && minCallScore > 1) {
      query = query.gte('analysis_score', minCallScore);
    }
    if (minXScore && minXScore > 1) {
      query = query.gte('x_analysis_score', minXScore);
    }
    
    // Add token type filter
    if (tokenTypes.length > 0) {
      query = query.in('analysis_token_type', tokenTypes);
    }
    
    // Add network filter
    if (networks.length > 0) {
      // Map filter values to actual network names in database
      const networkMap: { [key: string]: string[] } = {
        'ethereum': ['ethereum', 'eth', 'ETH'],
        'solana': ['solana', 'sol', 'SOL']
      };
      
      const actualNetworks = networks.flatMap(n => networkMap[n] || [n]);
      // Use proper JSONB filtering syntax
      const networkConditions = actualNetworks.map(n => `raw_data->token->>network.ilike.%${n}%`).join(',');
      query = query.or(networkConditions);
    }
    
    // Add groups filter
    if (groups.length > 0) {
      // Filter by group names in raw_data
      const groupConditions = groups.map(g => 
        `raw_data->>groupName.eq.${g},raw_data->group->>name.eq.${g}`
      ).join(',');
      query = query.or(groupConditions);
    }
    
    // Add ROI filters
    if (onlyProfitable) {
      query = query.gt('roi_percent', 0);
    }
    if (minROI !== null) {
      query = query.gte('roi_percent', minROI);
    }
    if (minAthROI !== null) {
      query = query.gte('ath_roi_percent', minAthROI);
    }
    
    // Add market cap filters
    if (minCurrentMcap !== null) {
      query = query.gte('current_market_cap', minCurrentMcap);
    }
    if (minBuyMcap !== null) {
      query = query.gte('market_cap_at_call', minBuyMcap);
    }
    if (maxBuyMcap !== null) {
      query = query.lte('market_cap_at_call', maxBuyMcap);
    }
    
    // Handle special sorting cases
    let orderedQuery = query;
    
    if (sortBy === 'quality') {
      // For quality sorting, we need to calculate a composite score
      // Get all data first, then sort in JavaScript since it's a computed field
      const { data: allCalls, error: fetchError, count } = await query;
      
      if (fetchError) {
        console.error('Database fetch error:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch analyzed calls' }, { status: 500 });
      }
      
      // Calculate quality score for each call
      const callsWithQuality = allCalls?.map(call => {
        const callScore = call.analysis_score || 0;
        const xScore = call.x_analysis_score || 0;
        const athRoi = call.ath_roi_percent || 0;
        const currentRoi = call.roi_percent || 0;
        
        // Quality score formula: 
        // - Call analysis (0-10): 40% weight
        // - X analysis (0-10): 30% weight  
        // - Performance bonus: 30% weight (based on ROI performance)
        let performanceScore = 0;
        if (athRoi > 1000) performanceScore = 10;
        else if (athRoi > 500) performanceScore = 8;
        else if (athRoi > 200) performanceScore = 6;
        else if (athRoi > 100) performanceScore = 4;
        else if (athRoi > 50) performanceScore = 2;
        else if (athRoi > 0) performanceScore = 1;
        
        const qualityScore = (callScore * 0.4) + (xScore * 0.3) + (performanceScore * 0.3);
        
        return {
          ...call,
          quality_score: qualityScore
        };
      }) || [];
      
      // Sort by quality score
      callsWithQuality.sort((a, b) => {
        return sortOrder === 'asc' 
          ? a.quality_score - b.quality_score
          : b.quality_score - a.quality_score;
      });
      
      // Apply pagination
      const calls = callsWithQuality.slice(offset, offset + limit);
      
      // Format results (same as below)
      const results = calls.map(call => ({
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
        analysis_reasoning: call.analysis_reasoning,
        analysis_batch_id: call.analysis_batch_id,
        analysis_batch_timestamp: call.analysis_batch_timestamp,
        analysis_prompt_used: call.analysis_prompt_used,
        analysis_duration_ms: call.analysis_duration_ms,
        call_message: call.raw_data?.text || 'No message available',
        group_name: call.source === 'gecko_trending' ? 'Trending' : (call.raw_data?.groupName || call.raw_data?.group?.name || 'Unknown'),
        x_score: call.x_analysis_score,
        x_tier: call.x_analysis_tier,
        x_token_type: call.x_analysis_token_type,
        x_legitimacy_factor: call.x_legitimacy_factor,
        x_analysis_model: call.x_analysis_model,
        x_analysis_reasoning: call.x_analysis_reasoning,
        x_analysis_prompt_used: call.x_analysis_prompt_used,
        x_best_tweet: call.x_best_tweet,
        x_analyzed_at: call.x_reanalyzed_at || call.x_analyzed_at,
        x_tweet_count: call.x_raw_tweets ? call.x_raw_tweets.length : 0,
        x_raw_tweets: call.x_raw_tweets || [],
        has_comment: call.user_comment ? true : false,
        is_coin_of_interest: call.is_coin_of_interest || false,
        coin_of_interest_notes: call.coin_of_interest_notes || null,
        price_at_call: call.price_at_call,
        current_price: call.current_price,
        price_updated_at: call.price_updated_at,
        ath_price: call.ath_price,
        ath_timestamp: call.ath_timestamp,
        roi_percent: call.roi_percent,
        ath_roi_percent: call.ath_roi_percent,
        price_network: call.price_network,
        price_fetched_at: call.price_fetched_at,
        market_cap_at_call: call.market_cap_at_call,
        current_market_cap: call.current_market_cap,
        ath_market_cap: call.ath_market_cap,
        fdv_at_call: call.fdv_at_call,
        current_fdv: call.current_fdv,
        ath_fdv: call.ath_fdv,
        token_supply: call.token_supply,
        is_invalidated: call.is_invalidated || false,
        is_dead: call.is_dead || false,
        raw_data: call.raw_data,
        quality_score: call.quality_score, // Include quality score in response
        volume_24h: call.volume_24h,
        txns_24h: call.txns_24h,
        last_volume_check: call.last_volume_check,
        liquidity_usd: call.liquidity_usd,
        price_change_24h: call.price_change_24h,
        // Security fields
        liquidity_locked: call.liquidity_locked,
        liquidity_lock_percent: call.liquidity_lock_percent,
        ownership_renounced: call.ownership_renounced,
        security_score: call.security_score,
        security_warnings: call.security_warnings,
        security_checked_at: call.security_checked_at,
        security_raw_data: call.security_raw_data
      }));

      // Calculate ATH ROI average
      const validAthRois = results
        .filter(r => r.ath_roi_percent !== null && r.ath_roi_percent !== undefined)
        .map(r => r.ath_roi_percent);
      
      const athRoiAverage = validAthRois.length > 0 
        ? validAthRois.reduce((sum: number, roi: number) => sum + roi, 0) / validAthRois.length
        : null;

      return NextResponse.json({
        success: true,
        count: count || 0,
        limit,
        offset,
        results,
        athRoiAverage
      });
    } else {
      // Standard database sorting
      // For ROI sorting, we need to handle NULL values specially
      let finalQuery = orderedQuery;
      
      if (sortBy === 'roi_percent' || sortBy === 'ath_roi_percent' || sortBy === 'volume_24h' || sortBy === 'liquidity_usd' || sortBy === 'price_change_24h') {
        // When sorting by ROI, volume, liquidity, or price change, exclude NULL values to avoid them appearing first
        finalQuery = finalQuery.not(sortBy, 'is', null);
      }
      
      const { data: calls, error, count } = await finalQuery
        .order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Database fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch analyzed calls' }, { status: 500 });
      }

      // Format the results (existing code)
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
        analysis_reasoning: call.analysis_reasoning,
        analysis_batch_id: call.analysis_batch_id,
        analysis_batch_timestamp: call.analysis_batch_timestamp,
        analysis_prompt_used: call.analysis_prompt_used,
        analysis_duration_ms: call.analysis_duration_ms,
        call_message: call.raw_data?.text || 'No message available',
        group_name: call.source === 'gecko_trending' ? 'Trending' : (call.raw_data?.groupName || call.raw_data?.group?.name || 'Unknown'),
        x_score: call.x_analysis_score,
        x_tier: call.x_analysis_tier,
        x_token_type: call.x_analysis_token_type,
        x_legitimacy_factor: call.x_legitimacy_factor,
        x_analysis_model: call.x_analysis_model,
        x_analysis_reasoning: call.x_analysis_reasoning,
        x_analysis_prompt_used: call.x_analysis_prompt_used,
        x_best_tweet: call.x_best_tweet,
        x_analyzed_at: call.x_reanalyzed_at || call.x_analyzed_at,
        x_tweet_count: call.x_raw_tweets ? call.x_raw_tweets.length : 0,
        x_raw_tweets: call.x_raw_tweets || [],
        has_comment: call.user_comment ? true : false,
        is_coin_of_interest: call.is_coin_of_interest || false,
        coin_of_interest_notes: call.coin_of_interest_notes || null,
        price_at_call: call.price_at_call,
        current_price: call.current_price,
        price_updated_at: call.price_updated_at,
        ath_price: call.ath_price,
        ath_timestamp: call.ath_timestamp,
        roi_percent: call.roi_percent,
        ath_roi_percent: call.ath_roi_percent,
        price_network: call.price_network,
        price_fetched_at: call.price_fetched_at,
        market_cap_at_call: call.market_cap_at_call,
        current_market_cap: call.current_market_cap,
        ath_market_cap: call.ath_market_cap,
        fdv_at_call: call.fdv_at_call,
        current_fdv: call.current_fdv,
        ath_fdv: call.ath_fdv,
        token_supply: call.token_supply,
        is_invalidated: call.is_invalidated || false,
        is_dead: call.is_dead || false,
        raw_data: call.raw_data,
        volume_24h: call.volume_24h,
        txns_24h: call.txns_24h,
        last_volume_check: call.last_volume_check,
        liquidity_usd: call.liquidity_usd,
        price_change_24h: call.price_change_24h
      })) || [];

      // Calculate ATH ROI average
      const validAthRois = results
        .filter(r => r.ath_roi_percent !== null && r.ath_roi_percent !== undefined)
        .map(r => r.ath_roi_percent);
      
      const athRoiAverage = validAthRois.length > 0 
        ? validAthRois.reduce((sum, roi) => sum + roi, 0) / validAthRois.length
        : null;

      return NextResponse.json({
        success: true,
        count: count || 0,
        limit,
        offset,
        results,
        athRoiAverage
      });
    }

  } catch (error) {
    console.error('Error fetching analyzed calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyzed calls', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}