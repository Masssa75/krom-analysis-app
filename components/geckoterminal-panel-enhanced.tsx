'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface GeckoTerminalPanelProps {
  token: {
    ticker: string
    contract: string | null
    network: string | null
    priceData?: {
      currentPrice?: number | null
      priceAtCall?: number | null
      roi?: number | null
      currentMcap?: number | null
      currentFdv?: number | null
      ath?: number | null
      athROI?: number | null
      marketCapAtCall?: number | null
      athMarketCap?: number | null
      athFdv?: number | null
      athDateFormatted?: string | null
      callDateFormatted?: string | null
    }
    callTimestamp?: string | null
  }
  onClose: () => void
}

export function GeckoTerminalPanelEnhanced({ token, onClose }: GeckoTerminalPanelProps) {
  const [priceData, setPriceData] = useState(token.priceData || {})
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)

  // Fetch price data if not available
  useEffect(() => {
    if (!token.contract || !token.network) return
    
    // If we don't have price data or it's incomplete, fetch it
    if (!priceData.currentPrice || !priceData.priceAtCall || !priceData.ath) {
      setIsLoadingPrice(true)
      
      fetch('/api/token-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: token.contract,
          network: token.network,
          callTimestamp: token.callTimestamp
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setPriceData(data.data)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingPrice(false))
    }
  }, [token.contract, token.network, token.callTimestamp])

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
    if (!network) return 'eth'
    
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
  const embedUrl = `https://www.geckoterminal.com/${networkSlug}/pools/${token.contract}?embed=1&info=0&swaps=0`
  
  // Extract ATH date from formatted string if available
  const athDate = priceData.athDateFormatted ? 
    priceData.athDateFormatted.split(',')[0] : // Extract "Jul 27" from "Jul 27, 2025, 07:00 AM (Thai Time)"
    null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header with new design */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{token.ticker} - GeckoTerminal Chart</h3>
              <div className="text-xs text-muted-foreground mt-1">
                {networkSlug.toUpperCase()} • {token.contract} • 
                {token.callTimestamp && ` Called ${formatDate(token.callTimestamp)}`}
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              {/* Entry Card */}
              <div className="bg-gray-800 dark:bg-gray-800/50 rounded-lg px-4 py-2 min-w-[140px]">
                <div className="text-xs text-green-400 mb-0.5">ENTRY</div>
                <div className="font-mono text-sm font-semibold">
                  {isLoadingPrice ? '...' : `$${formatPrice(priceData.priceAtCall)}`}
                </div>
                {priceData.marketCapAtCall && (
                  <div className="text-xs text-muted-foreground">
                    {formatMarketCap(priceData.marketCapAtCall)}
                  </div>
                )}
              </div>
              
              {/* ATH Card */}
              <div className="bg-gray-800 dark:bg-gray-800/50 rounded-lg px-4 py-2 min-w-[140px]">
                <div className="text-xs text-red-400 mb-0.5">
                  ATH {athDate && `• ${athDate}`}
                </div>
                <div className="font-mono text-sm font-semibold">
                  {isLoadingPrice ? '...' : `$${formatPrice(priceData.ath)}`}
                </div>
                {priceData.athROI !== null && priceData.athROI !== undefined && (
                  <div className={`text-xs font-medium ${
                    priceData.athROI > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {priceData.athROI > 0 ? '↑' : '↓'} {Math.abs(priceData.athROI).toFixed(0)}%
                  </div>
                )}
              </div>
              
              {/* Current Card */}
              <div className="bg-gray-800 dark:bg-gray-800/50 rounded-lg px-4 py-2 min-w-[140px]">
                <div className="text-xs text-blue-400 mb-0.5">CURRENT</div>
                <div className="font-mono text-sm font-semibold">
                  {isLoadingPrice ? '...' : `$${formatPrice(priceData.currentPrice)}`}
                </div>
                {priceData.roi !== null && priceData.roi !== undefined && (
                  <div className={`text-xs font-medium ${
                    priceData.roi > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {priceData.roi > 0 ? '↑' : '↓'} {Math.abs(priceData.roi).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-3"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Chart iframe */}
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