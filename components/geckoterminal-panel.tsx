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
    }
    callTimestamp?: string | null
  }
  onClose: () => void
}

export function GeckoTerminalPanel({ token, onClose }: GeckoTerminalPanelProps) {
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
          <div>
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
            {token.priceData && (
              <div className="text-right grid grid-cols-3 gap-4">
                {/* Entry Price */}
                <div>
                  <div className="text-xs text-muted-foreground">Entry</div>
                  <div className="text-sm font-mono font-medium">
                    ${formatPrice(token.priceData.priceAtCall)}
                  </div>
                  {token.priceData.marketCapAtCall && (
                    <div className="text-xs text-muted-foreground">
                      {formatMarketCap(token.priceData.marketCapAtCall)}
                    </div>
                  )}
                </div>
                
                {/* ATH */}
                <div>
                  <div className="text-xs text-muted-foreground">ATH</div>
                  <div className="text-sm font-mono font-medium">
                    ${formatPrice(token.priceData.ath)}
                  </div>
                  {token.priceData.athMarketCap && (
                    <div className="text-xs text-muted-foreground">
                      {formatMarketCap(token.priceData.athFdv || token.priceData.athMarketCap)}
                    </div>
                  )}
                  {token.priceData.athROI !== null && token.priceData.athROI !== undefined && (
                    <div className={`text-xs font-medium ${
                      token.priceData.athROI > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {token.priceData.athROI > 0 ? '+' : ''}{token.priceData.athROI.toFixed(0)}%
                    </div>
                  )}
                </div>
                
                {/* Now */}
                <div>
                  <div className="text-xs text-muted-foreground">Now</div>
                  <div className="text-sm font-mono font-medium">
                    ${formatPrice(token.priceData.currentPrice)}
                  </div>
                  {token.priceData.currentMcap && (
                    <div className="text-xs text-muted-foreground">
                      {formatMarketCap(token.priceData.currentFdv || token.priceData.currentMcap)}
                    </div>
                  )}
                  {token.priceData.roi !== null && token.priceData.roi !== undefined && (
                    <div className={`text-xs font-medium ${
                      token.priceData.roi > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {token.priceData.roi > 0 ? '+' : ''}{token.priceData.roi.toFixed(0)}%
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