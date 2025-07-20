import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Contract address extraction regex patterns
const CONTRACT_PATTERNS = {
  ethereum: /0x[a-fA-F0-9]{40}/g,
  solana: /[1-9A-HJ-NP-Za-km-z]{32,44}/g
};

// Extract contract addresses from text
function extractContractAddresses(text: string): { ethereum: string[], solana: string[] } {
  const ethereum = text.match(CONTRACT_PATTERNS.ethereum) || [];
  const solana = text.match(CONTRACT_PATTERNS.solana) || [];
  
  // Filter out common false positives for Solana (like regular words)
  const validSolana = solana.filter(addr => 
    addr.length >= 32 && 
    !addr.match(/^[A-Z][a-z]+$/) && // Not a capitalized word
    !addr.match(/^[a-z]+$/) // Not all lowercase
  );
  
  return { ethereum, solana: validSolana };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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
    const { limit = 5, model = 'claude-3-haiku-20240307' } = await request.json();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Fetch oldest unanalyzed calls from Supabase
    const { data: calls, error: fetchError } = await supabase
      .from('crypto_calls')
      .select('*')
      .is('analysis_score', null)
      .order('buy_timestamp', { ascending: true })
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
    
    if (isClaudeModel) {
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
        // Extract contract addresses from raw data
        const rawDataStr = JSON.stringify(call.raw_data || {});
        const addresses = extractContractAddresses(rawDataStr);
        const contract = addresses.ethereum[0] || addresses.solana[0] || null;
        
        // Prepare analysis prompt
        const analysisPrompt = `
Analyze this cryptocurrency call and provide a score from 1-10 based on potential value and legitimacy.

Call Data:
- Token: ${call.ticker || 'Unknown'}
- Group: ${call.raw_data?.group_name || 'Unknown'}
- Message: ${call.raw_data?.message || call.raw_data?.text || 'No message'}
- Timestamp: ${call.buy_timestamp}

Scoring Criteria:
- 8-10: ALPHA tier - High potential, legitimate project, strong fundamentals
- 6-7: SOLID tier - Good potential, reasonable risk
- 4-5: BASIC tier - Average, higher risk
- 1-3: TRASH tier - Likely scam or very high risk

Response Format (JSON):
{
  "score": <number 1-10>,
  "legitimacy_factor": "<High|Medium|Low>",
  "reasoning": "<brief explanation>"
}

Respond with JSON only.`;

        let analysisResult;
        
        if (isClaudeModel) {
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
          
          const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
          analysisResult = JSON.parse(responseText);
        } else {
          const geminiModel = aiClient.getGenerativeModel({ model: 'gemini-pro' });
          const result = await geminiModel.generateContent(analysisPrompt);
          const responseText = result.response.text();
          // Extract JSON from response (Gemini sometimes adds extra text)
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        }
        
        results.push({
          token: call.ticker || 'Unknown',
          contract: contract,
          score: analysisResult.score || 5,
          legitimacy_factor: analysisResult.legitimacy_factor || 'Medium',
          reasoning: analysisResult.reasoning || 'No analysis available',
          krom_id: call.krom_id
        });
        
        // Update the database with the analysis score
        if (analysisResult.score) {
          await supabase
            .from('crypto_calls')
            .update({ 
              analysis_score: analysisResult.score,
              analysis_legitimacy: analysisResult.legitimacy_factor,
              contract_address: contract
            })
            .eq('krom_id', call.krom_id);
        }
        
      } catch (err) {
        console.error(`Error analyzing call ${call.krom_id}:`, err);
        results.push({
          token: call.ticker || 'Unknown',
          contract: null,
          score: 5,
          legitimacy_factor: 'Unknown',
          reasoning: 'Analysis failed',
          krom_id: call.krom_id
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