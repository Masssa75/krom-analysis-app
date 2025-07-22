import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { krom_id, comment } = await request.json();
    
    if (!krom_id) {
      return NextResponse.json(
        { error: 'krom_id is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Update the comment in the database
    const { data, error } = await supabase
      .from('crypto_calls')
      .update({ 
        user_comment: comment || null,
        user_comment_updated_at: comment ? new Date().toISOString() : null
      })
      .eq('krom_id', krom_id)
      .select();
    
    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to save comment', details: error.message },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Comment API error:', error);
    return NextResponse.json(
      { error: 'Failed to save comment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const krom_id = searchParams.get('krom_id');
    
    if (!krom_id) {
      return NextResponse.json(
        { error: 'krom_id is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('crypto_calls')
      .select('user_comment, user_comment_updated_at')
      .eq('krom_id', krom_id)
      .single();
    
    if (error) {
      // If row not found, return empty comment
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          comment: null,
          updated_at: null
        });
      }
      
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comment', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      comment: data?.user_comment || null,
      updated_at: data?.user_comment_updated_at || null
    });
    
  } catch (error) {
    console.error('Comment GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    );
  }
}