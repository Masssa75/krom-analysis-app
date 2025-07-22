import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { krom_id, model = 'moonshotai/kimi-k2:free' } = await request.json();
    
    if (!krom_id) {
      return NextResponse.json({ error: 'krom_id is required' }, { status: 400 });
    }

    // Fetch the specific call
    const { data: call, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('*')
      .eq('krom_id', krom_id)
      .single();

    if (fetchError || !call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const startTime = Date.now();

    // Store the full prompt for analysis_prompt_used
    const REANALYSIS_PROMPT = `You are an expert cryptocurrency analyst. Pay close attention to technical terminology and crypto community slang.

Key crypto terms to recognize:
- "tek" = technical analysis/technology (indicates utility focus)
- "tool" = actual software/utility application
- References to specific development tools, platforms, or technical features indicate utility projects
- "awesome tool", "building something", "dev", "platform" = utility indicators

Analyze the following crypto call and provide a score from 1-10 based on potential value and legitimacy.

Scoring Criteria:
- 8-10: ALPHA tier - High potential, legitimate project, strong fundamentals
- 6-7: SOLID tier - Good potential, reasonable risk
- 4-5: BASIC tier - Average, higher risk
- 1-3: TRASH tier - Likely scam or very high risk

Consider:
- Is there a clear contract address?
- Does the message contain substantial information?
- Group reputation (if known)
- Red flags like "pump", "moon", excessive emojis
- Message quality and professionalism
- Specific details vs vague hype
- Verifiable claims vs empty promises
- Technical details and utility

Also classify the token type:
- Meme: Community-driven, humor/viral focus, dog/cat/pepe themes, no serious utility claims
- Utility: Real use case, DeFi, infrastructure, gaming, AI tools, solving actual problems
- Hybrid: Combines meme appeal with actual utility features

Response format:
Score: [1-10]
Token Type: [Meme/Utility/Hybrid]
Legitimacy Factor: [High/Medium/Low]
Key Observations: [2-3 bullet points]
Reasoning: [Brief explanation of score]`;

    // Analyze with AI model
    const isOpenRouterModel = model.includes('moonshotai') || model.includes('/');
    let analysisText: string;
    
    const userContent = `Analyze this crypto call:
            
Ticker: ${call.ticker || 'Unknown'}
Contract: ${call.raw_data?.token?.ca || 'No contract'}
Network: ${call.raw_data?.token?.network || 'Unknown'}
Message: ${call.raw_data?.text || 'No message'}
Call Timestamp: ${call.created_at ? new Date(call.created_at).toISOString() : 'Unknown'}
Group: ${call.raw_data?.groupName || call.raw_data?.group?.name || 'Unknown'}`;
    
    if (isOpenRouterModel) {
      // Use OpenRouter API
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
              role: 'system',
              content: REANALYSIS_PROMPT
            },
            {
              role: 'user',
              content: userContent
            }
          ],
          temperature: 0,
          max_tokens: 1024
        })
      });
      
      if (!openRouterResponse.ok) {
        throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
      }
      
      const openRouterResult = await openRouterResponse.json();
      analysisText = openRouterResult.choices[0].message.content;
    } else {
      // Use Claude API directly
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          temperature: 0,
          system: REANALYSIS_PROMPT,
          messages: [
            {
              role: 'user',
              content: userContent
            }
          ]
        })
      });

      if (!anthropicResponse.ok) {
        throw new Error(`Claude API error: ${anthropicResponse.status}`);
      }

      const anthropicResult = await anthropicResponse.json();
      analysisText = anthropicResult.content[0].text;
    }

    // Parse the response
    const scoreMatch = analysisText.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

    const tokenTypeMatch = analysisText.match(/Token Type:\s*(Meme|Utility|Hybrid)/i);
    const tokenType = tokenTypeMatch ? tokenTypeMatch[1].toLowerCase() : 'meme';

    const legitimacyMatch = analysisText.match(/Legitimacy Factor:\s*(High|Medium|Low)/i);
    const legitimacyFactor = legitimacyMatch ? legitimacyMatch[1] : 'Medium';

    let tier = 'BASIC';
    if (score >= 8) tier = 'ALPHA';
    else if (score >= 6) tier = 'SOLID';
    else if (score <= 3) tier = 'TRASH';

    const analysisTime = Date.now() - startTime;

    // Update the call with new analysis
    const { error: updateError } = await supabase
      .from('crypto_calls')
      .update({
        analysis_score: score,
        analysis_tier: tier,
        analysis_token_type: tokenType,
        analysis_legitimacy_factor: legitimacyFactor,
        analysis_model: model,
        analysis_reasoning: analysisText,
        analysis_reanalyzed_at: new Date().toISOString(),
        analysis_duration_ms: analysisTime,
        analysis_prompt_used: REANALYSIS_PROMPT
      })
      .eq('krom_id', krom_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      result: {
        krom_id,
        score,
        tier,
        token_type: tokenType,
        legitimacy_factor: legitimacyFactor,
        analysis_reasoning: analysisText,
        duration_ms: analysisTime
      }
    });

  } catch (error) {
    console.error('Error reanalyzing call:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reanalyze call' },
      { status: 500 }
    );
  }
}