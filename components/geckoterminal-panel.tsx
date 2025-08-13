'use client'

import { X, ChevronDown, ChevronUp, Globe, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

// Helper functions for formatting
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return 'N/A'
  if (price < 0.00001) return price.toExponential(2)
  if (price < 0.01) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  return price.toFixed(2)
}

const formatMarketCap = (mcap: number | null | undefined) => {
  if (!mcap) return ''
  if (mcap >= 1000000) return `$${(mcap / 1000000).toFixed(2)}M`
  if (mcap >= 1000) return `$${(mcap / 1000).toFixed(2)}K`
  return `$${mcap.toFixed(0)}`
}

interface GeckoTerminalPanelProps {
  token: {
    ticker: string
    contract: string | null
    network: string | null
    kromId?: string
    priceData?: {
      currentPrice?: number | null
      priceAtCall?: number | null
      roi?: number | null
      currentMarketCap?: number | null
      currentFdv?: number | null
      ath?: number | null
      athROI?: number | null
      marketCapAtCall?: number | null
      athMarketCap?: number | null
      athFdv?: number | null
    }
    callTimestamp?: string | null
    socialData?: {
      website?: string | null
      twitter?: string | null
      telegram?: string | null
      discord?: string | null
    }
  }
  onClose: () => void
}

interface DexScreenerData {
  website?: string
  twitter?: string
  telegram?: string
}

export function GeckoTerminalPanel({ token, onClose }: GeckoTerminalPanelProps) {
  const [priceData, setPriceData] = useState(token.priceData || null)
  const [loading, setLoading] = useState(false)
  const [isInfoExpanded, setIsInfoExpanded] = useState(false)
  // Use social data from props if available, otherwise null
  const [dexScreenerData, setDexScreenerData] = useState<DexScreenerData | null>(
    token.socialData ? {
      website: token.socialData.website || undefined,
      twitter: token.socialData.twitter || undefined,
      telegram: token.socialData.telegram || undefined
    } : null
  )
  const [dexLoading, setDexLoading] = useState(false)
  
  useEffect(() => {
    // Fetch fresh price data from database when panel opens
    const fetchPriceData = async () => {
      if (!token.contract) return
      
      setLoading(true)
      try {
        const response = await fetch('/api/get-token-prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: token.contract,
            ticker: token.ticker,
            kromId: token.kromId
          })
        })
        
        const data = await response.json()
        if (data.priceData) {
          setPriceData(data.priceData)
        }
      } catch (error) {
        console.error('Failed to fetch price data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPriceData()
  }, [token.contract, token.ticker, token.kromId])
  
  // Only fetch DexScreener data if we don't have social data from props
  useEffect(() => {
    if (!isInfoExpanded || !token.contract || dexScreenerData || token.socialData) return
    
    const fetchDexScreenerData = async () => {
      setDexLoading(true)
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.contract}`)
        const data = await response.json()
        
        if (data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0]
          const socialLinks: DexScreenerData = {}
          
          // Extract website
          if (pair.info?.websites && pair.info.websites.length > 0) {
            socialLinks.website = pair.info.websites[0].url
          }
          
          // Extract social links
          if (pair.info?.socials) {
            const twitterLink = pair.info.socials.find((s: any) => s.type === 'twitter')
            const telegramLink = pair.info.socials.find((s: any) => s.type === 'telegram')
            
            if (twitterLink) socialLinks.twitter = twitterLink.url
            if (telegramLink) socialLinks.telegram = telegramLink.url
          }
          
          setDexScreenerData(socialLinks)
        }
      } catch (error) {
        console.error('Failed to fetch DexScreener data:', error)
      } finally {
        setDexLoading(false)
      }
    }
    
    fetchDexScreenerData()
  }, [isInfoExpanded, token.contract, dexScreenerData, token.socialData])
  
  if (!token.contract) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-md" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-2">{token.ticker}</h3>
          <p className="text-muted-foreground">No contract address available</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    )
  }

  // Determine the network slug for GeckoTerminal
  const getNetworkSlug = (network: string | null) => {
    if (!network) return 'eth' // default to Ethereum
    
    const networkMap: Record<string, string> = {
      'ethereum': 'eth',
      'eth': 'eth',
      'solana': 'solana',
      'bsc': 'bsc',
      'binance': 'bsc',
      'base': 'base',
      'polygon': 'polygon',
      'arbitrum': 'arbitrum',
      'avalanche': 'avax',
      'optimism': 'optimism',
      'hyperevm': 'hyperevm',
      'hyper': 'hyperevm'
    }
    
    return networkMap[network.toLowerCase()] || 'eth'
  }

  const networkSlug = getNetworkSlug(token.network)
  
  // GeckoTerminal embed URL - hide transactions section to maximize chart space
  const embedUrl = `https://www.geckoterminal.com/${networkSlug}/pools/${token.contract}?embed=1&info=0&swaps=0`
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{token.ticker} - GeckoTerminal Chart</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Contract: {token.contract} ({networkSlug})</span>
              {token.callTimestamp && (
                <span className="border-l pl-4">
                  Call: {new Date(token.callTimestamp).toLocaleString('en-US', {
                    timeZone: 'Asia/Bangkok',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })} (Thai Time)
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {(priceData || loading) && (
              <div className="text-right grid grid-cols-3 gap-4">
                {/* Entry Price */}
                <div>
                  <div className="text-xs text-muted-foreground">Entry</div>
                  <div className="text-sm font-mono font-medium">
                    ${loading ? '...' : formatPrice(priceData?.priceAtCall)}
                  </div>
                  {priceData?.marketCapAtCall && (
                    <div className="text-xs text-muted-foreground">
                      {formatMarketCap(priceData.marketCapAtCall)}
                    </div>
                  )}
                </div>
                
                {/* ATH */}
                <div>
                  <div className="text-xs text-muted-foreground">ATH</div>
                  <div className="text-sm font-mono font-medium">
                    ${loading ? '...' : formatPrice(priceData?.ath)}
                  </div>
                  {priceData?.athMarketCap && (
                    <div className="text-xs text-muted-foreground">
                      {formatMarketCap(priceData.athFdv || priceData.athMarketCap)}
                    </div>
                  )}
                  {priceData?.athROI !== null && priceData?.athROI !== undefined && (
                    <div className={`text-xs font-medium ${
                      priceData.athROI > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {priceData.athROI > 0 ? '+' : ''}{priceData.athROI.toFixed(0)}%
                    </div>
                  )}
                </div>
                
                {/* Now */}
                <div>
                  <div className="text-xs text-muted-foreground">Now</div>
                  <div className="text-sm font-mono font-medium">
                    ${loading ? '...' : formatPrice(priceData?.currentPrice)}
                  </div>
                  {priceData?.currentMarketCap && (
                    <div className="text-xs text-muted-foreground">
                      {formatMarketCap(priceData.currentFdv || priceData.currentMarketCap)}
                    </div>
                  )}
                  {priceData?.roi !== null && priceData?.roi !== undefined && (
                    <div className={`text-xs font-medium ${
                      priceData.roi > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {priceData.roi > 0 ? '+' : ''}{priceData.roi.toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Collapsible Token Info Section */}
        <div className="border-b">
          <button
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-sm font-medium">Market Data & Links</span>
            {isInfoExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          {isInfoExpanded && (
            <div className="px-4 pb-3 space-y-3">
              {/* Market Cap & Supply Data Section */}
              {priceData && (
                <div className="space-y-3 border-b pb-3">
                  {/* Market Cap Row */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Market Cap:</span>
                      <span className="ml-2 font-medium">
                        {formatMarketCap(priceData.currentMarketCap) || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Market Cap at Call:</span>
                      <span className="ml-2 font-medium">
                        {priceData.marketCapAtCall 
                          ? formatMarketCap(priceData.marketCapAtCall)
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Social Links Section */}
              {dexLoading ? (
                <div className="text-sm text-muted-foreground py-2">Loading token information...</div>
              ) : (
                <div className="flex items-center gap-4 text-sm">
                  {dexScreenerData?.website && (
                    <a
                      href={dexScreenerData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {dexScreenerData?.twitter && (
                    <a
                      href={dexScreenerData.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      X/Twitter
                    </a>
                  )}
                  {dexScreenerData?.telegram && (
                    <a
                      href={dexScreenerData.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Telegram
                    </a>
                  )}
                  {!dexScreenerData?.website && !dexScreenerData?.twitter && !dexScreenerData?.telegram && (
                    <span className="text-muted-foreground">No social links available</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 p-2">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            title={`GeckoTerminal chart for ${token.ticker}`}
          />
        </div>
      </div>
    </div>
  )
}