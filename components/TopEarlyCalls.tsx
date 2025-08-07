'use client'

import { useState, useEffect } from 'react'
import ChartModal from './ChartModal'

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
  analysis_reasoning?: string
  x_analysis_score: number
  x_analysis_tier: string
  x_analysis_reasoning?: string
  x_best_tweet?: string
  pool_address?: string
  volume_24h?: number
  liquidity_usd?: number
}

export default function TopEarlyCalls() {
  const [calls, setCalls] = useState<TopCall[]>([])
  const [period, setPeriod] = useState<string>('90d')
  const [loading, setLoading] = useState(true)
  const [selectedToken, setSelectedToken] = useState<TopCall | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
    // Convert from percentage to X multiplier (e.g., 100% = 2x, 200% = 3x)
    const multiplier = (roi / 100) + 1
    return `${Math.round(multiplier)}x`
  }

  const handleTokenClick = (call: TopCall) => {
    setSelectedToken(call)
    setIsModalOpen(true)
  }

  return (
    <div className="bg-black border-b border-[#111] py-10">
      <div className="max-w-[1200px] mx-auto px-10">
        <div className="flex justify-between items-center mb-8">
          <div className="text-xl text-[#00ff88] tracking-[3px] font-extralight flex items-center gap-4">
            TOP EARLY CALLS
          </div>
          
          {/* Time Selector with Dots */}
          <div className="flex gap-8">
            {[
              { key: '24h', label: '24H' },
              { key: '7d', label: '7D' },
              { key: '90d', label: '90D' },
              { key: 'all', label: 'ALL TIME' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`flex items-center gap-2 bg-transparent border-none text-sm font-normal tracking-wider cursor-pointer transition-all ${
                  period === key ? 'text-white' : 'text-[#666] hover:text-[#999]'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                  period === key 
                    ? 'bg-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.5)]' 
                    : 'bg-[#333]'
                }`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calls Grid */}
        <div className="grid grid-cols-3 gap-x-10 gap-y-5 text-left">
          {loading ? (
            [...Array(9)].map((_, i) => (
              <div key={i} className="text-lg font-extralight font-mono whitespace-nowrap leading-relaxed">
                <span className="text-[#00ff88] opacity-50">[</span>
                <span className="text-white font-normal animate-pulse">Loading</span>
                <span className="text-[#00ff88] opacity-50">]</span>
              </div>
            ))
          ) : calls.length === 0 ? (
            <div className="col-span-3 text-center text-[#666] py-8">
              No calls found for this time period
            </div>
          ) : (
            calls.slice(0, 9).map(call => (
              <div 
                key={call.id} 
                className="text-lg font-extralight font-mono whitespace-nowrap leading-relaxed cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleTokenClick(call)}
              >
                <span className="text-[#00ff88] opacity-50">[</span>
                <span className="text-white font-normal">{call.ticker}</span>
                <span className="text-[#00ff88] opacity-50">:</span>
                <span className="text-[#00ff88]">{formatROI(call.ath_roi_percent)}</span>
                <span className="text-[#00ff88] opacity-50">]</span>
              </div>
            ))
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