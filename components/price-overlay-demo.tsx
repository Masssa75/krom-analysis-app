'use client'

interface PriceOverlayDemoProps {
  ticker: string
  contract: string
  network: string
  priceAtCall?: number
  athPrice?: number
  currentPrice?: number
}

export function PriceOverlayDemo({ 
  ticker, 
  contract, 
  network, 
  priceAtCall = 0.0152,
  athPrice = 0.3301,
  currentPrice = 0.0895
}: PriceOverlayDemoProps) {
  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toExponential(2)
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
  }

  const calculatePercentage = (from: number, to: number) => {
    return ((to / from - 1) * 100).toFixed(0)
  }

  // Determine the network slug for GeckoTerminal
  const getNetworkSlug = (network: string) => {
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
    }
    return networkMap[network.toLowerCase()] || 'eth'
  }

  const networkSlug = getNetworkSlug(network)
  const embedUrl = `https://www.geckoterminal.com/${networkSlug}/pools/${contract}?embed=1&info=0&swaps=0`

  return (
    <div className="w-full">
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">{ticker} - Price Overlay Demo</h3>
          <p className="text-sm text-gray-400">
            Contract: {contract} ({network})
          </p>
        </div>

        {/* Chart container with overlay */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ height: '500px' }}>
          {/* GeckoTerminal iframe */}
          <iframe
            src={embedUrl}
            className="w-full h-full"
            title={`GeckoTerminal chart for ${ticker}`}
          />
          
          {/* Price level overlays */}
          <div className="absolute top-4 right-4 space-y-2 pointer-events-none">
            {/* Entry Price */}
            <div className="bg-green-500/90 text-white px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="font-medium">Entry: ${formatPrice(priceAtCall)}</span>
            </div>
            
            {/* ATH Price */}
            <div className="bg-red-500/90 text-white px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="font-medium">
                ATH: ${formatPrice(athPrice)} 
                <span className="text-xs ml-1">(+{calculatePercentage(priceAtCall, athPrice)}%)</span>
              </span>
            </div>
            
            {/* Current Price */}
            <div className="bg-blue-500/90 text-white px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="font-medium">
                Now: ${formatPrice(currentPrice)}
                <span className="text-xs ml-1">
                  ({Number(calculatePercentage(priceAtCall, currentPrice)) > 0 ? '+' : ''}{calculatePercentage(priceAtCall, currentPrice)}%)
                </span>
              </span>
            </div>
          </div>

          {/* Alternative: Bottom bar with prices */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3">
            <div className="flex justify-around text-sm">
              <div className="text-center">
                <div className="text-gray-400 text-xs">Entry</div>
                <div className="text-green-400 font-mono font-medium">${formatPrice(priceAtCall)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">ATH</div>
                <div className="text-red-400 font-mono font-medium">${formatPrice(athPrice)}</div>
                <div className="text-red-300 text-xs">+{calculatePercentage(priceAtCall, athPrice)}%</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">Current</div>
                <div className="text-blue-400 font-mono font-medium">${formatPrice(currentPrice)}</div>
                <div className={`text-xs ${Number(calculatePercentage(priceAtCall, currentPrice)) > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {Number(calculatePercentage(priceAtCall, currentPrice)) > 0 ? '+' : ''}{calculatePercentage(priceAtCall, currentPrice)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>* This demo shows how we can overlay price labels on top of the GeckoTerminal iframe</p>
          <p>* The labels are positioned absolutely and don\'t interfere with chart interaction</p>
        </div>
      </div>
    </div>
  )
}