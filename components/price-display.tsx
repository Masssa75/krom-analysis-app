import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Loader2, DollarSign, Trophy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PriceData {
  priceAtCall: number | null
  currentPrice: number | null
  ath: number | null
  athDate: string | null
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
  existingPriceData?: PriceData | null
}

export function PriceDisplay({ contractAddress, callTimestamp, kromId, existingPriceData }: PriceDisplayProps) {
  const [loading, setLoading] = useState(false)
  const [priceData, setPriceData] = useState<PriceData | null>(existingPriceData || null)
  const [error, setError] = useState<string | null>(null)
  
  const fetchPriceData = async (viaEdgeFunction = false) => {
    if (!contractAddress) {
      setError('No contract address')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      let response;
      
      if (viaEdgeFunction) {
        // Call Supabase Edge Function
        console.log('Fetching via Edge Function for:', contractAddress)
        response = await fetch('https://eucfoommxxvqmmwdbkdv.supabase.co/functions/v1/crypto-price-single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            contractAddress,
            callTimestamp: new Date(callTimestamp).getTime()
          })
        })
      } else {
        // Call Netlify function
        console.log('Fetching via Netlify function for:', contractAddress)
        response = await fetch('/api/token-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractAddress,
            callTimestamp: new Date(callTimestamp).getTime()
          })
        })
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch price data')
      }
      
      setPriceData(data)
      
      // Save to database for caching
      await fetch('/api/save-price-data', {
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
          onClick={fetchPriceData}
          className="h-6 text-xs"
        >
          Retry
        </Button>
      </div>
    )
  }
  
  if (!priceData) {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchPriceData(false)}
          className="h-6 text-xs"
          title="Fetch using Netlify function"
        >
          <DollarSign className="h-3 w-3 mr-1" />
          Get Price
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchPriceData(true)}
          className="h-6 text-xs border-blue-500 text-blue-600 hover:bg-blue-50"
          title="Fetch using Supabase Edge Function"
        >
          Edge
        </Button>
      </div>
    )
  }
  
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A'
    if (price < 0.00001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
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
  
  // Check if all price data is N/A or if we're missing market cap data
  const hasNoData = (priceData.priceAtCall === null && priceData.currentPrice === null && priceData.ath === null) ||
    (priceData.marketCapAtCall === null && priceData.currentMarketCap === null && priceData.athMarketCap === null &&
     priceData.fdvAtCall === null && priceData.currentFDV === null && priceData.athFDV === null)
  
  if (hasNoData) {
    return (
      <div className="space-y-1.5 text-xs">
        <div className="text-muted-foreground">N/A</div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchPriceData(false)}
            className="h-6 text-xs"
            title="Refetch using Netlify function"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refetch
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchPriceData(true)}
            className="h-6 text-xs border-blue-500 text-blue-600 hover:bg-blue-50"
            title="Refetch using Supabase Edge Function"
          >
            Edge
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-1.5 text-xs">
      {/* Market Cap Column */}
      <div className="space-y-1">
        <div 
          className="flex items-center gap-1 cursor-help hover:opacity-80 transition-opacity"
          title={`Price: ${formatPrice(priceData.priceAtCall)}`}
        >
          <span className="text-muted-foreground">Entry:</span>
          <span className="font-mono font-medium">{formatMarketCap(priceData.fdvAtCall || priceData.marketCapAtCall)}</span>
        </div>
        
        <div 
          className="flex items-center gap-1 cursor-help hover:opacity-80 transition-opacity"
          title={`Price: ${formatPrice(priceData.currentPrice)}`}
        >
          <span className="text-muted-foreground">Now:</span>
          <span className="font-mono font-medium">{formatMarketCap(priceData.currentFDV || priceData.currentMarketCap)}</span>
        </div>
        
        <div 
          className="flex items-center gap-1 cursor-help hover:opacity-80 transition-opacity"
          title={`Price: ${formatPrice(priceData.ath)}${priceData.athDate ? ` | Date: ${new Date(priceData.athDate).toLocaleDateString()}` : ''}`}
        >
          <Trophy className="h-3 w-3 text-yellow-500" />
          <span className="text-muted-foreground">ATH:</span>
          <span className="font-mono font-medium">{formatMarketCap(priceData.athFDV || priceData.athMarketCap)}</span>
        </div>
      </div>
        
        {/* ROI Display */}
        <div className="flex items-center gap-3 pt-1 border-t">
          <div className={`flex items-center gap-1 ${roiColor(priceData.roi)}`}>
            {priceData.roi !== null && priceData.roi > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{formatPercent(priceData.roi)}</span>
          </div>
          
          <div className={`flex items-center gap-1 ${roiColor(priceData.athROI)}`}>
            <Trophy className="h-3 w-3" />
            <span>{formatPercent(priceData.athROI)}</span>
          </div>
        </div>
      </div>
  )
}