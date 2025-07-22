import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const X_ANALYSIS_PROMPT = `You are an expert crypto analyst reviewing Twitter/X posts about a cryptocurrency token. 
Analyze the provided tweets and score the token's social media presence from 1-10.

SCORING CRITERIA:
- Community engagement and sentiment (positive discussions, genuine interest)
- Team/developer activity and transparency
- Partnership announcements or notable endorsements
- Red flags (bot activity, pump schemes, fake hype)
- Overall legitimacy and long-term potential based on social signals

SCORE GUIDE:
1-3: TRASH - Obvious scam, bot activity, pump scheme, no real community
4-5: BASIC - Limited activity, unclear value, some red flags
6-7: SOLID - Good community, active development, some positive signals
8-10: ALPHA - Strong community, verified partnerships, high-quality engagement

Provide:
1. A score from 1-10
2. Key positive signals (2-3 bullet points, max 15 words each)
3. Red flags or concerns (1-2 bullet points, max 10 words each)
4. Brief overall assessment (1 sentence, max 20 words)

Be direct and factual. Focus on what the tweets reveal about the token's legitimacy and potential.`

export async function POST(request: NextRequest) {
  try {
    const { callId } = await request.json()
    
    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 })
    }

    // Check for ScraperAPI key
    const scraperApiKey = process.env.SCRAPERAPI_KEY
    if (!scraperApiKey) {
      console.error('SCRAPERAPI_KEY not found in environment variables')
      return NextResponse.json({ 
        error: 'X analysis is not configured. Please add SCRAPERAPI_KEY to environment variables.' 
      }, { status: 500 })
    }

    // Fetch the call data
    const { data: call, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('*')
      .eq('krom_id', callId)
      .single()

    if (fetchError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Extract contract address
    const contractAddress = call.raw_data?.token?.ca
    if (!contractAddress) {
      return NextResponse.json({ 
        error: 'No contract address found for this call' 
      }, { status: 400 })
    }

    console.log(`Analyzing X data for ${call.ticker} (${contractAddress})`)

    // Fetch tweets using ScraperAPI + Nitter
    const targetUrl = `https://nitter.net/search?q=${contractAddress}&f=tweets`
    const scraperUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`
    
    const response = await fetch(scraperUrl)
    
    if (!response.ok) {
      console.error(`ScraperAPI error: ${response.status}`)
      return NextResponse.json({ 
        error: `Failed to fetch X data: ${response.status}` 
      }, { status: 500 })
    }

    const html = await response.text()
    console.log(`Received HTML response, length: ${html.length}`)

    // Extract tweets from Nitter HTML
    const tweetMatches = html.matchAll(/<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)
    const tweets = []

    for (const match of tweetMatches) {
      const content = match[1]
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
      
      if (content && content.length > 20) {
        tweets.push({ text: content })
      }
      
      if (tweets.length >= 15) break // Get up to 15 tweets for better analysis
    }

    console.log(`Found ${tweets.length} tweets for analysis`)

    // Prepare response data
    const analysisData: any = {
      krom_id: callId,
      ticker: call.ticker,
      contract_address: contractAddress,
      tweets_found: tweets.length,
      analyzed_at: new Date().toISOString()
    }

    if (tweets.length === 0) {
      // No tweets found
      analysisData.score = 1
      analysisData.positive_signals = ['No social media presence found']
      analysisData.red_flags = ['Zero Twitter activity for contract address']
      analysisData.assessment = 'No community engagement detected'
      analysisData.tier = 'TRASH'
    } else {
      // Analyze tweets with Claude
      const tweetContent = tweets.map((tweet, index) => 
        `Tweet ${index + 1}: ${tweet.text}`
      ).join('\n\n')

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 600,
          temperature: 0,
          system: X_ANALYSIS_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Analyze these tweets about ${call.ticker} (contract: ${contractAddress}):\n\n${tweetContent}`
            }
          ]
        })
      })

      if (!anthropicResponse.ok) {
        console.error(`Claude API error: ${anthropicResponse.status}`)
        return NextResponse.json({ 
          error: 'Failed to analyze tweets' 
        }, { status: 500 })
      }

      const anthropicResult = await anthropicResponse.json()
      const analysisText = anthropicResult.content[0].text

      // Parse Claude's response
      const scoreMatch = analysisText.match(/score[:\s]+(\d+)/i)
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 1

      // Extract structured data from response
      const lines = analysisText.split('\n').filter(line => line.trim())
      const positiveSignals: string[] = []
      const redFlags: string[] = []
      let assessment = ''

      let section = ''
      for (const line of lines) {
        if (line.toLowerCase().includes('positive signal') || line.toLowerCase().includes('key positive')) {
          section = 'positive'
        } else if (line.toLowerCase().includes('red flag') || line.toLowerCase().includes('concern')) {
          section = 'red'
        } else if (line.toLowerCase().includes('assessment') || line.toLowerCase().includes('overall')) {
          section = 'assessment'
        } else if (line.startsWith('•') || line.startsWith('-')) {
          const content = line.replace(/^[•\-]\s*/, '').trim()
          if (section === 'positive' && positiveSignals.length < 3) {
            positiveSignals.push(content)
          } else if (section === 'red' && redFlags.length < 2) {
            redFlags.push(content)
          }
        } else if (section === 'assessment' && !assessment) {
          assessment = line.trim()
        }
      }

      // Determine tier based on score
      let tier = 'TRASH'
      if (score >= 8) tier = 'ALPHA'
      else if (score >= 6) tier = 'SOLID'
      else if (score >= 4) tier = 'BASIC'

      analysisData.score = score
      analysisData.tier = tier
      analysisData.positive_signals = positiveSignals.length > 0 ? positiveSignals : ['Analysis complete']
      analysisData.red_flags = redFlags.length > 0 ? redFlags : ['None identified']
      analysisData.assessment = assessment || `Scored ${score}/10 based on ${tweets.length} tweets`
      analysisData.raw_analysis = analysisText
    }

    // Store analysis in database
    const summaryText = [
      ...analysisData.positive_signals.map((s: string) => `• ${s}`),
      ...(analysisData.red_flags.length > 0 ? ['\nRED FLAGS:'] : []),
      ...analysisData.red_flags.map((r: string) => `• ${r}`)
    ].join('\n')

    const { error: updateError } = await supabase
      .from('crypto_calls')
      .update({
        x_analysis_tier: analysisData.tier,
        x_analysis_summary: summaryText,
        x_raw_tweets: tweets.slice(0, 10), // Store first 10 tweets
        x_analyzed_at: analysisData.analyzed_at,
        // Add new score field if it exists, otherwise store in raw_data
        raw_data: {
          ...call.raw_data,
          x_analysis_score: analysisData.score,
          x_analysis_assessment: analysisData.assessment
        }
      })
      .eq('krom_id', callId)

    if (updateError) {
      console.error('Failed to update database:', updateError)
      // Continue anyway - we have the analysis
    }

    return NextResponse.json({
      success: true,
      data: analysisData
    })

  } catch (error) {
    console.error('X analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}