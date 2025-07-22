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
    
    // First, try to update with the comment columns
    const { data, error } = await supabase
      .from('crypto_calls')
      .update({ 
        user_comment: comment,
        user_comment_updated_at: new Date().toISOString()
      })
      .eq('krom_id', krom_id);
    
    if (error && error.message.includes('column')) {
      // If columns don't exist, create them first
      console.log('Creating user_comment columns...');
      
      // Add columns using raw SQL
      const { error: alterError1 } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE crypto_calls ADD COLUMN IF NOT EXISTS user_comment TEXT'
      }).single();
      
      const { error: alterError2 } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE crypto_calls ADD COLUMN IF NOT EXISTS user_comment_updated_at TIMESTAMPTZ'
      }).single();
      
      // If RPC doesn't work, we'll handle it differently
      if (alterError1 || alterError2) {
        // For now, we'll store comments in a separate table or handle differently
        console.error('Could not add columns:', alterError1 || alterError2);
        return NextResponse.json(
          { error: 'Database schema update needed. Please contact admin.' },
          { status: 500 }
        );
      }
      
      // Retry the update
      const { data: retryData, error: retryError } = await supabase
        .from('crypto_calls')
        .update({ 
          user_comment: comment,
          user_comment_updated_at: new Date().toISOString()
        })
        .eq('krom_id', krom_id);
      
      if (retryError) {
        console.error('Update error after adding columns:', retryError);
        return NextResponse.json(
          { error: 'Failed to save comment' },
          { status: 500 }
        );
      }
    } else if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to save comment' },
        { status: 500 }
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
    
    if (error && !error.message.includes('column')) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comment' },
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