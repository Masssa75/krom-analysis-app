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
    const { limit = 5, model = 'moonshotai/kimi-k2' } = await request.json();

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
    
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      
      // Add delay between API calls to respect rate limits (100ms between calls)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      try {
        // Extract contract address from raw_data
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

        let analysisResult;
        let rawResponse;
        const analysisStartTime = Date.now();
        
        if (isOpenRouterModel) {
          // Call OpenRouter API
          // Special handling for Gemini 2.5 Pro which needs 4000 tokens
          const maxTokens = model === 'google/gemini-2.5-pro' ? 4000 : 1000;
          
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
              max_tokens: maxTokens,
              // Add response format for models that support it
              ...(model === 'google/gemini-2.5-pro' ? { response_format: { type: "json_object" } } : {})
            })
          });
          
          if (!openRouterResponse.ok) {
            throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
          }
          
          const openRouterResult = await openRouterResponse.json();
          
          // Check if we have a valid response structure
          if (!openRouterResult.choices || !openRouterResult.choices[0] || !openRouterResult.choices[0].message) {
            console.error('Invalid OpenRouter response structure:', openRouterResult);
            throw new Error('Invalid response from OpenRouter API');
          }
          
          rawResponse = openRouterResult.choices[0].message.content;
          console.log(`Raw response for ${call.ticker}:`, rawResponse);
          
          // Extract JSON from response
          const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error('No JSON found in response:', rawResponse);
            throw new Error('No valid JSON in AI response');
          }
          
          try {
            analysisResult = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Raw JSON:', jsonMatch[0]);
            throw new Error('Failed to parse AI response JSON');
          }
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
        console.error(`Error analyzing call ${call.krom_id} (${call.ticker}):`, err);
        console.error('Call data:', {
          ticker: call.ticker,
          contract: call.raw_data?.token?.ca || 'missing',
          network: call.raw_data?.token?.network || 'missing',
          message: call.raw_data?.text ? 'present' : 'missing'
        });
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
    
    // Save results to database
    for (const result of results) {
      if (result.krom_id) {  // Remove the score check - save even failed analyses
        try {
          const updateData = {
            analysis_score: result.score,
            analysis_tier: result.score >= 7 ? 'ALPHA' : result.score >= 5 ? 'SOLID' : result.score >= 3 ? 'BASIC' : 'TRASH',
            analysis_token_type: result.token_type || 'meme',
            analysis_legitimacy_factor: result.legitimacy_factor || 'Unknown',
            analysis_model: model,
            analysis_reasoning: result.analysis_reasoning || result.reasoning || 'Analysis failed',
            analysis_prompt_used: result.analysis_prompt_used || '',
            analysis_batch_id: batchId,
            analysis_batch_timestamp: batchTimestamp,
            analysis_duration_ms: result.analysis_duration_ms || 0,
            analyzed_at: new Date().toISOString()
          };
          
          const { error: updateError } = await supabase
            .from('crypto_calls')
            .update(updateData)
            .eq('krom_id', result.krom_id);
            
          if (updateError) {
            console.error(`Failed to update call ${result.krom_id}:`, updateError);
          }
        } catch (err) {
          console.error(`Error saving result for ${result.krom_id}:`, err);
        }
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    const responseData = {
      success: true,
      count: results.length,
      model: model,
      duration: duration,
      results: results
    };
    
    // Ensure response is properly stringified
    const jsonResponse = JSON.stringify(responseData);
    
    return new NextResponse(jsonResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': jsonResponse.length.toString()
      }
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