import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const batchId = crypto.randomUUID(); // Generate unique batch ID
  const batchTimestamp = new Date().toISOString();
  
  // Initialize clients inside the function to avoid build-time errors
  const anthropic = process.env.ANTHROPIC_API_KEY 
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

  const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

  const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;
    
  try {
    const { limit = 5, model = 'moonshotai/kimi-k2:free' } = await request.json();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Fetch oldest calls that haven't been scored with the new 1-10 system
    // Using created_at timestamp for chronological ordering
    const { data: calls, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('*')
      .is('analysis_score', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch calls from database' }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({ error: 'No unanalyzed calls found' }, { status: 404 });
    }

    // Prepare AI client based on model selection
    let aiClient: any;
    const isClaudeModel = model.includes('claude');
    const isOpenRouterModel = model.includes('moonshotai') || model.includes('/');
    
    if (isOpenRouterModel) {
      if (!process.env.OPEN_ROUTER_API_KEY) {
        return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
      }
      // OpenRouter doesn't need a client initialization
      aiClient = null;
    } else if (isClaudeModel) {
      if (!anthropic) {
        return NextResponse.json({ error: 'Claude API key not configured' }, { status: 500 });
      }
      aiClient = anthropic;
    } else {
      if (!genAI) {
        return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
      }
      aiClient = genAI;
    }

    // Analyze each call
    const results = [];
    
    for (const call of calls) {
      try {
        // Extract contract address from raw_data
        const contract = call.raw_data?.token?.ca || null;
        const network = call.raw_data?.token?.network || 'unknown';
        const groupName = call.raw_data?.groupName || call.raw_data?.group?.name || 'Unknown';
        const message = call.raw_data?.text || 'No message';
        
        // Prepare analysis prompt
        const analysisPrompt = `
Analyze this cryptocurrency call and provide a score from 1-10 based on potential value and legitimacy.

Call Data:
- Token: ${call.ticker || 'Unknown'}
- Contract: ${contract || 'No contract'}
- Network: ${network}
- Group: ${groupName}
- Message: ${message}
- Timestamp: ${call.buy_timestamp || call.created_at}

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

Also classify the token type:
- Meme: Community-driven, humor/viral focus, dog/cat/pepe themes, no serious utility claims
- Utility: Real use case, DeFi, infrastructure, gaming, AI tools, solving actual problems
- Hybrid: Combines meme appeal with actual utility features

Response Format (JSON):
{
  "score": <number 1-10>,
  "token_type": "<meme|utility|hybrid>",
  "legitimacy_factor": "<High|Medium|Low>",
  "reasoning": "<brief explanation>"
}

Respond with JSON only.`;

        let analysisResult;
        let rawResponse;
        const analysisStartTime = Date.now();
        
        if (isOpenRouterModel) {
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
          rawResponse = openRouterResult.choices[0].message.content;
          // Extract JSON from response
          const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
          analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } else if (isClaudeModel) {
          const message = await aiClient.messages.create({
            model: model,
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: analysisPrompt
              }
            ]
          });
          
          rawResponse = message.content[0].type === 'text' ? message.content[0].text : '{}';
          analysisResult = JSON.parse(rawResponse);
        } else {
          const geminiModel = aiClient.getGenerativeModel({ model: 'gemini-pro' });
          const result = await geminiModel.generateContent(analysisPrompt);
          rawResponse = result.response.text();
          // Extract JSON from response (Gemini sometimes adds extra text)
          const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
          analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        }
        
        const analysisDuration = Date.now() - analysisStartTime;
        
        // Get full contract address for display
        const displayContract = contract;
        
        results.push({
          token: call.ticker || 'Unknown',
          contract: displayContract,
          score: analysisResult.score || 5,
          token_type: analysisResult.token_type || 'meme',
          x_token_type: call.x_analysis_token_type || null,
          legitimacy_factor: analysisResult.legitimacy_factor || 'Medium',
          reasoning: analysisResult.reasoning || 'No analysis available',
          krom_id: call.krom_id,
          network: network,
          // Include all analysis fields for the detail panel
          analysis_reasoning: analysisResult.reasoning || rawResponse,
          analysis_model: model,
          analysis_duration_ms: analysisDuration,
          analysis_batch_id: batchId,
          analysis_batch_timestamp: batchTimestamp,
          analysis_prompt_used: analysisPrompt
        });
        
        // Update the database with full analysis details
        if (analysisResult.score) {
          // First try with all fields
          const fullUpdate = await supabase
            .from('crypto_calls')
            .update({ 
              analysis_score: analysisResult.score,
              analysis_token_type: analysisResult.token_type || 'meme',
              analysis_legitimacy_factor: analysisResult.legitimacy_factor,
              analysis_model: model,
              analysis_reasoning: analysisResult.reasoning || rawResponse,
              analysis_batch_id: batchId,
              analysis_batch_timestamp: batchTimestamp,
              analysis_prompt_used: analysisPrompt,
              analysis_duration_ms: analysisDuration
            })
            .eq('krom_id', call.krom_id);
          
          // If it fails due to missing columns, fall back to basic update
          if (fullUpdate.error && fullUpdate.error.message.includes('column')) {
            console.log('New columns not yet available, using basic update');
            await supabase
              .from('crypto_calls')
              .update({ 
                analysis_score: analysisResult.score,
                analysis_token_type: analysisResult.token_type || 'meme',
                analysis_legitimacy_factor: analysisResult.legitimacy_factor,
                analysis_model: model
              })
              .eq('krom_id', call.krom_id);
          }
        }
        
      } catch (err) {
        console.error(`Error analyzing call ${call.krom_id}:`, err);
        results.push({
          token: call.ticker || 'Unknown',
          contract: null,
          score: 5,
          legitimacy_factor: 'Unknown',
          reasoning: 'Analysis failed',
          krom_id: call.krom_id,
          network: 'unknown',
          // Include empty analysis fields for consistency
          analysis_reasoning: 'Analysis failed',
          analysis_model: model,
          analysis_duration_ms: 0,
          analysis_batch_id: batchId,
          analysis_batch_timestamp: batchTimestamp,
          analysis_prompt_used: ''
        });
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return NextResponse.json({
      success: true,
      count: results.length,
      model: model,
      duration: duration,
      results: results
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze calls', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}