'use client'

import { useState, useEffect } from 'react'

interface TopCall {
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
}

export default function TopEarlyCalls() {
  const [calls, setCalls] = useState<TopCall[]>([])
  const [period, setPeriod] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopCalls()
  }, [period])

  const fetchTopCalls = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/top-calls?period=${period}`)
      const data = await response.json()
      setCalls(data.data || [])
    } catch (error) {
      console.error('Error fetching top calls:', error)
      setCalls([])
    }
    setLoading(false)
  }

  const formatROI = (roi: number) => {
    if (roi >= 1000) {
      return `${(roi / 1000).toFixed(1)}k%`
    }
    return `${roi.toFixed(0)}%`
  }

  const formatPrice = (price: number) => {
    if (!price) return '-'
    if (price < 0.00001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const getNetworkColor = (network: string) => {
    const colors: { [key: string]: string } = {
      ethereum: 'text-blue-400',
      solana: 'text-purple-400',
      bsc: 'text-yellow-400',
      base: 'text-blue-300',
      arbitrum: 'text-blue-500',
      polygon: 'text-purple-300'
    }
    return colors[network.toLowerCase()] || 'text-gray-400'
  }

  const getScoreBadge = (score: number | null, tier: string | null) => {
    if (!score) return null
    
    let bgColor = 'bg-gray-800'
    let textColor = 'text-gray-400'
    
    if (tier === 'ALPHA') {
      bgColor = 'bg-green-900/30'
      textColor = 'text-green-400'
    } else if (tier === 'SOLID') {
      bgColor = 'bg-blue-900/30'
      textColor = 'text-blue-400'
    } else if (tier === 'BASIC') {
      bgColor = 'bg-yellow-900/30'
      textColor = 'text-yellow-400'
    } else if (tier === 'TRASH') {
      bgColor = 'bg-red-900/30'
      textColor = 'text-red-400'
    }
    
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${bgColor} ${textColor}`}>
        {score}/10
      </span>
    )
  }

  return (
    <div className="p-10 border-b border-[#111]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl text-[#00ff88] tracking-[3px] font-extralight">TOP EARLY CALLS</h2>
        <div className="flex gap-2">
          {['24h', '7d', '90d', 'all'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs uppercase tracking-wider transition-all ${
                period === p 
                  ? 'bg-[#00ff88] text-black font-semibold' 
                  : 'bg-[#1a1c1f] text-[#666] hover:bg-[#222427] hover:text-[#888]'
              }`}
            >
              {p === 'all' ? 'All Time' : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-[#0f1011] border border-[#1a1c1f] p-4 animate-pulse">
              <div className="h-4 bg-[#1a1c1f] rounded mb-2"></div>
              <div className="h-8 bg-[#1a1c1f] rounded mb-2"></div>
              <div className="h-4 bg-[#1a1c1f] rounded"></div>
            </div>
          ))}
        </div>
      ) : calls.length === 0 ? (
        <div className="text-[#444] text-center py-8">
          No calls found for this time period
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {calls.map((call, index) => (
            <div 
              key={call.id} 
              className="bg-[#0f1011] border border-[#1a1c1f] p-4 hover:border-[#2a2d31] transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#333] text-2xl font-bold">#{index + 1}</span>
                  <div>
                    <div className="font-semibold text-white">{call.ticker}</div>
                    <div className={`text-xs ${getNetworkColor(call.network)}`}>
                      {call.network.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#00ff88] font-bold text-lg">
                    +{formatROI(call.ath_roi_percent)}
                  </div>
                  <div className="text-[#666] text-xs">ATH ROI</div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#666]">Entry</span>
                  <span className="text-[#888]">{formatPrice(call.price_at_call)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">ATH</span>
                  <span className="text-[#00ff88]">{formatPrice(call.ath_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Current</span>
                  <span className="text-[#888]">{formatPrice(call.current_price)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1a1c1f]">
                {getScoreBadge(call.analysis_score, call.analysis_tier)}
                {getScoreBadge(call.x_analysis_score, call.x_analysis_tier)}
                <a
                  href={`https://dexscreener.com/${call.network}/${call.contract_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[#444] hover:text-[#00ff88] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}