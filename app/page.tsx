'use client'

import { useState } from 'react'
import TopEarlyCalls from '@/components/TopEarlyCalls'
import RecentCalls from '@/components/RecentCalls'

interface FilterState {
  tokenType: 'all' | 'meme' | 'utility'
}

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>({ tokenType: 'all' })
  const [isTokenTypeCollapsed, setIsTokenTypeCollapsed] = useState(false)
  const [includeUtility, setIncludeUtility] = useState(true)
  const [includeMeme, setIncludeMeme] = useState(true)

  const handleTokenTypeChange = () => {
    let newType: FilterState['tokenType'] = 'all'
    
    if (includeUtility && includeMeme) {
      newType = 'all'
    } else if (includeUtility && !includeMeme) {
      newType = 'utility'
    } else if (!includeUtility && includeMeme) {
      newType = 'meme'
    } else {
      // Neither selected, default to all
      setIncludeUtility(true)
      setIncludeMeme(true)
      newType = 'all'
    }
    
    setFilters({ tokenType: newType })
  }

  return (
    <div className="fixed inset-0 flex bg-[#0a0b0d]">
      {/* Left Sidebar */}
      <div className="w-[300px] bg-[#111214] border-r border-[#2a2d31] flex-shrink-0 overflow-y-auto">
        <div className="p-5 border-b border-[#1a1c1f]">
          <h1 className="text-[32px] font-black tracking-[4px] text-[#00ff88] mb-1">KROM</h1>
          <p className="text-[#666] text-xs">Advanced Token Discovery</p>
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
                    setIncludeUtility(!includeUtility)
                    setTimeout(handleTokenTypeChange, 0)
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
                    setIncludeMeme(!includeMeme)
                    setTimeout(handleTokenTypeChange, 0)
                  }}
                >
                  {includeMeme && <span className="text-black font-bold text-xs">✓</span>}
                </div>
                <span>Meme Tokens</span>
              </label>
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
    </div>
  )
}