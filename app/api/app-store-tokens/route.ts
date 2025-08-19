import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function generateHeadline(token: any): string {
  const type = token.analysis_token_type || 'Token'
  const network = token.network || 'Crypto'
  
  if (type === 'meme') {
    return `${network.charAt(0).toUpperCase() + network.slice(1)} Meme Token`
  } else if (type === 'utility') {
    // Try to extract category from reasoning
    const reasoning = (token.analysis_reasoning || '').toLowerCase()
    if (reasoning.includes('defi') || reasoning.includes('decentralized finance')) {
      return 'DeFi Protocol'
    } else if (reasoning.includes('gaming') || reasoning.includes('game')) {
      return 'Gaming Platform'
    } else if (reasoning.includes('ai') || reasoning.includes('artificial')) {
      return 'AI Infrastructure'
    } else if (reasoning.includes('layer 2') || reasoning.includes('l2')) {
      return 'Layer 2 Solution'
    } else if (reasoning.includes('cross-chain') || reasoning.includes('bridge')) {
      return 'Cross-Chain Infrastructure'
    } else if (reasoning.includes('nft')) {
      return 'NFT Platform'
    } else if (reasoning.includes('exchange') || reasoning.includes('dex')) {
      return 'Exchange Token'
    }
    return 'Utility Token'
  }
  return 'Crypto Project'
}

function generateDescription(token: any): string {
  const reasoning = token.analysis_reasoning || ''
  const xReasoning = token.x_analysis_reasoning || ''
  const facts = []
  
  // Extract key facts from reasoning
  // Look for celebrity/founder mentions
  const celebrityMatch = reasoning.match(/([A-Z][a-z]+ [A-Z][a-z]+)(?:\s+\([^)]+\))?(?:\s+(?:tweeted|posted|endorsed|mentioned|called))/g)
  if (celebrityMatch) {
    facts.push(celebrityMatch[0])
  }
  
  // Look for investor/backer mentions
  const backerMatch = reasoning.match(/(?:backed by|investors include|funded by)([^.]+)/i)
  if (backerMatch) {
    facts.push('Backed by' + backerMatch[1].trim())
  }
  
  // Look for partnership mentions
  const partnerMatch = reasoning.match(/(?:partnership|partnered with|collaboration with)([^.]+)/i)
  if (partnerMatch) {
    facts.push('Partnership with' + partnerMatch[1].trim())
  }
  
  // Add liquidity if significant
  if (token.liquidity_usd && token.liquidity_usd > 1000000) {
    facts.push(`$${(token.liquidity_usd / 1000000).toFixed(1)}M liquidity`)
  } else if (token.liquidity_usd && token.liquidity_usd > 100000) {
    facts.push(`$${(token.liquidity_usd / 1000).toFixed(0)}K liquidity`)
  }
  
  // Add market cap if significant
  if (token.current_market_cap && token.current_market_cap > 1000000) {
    facts.push(`$${(token.current_market_cap / 1000000).toFixed(1)}M market cap`)
  }
  
  // Add ROI if positive and significant
  if (token.roi_percent && token.roi_percent > 50) {
    facts.push(`+${token.roi_percent.toFixed(0)}% since call`)
  }
  
  // If we don't have enough facts, extract the first sentence from reasoning
  if (facts.length < 2 && reasoning.length > 0) {
    const firstSentence = reasoning.split('.')[0]
    if (firstSentence.length < 150) {
      facts.unshift(firstSentence)
    }
  }
  
  // Join facts with periods, limit to 2-3 facts
  return facts.slice(0, 3).join('. ') + (facts.length > 0 ? '.' : 'New token project on ' + token.network)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '9')
  const sortBy = searchParams.get('sort') || 'mixed' // 'score', 'recent', 'liquidity', 'mixed'
  
  try {
    let query = supabase
      .from('crypto_calls')
      .select('*')
      .not('website_url', 'is', null)
      .neq('website_url', '')
    
    // Apply different sorting strategies
    if (sortBy === 'score') {
      query = query.order('analysis_score', { ascending: false, nullsFirst: false })
    } else if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'liquidity') {
      query = query.order('liquidity_usd', { ascending: false, nullsFirst: false })
    } else {
      // Mixed: Get some high scores, some recent, some with good liquidity
      // This gives a more realistic distribution
      query = query.order('created_at', { ascending: false })
    }
    
    const { data, error } = await query.limit(limit * 2) // Get extra to filter
    
    if (error) {
      console.error('Error fetching tokens:', error)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }
    
    // For mixed sorting, take a variety
    let selectedTokens = data || []
    if (sortBy === 'mixed' && selectedTokens.length > limit) {
      const highScore = selectedTokens.filter(t => (t.analysis_score || 0) >= 7).slice(0, 3)
      const midScore = selectedTokens.filter(t => (t.analysis_score || 0) >= 4 && (t.analysis_score || 0) < 7).slice(0, 3)
      const recent = selectedTokens.filter(t => !highScore.includes(t) && !midScore.includes(t)).slice(0, 3)
      selectedTokens = [...highScore, ...midScore, ...recent].slice(0, limit)
    } else {
      selectedTokens = selectedTokens.slice(0, limit)
    }
    
    // Process tokens to add headlines and descriptions
    const processedTokens = selectedTokens.map(token => ({
      ...token,
      headline: generateHeadline(token),
      description: generateDescription(token),
      displayScore: token.analysis_score || token.x_analysis_score || Math.floor(Math.random() * 3) + 4 // If no score, show 4-6
    }))
    
    // Set CORS headers
    return NextResponse.json(processedTokens, {
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