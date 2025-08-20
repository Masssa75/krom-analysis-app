'use client'

import { useState, useEffect, useRef } from 'react'
import ChartModal from './ChartModal'
import { SortDropdown } from './sort-dropdown'
import SearchInput from './SearchInput'
import ColumnSettings, { ColumnVisibility } from './ColumnSettings'
import { WebsiteAnalysisTooltip } from './WebsiteAnalysisTooltip'

interface RecentCall {
  id: string
  ticker: string
  network: string
  contract_address: string
  buy_timestamp: string
  price_at_call: number
  ath_price: number
  ath_roi_percent: number
  ath_market_cap: number
  current_price: number
  roi_percent: number
  analysis_score: number
  analysis_tier: string
  analysis_reasoning?: string
  x_analysis_score: number
  x_analysis_tier: string
  x_analysis_reasoning?: string
  x_best_tweet?: string
  analysis_token_type: string
  x_analysis_token_type?: string
  is_imposter?: boolean
  website_score?: number
  website_tier?: string
  website_token_type?: string
  website_analysis_reasoning?: string
  website_analysis_full?: any
  pool_address?: string
  volume_24h?: number
  liquidity_usd?: number
  market_cap_at_call: number
  current_market_cap: number
  group_name: string
}

interface RecentCallsProps {
  filters?: {
    tokenType?: 'all' | 'meme' | 'utility'
    networks?: string[]
    liquidityMin?: number
    liquidityMax?: number
    marketCapMin?: number
    marketCapMax?: number
    excludeRugs?: boolean
    excludeImposters?: boolean
    socialFilters?: string[]
    minCallScore?: number
    minXScore?: number
    minWebsiteScore?: number
  }
  isGodMode?: boolean
}

export default function RecentCalls({ filters = { tokenType: 'all' }, isGodMode = false }: RecentCallsProps) {
  const [calls, setCalls] = useState<RecentCall[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedToken, setSelectedToken] = useState<RecentCall | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sortBy, setSortBy] = useState('buy_timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    callAnalysis: true,
    xAnalysis: true,
    websiteAnalysis: false,
    showScores: true,
    showBadges: true
  })
  const itemsPerPage = 20
  
  // AbortController ref to cancel in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setCurrentPage(1)  // Reset to first page when filters change
  }, [filters, searchQuery])

  useEffect(() => {
    fetchRecentCalls()
    
    // Cleanup function to cancel request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [currentPage, sortBy, sortOrder, filters, searchQuery])

  const fetchRecentCalls = async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        page: currentPage.toString(),
        sortBy,
        sortOrder,
        tokenType: filters?.tokenType || 'all',
        networks: filters?.networks?.join(',') || 'ethereum,solana,bsc,base'
      })
      
      // Add search query if present
      if (searchQuery) {
        params.set('search', searchQuery)
      }
      
      // Add optional range filters
      if (filters?.liquidityMin !== undefined) {
        params.set('liquidityMin', filters.liquidityMin.toString())
      }
      if (filters?.liquidityMax !== undefined) {
        params.set('liquidityMax', filters.liquidityMax.toString())
      }
      if (filters?.marketCapMin !== undefined) {
        params.set('marketCapMin', filters.marketCapMin.toString())
      }
      if (filters?.marketCapMax !== undefined) {
        params.set('marketCapMax', filters.marketCapMax.toString())
      }
      if (filters?.excludeRugs !== undefined) {
        params.set('excludeRugs', filters.excludeRugs.toString())
      }
      if (filters?.excludeImposters !== undefined) {
        params.set('excludeImposters', filters.excludeImposters.toString())
      }
      if (filters?.socialFilters && filters.socialFilters.length > 0) {
        params.set('socialFilters', filters.socialFilters.join(','))
      }
      if (filters?.minCallScore !== undefined) {
        params.set('minCallScore', filters.minCallScore.toString())
      }
      if (filters?.minXScore !== undefined) {
        params.set('minXScore', filters.minXScore.toString())
      }
      if (filters?.minWebsiteScore !== undefined) {
        params.set('minWebsiteScore', filters.minWebsiteScore.toString())
      }
      
      const response = await fetch(`/api/recent-calls?${params}`, {
        signal: abortController.signal
      })
      
      // Only proceed if the request wasn't aborted
      if (!abortController.signal.aborted) {
        const data = await response.json()
        setCalls(data.data || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.totalCount || 0)
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name !== 'AbortError') {
        console.error('Error fetching recent calls:', error)
        setCalls([])
      }
    } finally {
      // Only set loading to false if this is the current request
      if (abortController === abortControllerRef.current) {
        setLoading(false)
      }
    }
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

  const formatMarketCap = (marketCap: number | null | undefined) => {
    if (!marketCap && marketCap !== 0) return 'N/A'
    
    // Format market caps nicely
    if (marketCap >= 1000000000) return `$${(marketCap / 1000000000).toFixed(2)}B`
    if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(1)}M`
    if (marketCap >= 1000) return `$${(marketCap / 1000).toFixed(0)}K`
    return `$${marketCap.toFixed(0)}`
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
      TRASH: { bg: '#ff444422', text: '#ff4444' },
      FAILED: { bg: '#ff666622', text: '#ff6666' }  // Red/orange for failed
    }
    return colors[tier] || { bg: '#88888822', text: '#888' }
  }


  const handleTokenClick = (call: RecentCall) => {
    setSelectedToken(call)
    setIsModalOpen(true)
  }
  
  const handleMarkImposter = async (callId: string, isImposter: boolean) => {
    try {
      const response = await fetch('/api/mark-imposter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callId, isImposter })
      })
      
      if (response.ok) {
        // Update the local state
        setCalls(prevCalls => 
          prevCalls.map(call => 
            call.id === callId 
              ? { ...call, is_imposter: isImposter }
              : call
          )
        )
      } else {
        console.error('Failed to mark as imposter')
      }
    } catch (error) {
      console.error('Error marking imposter:', error)
    }
  }

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  return (
    <div className="py-8 px-0 bg-[#0a0b0d]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-8 px-10">
          <div className="flex items-center">
            <h2 className="text-xl text-[#00ff88] tracking-[3px] font-extralight m-0">RECENT CALLS</h2>
            <ColumnSettings onSettingsChange={setColumnVisibility} />
            <SearchInput onSearch={setSearchQuery} />
          </div>
          <SortDropdown onSortChange={handleSortChange} />
        </div>
        
        <div className="flex flex-col gap-0">
          {loading ? (
            [...Array(Math.min(itemsPerPage, 10))].map((_, i) => (
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
              {searchQuery ? `No tokens found matching "${searchQuery}"` : 'No recent calls found'}
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
                        className={`font-semibold text-base cursor-pointer transition-colors ${
                          call.is_imposter 
                            ? 'text-red-500 line-through hover:text-red-400' 
                            : 'text-white hover:text-[#00ff88]'
                        }`}
                        onClick={() => handleTokenClick(call)}
                      >
                        {call.ticker}
                      </span>
                      {/* Token Type Badge - Show website type if available, otherwise use call/X type */}
                      {(() => {
                        const tokenType = call.website_token_type || call.analysis_token_type || call.x_analysis_token_type;
                        if (!tokenType) return null;
                        
                        return (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-semibold ${
                            tokenType === 'utility' 
                              ? 'bg-[#00a8ff22] text-[#00a8ff]' 
                              : 'bg-[#ff00ff22] text-[#ff00ff]'
                          }`}>
                            {tokenType.toUpperCase()}
                          </span>
                        );
                      })()}
                      <span 
                        className="text-[10px] px-1 py-0.5 rounded-sm font-medium"
                        style={{ 
                          color: getNetworkColor(call.network), 
                          backgroundColor: getNetworkBgColor(call.network) 
                        }}
                      >
                        {getNetworkLabel(call.network)}
                      </span>
                    </div>
                    
                    {/* Analysis Scores - Only show if enabled and showScores is true */}
                    {columnVisibility.showScores && (
                      <div className="flex items-center gap-2">
                        {columnVisibility.callAnalysis && call.analysis_score && (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-[#666]">CALL</span>
                            <div className="text-lg font-semibold text-white">
                              {call.analysis_score.toFixed(1)}
                            </div>
                          </div>
                        )}
                        
                        {columnVisibility.xAnalysis && call.x_analysis_score && (
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-[#666]">X</span>
                            <div className="text-lg font-semibold text-white">
                              {call.x_analysis_score.toFixed(1)}
                            </div>
                          </div>
                        )}
                        
                        {columnVisibility.websiteAnalysis && call.website_score !== undefined && call.website_score !== null && (
                          <WebsiteAnalysisTooltip fullAnalysis={call.website_analysis_full}>
                            <div className="flex flex-col items-center cursor-help">
                              <span className="text-[9px] text-[#666]">WEB</span>
                              <div className="text-lg font-semibold text-white">
                                {call.website_score === 0 && call.website_analysis_reasoning?.includes('ERROR') 
                                  ? '❌' 
                                  : (call.website_score / 21 * 10).toFixed(1)}
                              </div>
                            </div>
                          </WebsiteAnalysisTooltip>
                        )}
                      </div>
                    )}
                    
                    {/* Tier Badges - Show based on visibility settings and showBadges */}
                    {columnVisibility.showBadges && (
                      <div className="flex gap-1.5">
                        {columnVisibility.callAnalysis && call.analysis_tier && (
                          <span 
                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: callTier.bg, color: callTier.text }}
                          >
                            C: {call.analysis_tier}
                          </span>
                        )}
                        {columnVisibility.xAnalysis && call.x_analysis_tier && (
                          <span 
                            className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: xTier.bg, color: xTier.text }}
                          >
                            X: {call.x_analysis_tier}
                          </span>
                        )}
                        {columnVisibility.websiteAnalysis && call.website_tier && (
                          <WebsiteAnalysisTooltip fullAnalysis={call.website_analysis_full}>
                            <span 
                              className="text-[9px] px-1.5 py-0.5 rounded font-semibold cursor-help"
                              style={{ 
                                backgroundColor: (call.website_score === 0 && call.website_analysis_reasoning?.includes('ERROR')) ? '#ff666622' : getTierColor(call.website_tier).bg, 
                                color: (call.website_score === 0 && call.website_analysis_reasoning?.includes('ERROR')) ? '#ff6666' : getTierColor(call.website_tier).text 
                              }}
                            >
                              W: {(call.website_score === 0 && call.website_analysis_reasoning?.includes('ERROR')) ? 'FAILED' : call.website_tier}
                            </span>
                          </WebsiteAnalysisTooltip>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {/* Liquidity */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">LIQUIDITY</span>
                      <span className="text-white text-sm font-medium">
                        {call.liquidity_usd ? formatMarketCap(call.liquidity_usd) : 'N/A'}
                      </span>
                    </div>
                    
                    {/* Market Cap Info */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">ENTRY MC</span>
                      <span className="text-white text-sm font-medium">
                        {formatMarketCap(call.market_cap_at_call)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">ATH MC</span>
                      <span className="text-white text-sm font-medium">
                        {formatMarketCap(call.ath_market_cap)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">NOW MC</span>
                      <span className="text-white text-sm font-medium">
                        {formatMarketCap(call.current_market_cap)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">ROI</span>
                      <span className="text-base font-semibold" style={{ color: roiColor }}>
                        {formatROI(call.roi_percent)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[#666] text-[10px]">ATH ROI</span>
                      <span className="text-base font-semibold text-[#00ff88]">
                        {formatROI(call.ath_roi_percent)}
                      </span>
                    </div>
                    
                    {/* Group & Time */}
                    <div className="text-[#888] text-xs">
                      <div>{call.group_name}</div>
                      <div className="text-[#666]">{formatTime(call.buy_timestamp)}</div>
                    </div>
                    
                    {/* God Mode Admin Button */}
                    {isGodMode && (
                      <div className="ml-4">
                        <button
                          onClick={() => handleMarkImposter(call.id, !call.is_imposter)}
                          className={`px-2 py-1 text-xs rounded ${
                            call.is_imposter 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          } transition-colors`}
                          title={call.is_imposter ? 'Unmark as imposter' : 'Mark as imposter'}
                        >
                          {call.is_imposter ? '🚫 Imposter' : 'Mark Imposter'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-10">
            <div className="text-[#666] text-sm">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} calls
            </div>
            
            <div className="flex items-center gap-2">
              {/* First Page Button */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  currentPage === 1 
                    ? 'bg-[#1a1c1f] text-[#444] cursor-not-allowed' 
                    : 'bg-[#1a1c1f] text-white hover:bg-[#252729]'
                }`}
                title="Go to first page"
              >
                ««
              </button>
              
              {/* Previous Arrow Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`w-8 h-8 text-sm rounded transition-colors ${
                  currentPage === 1 
                    ? 'bg-[#1a1c1f] text-[#444] cursor-not-allowed' 
                    : 'bg-[#1a1c1f] text-white hover:bg-[#252729]'
                }`}
              >
                ‹
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  if (pageNum < 1 || pageNum > totalPages) return null
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded transition-colors ${
                        currentPage === pageNum
                          ? 'bg-[#00ff88] text-black font-semibold'
                          : 'bg-[#1a1c1f] text-white hover:bg-[#252729]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              {/* Next Arrow Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 text-sm rounded transition-colors ${
                  currentPage === totalPages 
                    ? 'bg-[#1a1c1f] text-[#444] cursor-not-allowed' 
                    : 'bg-[#1a1c1f] text-white hover:bg-[#252729]'
                }`}
              >
                ›
              </button>
              
              {/* Last Page Button */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  currentPage === totalPages 
                    ? 'bg-[#1a1c1f] text-[#444] cursor-not-allowed' 
                    : 'bg-[#1a1c1f] text-white hover:bg-[#252729]'
                }`}
                title="Go to last page"
              >
                »»
              </button>
            </div>
          </div>
        )}
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