import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Loader2, DollarSign, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
  
  const fetchPriceData = async () => {
    if (!contractAddress) {
      setError('No contract address')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/token-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          callTimestamp: new Date(callTimestamp).getTime()
        })
      })
      
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
    if (existingPriceData) {
      setPriceData(existingPriceData)
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
      <Button
        size="sm"
        variant="outline"
        onClick={fetchPriceData}
        className="h-6 text-xs"
      >
        <DollarSign className="h-3 w-3 mr-1" />
        Get Price
      </Button>
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
  
  return (
    <TooltipProvider>
      <div className="space-y-1.5 text-xs">
        {/* Market Cap Column */}
        <div className="space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-default">
                <span className="text-muted-foreground">Entry:</span>
                <span className="font-mono font-medium">{formatMarketCap(priceData.marketCapAtCall)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Price: {formatPrice(priceData.priceAtCall)}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-default">
                <span className="text-muted-foreground">Now:</span>
                <span className="font-mono font-medium">{formatMarketCap(priceData.currentMarketCap)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Price: {formatPrice(priceData.currentPrice)}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-default">
                <Trophy className="h-3 w-3 text-yellow-500" />
                <span className="text-muted-foreground">ATH:</span>
                <span className="font-mono font-medium">{formatMarketCap(priceData.athMarketCap)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Price: {formatPrice(priceData.ath)}</p>
              {priceData.athDate && (
                <p>Date: {new Date(priceData.athDate).toLocaleDateString()}</p>
              )}
            </TooltipContent>
          </Tooltip>
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
    </TooltipProvider>
  )
}