import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    }
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
  
  // GeckoTerminal embed URL
  const embedUrl = `https://www.geckoterminal.com/${networkSlug}/pools/${token.contract}?embed=1&info=0&swaps=1`
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{token.ticker} - GeckoTerminal Chart</h3>
            <p className="text-sm text-muted-foreground">
              Contract: {token.contract} ({networkSlug})
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {token.priceData && (
              <div className="text-right space-y-1">
                {token.priceData.currentPrice !== null && token.priceData.currentPrice !== undefined && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Price: </span>
                    <span className="font-mono font-medium">
                      ${token.priceData.currentPrice < 0.00001 
                        ? token.priceData.currentPrice.toExponential(2) 
                        : token.priceData.currentPrice.toFixed(6)}
                    </span>
                  </div>
                )}
                {token.priceData.currentMcap !== null && token.priceData.currentMcap !== undefined && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">MCap: </span>
                    <span className="font-mono font-medium">
                      ${token.priceData.currentMcap >= 1000000 
                        ? (token.priceData.currentMcap / 1000000).toFixed(2) + 'M'
                        : token.priceData.currentMcap >= 1000
                        ? (token.priceData.currentMcap / 1000).toFixed(2) + 'K'
                        : token.priceData.currentMcap.toFixed(0)}
                    </span>
                  </div>
                )}
                {token.priceData.roi !== null && token.priceData.roi !== undefined && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">ROI: </span>
                    <span className={`font-mono font-medium ${
                      token.priceData.roi > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {token.priceData.roi > 0 ? '+' : ''}{token.priceData.roi.toFixed(0)}%
                    </span>
                  </div>
                )}
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
        
        <div className="flex-1 p-4">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg border"
            title={`GeckoTerminal chart for ${token.ticker}`}
          />
        </div>
        
        <div className="p-4 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              If the chart doesn't load, the token might not be listed on GeckoTerminal
            </p>
            <Button
              variant="outline"
              onClick={() => window.open(`https://www.geckoterminal.com/${networkSlug}/pools/${token.contract}`, '_blank')}
            >
              Open in GeckoTerminal
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}