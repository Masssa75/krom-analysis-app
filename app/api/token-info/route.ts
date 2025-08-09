// API endpoint to fetch token information including social links from DexScreener
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const contract = searchParams.get('contract')
    const network = searchParams.get('network')
    
    if (!contract || !network) {
      return NextResponse.json({ error: 'Missing contract or network' }, { status: 400 })
    }
    
    // Fetch from DexScreener API
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contract}`)
    const data = await response.json()
    
    // Find the pair for the specific network
    const pair = data.pairs?.find((p: any) => 
      p.chainId?.toLowerCase() === network.toLowerCase() ||
      (network.toLowerCase() === 'ethereum' && p.chainId?.toLowerCase() === 'ethereum') ||
      (network.toLowerCase() === 'bsc' && p.chainId?.toLowerCase() === 'bsc') ||
      (network.toLowerCase() === 'solana' && p.chainId?.toLowerCase() === 'solana')
    ) || data.pairs?.[0]
    
    if (!pair) {
      return NextResponse.json({ 
        website: null,
        twitter: null,
        telegram: null,
        discord: null,
        imageUrl: null,
        description: null
      })
    }
    
    // Extract token info - handle websites array properly
    const websiteObj = pair.info?.websites?.[0]
    const websiteUrl = typeof websiteObj === 'string' ? websiteObj : websiteObj?.url || null
    
    const tokenInfo = {
      website: websiteUrl,
      twitter: pair.info?.socials?.find((s: any) => s.type === 'twitter')?.url || null,
      telegram: pair.info?.socials?.find((s: any) => s.type === 'telegram')?.url || null,
      discord: pair.info?.socials?.find((s: any) => s.type === 'discord')?.url || null,
      imageUrl: pair.info?.imageUrl || pair.baseToken?.info?.imageUrl || null,
      description: pair.info?.description || null,
      
      // Additional data that might be useful
      fdv: pair.fdv,
      marketCap: pair.marketCap,
      liquidity: pair.liquidity?.usd,
      volume24h: pair.volume?.h24,
      priceChange24h: pair.priceChange?.h24,
      holders: pair.baseToken?.info?.holders,
      
      // DexScreener URL for the token
      dexscreenerUrl: `https://dexscreener.com/${network}/${contract}`
    }
    
    return NextResponse.json(tokenInfo)
  } catch (error) {
    console.error('Error fetching token info:', error)
    return NextResponse.json({ 
      website: null,
      twitter: null,
      telegram: null,
      discord: null,
      imageUrl: null,
      description: null
    })
  }
}