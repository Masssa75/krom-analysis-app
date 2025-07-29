import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Simple auth check - you can use a secret in the URL
  const authToken = request.nextUrl.searchParams.get('auth');
  if (authToken !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const batchId = crypto.randomUUID();
  const batchTimestamp = new Date().toISOString();

  try {
    // Initialize clients
    const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
      : null;

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Process 5 calls for testing (will change to 20 later)
    const limit = 5;
    const model = 'moonshotai/kimi-k2';

    // Fetch oldest unanalyzed calls
    const { data: calls, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('*')
      .is('analysis_score', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No unanalyzed calls found',
        processed: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Get total unanalyzed count
    const { count: unanalyzedCount } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .is('analysis_score', null);

    // Process calls with real AI analysis
    let processed = 0;
    const errors = [];

    for (const call of calls) {
      try {
        // Extract contract info
        const contract = call.raw_data?.token?.ca || null;
        const network = call.raw_data?.token?.network || 'unknown';
        const groupName = call.raw_data?.groupName || call.raw_data?.group?.name || 'Unknown';
        const message = call.raw_data?.text || 'No message';

        // Prepare analysis prompt
        const analysisPrompt = `You are analyzing a cryptocurrency call to assess the LEGITIMACY of the project based on available information. Your goal is to identify tokens backed by credible teams, established companies, reputable investors, or influential supporters.

Call Data:
- Token: ${call.ticker || 'Unknown'}
- Contract: ${contract || 'No contract'}
- Network: ${network}
- Telegram Call Group: ${groupName} (Group ranking: TBD)
- Message: ${message}
- Timestamp: ${call.buy_timestamp || call.created_at}

Scoring Criteria (based on legitimacy indicators):
- 8-10: Exceptional legitimacy or rare significance - Verifiable high-profile backing, substantial documented investment, OR something truly extraordinary (groundbreaking technical innovation, exceptional quality that stands out from typical crypto projects)
- 6-7: Strong legitimacy - Clear signs of professional operation and accountability (transparent team/company structure, proven track record)
- 4-5: Moderate legitimacy - Some credible elements present (demonstrated development effort, community building, partial transparency)
- 1-3: Low/No legitimacy - Minimal to no verifiable information beyond basic token existence

When in doubt: If you encounter something unusual that seems significant but doesn't fit clear categories, err on the side of a higher score (5-7 range) and explain your uncertainty in the reasoning field. Better to flag potentially important projects for human review than to miss them.

Also consider the quality and nature of discourse around the project. The way people communicate about a token often reflects its legitimacy - genuine projects tend to generate different conversation patterns than typical pump schemes.

Also classify the token type:
- Meme: Community-driven, humor/viral focus, dog/cat/pepe themes, no serious utility claims
- Utility: Real use case, DeFi, infrastructure, gaming, AI tools, solving actual problems

Response Format (JSON):
{
  "score": <number 1-10>,
  "token_type": "<meme|utility>",
  "legitimacy_factor": "<High|Medium|Low>",
  "reasoning": "<explain legitimacy indicators found or absent>"
}

Respond with JSON only.`;

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
                content: analysisPrompt
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

        // Update database with analysis results
        const { error: updateError } = await supabase
          .from('crypto_calls')
          .update({ 
            analysis_score: analysisResult.score || 5,
            analysis_token_type: analysisResult.token_type || 'meme',
            analysis_legitimacy_factor: analysisResult.legitimacy_factor || 'Medium',
            analysis_model: model,
            analysis_reasoning: analysisResult.reasoning || 'No reasoning provided',
            analysis_batch_id: batchId,
            analysis_batch_timestamp: batchTimestamp,
            analyzed_at: new Date().toISOString()
          })
          .eq('krom_id', call.krom_id);
          
        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        processed++;
      } catch (err) {
        console.error(`Error processing ${call.krom_id}:`, err);
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
      estimatedCompletion: unanalyzedCount ? `${Math.ceil((unanalyzedCount - processed) / 20)} minutes` : 'unknown'
    });
    
  } catch (error) {
    console.error('Cron analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to run analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// For cron services that use HEAD requests to check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}