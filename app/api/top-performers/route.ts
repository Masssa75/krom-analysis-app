import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch top performers based on ATH ROI
    // Include tokens with significant gains (10X or more)
    const { data: performers, error } = await supabase
      .from('crypto_calls')
      .select(`
        ticker,
        raw_data,
        source,
        ath_roi_percent,
        roi_percent,
        contract_address,
        network,
        buy_timestamp,
        current_price,
        ath_price
      `)
      .or('ath_roi_percent.gte.10,roi_percent.gte.10')
      .not('ticker', 'is', null)
      .order('ath_roi_percent', { ascending: false, nullsFirst: false })
      .limit(30)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch performers' }, { status: 500 })
    }

    // Process the data to extract group information
    const processedPerformers = performers?.map((p, index) => {
      // Debug first few items
      if (index < 3) {
        console.log(`Token ${p.ticker} raw_data sample:`, 
          typeof p.raw_data === 'string' 
            ? p.raw_data.substring(0, 200) 
            : JSON.stringify(p.raw_data).substring(0, 200)
        )
      }
      // Extract group from raw_data
      let group = 'Unknown'
      if (p.raw_data) {
        // Try to extract group name from the raw_data
        const rawDataStr = typeof p.raw_data === 'string' ? p.raw_data : JSON.stringify(p.raw_data)
        
        // Multiple patterns to extract group information
        // Pattern 1: Look for "Group: Name" format
        let groupMatch = rawDataStr.match(/Group[:\s]+([^,\n\r]+)/i)
        
        // Pattern 2: Look for "from Group Name" or "by Group Name"
        if (!groupMatch) {
          groupMatch = rawDataStr.match(/(?:from|by)\s+(?:Group\s+)?([A-Z][a-zA-Z0-9\s]+?)(?:\s+group)?(?:\n|\r|,|$)/i)
        }
        
        // Pattern 3: Look for known group names (Greek gods and letters)
        if (!groupMatch) {
          groupMatch = rawDataStr.match(/\b(Zeus|Apollo|Hermes|Ares|Athena|Poseidon|Artemis|Dionysus|Aphrodite|Hera|Demeter|Hephaestus|Hades|Persephone|Hestia|Nike|Hecate|Tyche|Nemesis|Iris|Pan|Morpheus|Hypnos|Thanatos|Nyx|Erebus|Gaia|Ouranos|Kronos|Rhea|Atlas|Prometheus|Epimetheus|Pandora|Helios|Selene|Eos|Boreas|Zephyrus|Notus|Eurus|Alpha|Beta|Gamma|Delta|Epsilon|Zeta|Eta|Theta|Iota|Kappa|Lambda|Mu|Nu|Xi|Omicron|Pi|Rho|Sigma|Tau|Upsilon|Phi|Chi|Psi|Omega)\b/i)
        }
        
        // Pattern 4: Look for any capitalized phrase that might be a group name
        if (!groupMatch) {
          groupMatch = rawDataStr.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:call|signal|alert)/i)
        }
        
        if (groupMatch) {
          group = groupMatch[1].trim()
          // Clean up the group name
          group = group.replace(/^Group\s+/i, '')
                      .replace(/\s+group$/i, '')
                      .trim()
        } else if (p.source && p.source !== 'krom') {
          // Fallback to source if it's not the default
          group = p.source
        }

      return {
        ticker: p.ticker,
        group,
        source: p.source || 'krom',
        ath_roi_percent: p.ath_roi_percent || 0,
        current_roi_percent: p.roi_percent || 0,
        contract_address: p.contract_address,
        network: p.network,
        buy_timestamp: p.buy_timestamp
      }
    }) || []

    // Filter to ensure we have meaningful data
    const validPerformers = processedPerformers.filter(p => 
      p.ticker && (p.ath_roi_percent > 0 || p.current_roi_percent > 0)
    )

    return NextResponse.json({ 
      performers: validPerformers,
      count: validPerformers.length 
    })

  } catch (error) {
    console.error('Error fetching top performers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}