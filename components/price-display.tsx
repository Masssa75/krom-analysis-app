import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Loader2, DollarSign, Trophy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PriceData {
  priceAtCall: number | null
  currentPrice: number | null
  ath: number | null
  athDate: string | null
  athDateFormatted?: string | null
  callDateFormatted?: string | null
  priceUpdatedAt?: string | null  // When current price was last updated
  roi: number | null
  athROI: number | null
  drawdownFromATH: number | null
  marketCapAtCall: number | null
  currentMarketCap: number | null
  athMarketCap: number | null
  fdvAtCall: number | null
  currentFDV: number | null
  athFDV: number | null
}

interface PriceDisplayProps {
  contractAddress: string | null
  callTimestamp: string
  kromId: string
  network?: string
  existingPriceData?: PriceData | null
  rawData?: any // To access raw_data.trade.buyPrice
}

export function PriceDisplay({ contractAddress, callTimestamp, kromId, network, existingPriceData, rawData }: PriceDisplayProps) {
  const [loading, setLoading] = useState(false)
  const [priceData, setPriceData] = useState<PriceData | null>(existingPriceData || null)
  const [error, setError] = useState<string | null>(null)
  
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A'
    if (price < 0.00001) return price.toExponential(2)
    if (price < 0.01) return price.toFixed(6)
    if (price < 1) return price.toFixed(4)
    return price.toFixed(2)
  }
  
  const fetchPriceData = async () => {
    if (!contractAddress) {
      setError('No contract address')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Always use Supabase Edge Function by default
      console.log('Fetching via Supabase Edge Function for:', contractAddress)
      const response = await fetch('https://eucfoommxxvqmmwdbkdv.supabase.co/functions/v1/crypto-price-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          contractAddress,
          callTimestamp: new Date(callTimestamp).getTime(),
          network: network
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch price data')
      }
      
      setPriceData(data)
      
      // Save to database for caching
      const saveResponse = await fetch('/api/save-price-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kromId,
          priceAtCall: data.priceAtCall,
          currentPrice: data.currentPrice,
          ath: data.ath,
          athTimestamp: data.athDate,
          roi: data.roi,
          athROI: data.athROI,
          network: data.network,
          marketCapAtCall: data.marketCapAtCall,
          currentMarketCap: data.currentMarketCap,
          athMarketCap: data.athMarketCap,
          fdvAtCall: data.fdvAtCall,
          currentFDV: data.currentFDV,
          athFDV: data.athFDV,
          tokenSupply: data.tokenSupply
        })
      })
      
      // Data saved successfully
    } catch (err: any) {
      console.error('Error fetching price:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    // If we have existing price data, use it
    // But check if it's actually valid data (not all nulls)
    if (existingPriceData) {
      const hasValidData = existingPriceData.priceAtCall !== null || 
                          existingPriceData.currentPrice !== null || 
                          existingPriceData.ath !== null
      if (hasValidData) {
        setPriceData(existingPriceData)
      }
    }
  }, [existingPriceData])
  
  if (!contractAddress) {
    return (
      <div className="text-xs text-muted-foreground">
        No contract
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Fetching...</span>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="space-y-1">
        <div className="text-xs text-red-500">Error</div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchPriceData()}
          className="h-6 text-xs"
        >
          Retry
        </Button>
      </div>
    )
  }
  
  if (!priceData) {
    // Check if we have buy price in raw_data
    const buyPrice = rawData?.trade?.buyPrice
    
    return (
      <div className="space-y-1">
        {buyPrice ? (
          <div className="text-xs font-mono">
            Entry: $${formatPrice(buyPrice)}
          </div>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchPriceData()}
          className="h-6 text-xs"
          title="Fetch price data"
        >
          <DollarSign className="h-3 w-3 mr-1" />
          {buyPrice ? 'Fetch All' : 'Fetch'}
        </Button>
      </div>
    )
  }
  
  
  const formatPercent = (percent: number | null) => {
    if (percent === null) return 'N/A'
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(0)}%`
  }
  
  const formatMarketCap = (mc: number | null) => {
    if (mc === null) return 'N/A'
    if (mc >= 1000000000) return `$${(mc / 1000000000).toFixed(2)}B`
    if (mc >= 1000000) return `$${(mc / 1000000).toFixed(2)}M`
    if (mc >= 1000) return `$${(mc / 1000).toFixed(2)}K`
    return `$${mc.toFixed(0)}`
  }
  
  const roiColor = (roi: number | null) => {
    if (roi === null) return ''
    if (roi > 100) return 'text-green-600 font-semibold'
    if (roi > 0) return 'text-green-500'
    if (roi > -50) return 'text-red-500'
    return 'text-red-600 font-semibold'
  }
  
  // Check if we have absolutely no data
  const hasNoData = priceData.priceAtCall === null && priceData.currentPrice === null && priceData.ath === null
  
  // If we have no price data at all, show refetch buttons
  if (hasNoData) {
    return (
      <div className="space-y-1.5 text-xs">
        <div className="text-muted-foreground">N/A</div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchPriceData()}
            className="h-6 text-xs"
            title="Refetch using Netlify function"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refetch
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchPriceData()}
            className="h-6 text-xs border-blue-500 text-blue-600 hover:bg-blue-50"
            title="Refetch using Supabase Edge Function"
          >
            Edge
          </Button>
        </div>
      </div>
    )
  }
  
  // Always show simple price-based view (removed complex market cap view)
  return (
    <div className="space-y-1.5 text-xs">
      <div className="space-y-1">
        {priceData.priceAtCall !== null && (
          <div 
            className="flex items-center gap-1 cursor-help hover:opacity-80 transition-opacity"
            title={priceData.callDateFormatted ? priceData.callDateFormatted : undefined}
          >
            <span className="text-muted-foreground">Entry:</span>
            <span className="font-mono font-medium">${formatPrice(priceData.priceAtCall)}</span>
          </div>
        )}
        
        {priceData.currentPrice !== null && (
          <div 
            className="flex items-center gap-1 cursor-help hover:opacity-80 transition-opacity"
            title={`Current price: $${formatPrice(priceData.currentPrice)}${
              priceData.priceUpdatedAt 
                ? `\nLast updated: ${new Date(priceData.priceUpdatedAt).toLocaleString('en-US', {
                    timeZone: 'Asia/Bangkok',
                    year: 'numeric',
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })} (Thai Time)`
                : ''
            }`}
          >
            <span className="text-muted-foreground">Now:</span>
            <span className="font-mono font-medium">${formatPrice(priceData.currentPrice)}</span>
          </div>
        )}
        
        {priceData.ath !== null && (
          <div 
            className="flex items-center gap-1 cursor-help hover:opacity-80 transition-opacity"
            title={priceData.athDateFormatted || (priceData.athDate ? new Date(priceData.athDate).toLocaleDateString() : undefined)}
          >
            <Trophy className="h-3 w-3 text-yellow-500" />
            <span className="text-muted-foreground">ATH:</span>
            <span className="font-mono font-medium">${formatPrice(priceData.ath)}</span>
          </div>
        )}
      </div>
      
      {/* ROI Display */}
      {(priceData.roi !== null || priceData.athROI !== null) && (
        <div className="flex items-center gap-3 pt-1 border-t">
          {priceData.roi !== null && (
            <div className={`flex items-center gap-1 ${roiColor(priceData.roi)}`}>
              {priceData.roi > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{formatPercent(priceData.roi)}</span>
            </div>
          )}
          
          {priceData.athROI !== null && (
            <div className={`flex items-center gap-1 ${roiColor(priceData.athROI)}`}>
              <Trophy className="h-3 w-3" />
              <span>{formatPercent(priceData.athROI)}</span>
            </div>
          )}
        </div>
      )}
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => fetchPriceData()}
        className="h-6 text-xs"
        title="Fetch ATH and complete price data"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        Fetch All
      </Button>
    </div>
  )
}