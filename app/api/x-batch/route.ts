import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Prompt for batch X analysis using existing tweets
const X_BATCH_ANALYSIS_PROMPT = `You are an expert crypto analyst evaluating Twitter/X social media data about cryptocurrency tokens.

IMPORTANT: You are analyzing historical tweets that were captured at the time of the original call. These tweets provide social context about the token.

Analyze the provided tweets and score the token's social media presence from 1-10 based on:

SCORING CRITERIA:
- Community engagement quality and authenticity
- Team/developer transparency and activity  
- Legitimate partnerships or endorsements
- Technical discussions and development updates
- Warning signs (bot activity, pump rhetoric, fake hype)
- Overall community sentiment and growth potential

SCORE GUIDE:
1-3: TRASH - Obvious scam, heavy bot activity, pump and dump rhetoric, no real community
4-5: BASIC - Limited genuine activity, some red flags, unclear value proposition
6-7: SOLID - Good community engagement, active development, some positive signals
8-10: ALPHA - Exceptional community, verified partnerships, strong development activity

For each token, provide:
1. Score (1-10)
2. Token Type: "meme", "utility", or "hybrid" based on social media presence
3. Legitimacy Factor: "Low", "Medium", or "High"
4. Best Tweet: The single most informative/relevant tweet (copy exact text)
5. Key Observations: 2-3 bullet points about what you found (max 20 words each)
6. Reasoning: Brief explanation of your score (2-3 sentences)

TOKEN TYPE CLASSIFICATION:
- Meme: Community-driven, humor/viral focus, price speculation, moon/rocket talk, animal themes
- Utility: Technical discussions, real use cases, development updates, partnerships, solving problems
- Hybrid: Shows both meme culture AND actual utility/development

Remember: Focus on the quality of engagement and legitimate development activity, not just volume of tweets.`

interface CallToAnalyze {
  krom_id: string
  ticker: string
  x_raw_tweets: any[]
  buy_timestamp: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { limit = 10, model = 'claude-3-haiku-20240307' } = await request.json()
    
    // Generate batch ID
    const batchId = crypto.randomUUID()
    const batchTimestamp = new Date().toISOString()
    
    console.log(`Starting X batch analysis: ${batchId}, limit: ${limit}`)
    
    // Fetch calls with raw tweets that need new X analysis
    // Order by oldest first to ensure systematic analysis
    const { data: callsToAnalyze, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('krom_id, ticker, x_raw_tweets, buy_timestamp, raw_data')
      .not('x_raw_tweets', 'is', null)
      .is('x_analysis_score', null)  // Only get calls without new scoring
      .order('created_at', { ascending: true })
      .limit(limit)
    
    if (fetchError) {
      console.error('Error fetching calls:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch calls for analysis' 
      }, { status: 500 })
    }
    
    if (!callsToAnalyze || callsToAnalyze.length === 0) {
      return NextResponse.json({
        message: 'No calls found that need X analysis',
        analyzed: 0
      })
    }
    
    console.log(`Found ${callsToAnalyze.length} calls to analyze`)
    
    // Analyze each call's tweets
    const results = []
    const errors = []
    
    for (const call of callsToAnalyze) {
      const callStartTime = Date.now()
      
      try {
        // Handle empty tweet arrays - still analyze but with appropriate score
        if (!call.x_raw_tweets || call.x_raw_tweets.length === 0) {
          console.log(`No tweets for ${call.ticker}, giving minimum score`)
          
          // Give minimum score for tokens with no tweet data
          const duration = Date.now() - callStartTime
          
          const { error: updateError } = await supabase
            .from('crypto_calls')
            .update({
              x_analysis_score: 1,
              x_analysis_tier: 'TRASH',
              x_analysis_token_type: 'meme',
              x_legitimacy_factor: 'Low',
              x_analysis_model: model,
              x_best_tweet: null,
              x_analysis_reasoning: 'No tweets found for this token - indicates zero social media presence or community engagement.',
              x_analysis_batch_id: batchId,
              x_analysis_batch_timestamp: batchTimestamp,
              x_analysis_duration_ms: duration,
              x_analysis_prompt_used: 'X_BATCH_ANALYSIS_V1',
              x_reanalyzed_at: new Date().toISOString()
            })
            .eq('krom_id', call.krom_id)
          
          if (updateError) {
            console.error(`Error updating ${call.ticker}:`, updateError)
            errors.push({
              krom_id: call.krom_id,
              ticker: call.ticker,
              error: updateError.message
            })
          } else {
            results.push({
              krom_id: call.krom_id,
              ticker: call.ticker,
              score: 1,
              tier: 'TRASH',
              legitimacy_factor: 'Low',
              tweet_count: 0,
              duration_ms: duration
            })
          }
          
          continue
        }
        
        // Prepare tweet content for analysis
        const tweetTexts = call.x_raw_tweets
          .filter((t: any) => t.text)
          .map((t: any, i: number) => `Tweet ${i + 1}: ${t.text}`)
          .join('\n')
        
        if (!tweetTexts) {
          console.log(`No valid tweet text for ${call.ticker}, skipping`)
          continue
        }
        
        // Call Claude for analysis
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 800,
            temperature: 0,
            system: X_BATCH_ANALYSIS_PROMPT,
            messages: [
              {
                role: 'user',
                content: `Analyze these tweets about ${call.ticker} token (captured at ${call.raw_data?.timestamp ? new Date(call.raw_data.timestamp * 1000).toISOString() : 'unknown time'}):\n\n${tweetTexts}`
              }
            ]
          })
        })
        
        if (!anthropicResponse.ok) {
          throw new Error(`Claude API error: ${anthropicResponse.status}`)
        }
        
        const anthropicResult = await anthropicResponse.json()
        const analysisText = anthropicResult.content[0].text
        
        // Parse the response
        const scoreMatch = analysisText.match(/score[:\s]+(\d+)/i)
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 1
        
        const tokenTypeMatch = analysisText.match(/token\s*type[:\s]+(meme|utility|hybrid)/i)
        const tokenType = tokenTypeMatch ? tokenTypeMatch[1].toLowerCase() : 'meme'
        
        const legitimacyMatch = analysisText.match(/legitimacy\s*factor[:\s]+(low|medium|high)/i)
        const legitimacyFactor = legitimacyMatch ? legitimacyMatch[1].charAt(0).toUpperCase() + legitimacyMatch[1].slice(1) : 'Low'
        
        // Extract best tweet
        const bestTweetMatch = analysisText.match(/best\s*tweet[:\s]*(.+?)(?=\n|key\s*observations|$)/i)
        const bestTweet = bestTweetMatch ? bestTweetMatch[1].trim() : null
        
        // Extract reasoning
        const reasoningMatch = analysisText.match(/reasoning[:\s]*(.+?)$/i)
        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : analysisText
        
        // Determine tier based on score
        let tier = 'TRASH'
        if (score >= 8) tier = 'ALPHA'
        else if (score >= 6) tier = 'SOLID'
        else if (score >= 4) tier = 'BASIC'
        
        const duration = Date.now() - callStartTime
        
        // Update database with new X analysis
        const { error: updateError } = await supabase
          .from('crypto_calls')
          .update({
            x_analysis_score: score,
            x_analysis_tier: tier,
            x_analysis_token_type: tokenType,
            x_legitimacy_factor: legitimacyFactor,
            x_analysis_model: model,
            x_best_tweet: bestTweet,
            x_analysis_reasoning: reasoning,
            x_analysis_batch_id: batchId,
            x_analysis_batch_timestamp: batchTimestamp,
            x_analysis_duration_ms: duration,
            x_analysis_prompt_used: 'X_BATCH_ANALYSIS_V1',
            x_reanalyzed_at: new Date().toISOString()
          })
          .eq('krom_id', call.krom_id)
        
        if (updateError) {
          throw updateError
        }
        
        results.push({
          krom_id: call.krom_id,
          ticker: call.ticker,
          score,
          tier,
          legitimacy_factor: legitimacyFactor,
          tweet_count: call.x_raw_tweets.length,
          duration_ms: duration
        })
        
        console.log(`Analyzed ${call.ticker}: Score ${score}/10 (${tier}) in ${duration}ms`)
        
      } catch (error) {
        console.error(`Error analyzing ${call.ticker}:`, error)
        errors.push({
          krom_id: call.krom_id,
          ticker: call.ticker,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    const totalDuration = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      batch_id: batchId,
      analyzed: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      total_duration_ms: totalDuration,
      model_used: model
    })
    
  } catch (error) {
    console.error('Batch X analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}