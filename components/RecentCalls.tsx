'use client'

import { useState, useEffect } from 'react'
import ChartModal from './ChartModal'

interface RecentCall {
  id: string
  ticker: string
  network: string
  contract_address: string
  buy_timestamp: string
  price_at_call: number
  ath_price: number
  ath_roi_percent: number
  current_price: number
  roi_percent: number
  analysis_score: number
  analysis_tier: string
  x_analysis_score: number
  x_analysis_tier: string
  analysis_token_type: string
  market_cap_at_call: number
  current_market_cap: number
  group_name: string
}

export default function RecentCalls() {
  const [calls, setCalls] = useState<RecentCall[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedToken, setSelectedToken] = useState<RecentCall | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchRecentCalls()
  }, [])

  const fetchRecentCalls = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recent-calls?limit=10')
      const data = await response.json()
      setCalls(data.data || [])
    } catch (error) {
      console.error('Error fetching recent calls:', error)
      setCalls([])
    }
    setLoading(false)
  }

  const formatPrice = (price: number | null | undefined) => {
    if (!price && price !== 0) return '-'
    
    // Very small prices (likely meme coins)
    if (price < 0.00000001) return `$${price.toExponential(2)}`
    if (price < 0.000001) return `$${price.toFixed(9)}`
    if (price < 0.001) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    if (price < 100) return `$${price.toFixed(2)}`
    if (price < 10000) return `$${price.toFixed(0)}`
    
    // For market cap style display
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`
    return `$${price.toFixed(0)}`
  }

  const formatROI = (roi: number) => {
    if (!roi && roi !== 0) return '-'
    const prefix = roi >= 0 ? '+' : ''
    return `${prefix}${Math.round(roi)}%`
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins}m ago`
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`
    }
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const getNetworkColor = (network: string) => {
    const colors: { [key: string]: string } = {
      ethereum: '#627eea',
      eth: '#627eea',
      solana: '#00ffa3',
      sol: '#00ffa3',
      bsc: '#ffcc00',
      base: '#0052ff',
      arbitrum: '#28a0f0',
      polygon: '#8247e5'
    }
    return colors[network.toLowerCase()] || '#888'
  }

  const getNetworkBgColor = (network: string) => {
    const colors: { [key: string]: string } = {
      ethereum: '#627eea22',
      eth: '#627eea22',
      solana: '#00ffa322',
      sol: '#00ffa322',
      bsc: '#ffcc0022',
      base: '#0052ff22',
      arbitrum: '#28a0f022',
      polygon: '#8247e522'
    }
    return colors[network.toLowerCase()] || '#88888822'
  }

  const getNetworkLabel = (network: string) => {
    const labels: { [key: string]: string } = {
      ethereum: 'ETH',
      eth: 'ETH',
      solana: 'SOL',
      sol: 'SOL',
      bsc: 'BSC',
      base: 'BASE',
      arbitrum: 'ARB',
      polygon: 'POLY'
    }
    return labels[network.toLowerCase()] || network.toUpperCase().slice(0, 3)
  }

  const getTierColor = (tier: string) => {
    if (!tier) return { bg: '#88888822', text: '#888' }
    
    const colors: { [key: string]: { bg: string, text: string } } = {
      ALPHA: { bg: '#00ff8822', text: '#00ff88' },
      SOLID: { bg: '#ffcc0022', text: '#ffcc00' },
      BASIC: { bg: '#88888822', text: '#888' },
      TRASH: { bg: '#ff444422', text: '#ff4444' }
    }
    return colors[tier] || { bg: '#88888822', text: '#888' }
  }

  const handleTokenClick = (call: RecentCall) => {
    setSelectedToken(call)
    setIsModalOpen(true)
  }

  return (
    <div className="py-8 px-0 bg-[#0a0b0d]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-8 px-10">
          <h2 className="text-xl text-[#00ff88] tracking-[3px] font-extralight m-0">RECENT CALLS</h2>
        </div>
        
        <div className="flex flex-col gap-0">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-3 px-10 border-b border-[#1a1c1f] animate-pulse">
                <div className="flex items-center gap-5">
                  <div className="h-6 w-20 bg-[#1a1c1f] rounded"></div>
                  <div className="h-5 w-10 bg-[#1a1c1f] rounded"></div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="h-5 w-16 bg-[#1a1c1f] rounded"></div>
                  <div className="h-5 w-16 bg-[#1a1c1f] rounded"></div>
                </div>
              </div>
            ))
          ) : calls.length === 0 ? (
            <div className="text-center py-8 text-[#666]">
              No recent calls found
            </div>
          ) : (
            calls.map(call => {
              const roiColor = call.roi_percent >= 0 ? '#00ff88' : '#ff4444'
              const callTier = getTierColor(call.analysis_tier)
              const xTier = getTierColor(call.x_analysis_tier)
              
              return (
                <div 
                  key={call.id} 
                  className="flex justify-between items-center py-3 px-10 border-b border-[#1a1c1f] hover:bg-[#0f1011] transition-colors"
                >
                  <div className="flex items-center gap-5">
                    {/* Token Info */}
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-semibold text-white text-base cursor-pointer hover:text-[#00ff88] transition-colors"
                        onClick={() => handleTokenClick(call)}
                      >
                        {call.ticker}
                      </span>
                      <span 
                        className="text-[10px] px-1 py-0.5 rounded-sm font-medium"
                        style={{ 
                          color: getNetworkColor(call.network), 
                          backgroundColor: getNetworkBgColor(call.network) 
                        }}
                      >
                        {getNetworkLabel(call.network)}
                      </span>
                      {call.analysis_token_type && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-semibold bg-[#ff00ff22] text-[#ff00ff]">
                          {call.analysis_token_type.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    {/* Scores */}
                    {call.analysis_score && (
                      <div className="text-xl font-semibold text-white">
                        {call.analysis_score.toFixed(1)}
                      </div>
                    )}
                    
                    {/* Tier Badges */}
                    <div className="flex gap-1.5">
                      {call.analysis_tier && (
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ backgroundColor: callTier.bg, color: callTier.text }}
                        >
                          {call.analysis_tier}
                        </span>
                      )}
                      {call.x_analysis_tier && call.x_analysis_tier !== call.analysis_tier && (
                        <span 
                          className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ backgroundColor: xTier.bg, color: xTier.text }}
                        >
                          X: {call.x_analysis_tier}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {/* Price Info */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">ENTRY</span>
                      <span className="text-white text-sm font-medium">
                        {formatPrice(call.price_at_call)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">ATH</span>
                      <span className="text-white text-sm font-medium">
                        {formatPrice(call.ath_price)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">NOW</span>
                      <span className="text-white text-sm font-medium">
                        {formatPrice(call.current_price)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">ROI</span>
                      <span className="text-base font-semibold" style={{ color: roiColor }}>
                        {formatROI(call.roi_percent)}
                      </span>
                    </div>
                    
                    {/* Group & Time */}
                    <div className="text-[#888] text-xs">
                      <div>{call.group_name}</div>
                      <div className="text-[#666]">{formatTime(call.buy_timestamp)}</div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chart Modal */}
      <ChartModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedToken(null)
        }}
        token={selectedToken}
      />
    </div>
  )
}