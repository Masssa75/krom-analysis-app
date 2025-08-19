import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Fetch analyzed tokens with websites and good scores
    const { data, error } = await supabase
      .from('crypto_calls')
      .select('ticker, network, contract_address, liquidity_usd, current_market_cap, analysis_score, x_analysis_score, roi_percent, ath_roi_percent, analysis_reasoning, x_analysis_reasoning, analysis_token_type, x_analysis_token_type, website_url, twitter_url, created_at')
      .not('website_url', 'is', null)
      .neq('website_url', '')
      .not('analysis_reasoning', 'is', null)
      .gte('analysis_score', 5)  // Only tokens with decent scores
      .order('analysis_score', { ascending: false })
      .limit(9)

    if (error) {
      console.error('Error fetching analyzed tokens:', error)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    // Process the data to extract key points from analysis
    const processedData = data?.map(token => {
      const reasoning = token.analysis_reasoning || token.x_analysis_reasoning || ''
      
      // Extract key points from the analysis
      const bulletPoints = []
      
      // Token type
      const tokenType = token.analysis_token_type || token.x_analysis_token_type || 'Unknown'
      bulletPoints.push(`${tokenType.charAt(0).toUpperCase() + tokenType.slice(1)} token`)
      
      // Extract notable features from reasoning
      if (reasoning.toLowerCase().includes('team')) {
        bulletPoints.push('Active development team')
      }
      if (reasoning.toLowerCase().includes('communit')) {
        bulletPoints.push('Strong community presence')
      }
      if (reasoning.toLowerCase().includes('partner') || reasoning.toLowerCase().includes('investor')) {
        bulletPoints.push('Notable partnerships')
      }
      if (reasoning.toLowerCase().includes('innovative') || reasoning.toLowerCase().includes('unique')) {
        bulletPoints.push('Innovative technology')
      }
      if (reasoning.toLowerCase().includes('launch') && reasoning.toLowerCase().includes('recent')) {
        bulletPoints.push('Recently launched')
      }
      
      // Add performance indicator
      if (token.roi_percent && token.roi_percent > 100) {
        bulletPoints.push(`${token.roi_percent.toFixed(0)}% ROI since call`)
      } else if (token.ath_roi_percent && token.ath_roi_percent > 100) {
        bulletPoints.push(`${token.ath_roi_percent.toFixed(0)}% ATH ROI`)
      }
      
      // Ensure we have at least 3 bullet points
      while (bulletPoints.length < 3) {
        if (token.liquidity_usd && token.liquidity_usd > 100000) {
          bulletPoints.push(`$${(token.liquidity_usd / 1000000).toFixed(1)}M liquidity`)
        } else if (token.current_market_cap && token.current_market_cap > 100000) {
          bulletPoints.push(`$${(token.current_market_cap / 1000000).toFixed(1)}M market cap`)
        } else {
          bulletPoints.push('Early stage project')
        }
      }
      
      return {
        ...token,
        bulletPoints: bulletPoints.slice(0, 4) // Max 4 bullet points
      }
    })

    // Set CORS headers
    return NextResponse.json(processedData || [], {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}