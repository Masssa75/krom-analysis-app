import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize clients (will use environment variables in production)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'claude', data } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let response;

    if (model === 'claude') {
      // Use Claude for analysis
      const message = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `Analyze the following crypto data and ${prompt}:\n\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      });

      response = message.content[0].type === 'text' ? message.content[0].text : '';
    } else if (model === 'gemini') {
      // Use Gemini for analysis
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await geminiModel.generateContent(
        `Analyze the following crypto data and ${prompt}:\n\n${JSON.stringify(data, null, 2)}`
      );
      response = result.response.text();
    } else {
      return NextResponse.json({ error: 'Invalid model specified' }, { status: 400 });
    }

    // Store analysis results in Supabase if needed
    if (process.env.STORE_ANALYSIS_RESULTS === 'true') {
      const { error } = await supabase
        .from('analysis_results')
        .insert({
          prompt,
          model,
          response,
          data: data,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing analysis:', error);
      }
    }

    return NextResponse.json({ 
      success: true,
      analysis: response,
      model: model
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze data', details: error instanceof Error ? error.message : 'Unknown error' },
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