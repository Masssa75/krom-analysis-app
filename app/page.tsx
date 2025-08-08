'use client'

import { useState } from 'react'
import TopEarlyCalls from '@/components/TopEarlyCalls'
import RecentCalls from '@/components/RecentCalls'
import FloatingMenu from '@/components/FloatingMenu'

interface FilterState {
  tokenType: 'all' | 'meme' | 'utility'
  networks: string[]
  liquidityMin?: number
  liquidityMax?: number
  marketCapMin?: number
  marketCapMax?: number
  excludeRugs?: boolean
}

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>({ 
    tokenType: 'all',
    networks: ['ethereum', 'solana', 'bsc', 'base'],
    excludeRugs: true
  })
  const [isTokenTypeCollapsed, setIsTokenTypeCollapsed] = useState(false)
  const [includeUtility, setIncludeUtility] = useState(true)
  const [includeMeme, setIncludeMeme] = useState(true)
  const [isNetworksCollapsed, setIsNetworksCollapsed] = useState(true)
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(['ethereum', 'solana', 'bsc', 'base'])
  const [isRugsCollapsed, setIsRugsCollapsed] = useState(true)
  const [excludeRugs, setExcludeRugs] = useState(true)
  const [isRangeFiltersCollapsed, setIsRangeFiltersCollapsed] = useState(true)
  const [liquidityMin, setLiquidityMin] = useState<string>('')
  const [liquidityMax, setLiquidityMax] = useState<string>('')
  const [marketCapMin, setMarketCapMin] = useState<string>('')
  const [marketCapMax, setMarketCapMax] = useState<string>('')

  const handleTokenTypeChange = (utilityChecked: boolean, memeChecked: boolean) => {
    let newType: FilterState['tokenType'] = 'all'
    
    if (utilityChecked && memeChecked) {
      newType = 'all'
    } else if (utilityChecked && !memeChecked) {
      newType = 'utility'
    } else if (!utilityChecked && memeChecked) {
      newType = 'meme'
    } else {
      // Neither selected, default to all - re-check both
      setIncludeUtility(true)
      setIncludeMeme(true)
      newType = 'all'
      return // Don't update filters since we're resetting
    }
    
    setFilters(prev => ({ ...prev, tokenType: newType }))
  }

  return (
    <div className="fixed inset-0 flex bg-[#0a0b0d]">
      {/* Left Sidebar */}
      <div className="w-[300px] bg-[#111214] border-r border-[#2a2d31] flex-shrink-0 overflow-y-auto">
        <div className="p-5 border-b border-[#1a1c1f]">
          <div className="flex items-center justify-between">
            <h1 className="text-[32px] font-black tracking-[4px] text-[#00ff88] mb-1">KROM</h1>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 bg-[#2a2d31] hover:bg-[#3a3d41] text-[#888] hover:text-white text-xs font-semibold rounded transition-all border border-[#3a3d41]"
                onClick={() => window.open('https://raydium.io/swap/?inputMint=sol&outputMint=9eCEK7ttNtroHsFLnW8jW7pS9MtSAPrPPrZ6QCUFpump', '_blank')}
              >
                BUY
              </button>
              <button 
                className="w-9 h-9 rounded-full bg-transparent border-none flex items-center justify-center cursor-pointer transition-all p-0 hover:bg-[#1a1c1f]"
                onClick={() => window.open('https://t.me/OfficialKromOne', '_blank')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" className="transition-colors">
                  <path 
                    d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" 
                    className="fill-[#666] hover:fill-[#00ff88] transition-colors"
                  />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-[#666] text-xs">Advanced AI Powered Token Discovery</p>
          <div className="mt-2 mb-[15px]">
            <div className="text-[10px] text-[#666] mb-1">Contract Address:</div>
            <div className="text-[11px] text-[#888] break-all font-mono">
              9eCEK7ttNtroHsFLnW8jW7pS9MtSAPrPPrZ6QCUFpump
            </div>
          </div>
        </div>

        {/* Filters Title */}
        <div className="px-5 pt-5 pb-2">
          <h2 className="text-sm uppercase tracking-[2px] text-[#666] font-semibold">FILTERS</h2>
        </div>

        {/* Token Type Filter */}
        <div className={`border-b border-[#1a1c1f] ${isTokenTypeCollapsed ? 'collapsed' : ''}`}>
          <div 
            className="px-5 py-5 cursor-pointer flex justify-between items-center bg-[#111214] hover:bg-[#1a1c1f] hover:pl-6 transition-all"
            onClick={() => setIsTokenTypeCollapsed(!isTokenTypeCollapsed)}
          >
            <h3 className={`text-[13px] uppercase tracking-[1px] font-semibold transition-colors ${!isTokenTypeCollapsed ? 'text-[#00ff88]' : 'text-[#888]'}`}>
              Token Type
            </h3>
            <span className={`text-xs transition-all ${!isTokenTypeCollapsed ? 'text-[#00ff88]' : 'text-[#666]'} ${isTokenTypeCollapsed ? 'rotate-[-90deg]' : ''}`}>
              ▼
            </span>
          </div>
          <div className={`bg-[#0a0b0d] overflow-hidden transition-all ${isTokenTypeCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 p-5'}`}>
            <div className="flex flex-col gap-3">
              <label 
                className="flex items-center gap-2.5 cursor-pointer text-sm text-[#ccc] hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className={`w-5 h-5 border-2 rounded-[5px] transition-all flex items-center justify-center ${
                    includeUtility ? 'bg-[#00ff88] border-[#00ff88]' : 'border-[#333]'
                  }`}
                  onClick={() => {
                    const newUtilityState = !includeUtility
                    setIncludeUtility(newUtilityState)
                    handleTokenTypeChange(newUtilityState, includeMeme)
                  }}
                >
                  {includeUtility && <span className="text-black font-bold text-xs">✓</span>}
                </div>
                <span>Utility Tokens</span>
              </label>
              <label 
                className="flex items-center gap-2.5 cursor-pointer text-sm text-[#ccc] hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className={`w-5 h-5 border-2 rounded-[5px] transition-all flex items-center justify-center ${
                    includeMeme ? 'bg-[#00ff88] border-[#00ff88]' : 'border-[#333]'
                  }`}
                  onClick={() => {
                    const newMemeState = !includeMeme
                    setIncludeMeme(newMemeState)
                    handleTokenTypeChange(includeUtility, newMemeState)
                  }}
                >
                  {includeMeme && <span className="text-black font-bold text-xs">✓</span>}
                </div>
                <span>Meme Tokens</span>
              </label>
            </div>
          </div>
        </div>

        {/* Rugs Filter */}
        <div className={`border-b border-[#1a1c1f] ${isRugsCollapsed ? 'collapsed' : ''}`}>
          <div 
            className="px-5 py-5 cursor-pointer flex justify-between items-center bg-[#111214] hover:bg-[#1a1c1f] hover:pl-6 transition-all"
            onClick={() => setIsRugsCollapsed(!isRugsCollapsed)}
          >
            <h3 className={`text-[13px] uppercase tracking-[1px] font-semibold transition-colors ${!isRugsCollapsed ? 'text-[#00ff88]' : 'text-[#888]'}`}>
              Rugs
            </h3>
            <span className={`text-xs transition-all ${!isRugsCollapsed ? 'text-[#00ff88]' : 'text-[#666]'} ${isRugsCollapsed ? 'rotate-[-90deg]' : ''}`}>
              ▼
            </span>
          </div>
          <div className={`bg-[#0a0b0d] overflow-hidden transition-all ${isRugsCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 p-5'}`}>
            <div className="flex flex-col gap-3">
              <label 
                className="flex items-center gap-2.5 cursor-pointer text-sm text-[#ccc] hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className={`w-5 h-5 border-2 rounded-[5px] transition-all flex items-center justify-center ${
                    !excludeRugs ? 'bg-[#00ff88] border-[#00ff88]' : 'border-[#333]'
                  }`}
                  onClick={() => {
                    const newExcludeState = !excludeRugs
                    setExcludeRugs(newExcludeState)
                    setFilters(prev => ({ ...prev, excludeRugs: newExcludeState }))
                  }}
                >
                  {!excludeRugs && <span className="text-black font-bold text-xs">✓</span>}
                </div>
                <span>Include Rugs</span>
              </label>
              <div className="text-xs text-[#666] mt-1">
                When unchecked, hides tokens with:
                <ul className="list-disc list-inside mt-1 ml-2">
                  <li>ATH ROI &lt; 20% AND</li>
                  <li>Current ROI &lt; -75% AND</li>
                  <li>Liquidity &amp; Market Cap both &lt; $50K</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Networks Filter */}
        <div className={`border-b border-[#1a1c1f] ${isNetworksCollapsed ? 'collapsed' : ''}`}>
          <div 
            className="px-5 py-5 cursor-pointer flex justify-between items-center bg-[#111214] hover:bg-[#1a1c1f] hover:pl-6 transition-all"
            onClick={() => setIsNetworksCollapsed(!isNetworksCollapsed)}
          >
            <h3 className={`text-[13px] uppercase tracking-[1px] font-semibold transition-colors ${!isNetworksCollapsed ? 'text-[#00ff88]' : 'text-[#888]'}`}>
              Networks
            </h3>
            <span className={`text-xs transition-all ${!isNetworksCollapsed ? 'text-[#00ff88]' : 'text-[#666]'} ${isNetworksCollapsed ? 'rotate-[-90deg]' : ''}`}>
              ▼
            </span>
          </div>
          <div className={`bg-[#0a0b0d] overflow-hidden transition-all ${isNetworksCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 p-5'}`}>
            <div className="flex flex-col gap-3">
              {[
                { id: 'ethereum', label: 'Ethereum', color: '#627eea' },
                { id: 'solana', label: 'Solana', color: '#00ffa3' },
                { id: 'bsc', label: 'BSC', color: '#ffcc00' },
                { id: 'base', label: 'Base', color: '#0052ff' }
              ].map(network => (
                <label 
                  key={network.id}
                  className="flex items-center gap-2.5 cursor-pointer text-sm text-[#ccc] hover:text-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className={`w-5 h-5 border-2 rounded-[5px] transition-all flex items-center justify-center ${
                      selectedNetworks.includes(network.id) ? 'bg-[#00ff88] border-[#00ff88]' : 'border-[#333]'
                    }`}
                    onClick={() => {
                      const newNetworks = selectedNetworks.includes(network.id)
                        ? selectedNetworks.filter(n => n !== network.id)
                        : [...selectedNetworks, network.id]
                      
                      // Don't allow empty selection
                      if (newNetworks.length === 0) return
                      
                      setSelectedNetworks(newNetworks)
                      setFilters(prev => ({ ...prev, networks: newNetworks }))
                    }}
                  >
                    {selectedNetworks.includes(network.id) && <span className="text-black font-bold text-xs">✓</span>}
                  </div>
                  <span style={{ color: selectedNetworks.includes(network.id) ? network.color : '#ccc' }}>
                    {network.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Range Filters (Liquidity & Market Cap) */}
        <div className={`border-b border-[#1a1c1f] ${isRangeFiltersCollapsed ? 'collapsed' : ''}`}>
          <div 
            className="px-5 py-5 cursor-pointer flex justify-between items-center bg-[#111214] hover:bg-[#1a1c1f] hover:pl-6 transition-all"
            onClick={() => setIsRangeFiltersCollapsed(!isRangeFiltersCollapsed)}
          >
            <h3 className={`text-[13px] uppercase tracking-[1px] font-semibold transition-colors ${!isRangeFiltersCollapsed ? 'text-[#00ff88]' : 'text-[#888]'}`}>
              Liquidity & Market Cap
            </h3>
            <span className={`text-xs transition-all ${!isRangeFiltersCollapsed ? 'text-[#00ff88]' : 'text-[#666]'} ${isRangeFiltersCollapsed ? 'rotate-[-90deg]' : ''}`}>
              ▼
            </span>
          </div>
          <div className={`bg-[#0a0b0d] overflow-hidden transition-all ${isRangeFiltersCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 p-4'}`}>
            <div className="space-y-4">
              {/* Liquidity Range */}
              <div>
                <label className="text-xs uppercase tracking-wider text-[#666] mb-2 block">Liquidity (USD)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={liquidityMin}
                    onChange={(e) => {
                      setLiquidityMin(e.target.value)
                      const min = e.target.value ? parseFloat(e.target.value) : undefined
                      setFilters(prev => ({ ...prev, liquidityMin: min }))
                    }}
                    className="w-24 bg-[#1a1c1f] border border-[#2a2d31] rounded px-2 py-1.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#00ff88] transition-colors"
                  />
                  <span className="text-[#666] text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={liquidityMax}
                    onChange={(e) => {
                      setLiquidityMax(e.target.value)
                      const max = e.target.value ? parseFloat(e.target.value) : undefined
                      setFilters(prev => ({ ...prev, liquidityMax: max }))
                    }}
                    className="w-24 bg-[#1a1c1f] border border-[#2a2d31] rounded px-2 py-1.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#00ff88] transition-colors"
                  />
                </div>
              </div>

              {/* Market Cap Range */}
              <div>
                <label className="text-xs uppercase tracking-wider text-[#666] mb-2 block">Market Cap (USD)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={marketCapMin}
                    onChange={(e) => {
                      setMarketCapMin(e.target.value)
                      const min = e.target.value ? parseFloat(e.target.value) : undefined
                      setFilters(prev => ({ ...prev, marketCapMin: min }))
                    }}
                    className="w-24 bg-[#1a1c1f] border border-[#2a2d31] rounded px-2 py-1.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#00ff88] transition-colors"
                  />
                  <span className="text-[#666] text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={marketCapMax}
                    onChange={(e) => {
                      setMarketCapMax(e.target.value)
                      const max = e.target.value ? parseFloat(e.target.value) : undefined
                      setFilters(prev => ({ ...prev, marketCapMax: max }))
                    }}
                    className="w-24 bg-[#1a1c1f] border border-[#2a2d31] rounded px-2 py-1.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#00ff88] transition-colors"
                  />
                </div>
              </div>

              {/* Clear button */}
              <button
                onClick={() => {
                  setLiquidityMin('')
                  setLiquidityMax('')
                  setMarketCapMin('')
                  setMarketCapMax('')
                  setFilters(prev => ({ 
                    ...prev, 
                    liquidityMin: undefined,
                    liquidityMax: undefined,
                    marketCapMin: undefined,
                    marketCapMax: undefined
                  }))
                }}
                className="w-full py-2 px-4 bg-[#1a1c1f] hover:bg-[#2a2d31] text-[#888] hover:text-white text-xs uppercase tracking-wider rounded transition-colors"
              >
                Clear Range Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black overflow-y-auto">
        {/* Top Early Calls Section */}
        <TopEarlyCalls />

        {/* Recent Calls Section */}
        <RecentCalls filters={filters} />
      </div>

      {/* Floating Action Menu */}
      <FloatingMenu />
    </div>
  )
}