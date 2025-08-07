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
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Calculate actual offset from page if provided
    const actualOffset = page > 1 ? (page - 1) * limit : offset
    
    // Map 'created_at' to 'buy_timestamp' for consistency
    let actualSortBy = sortBy
    if (sortBy === 'created_at') {
      actualSortBy = 'buy_timestamp'
    }
    
    // First get the total count
    const { count: totalCount, error: countError } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .or('is_invalidated.is.null,is_invalidated.eq.false')
    
    if (countError) {
      console.error('Error fetching count:', countError)
      return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 })
    }
    
    // For certain sorts (ATH ROI, ROI %), we need to fetch all data first
    // because many entries have null values and we want non-null values first
    const needsAllData = ['ath_roi_percent', 'roi_percent'].includes(actualSortBy)
    
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
        market_cap_at_call,
        current_market_cap,
        pool_address,
        volume_24h,
        liquidity_usd,
        source,
        raw_data
      `)
      .or('is_invalidated.is.null,is_invalidated.eq.false')
    
    // Apply ordering
    if (needsAllData) {
      // For ATH ROI and ROI sorting, fetch all and sort/paginate in memory
      query = query.order('buy_timestamp', { ascending: false })
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
    let callsWithGroups = (data || []).map(call => {
      let groupName = 'Unknown Group'
      if (call.raw_data && typeof call.raw_data === 'object') {
        groupName = call.raw_data.groupName || call.raw_data.group || call.raw_data.group_username || 'Unknown Group'
      }
      
      return {
        ...call,
        group_name: groupName
      }
    })
    
    // If we fetched all data for sorting, now sort and paginate
    if (needsAllData) {
      // Log some data stats for debugging
      const withAthRoi = callsWithGroups.filter((c: any) => c.ath_roi_percent !== null && c.ath_roi_percent !== undefined).length
      const withPriceAtCall = callsWithGroups.filter((c: any) => c.price_at_call !== null && c.price_at_call !== undefined).length
      const withAthPrice = callsWithGroups.filter((c: any) => c.ath_price !== null && c.ath_price !== undefined).length
      
      console.log(`Data stats: Total=${callsWithGroups.length}, WithAthRoi=${withAthRoi}, WithPriceAtCall=${withPriceAtCall}, WithAthPrice=${withAthPrice}`)
      
      // Sort by the requested field, putting non-null values first
      callsWithGroups.sort((a: any, b: any) => {
        const aVal = a[actualSortBy]
        const bVal = b[actualSortBy]
        
        // Nulls go to the end
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        
        // Sort by value
        if (sortOrder === 'asc') {
          return aVal - bVal
        } else {
          return bVal - aVal
        }
      })
      
      // Now paginate
      callsWithGroups = callsWithGroups.slice(actualOffset, actualOffset + limit)
    }
    
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