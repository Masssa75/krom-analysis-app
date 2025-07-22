import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const X_ANALYSIS_PROMPT = `You are an expert crypto analyst evaluating Twitter/X social media data about cryptocurrency tokens.

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
2. Legitimacy Factor: "Low", "Medium", or "High"
3. Best Tweet: The single most informative/relevant tweet (copy exact text)
4. Key Observations: 2-3 bullet points about what you found (max 20 words each)
5. Reasoning: Brief explanation of your score (2-3 sentences)

Remember: Focus on the quality of engagement and legitimate development activity, not just volume of tweets.`;

export async function POST(request: NextRequest) {
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
    const { krom_id, model = 'claude-3-haiku-20240307' } = await request.json();
    
    if (!krom_id) {
      return NextResponse.json({ error: 'krom_id is required' }, { status: 400 });
    }

    // Fetch the specific call with X data
    const { data: call, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('*')
      .eq('krom_id', krom_id)
      .single();

    if (fetchError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const startTime = Date.now();

    // Check if we need to fetch tweets first
    if (!call.x_raw_tweets || call.x_raw_tweets.length === 0) {
      // If no tweets stored, we can't do X analysis
      // In a real implementation, you might want to fetch tweets here
      return NextResponse.json({ 
        error: 'No tweets available for this token. X analysis requires historical tweet data.' 
      }, { status: 400 });
    }

    // Prepare tweet content for analysis
    const tweetTexts = call.x_raw_tweets
      .filter((t: any) => t.text)
      .map((t: any, i: number) => `Tweet ${i + 1}: ${t.text}`)
      .join('\n');
    
    if (!tweetTexts) {
      // Give minimum score for tokens with no valid tweet text
      const duration = Date.now() - startTime;
      
      const { error: updateError } = await supabase
        .from('crypto_calls')
        .update({
          x_analysis_score: 1,
          x_analysis_tier: 'TRASH',
          x_legitimacy_factor: 'Low',
          x_analysis_model: model,
          x_best_tweet: null,
          x_analysis_reasoning: 'No valid tweets found for this token - indicates zero social media presence or community engagement.',
          x_analysis_duration_ms: duration,
          x_analysis_prompt_used: 'X_REANALYSIS_V1',
          x_reanalyzed_at: new Date().toISOString()
        })
        .eq('krom_id', krom_id);
      
      if (updateError) {
        throw updateError;
      }
      
      return NextResponse.json({
        success: true,
        result: {
          krom_id,
          x_score: 1,
          x_tier: 'TRASH',
          x_legitimacy_factor: 'Low',
          x_analysis_reasoning: 'No valid tweets found.',
          duration_ms: duration
        }
      });
    }

    // Analyze with Claude
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
        system: X_ANALYSIS_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyze these tweets about ${call.ticker} token (captured at ${new Date(call.buy_timestamp).toISOString()}):\n\n${tweetTexts}`
          }
        ]
      })
    });

    if (!anthropicResponse.ok) {
      throw new Error(`Claude API error: ${anthropicResponse.status}`);
    }

    const anthropicResult = await anthropicResponse.json();
    const analysisText = anthropicResult.content[0].text;

    // Parse the response
    const scoreMatch = analysisText.match(/score[:\s]+(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 1;
    
    const legitimacyMatch = analysisText.match(/legitimacy\s*factor[:\s]+(low|medium|high)/i);
    const legitimacyFactor = legitimacyMatch ? legitimacyMatch[1].charAt(0).toUpperCase() + legitimacyMatch[1].slice(1) : 'Low';
    
    // Extract best tweet
    const bestTweetMatch = analysisText.match(/best\s*tweet[:\s]*(.+?)(?=\n|key\s*observations|$)/i);
    const bestTweet = bestTweetMatch ? bestTweetMatch[1].trim() : null;
    
    // Extract reasoning
    const reasoningMatch = analysisText.match(/reasoning[:\s]*(.+?)$/i);
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : analysisText;
    
    // Determine tier based on score
    let tier = 'TRASH';
    if (score >= 8) tier = 'ALPHA';
    else if (score >= 6) tier = 'SOLID';
    else if (score >= 4) tier = 'BASIC';
    
    const duration = Date.now() - startTime;

    // Update the call with new X analysis
    const { error: updateError } = await supabase
      .from('crypto_calls')
      .update({
        x_analysis_score: score,
        x_analysis_tier: tier,
        x_legitimacy_factor: legitimacyFactor,
        x_analysis_model: model,
        x_best_tweet: bestTweet,
        x_analysis_reasoning: reasoning,
        x_analysis_duration_ms: duration,
        x_analysis_prompt_used: 'X_REANALYSIS_V1',
        x_reanalyzed_at: new Date().toISOString()
      })
      .eq('krom_id', krom_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      result: {
        krom_id,
        x_score: score,
        x_tier: tier,
        x_legitimacy_factor: legitimacyFactor,
        x_best_tweet: bestTweet,
        x_analysis_reasoning: reasoning,
        tweet_count: call.x_raw_tweets.length,
        duration_ms: duration
      }
    });

  } catch (error) {
    console.error('Error reanalyzing X data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reanalyze X data' },
      { status: 500 }
    );
  }
}