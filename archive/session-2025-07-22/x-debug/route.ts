import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Count total calls with x_raw_tweets
    const { count: totalWithTweets } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('x_raw_tweets', 'is', null)
    
    // Count calls with x_raw_tweets but no x_analysis_score
    const { count: needingAnalysis } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('x_raw_tweets', 'is', null)
      .is('x_analysis_score', null)
    
    // Count calls with x_analysis_score
    const { count: alreadyScored } = await supabase
      .from('crypto_calls')
      .select('*', { count: 'exact', head: true })
      .not('x_analysis_score', 'is', null)
    
    // Get sample of calls needing analysis
    const { data: sampleCalls, error: sampleError } = await supabase
      .from('crypto_calls')
      .select('krom_id, ticker, buy_timestamp, x_raw_tweets, x_analysis_score, x_analysis_tier')
      .not('x_raw_tweets', 'is', null)
      .is('x_analysis_score', null)
      .order('buy_timestamp', { ascending: true })
      .limit(5)
    
    // Check if x_raw_tweets is actually an array
    let tweetDataInfo = null
    if (sampleCalls && sampleCalls.length > 0) {
      const firstCall = sampleCalls[0]
      tweetDataInfo = {
        hasRawTweets: !!firstCall.x_raw_tweets,
        isArray: Array.isArray(firstCall.x_raw_tweets),
        tweetCount: Array.isArray(firstCall.x_raw_tweets) ? firstCall.x_raw_tweets.length : 0,
        sampleTweet: Array.isArray(firstCall.x_raw_tweets) && firstCall.x_raw_tweets.length > 0 
          ? firstCall.x_raw_tweets[0] 
          : null
      }
    }
    
    // Test the exact query used in x-batch
    const { data: batchQueryTest, error: batchError } = await supabase
      .from('crypto_calls')
      .select('krom_id, ticker, x_raw_tweets, buy_timestamp')
      .not('x_raw_tweets', 'is', null)
      .is('x_analysis_score', null)
      .order('buy_timestamp', { ascending: true })
      .limit(5)
    
    return NextResponse.json({
      debug: {
        totalWithTweets,
        needingAnalysis,
        alreadyScored,
        sampleCallsCount: sampleCalls?.length || 0,
        sampleCalls,
        tweetDataInfo,
        batchQueryTest: {
          count: batchQueryTest?.length || 0,
          error: batchError,
          data: batchQueryTest
        }
      }
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Debug failed' 
    }, { status: 500 })
  }
}