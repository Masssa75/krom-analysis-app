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
    
    // First get the total count
    let countQuery = supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .or('is_invalidated.is.null,is_invalidated.eq.false')
    
    // Apply token type filter
    if (tokenType !== 'all') {
      if (tokenType === 'utility') {
        // Show if either analysis says utility
        countQuery = countQuery.or('analysis_token_type.eq.utility,x_analysis_token_type.eq.utility')
      } else if (tokenType === 'meme') {
        // Show only if both analyses say meme (or one is null)
        countQuery = countQuery.or('and(analysis_token_type.eq.meme,x_analysis_token_type.is.null),and(analysis_token_type.is.null,x_analysis_token_type.eq.meme),and(analysis_token_type.eq.meme,x_analysis_token_type.eq.meme)')
      }
    }
    
    // Apply same filters for count when sorting by ATH ROI
    if (isAthRoiSort) {
      countQuery = countQuery
        .not('ath_roi_percent', 'is', null)
        .gt('ath_roi_percent', 0)
    } else if (isRoiSort) {
      countQuery = countQuery
        .not('roi_percent', 'is', null)
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
        market_cap_at_call,
        current_market_cap,
        pool_address,
        volume_24h,
        liquidity_usd,
        source,
        raw_data
      `)
      .or('is_invalidated.is.null,is_invalidated.eq.false')
    
    // Apply token type filter
    if (tokenType !== 'all') {
      if (tokenType === 'utility') {
        // Show if either analysis says utility
        query = query.or('analysis_token_type.eq.utility,x_analysis_token_type.eq.utility')
      } else if (tokenType === 'meme') {
        // Show only if both analyses say meme (or one is null)
        query = query.or('and(analysis_token_type.eq.meme,x_analysis_token_type.is.null),and(analysis_token_type.is.null,x_analysis_token_type.eq.meme),and(analysis_token_type.eq.meme,x_analysis_token_type.eq.meme)')
      }
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