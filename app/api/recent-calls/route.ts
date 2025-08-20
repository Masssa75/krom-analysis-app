// API endpoint to fetch recent calls
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const page = parseInt(searchParams.get('page') || '1')
    const sortBy = searchParams.get('sortBy') || 'buy_timestamp'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const tokenType = searchParams.get('tokenType') || 'all'
    const networks = searchParams.get('networks')?.split(',').filter(Boolean) || []
    const liquidityMin = searchParams.get('liquidityMin') ? parseFloat(searchParams.get('liquidityMin')!) : undefined
    const liquidityMax = searchParams.get('liquidityMax') ? parseFloat(searchParams.get('liquidityMax')!) : undefined
    const marketCapMin = searchParams.get('marketCapMin') ? parseFloat(searchParams.get('marketCapMin')!) : undefined
    const marketCapMax = searchParams.get('marketCapMax') ? parseFloat(searchParams.get('marketCapMax')!) : undefined
    const excludeRugs = searchParams.get('excludeRugs') === 'true'
    const excludeImposters = searchParams.get('excludeImposters') === 'true'
    const searchQuery = searchParams.get('search') || ''
    const socialFilters = searchParams.get('socialFilters')?.split(',').filter(Boolean) || []
    const minCallScore = searchParams.get('minCallScore') ? parseFloat(searchParams.get('minCallScore')!) : undefined
    const minXScore = searchParams.get('minXScore') ? parseFloat(searchParams.get('minXScore')!) : undefined
    const minWebsiteScore = searchParams.get('minWebsiteScore') ? parseFloat(searchParams.get('minWebsiteScore')!) : undefined
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Calculate actual offset from page if provided
    const actualOffset = page > 1 ? (page - 1) * limit : offset
    
    // Map 'created_at' to 'buy_timestamp' for consistency
    let actualSortBy = sortBy
    if (sortBy === 'created_at') {
      actualSortBy = 'buy_timestamp'
    }
    
    // For ATH ROI sorting, we should only show tokens that have ATH ROI data
    const isAthRoiSort = actualSortBy === 'ath_roi_percent'
    const isRoiSort = actualSortBy === 'roi_percent'
    const isWebsiteScoreSort = actualSortBy === 'website_score'
    
    // First get the total count
    let countQuery = supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .or('is_invalidated.is.null,is_invalidated.eq.false')
    
    // Apply search filter
    if (searchQuery) {
      // Search by ticker (case-insensitive) or contract address
      countQuery = countQuery.or(`ticker.ilike.%${searchQuery}%,contract_address.ilike.%${searchQuery}%`)
    }
    
    // Apply networks filter
    if (networks.length > 0) {
      countQuery = countQuery.in('network', networks)
    }
    
    // Apply liquidity filters
    if (liquidityMin !== undefined) {
      countQuery = countQuery.gte('liquidity_usd', liquidityMin)
    }
    if (liquidityMax !== undefined) {
      countQuery = countQuery.lte('liquidity_usd', liquidityMax)
    }
    
    // Apply market cap filters
    if (marketCapMin !== undefined) {
      countQuery = countQuery.gte('current_market_cap', marketCapMin)
    }
    if (marketCapMax !== undefined) {
      countQuery = countQuery.lte('current_market_cap', marketCapMax)
    }
    
    // Apply token type filter
    if (tokenType !== 'all') {
      if (tokenType === 'utility') {
        // Priority logic: Website analysis overrides all, otherwise ANY utility classification counts
        // 1. If website_token_type exists and is utility, show it
        // 2. If website_token_type exists and is meme, hide it
        // 3. If no website_token_type, show if ANY other analysis says utility
        countQuery = countQuery.or(
          'website_token_type.eq.utility,' +
          'and(website_token_type.is.null,or(analysis_token_type.eq.utility,x_analysis_token_type.eq.utility))'
        )
      } else if (tokenType === 'meme') {
        // Priority logic: Website analysis overrides all, otherwise ANY meme classification counts
        // 1. If website_token_type exists and is meme, show it
        // 2. If website_token_type exists and is utility, hide it
        // 3. If no website_token_type, show if ANY other analysis says meme
        countQuery = countQuery.or(
          'website_token_type.eq.meme,' +
          'and(website_token_type.is.null,or(analysis_token_type.eq.meme,x_analysis_token_type.eq.meme))'
        )
      }
    }
    
    // Apply rugs filter
    if (excludeRugs) {
      // Exclude tokens that meet ALL these conditions:
      // - ATH ROI < 20% (or null)
      // - Current ROI < -75% (or null)
      // - Both liquidity AND market cap < $50K (or null)
      countQuery = countQuery.or(
        'ath_roi_percent.gte.20,' +
        'roi_percent.gte.-75,' +
        'liquidity_usd.gte.50000,' +
        'current_market_cap.gte.50000'
      )
    }
    
    // Apply imposters filter
    if (excludeImposters) {
      countQuery = countQuery.or('is_imposter.eq.false,is_imposter.is.null')
    }
    
    // Apply social media filters
    if (socialFilters.length > 0 && socialFilters.length < 3) {
      // If not all 3 are selected, filter by the selected ones
      const conditions: string[] = []
      if (socialFilters.includes('website')) {
        conditions.push('website_url.not.is.null')
      }
      if (socialFilters.includes('twitter')) {
        conditions.push('twitter_url.not.is.null')
      }
      if (socialFilters.includes('telegram')) {
        conditions.push('telegram_url.not.is.null')
      }
      if (conditions.length > 0) {
        countQuery = countQuery.or(conditions.join(','))
      }
    }
    // If all 3 are selected or none selected, don't filter (show all)
    
    // Apply score filters
    if (minCallScore !== undefined && minCallScore > 1) {
      countQuery = countQuery.gte('analysis_score', minCallScore)
    }
    if (minXScore !== undefined && minXScore > 1) {
      countQuery = countQuery.gte('x_analysis_score', minXScore)
    }
    if (minWebsiteScore !== undefined && minWebsiteScore > 1) {
      countQuery = countQuery.gte('website_score', minWebsiteScore)
    }
    
    // Apply same filters for count when sorting by ATH ROI
    if (isAthRoiSort) {
      countQuery = countQuery
        .not('ath_roi_percent', 'is', null)
        .gt('ath_roi_percent', 0)
    } else if (isRoiSort) {
      countQuery = countQuery
        .not('roi_percent', 'is', null)
    } else if (isWebsiteScoreSort) {
      countQuery = countQuery
        .not('website_score', 'is', null)
    }
    
    const { count: totalCount, error: countError } = await countQuery
    
    if (countError) {
      console.error('Error fetching count:', countError)
      return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 })
    }
    
    // Build the query
    let query = supabase
      .from('crypto_calls')
      .select(`
        id,
        ticker,
        network,
        contract_address,
        buy_timestamp,
        price_at_call,
        ath_price,
        ath_roi_percent,
        ath_market_cap,
        current_price,
        roi_percent,
        analysis_score,
        analysis_tier,
        analysis_reasoning,
        x_analysis_score,
        x_analysis_tier,
        x_analysis_reasoning,
        x_best_tweet,
        analysis_token_type,
        x_analysis_token_type,
        website_score,
        website_tier,
        website_token_type,
        website_analysis_reasoning,
        website_analysis_full,
        market_cap_at_call,
        current_market_cap,
        pool_address,
        volume_24h,
        liquidity_usd,
        source,
        raw_data,
        is_imposter
      `)
      .or('is_invalidated.is.null,is_invalidated.eq.false')
    
    // Apply search filter
    if (searchQuery) {
      // Search by ticker (case-insensitive) or contract address
      query = query.or(`ticker.ilike.%${searchQuery}%,contract_address.ilike.%${searchQuery}%`)
    }
    
    // Apply networks filter
    if (networks.length > 0) {
      query = query.in('network', networks)
    }
    
    // Apply liquidity filters
    if (liquidityMin !== undefined) {
      query = query.gte('liquidity_usd', liquidityMin)
    }
    if (liquidityMax !== undefined) {
      query = query.lte('liquidity_usd', liquidityMax)
    }
    
    // Apply market cap filters
    if (marketCapMin !== undefined) {
      query = query.gte('current_market_cap', marketCapMin)
    }
    if (marketCapMax !== undefined) {
      query = query.lte('current_market_cap', marketCapMax)
    }
    
    // Apply token type filter
    if (tokenType !== 'all') {
      if (tokenType === 'utility') {
        // Priority logic: Website analysis overrides all, otherwise ANY utility classification counts
        // 1. If website_token_type exists and is utility, show it
        // 2. If website_token_type exists and is meme, hide it
        // 3. If no website_token_type, show if ANY other analysis says utility
        query = query.or(
          'website_token_type.eq.utility,' +
          'and(website_token_type.is.null,or(analysis_token_type.eq.utility,x_analysis_token_type.eq.utility))'
        )
      } else if (tokenType === 'meme') {
        // Priority logic: Website analysis overrides all, otherwise ANY meme classification counts
        // 1. If website_token_type exists and is meme, show it
        // 2. If website_token_type exists and is utility, hide it
        // 3. If no website_token_type, show if ANY other analysis says meme
        query = query.or(
          'website_token_type.eq.meme,' +
          'and(website_token_type.is.null,or(analysis_token_type.eq.meme,x_analysis_token_type.eq.meme))'
        )
      }
    }
    
    // Apply rugs filter
    if (excludeRugs) {
      // Exclude tokens that meet ALL these conditions:
      // - ATH ROI < 20% (or null)
      // - Current ROI < -75% (or null) 
      // - Both liquidity AND market cap < $50K (or null)
      query = query.or(
        'ath_roi_percent.gte.20,' +
        'roi_percent.gte.-75,' +
        'liquidity_usd.gte.50000,' +
        'current_market_cap.gte.50000'
      )
    }
    
    // Apply imposters filter
    if (excludeImposters) {
      query = query.or('is_imposter.eq.false,is_imposter.is.null')
    }
    
    // Apply social media filters
    if (socialFilters.length > 0 && socialFilters.length < 3) {
      // If not all 3 are selected, filter by the selected ones
      const conditions: string[] = []
      if (socialFilters.includes('website')) {
        conditions.push('website_url.not.is.null')
      }
      if (socialFilters.includes('twitter')) {
        conditions.push('twitter_url.not.is.null')
      }
      if (socialFilters.includes('telegram')) {
        conditions.push('telegram_url.not.is.null')
      }
      if (conditions.length > 0) {
        query = query.or(conditions.join(','))
      }
    }
    // If all 3 are selected or none selected, don't filter (show all)
    
    // Apply score filters
    if (minCallScore !== undefined && minCallScore > 1) {
      query = query.gte('analysis_score', minCallScore)
    }
    if (minXScore !== undefined && minXScore > 1) {
      query = query.gte('x_analysis_score', minXScore)
    }
    if (minWebsiteScore !== undefined && minWebsiteScore > 1) {
      query = query.gte('website_score', minWebsiteScore)
    }
    
    // When sorting by ATH ROI, only include tokens with ATH ROI > 0
    if (isAthRoiSort) {
      query = query
        .not('ath_roi_percent', 'is', null)
        .gt('ath_roi_percent', 0)
        .order('ath_roi_percent', { ascending: sortOrder === 'asc' })
        .range(actualOffset, actualOffset + limit - 1)
    } else if (isRoiSort) {
      query = query
        .not('roi_percent', 'is', null)
        .order('roi_percent', { ascending: sortOrder === 'asc' })
        .range(actualOffset, actualOffset + limit - 1)
    } else if (isWebsiteScoreSort) {
      // For website_score, exclude NULL values to put them at the end
      query = query
        .not('website_score', 'is', null)
        .order('website_score', { ascending: sortOrder === 'asc' })
        .range(actualOffset, actualOffset + limit - 1)
    } else {
      query = query
        .order(actualSortBy, { ascending: sortOrder === 'asc' })
        .range(actualOffset, actualOffset + limit - 1)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching recent calls:', error)
      return NextResponse.json({ error: 'Failed to fetch recent calls' }, { status: 500 })
    }
    
    // Extract group name from raw_data
    const callsWithGroups = (data || []).map(call => {
      let groupName = 'Unknown Group'
      if (call.raw_data && typeof call.raw_data === 'object') {
        groupName = call.raw_data.groupName || call.raw_data.group || call.raw_data.group_username || 'Unknown Group'
      }
      
      return {
        ...call,
        group_name: groupName
      }
    })
    
    const totalPages = Math.ceil((totalCount || 0) / limit)
    
    return NextResponse.json({ 
      data: callsWithGroups,
      totalCount: totalCount || 0,
      totalPages,
      currentPage: page,
      limit
    })
  } catch (error) {
    console.error('Error in recent-calls API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}