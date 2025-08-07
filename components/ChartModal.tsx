'use client'

import { useEffect } from 'react'

interface ChartModalProps {
  isOpen: boolean
  onClose: () => void
  token: {
    ticker: string
    network: string
    contract_address: string
    buy_timestamp: string
    price_at_call: number
    ath_price: number
    current_price: number
    roi_percent: number
    ath_roi_percent: number
    analysis_score?: number
    analysis_tier?: string
    x_analysis_score?: number
    x_analysis_tier?: string
    volume_24h?: number
    liquidity_usd?: number
    pool_address?: string
    group_name?: string
  } | null
}

export default function ChartModal({ isOpen, onClose, token }: ChartModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !token) return null

  const formatPrice = (price: number | null | undefined) => {
    if (!price && price !== 0) return '-'
    if (price < 0.00000001) return `$${price.toExponential(2)}`
    if (price < 0.000001) return `$${price.toFixed(9)}`
    if (price < 0.001) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(5)}`
    return `$${price.toFixed(2)}`
  }

  const formatROI = (roi: number) => {
    if (!roi && roi !== 0) return '-'
    const prefix = roi >= 0 ? '+' : ''
    return `${prefix}${Math.round(roi)}%`
  }

  const formatMultiplier = (roi: number) => {
    const multiplier = (roi / 100) + 1
    return `${multiplier.toFixed(2)}x`
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    })
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

  const getTierColors = (tier: string) => {
    if (!tier) return { bg: '#88888822', text: '#888' }
    
    const colors: { [key: string]: { bg: string, text: string } } = {
      ALPHA: { bg: '#00ff8822', text: '#00ff88' },
      SOLID: { bg: '#ffcc0022', text: '#ffcc00' },
      BASIC: { bg: '#88888822', text: '#888' },
      TRASH: { bg: '#ff444422', text: '#ff4444' }
    }
    return colors[tier] || { bg: '#88888822', text: '#888' }
  }

  const roiColor = token.roi_percent >= 0 ? '#00ff88' : '#ff4444'

  // Build GeckoTerminal embed URL
  const geckoNetwork = token.network.toLowerCase() === 'ethereum' ? 'eth' : token.network.toLowerCase()
  const geckoTerminalUrl = token.pool_address 
    ? `https://www.geckoterminal.com/${geckoNetwork}/pools/${token.pool_address}?embed=1&info=0&swaps=0`
    : `https://www.geckoterminal.com/${geckoNetwork}/pools?token=${token.contract_address}&embed=1&info=0&swaps=0`

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-5"
      onClick={onClose}
    >
      <div 
        className="bg-[#111214] rounded-2xl border border-[#2a2d31] w-full max-w-[1200px] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#1a1c1f] bg-[#0a0b0d]">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold text-white">{token.ticker}</span>
              <span 
                className="text-[11px] px-2 py-1 rounded font-semibold"
                style={{ 
                  color: getNetworkColor(token.network), 
                  backgroundColor: getNetworkBgColor(token.network) 
                }}
              >
                {getNetworkLabel(token.network)}
              </span>
            </div>
            <div className="text-[#666] text-[13px]">
              Called: {formatDate(token.buy_timestamp)}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[#1a1c1f] text-[#666] flex items-center justify-center text-xl hover:bg-[#222426] hover:text-white transition-all"
          >
            ×
          </button>
        </div>

        {/* Chart */}
        <div className="h-[500px] bg-black flex items-center justify-center relative">
          <iframe 
            className="w-full h-full border-0 bg-black"
            src={geckoTerminalUrl}
            title={`${token.ticker} Chart`}
          />
        </div>

        {/* Info Bar */}
        <div className="bg-[#0a0b0d] border-t border-[#1a1c1f] p-6">
          <div className="flex justify-between items-center">
            {/* Price Metrics */}
            <div className="flex gap-10">
              <div className="flex flex-col">
                <div className="text-[11px] text-[#666] mb-1 uppercase tracking-wider">Entry</div>
                <div className="text-lg font-semibold text-white">{formatPrice(token.price_at_call)}</div>
              </div>
              <div className="flex flex-col">
                <div className="text-[11px] text-[#666] mb-1 uppercase tracking-wider">Current</div>
                <div className="text-lg font-semibold text-white">{formatPrice(token.current_price)}</div>
              </div>
              <div className="flex flex-col">
                <div className="text-[11px] text-[#666] mb-1 uppercase tracking-wider">ATH</div>
                <div className="text-lg font-semibold text-white">{formatPrice(token.ath_price)}</div>
              </div>
              <div className="flex flex-col">
                <div className="text-[11px] text-[#666] mb-1 uppercase tracking-wider">ROI</div>
                <div className="text-lg font-semibold" style={{ color: roiColor }}>
                  {formatROI(token.roi_percent)}
                </div>
                <div className="text-[11px] text-[#888] mt-0.5">{formatMultiplier(token.roi_percent)}</div>
              </div>
              <div className="flex flex-col">
                <div className="text-[11px] text-[#666] mb-1 uppercase tracking-wider">ATH ROI</div>
                <div className="text-lg font-semibold text-[#00ff88]">
                  {formatROI(token.ath_roi_percent)}
                </div>
                <div className="text-[11px] text-[#888] mt-0.5">{formatMultiplier(token.ath_roi_percent)}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <a 
                href={`https://www.geckoterminal.com/${geckoNetwork}/pools?token=${token.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-[#1a1c1f] border border-[#2a2d31] text-[#ccc] hover:bg-[#222426] hover:border-[#333] hover:text-white transition-all flex items-center gap-1.5"
              >
                GeckoTerminal
                <span className="text-sm">↗</span>
              </a>
              <a 
                href={`https://dexscreener.com/${token.network}/${token.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-gradient-to-r from-[#00ff88] to-[#00ffcc] text-black hover:brightness-110 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                DexScreener
                <span className="text-sm">↗</span>
              </a>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-5 pt-5 border-t border-[#1a1c1f] flex justify-between items-center">
            <div className="flex gap-8">
              {/* AI Scores */}
              {token.analysis_score && (
                <div className="flex flex-col">
                  <div className="text-[10px] text-[#666] mb-1 uppercase tracking-wider">AI Score</div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold" style={{ color: getTierColors(token.analysis_tier || '').text }}>
                      {token.analysis_score.toFixed(1)}
                    </span>
                    {token.analysis_tier && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ 
                          backgroundColor: getTierColors(token.analysis_tier).bg,
                          color: getTierColors(token.analysis_tier).text 
                        }}
                      >
                        {token.analysis_tier}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {token.x_analysis_score && (
                <div className="flex flex-col">
                  <div className="text-[10px] text-[#666] mb-1 uppercase tracking-wider">X Score</div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold" style={{ color: getTierColors(token.x_analysis_tier || '').text }}>
                      {token.x_analysis_score.toFixed(1)}
                    </span>
                    {token.x_analysis_tier && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ 
                          backgroundColor: getTierColors(token.x_analysis_tier).bg,
                          color: getTierColors(token.x_analysis_tier).text 
                        }}
                      >
                        {token.x_analysis_tier}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Market Stats */}
              {token.volume_24h && (
                <div className="flex flex-col">
                  <div className="text-[10px] text-[#666] mb-1 uppercase tracking-wider">24h Volume</div>
                  <div className="text-sm font-medium text-[#ccc]">
                    ${(token.volume_24h / 1000000).toFixed(1)}M
                  </div>
                </div>
              )}
              
              {token.liquidity_usd && (
                <div className="flex flex-col">
                  <div className="text-[10px] text-[#666] mb-1 uppercase tracking-wider">Liquidity</div>
                  <div className="text-sm font-medium text-[#ccc]">
                    ${(token.liquidity_usd / 1000).toFixed(0)}K
                  </div>
                </div>
              )}
            </div>

            {/* Contract & Group */}
            <div className="flex items-center gap-4">
              {token.group_name && (
                <div className="text-xs text-[#666]">
                  Group: <span className="text-[#888]">{token.group_name}</span>
                </div>
              )}
              <button 
                onClick={() => navigator.clipboard.writeText(token.contract_address)}
                className="text-[10px] px-2 py-1 bg-[#1a1c1f] border border-[#2a2d31] rounded text-[#666] hover:border-[#00ff88] hover:text-[#00ff88] transition-all"
              >
                Copy CA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}