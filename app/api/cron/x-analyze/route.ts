import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// X analysis prompt
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

Remember: Focus on the quality of engagement and legitimate development activity, not just volume of tweets.`;

export async function GET(request: NextRequest) {
  // Simple auth check
  const authToken = request.nextUrl.searchParams.get('auth');
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const batchId = crypto.randomUUID();
  const batchTimestamp = new Date().toISOString();

  try {
    // Initialize Supabase
    const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
      : null;

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Process 5 calls for X analysis (safe limit)
    const limit = 5;
    const model = 'moonshotai/kimi-k2:free';

    // Fetch calls with tweets that need X analysis
    const { data: calls, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('krom_id, ticker, x_raw_tweets, buy_timestamp, raw_data')
      .not('x_raw_tweets', 'is', null)
      .is('x_analysis_score', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No calls found that need X analysis',
        processed: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Get total unanalyzed count
    const { count: unanalyzedCount } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('x_raw_tweets', 'is', null)
      .is('x_analysis_score', null);

    // Process calls with X analysis
    let processed = 0;
    const errors = [];

    for (const call of calls) {
      try {
        // Handle empty tweet arrays
        if (!call.x_raw_tweets || call.x_raw_tweets.length === 0) {
          await supabase
            .from('crypto_calls')
            .update({
              x_analysis_score: 1,
              x_analysis_token_type: 'meme',
              x_analysis_legitimacy_factor: 'Low',
              x_analysis_model: model,
              x_analysis_reasoning: 'No tweets found for analysis',
              x_analysis_batch_id: batchId,
              x_analysis_batch_timestamp: batchTimestamp
            })
            .eq('krom_id', call.krom_id);
          
          processed++;
          continue;
        }

        // Extract tweets text
        const tweetsText = call.x_raw_tweets
          .slice(0, 10)
          .map((tweet: any, idx: number) => {
            // Handle different tweet formats
            const text = tweet.text || tweet.content || JSON.stringify(tweet);
            return `Tweet ${idx + 1}: ${text}`;
          })
          .join('\n\n');

        // Prepare analysis prompt
        const prompt = `${X_BATCH_ANALYSIS_PROMPT}

Token: ${call.ticker}
Total tweets found: ${call.x_raw_tweets.length}

TWEETS TO ANALYZE:
${tweetsText}

Provide your analysis in this exact JSON format:
{
  "score": <1-10>,
  "token_type": "<meme|utility|hybrid>",
  "legitimacy_factor": "<Low|Medium|High>",
  "best_tweet": "<exact text of most informative tweet>",
  "key_observations": [
    "<observation 1>",
    "<observation 2>",
    "<observation 3>"
  ],
  "reasoning": "<2-3 sentence explanation>"
}`;

        // Call OpenRouter API
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 1000
          })
        });

        if (!openRouterResponse.ok) {
          throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
        }

        const openRouterResult = await openRouterResponse.json();
        const rawResponse = openRouterResult.choices[0]?.message?.content || '{}';
        
        // Extract JSON from response
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON in AI response');
        }

        const analysisResult = JSON.parse(jsonMatch[0]);

        // Update database with X analysis results
        await supabase
          .from('crypto_calls')
          .update({ 
            x_analysis_score: analysisResult.score || 1,
            x_analysis_token_type: analysisResult.token_type || 'meme',
            x_analysis_legitimacy_factor: analysisResult.legitimacy_factor || 'Low',
            x_analysis_model: model,
            x_analysis_reasoning: analysisResult.reasoning || 'No reasoning provided',
            x_analysis_best_tweet: analysisResult.best_tweet || null,
            x_analysis_key_observations: analysisResult.key_observations || [],
            x_analysis_batch_id: batchId,
            x_analysis_batch_timestamp: batchTimestamp
          })
          .eq('krom_id', call.krom_id);

        processed++;
      } catch (err) {
        console.error(`Error processing X analysis for ${call.krom_id}:`, err);
        errors.push(call.krom_id);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      processed: processed,
      total: calls.length,
      errors: errors.length,
      remaining: unanalyzedCount ? unanalyzedCount - processed : 'unknown',
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
      model: model,
      batchId: batchId,
      estimatedCompletion: unanalyzedCount ? `${Math.ceil((unanalyzedCount - processed) / 5)} minutes` : 'unknown'
    });
    
  } catch (error) {
    console.error('Cron X analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to run X analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// For cron services that use HEAD requests to check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}