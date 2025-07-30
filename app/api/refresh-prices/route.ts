import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const NETWORK_MAP: { [key: string]: string } = {
  'ethereum': 'eth',
  'solana': 'solana',
  'bsc': 'bsc',
  'polygon': 'polygon',
  'arbitrum': 'arbitrum',
  'base': 'base'
};

// Cache durations
const NEW_TOKEN_HOURS = 24;  // Tokens less than 24 hours old
const NEW_TOKEN_CACHE_MINUTES = 5;  // 5 minute cache for new tokens
const STANDARD_CACHE_MINUTES = 60;  // 1 hour cache for older tokens

export async function POST(request: NextRequest) {
  const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { tokens } = await request.json();
    
    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const now = new Date();
    const tokensToUpdate = [];
    const priceResults: { [key: string]: any } = {};

    // Determine which tokens need updates based on smart caching
    for (const token of tokens) {
      if (!token.contract_address || !token.network) continue;

      const lastUpdated = token.price_updated_at ? new Date(token.price_updated_at) : null;
      const tokenAge = token.created_at ? (now.getTime() - new Date(token.created_at).getTime()) / (1000 * 60 * 60) : Infinity;
      
      // Determine cache duration based on token age
      const cacheMinutes = tokenAge < NEW_TOKEN_HOURS ? NEW_TOKEN_CACHE_MINUTES : STANDARD_CACHE_MINUTES;
      const isStale = !lastUpdated || (now.getTime() - lastUpdated.getTime()) > cacheMinutes * 60 * 1000;

      if (isStale) {
        tokensToUpdate.push(token);
      } else {
        // Return cached price
        priceResults[token.contract_address.toLowerCase()] = {
          price: token.current_price,
          cached: true,
          lastUpdated: token.price_updated_at
        };
      }
    }

    // Batch fetch prices using DexScreener (supports up to 30 tokens)
    if (tokensToUpdate.length > 0) {
      // Split into batches of 30
      const batches = [];
      for (let i = 0; i < tokensToUpdate.length; i += 30) {
        batches.push(tokensToUpdate.slice(i, i + 30));
      }

      for (const batch of batches) {
        const addresses = batch.map(t => t.contract_address).join(',');
        
        try {
          const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses}`);
          
          if (response.ok) {
            const data = await response.json();
            
            // Process DexScreener results
            if (data.pairs && Array.isArray(data.pairs)) {
              for (const pair of data.pairs) {
                const contractAddress = pair.baseToken?.address?.toLowerCase();
                if (contractAddress && pair.priceUsd) {
                  const price = parseFloat(pair.priceUsd);
                  
                  // Find the original token to update
                  const originalToken = batch.find(t => 
                    t.contract_address.toLowerCase() === contractAddress
                  );
                  
                  if (originalToken) {
                    // Update database
                    const { error } = await supabase
                      .from('crypto_calls')
                      .update({
                        current_price: price,
                        price_updated_at: now.toISOString()
                      })
                      .eq('id', originalToken.id);

                    if (!error) {
                      priceResults[contractAddress] = {
                        price: price,
                        cached: false,
                        lastUpdated: now.toISOString(),
                        source: 'DexScreener'
                      };
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('DexScreener batch fetch error:', error);
        }
      }

      // Fallback to GeckoTerminal for tokens not found on DexScreener
      for (const token of tokensToUpdate) {
        const contractLower = token.contract_address.toLowerCase();
        if (!priceResults[contractLower]) {
          try {
            const apiNetwork = NETWORK_MAP[token.network] || token.network;
            const geckoResponse = await fetch(
              `https://api.geckoterminal.com/api/v2/networks/${apiNetwork}/tokens/${token.contract_address}/pools`
            );

            if (geckoResponse.ok) {
              const geckoData = await geckoResponse.json();
              const pools = geckoData.data || [];
              
              if (pools.length > 0) {
                let bestPrice = 0;
                for (const pool of pools) {
                  const poolPrice = parseFloat(pool.attributes?.token_price_usd || '0');
                  if (poolPrice > bestPrice) {
                    bestPrice = poolPrice;
                  }
                }

                if (bestPrice > 0) {
                  // Update database
                  const { error } = await supabase
                    .from('crypto_calls')
                    .update({
                      current_price: bestPrice,
                      price_updated_at: now.toISOString()
                    })
                    .eq('id', token.id);

                  if (!error) {
                    priceResults[contractLower] = {
                      price: bestPrice,
                      cached: false,
                      lastUpdated: now.toISOString(),
                      source: 'GeckoTerminal'
                    };
                  }
                }
              }
            }
          } catch (error) {
            console.error(`GeckoTerminal fetch error for ${token.ticker}:`, error);
          }

          // Small delay between GeckoTerminal requests
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    // Return all results
    const summary = {
      requested: tokens.length,
      cached: Object.values(priceResults).filter((r: any) => r.cached).length,
      updated: Object.values(priceResults).filter((r: any) => !r.cached).length,
      failed: tokens.length - Object.keys(priceResults).length
    };

    return NextResponse.json({
      success: true,
      prices: priceResults,
      summary
    });

  } catch (error) {
    console.error('Price refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh prices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}