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
    const { krom_id, model = 'claude-3-haiku-20240307' } = await request.json();
    
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
        max_tokens: 1024,
        temperature: 0,
        system: `You are an expert cryptocurrency analyst. Analyze the following crypto call and rate it on a scale of 1-10...

IMPORTANT SCORING CRITERIA:
- 10/10: Extremely rare. Reserved for tokens with CONFIRMED major backing (e.g., Binance Labs, Google Ventures, major institutional investors with PUBLIC PROOF)
- 8-9/10: Strong projects with verifiable partnerships, active development, transparent team
- 6-7/10: Solid projects with good fundamentals, community, some red flags
- 4-5/10: Basic legitimacy, limited information, higher risk
- 1-3/10: Likely scams, pump and dumps, no real value proposition

Consider:
1. Message quality and professionalism
2. Specific details vs vague hype
3. Verifiable claims vs empty promises
4. Technical details and utility
5. Red flags (urgency, guaranteed returns, etc.)

Response format:
Score: [1-10]
Legitimacy Factor: [High/Medium/Low]
Key Observations: [2-3 bullet points]
Investment Risk: [Very High/High/Medium/Low]`,
        messages: [
          {
            role: 'user',
            content: `Analyze this crypto call:
            
Ticker: ${call.ticker || 'Unknown'}
Message: ${call.raw_data?.callMessage || 'No message'}
Buy Timestamp: ${new Date(call.buy_timestamp).toISOString()}
Group: ${call.raw_data?.groupName || 'Unknown'}`
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
    const scoreMatch = analysisText.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

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
        analysis_legitimacy_factor: legitimacyFactor,
        analysis_model: model,
        analysis_reasoning: analysisText,
        analysis_reanalyzed_at: new Date().toISOString(),
        analysis_duration_ms: analysisTime,
        analysis_prompt_used: 'REANALYSIS_V1'
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