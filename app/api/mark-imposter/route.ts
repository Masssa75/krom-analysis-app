import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { callId, isImposter } = await request.json()

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      )
    }

    // Update the is_imposter flag
    const { data, error } = await supabase
      .from('crypto_calls')
      .update({
        is_imposter: isImposter,
        imposter_marked_at: isImposter ? new Date().toISOString() : null
      })
      .eq('id', callId)
      .select()
      .single()

    if (error) {
      console.error('Error updating imposter status:', error)
      return NextResponse.json(
        { error: 'Failed to update imposter status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        ticker: data.ticker,
        is_imposter: data.is_imposter
      }
    })
  } catch (error) {
    console.error('Error in mark-imposter API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}