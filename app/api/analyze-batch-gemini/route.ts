import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const batchId = crypto.randomUUID();
  const batchTimestamp = new Date().toISOString();
  
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
    const { limit = 5 } = await request.json();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    if (!genAI) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Fetch oldest unanalyzed calls
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

    // Prepare batch prompt
    const batchPrompt = `You are analyzing multiple cryptocurrency calls to assess the LEGITIMACY of each project. Analyze each call independently.

For each call, score based on legitimacy indicators:
- 8-10: Exceptional legitimacy or rare significance (verifiable high-profile backing, groundbreaking innovation)
- 6-7: Strong legitimacy (professional operation, transparent team)
- 4-5: Moderate legitimacy (some credible elements)
- 1-3: Low/No legitimacy (minimal verifiable information)

IMPORTANT: Be especially careful with tokens named after famous meme coins (like PEPE). Check if the contract address matches the official one. Many are imposters trying to ride on the original's success.

Token types:
- Meme: Community-driven, humor/viral focus
- Utility: Real use case, DeFi, infrastructure, gaming, AI tools

Analyze these ${calls.length} calls:

${calls.map((call, index) => {
  const contract = call.raw_data?.token?.ca || 'No contract';
  const network = call.raw_data?.token?.network || 'unknown';
  const groupName = call.raw_data?.groupName || call.raw_data?.group?.name || 'Unknown';
  const message = call.raw_data?.text || 'No message';
  
  return `Call ${index + 1}:
- Token: ${call.ticker || 'Unknown'}
- Contract: ${contract}
- Network: ${network}
- Group: ${groupName}
- Message: ${message}
- Timestamp: ${call.buy_timestamp || call.created_at}`;
}).join('\n\n')}

Respond with a JSON array containing exactly ${calls.length} objects in order:
[
  {
    "score": <number 1-10>,
    "token_type": "<meme|utility>",
    "legitimacy_factor": "<High|Medium|Low>",
    "reasoning": "<explain legitimacy indicators>"
  },
  ...
]

IMPORTANT: Return ONLY the JSON array, no other text.`;

    // Call Gemini API with batch
    const analysisStartTime = Date.now();
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json'
      }
    });
    
    const result = await model.generateContent(batchPrompt);
    const rawResponse = result.response.text();
    const analysisDuration = Date.now() - analysisStartTime;
    
    console.log(`Batch analysis completed in ${analysisDuration}ms for ${calls.length} calls`);
    
    // Parse batch response
    let batchResults;
    try {
      // Try to extract JSON array from response
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      batchResults = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(batchResults) || batchResults.length !== calls.length) {
        throw new Error(`Expected ${calls.length} results, got ${batchResults?.length || 0}`);
      }
    } catch (parseError) {
      console.error('Failed to parse batch response:', parseError);
      console.error('Raw response:', rawResponse);
      return NextResponse.json({ 
        error: 'Failed to parse batch analysis results',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Process results and update database
    const results = [];
    const updatePromises = [];
    
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      const analysisResult = batchResults[i];
      
      const contract = call.raw_data?.token?.ca || null;
      const network = call.raw_data?.token?.network || 'unknown';
      
      results.push({
        token: call.ticker || 'Unknown',
        contract: contract,
        score: analysisResult.score,
        token_type: analysisResult.token_type,
        x_token_type: call.x_analysis_token_type || null,
        legitimacy_factor: analysisResult.legitimacy_factor,
        reasoning: analysisResult.reasoning,
        krom_id: call.krom_id,
        network: network,
        analysis_reasoning: analysisResult.reasoning,
        analysis_model: 'google/gemini-2.5-pro',
        analysis_duration_ms: Math.floor(analysisDuration / calls.length), // Average time per call
        analysis_batch_id: batchId,
        analysis_batch_timestamp: batchTimestamp,
        analysis_prompt_used: `Batch analysis of ${calls.length} calls`
      });
      
      // Update database
      updatePromises.push(
        supabase
          .from('crypto_calls')
          .update({ 
            analysis_score: analysisResult.score,
            analysis_token_type: analysisResult.token_type,
            analysis_legitimacy_factor: analysisResult.legitimacy_factor,
            analysis_model: 'google/gemini-2.5-pro',
            analysis_reasoning: analysisResult.reasoning,
            analysis_batch_id: batchId,
            analysis_batch_timestamp: batchTimestamp,
            analysis_prompt_used: `Batch analysis of ${calls.length} calls`,
            analysis_duration_ms: Math.floor(analysisDuration / calls.length)
          })
          .eq('krom_id', call.krom_id)
      );
    }
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return NextResponse.json({
      success: true,
      count: results.length,
      model: 'google/gemini-2.5-pro',
      duration: duration,
      batchProcessing: true,
      tokensPerCall: Math.floor((batchPrompt.length + rawResponse.length) / calls.length),
      results: results
    });
    
  } catch (error) {
    console.error('Batch analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze calls', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}