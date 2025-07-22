import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;
    
  try {
    const { krom_id, is_marked, notes } = await request.json();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    if (!krom_id) {
      return NextResponse.json({ error: 'krom_id is required' }, { status: 400 });
    }

    // Update the coin of interest status
    const updateData: any = {
      is_coin_of_interest: is_marked
    };
    
    if (is_marked) {
      updateData.coin_of_interest_marked_at = new Date().toISOString();
      if (notes !== undefined) {
        updateData.coin_of_interest_notes = notes;
      }
    } else {
      updateData.coin_of_interest_marked_at = null;
      updateData.coin_of_interest_notes = null;
    }

    const { error: updateError } = await supabase
      .from('crypto_calls')
      .update(updateData)
      .eq('krom_id', krom_id);
    
    if (updateError) {
      console.error('Error updating coin of interest:', updateError);
      return NextResponse.json({ error: 'Failed to update coin of interest status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: is_marked ? 'Marked as coin of interest' : 'Unmarked as coin of interest',
      krom_id: krom_id
    });
    
  } catch (err) {
    console.error('Mark coin of interest error:', err);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}