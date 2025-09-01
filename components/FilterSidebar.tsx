'use client';

import { useState, useEffect } from 'react';

interface FilterState {
  tokenType: 'all' | 'meme' | 'utility'
  networks: string[]
  excludeRugs?: boolean
  excludeImposters?: boolean
  minXScore?: number
  minWebsiteScore?: number
}

interface FilterSidebarProps {
  onFiltersChange: (filters: FilterState) => void;
}

export default function FilterSidebar({ onFiltersChange }: FilterSidebarProps) {
  // Load saved filter state from localStorage
  const getInitialFilterState = (): FilterState => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kromProjectsFilters')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved filters:', e)
        }
      }
    }
    // Default state
    return {
      tokenType: 'all',
      networks: ['ethereum', 'solana', 'bsc', 'base'],
      excludeRugs: true,
      excludeImposters: true,
      minXScore: 1,
      minWebsiteScore: 1
    }
  }

  // Load saved section states from localStorage
  const getSectionStates = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kromProjectsFilterSections')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved section states:', e)
        }
      }
    }
    // Default: all collapsed except token type
    return {
      tokenType: false,
      networks: true,
      rugs: true,
      scores: true
    }
  }

  const sectionStates = getSectionStates()

  // Load sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kromSidebarCollapsed')
      return saved === 'true'
    }
    return false
  })

  const [filters, setFilters] = useState<FilterState>(getInitialFilterState)
  const [isTokenTypeCollapsed, setIsTokenTypeCollapsed] = useState(sectionStates.tokenType)
  const [includeUtility, setIncludeUtility] = useState(() => {
    const initial = getInitialFilterState()
    return initial.tokenType === 'all' || initial.tokenType === 'utility'
  })
  const [includeMeme, setIncludeMeme] = useState(() => {
    const initial = getInitialFilterState()
    return initial.tokenType === 'all' || initial.tokenType === 'meme'
  })
  const [isNetworksCollapsed, setIsNetworksCollapsed] = useState(sectionStates.networks)
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(() => {
    const initial = getInitialFilterState()
    return initial.networks || ['ethereum', 'solana', 'bsc', 'base']
  })
  const [isRugsCollapsed, setIsRugsCollapsed] = useState(sectionStates.rugs)
  const [excludeRugs, setExcludeRugs] = useState(() => {
    const initial = getInitialFilterState()
    return initial.excludeRugs !== undefined ? initial.excludeRugs : true
  })
  const [excludeImposters, setExcludeImposters] = useState(() => {
    const initial = getInitialFilterState()
    return initial.excludeImposters !== undefined ? initial.excludeImposters : true
  })
  const [isScoresCollapsed, setIsScoresCollapsed] = useState(sectionStates.scores)
  const [minXScore, setMinXScore] = useState<number>(() => {
    const initial = getInitialFilterState()
    return initial.minXScore || 1
  })
  const [minWebsiteScore, setMinWebsiteScore] = useState<number>(() => {
    const initial = getInitialFilterState()
    return initial.minWebsiteScore || 1
  })

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kromProjectsFilters', JSON.stringify(filters))
    }
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  // Save section states to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sectionStates = {
        tokenType: isTokenTypeCollapsed,
        networks: isNetworksCollapsed,
        rugs: isRugsCollapsed,
        scores: isScoresCollapsed
      }
      localStorage.setItem('kromProjectsFilterSections', JSON.stringify(sectionStates))
    }
  }, [isTokenTypeCollapsed, isNetworksCollapsed, isRugsCollapsed, isScoresCollapsed])

  // Save sidebar collapsed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kromSidebarCollapsed', String(isSidebarCollapsed))
    }
  }, [isSidebarCollapsed])

  // Reset all filters and collapse all sections
  const resetAllFilters = () => {
    const defaultState = {
      tokenType: 'all' as const,
      networks: ['ethereum', 'solana', 'bsc', 'base'],
      excludeRugs: true,
      excludeImposters: true,
      minXScore: 1,
      minWebsiteScore: 1
    }
    
    // Update all individual states
    setIncludeUtility(true)
    setIncludeMeme(true)
    setSelectedNetworks(['ethereum', 'solana', 'bsc', 'base'])
    setExcludeRugs(true)
    setExcludeImposters(true)
    setMinXScore(1)
    setMinWebsiteScore(1)
    
    // Reset all sections to collapsed (except token type)
    setIsTokenTypeCollapsed(false)
    setIsNetworksCollapsed(true)
    setIsRugsCollapsed(true)
    setIsScoresCollapsed(true)
    
    // Update main filter state
    setFilters(defaultState)
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kromProjectsFilters')
      localStorage.removeItem('kromProjectsFilterSections')
    }
  }

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
    <div className="relative flex-shrink-0">
      {/* Sidebar Container */}
      <div className={`bg-[#111214] border-r border-[#2a2d31] h-full transition-all duration-300 ${isSidebarCollapsed ? 'w-[50px]' : 'w-[300px] overflow-y-auto'}`}>
      
      {isSidebarCollapsed ? (
        /* Collapsed State - Icon Stack */
        <div className="flex flex-col items-center py-4 gap-3">
          {/* Toggle/Expand Button */}
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="w-9 h-9 rounded-md bg-[#1a1c1f] border border-[#2a2d31] flex items-center justify-center hover:bg-[#252729] hover:border-[#00ff88] transition-all group"
            title="Expand Filters"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#666] group-hover:stroke-[#00ff88] transition-colors" fill="none" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          
          {/* Filter Icon */}
          <button
            className="w-9 h-9 rounded-md bg-[#1a1c1f] border border-[#2a2d31] flex items-center justify-center hover:bg-[#252729] hover:border-[#00ff88] transition-all group"
            title="Filters"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#666] group-hover:stroke-[#00ff88] transition-colors" fill="none" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </button>
          
          {/* Settings Icon */}
          <button
            className="w-9 h-9 rounded-md bg-[#1a1c1f] border border-[#2a2d31] flex items-center justify-center hover:bg-[#252729] hover:border-[#00ff88] transition-all group"
            title="Settings"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#666] group-hover:stroke-[#00ff88] transition-colors" fill="none" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M18.36 18.36l4.24 4.24M20.66 12H21m-18 0h6m11.31 5.66l-4.24-4.24M7.76 7.76L3.52 3.52M6.34 12H1m4.24 5.66l4.24 4.24"></path>
            </svg>
          </button>
          
          {/* Notifications Icon */}
          <button
            className="w-9 h-9 rounded-md bg-[#1a1c1f] border border-[#2a2d31] flex items-center justify-center hover:bg-[#252729] hover:border-[#00ff88] transition-all group relative"
            title="Notifications"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#666] group-hover:stroke-[#00ff88] transition-colors" fill="none" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {/* Notification dot - optional */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#00ff88] rounded-full"></span>
          </button>
          
          {/* Account Icon */}
          <button
            className="w-9 h-9 rounded-md bg-[#1a1c1f] border border-[#2a2d31] flex items-center justify-center hover:bg-[#252729] hover:border-[#00ff88] transition-all group"
            title="Account"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#666] group-hover:stroke-[#00ff88] transition-colors" fill="none" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
        </div>
      ) : (
        /* Expanded State - Original Content */
        <>
          {/* Header */}
          <div className="p-5 border-b border-[#1a1c1f] relative">
            <div className="flex items-center justify-between">
              <h1 className="text-[32px] font-black tracking-[4px] text-[#00ff88] mb-1">KROM</h1>
            </div>
            <p className="text-[#666] text-xs">High-Quality Crypto Projects</p>
            
            {/* Collapse Button - Inside the header */}
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="absolute top-1/2 -translate-y-1/2 right-5 bg-[#1a1c1f] hover:bg-[#252729] rounded px-2 py-3 transition-all"
              title="Hide Filters"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#666] hover:stroke-[#00ff88] transition-colors" fill="none" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>

          {/* Filters Title */}
          <div className="px-5 pt-5 pb-2 flex justify-between items-center">
        <h2 className="text-sm uppercase tracking-[2px] text-[#666] font-semibold">FILTERS</h2>
        <button
          onClick={resetAllFilters}
          className="text-xs text-[#666] hover:text-[#00ff88] transition-colors uppercase tracking-[1px] font-medium"
        >
          Reset
        </button>
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
              When unchecked, hides rugged or dead projects
            </div>

            <label 
              className="flex items-center gap-2.5 cursor-pointer text-sm text-[#ccc] hover:text-white transition-colors mt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className={`w-5 h-5 border-2 rounded-[5px] transition-all flex items-center justify-center ${
                  !excludeImposters ? 'bg-[#00ff88] border-[#00ff88]' : 'border-[#333]'
                }`}
                onClick={() => {
                  const newExcludeState = !excludeImposters
                  setExcludeImposters(newExcludeState)
                  setFilters(prev => ({ ...prev, excludeImposters: newExcludeState }))
                }}
              >
                {!excludeImposters && <span className="text-black font-bold text-xs">✓</span>}
              </div>
              <span>Include Imposters</span>
            </label>
            <div className="text-xs text-[#666] mt-1">
              When unchecked, hides tokens marked as having inauthentic websites
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
              { id: 'base', label: 'Base', color: '#0052ff' },
              { id: 'polygon', label: 'Polygon', color: '#8247e5' },
              { id: 'arbitrum', label: 'Arbitrum', color: '#28a0f0' }
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

          {/* Analysis Scores Filter */}
          <div className={`border-b border-[#1a1c1f] ${isScoresCollapsed ? 'collapsed' : ''}`}>
        <div 
          className="px-5 py-5 cursor-pointer flex justify-between items-center bg-[#111214] hover:bg-[#1a1c1f] hover:pl-6 transition-all"
          onClick={() => setIsScoresCollapsed(!isScoresCollapsed)}
        >
          <h3 className={`text-[13px] uppercase tracking-[1px] font-semibold transition-colors ${!isScoresCollapsed ? 'text-[#00ff88]' : 'text-[#888]'}`}>
            Analysis Scores
          </h3>
          <span className={`text-xs transition-all ${!isScoresCollapsed ? 'text-[#00ff88]' : 'text-[#666]'} ${isScoresCollapsed ? 'rotate-[-90deg]' : ''}`}>
            ▼
          </span>
        </div>
        <div className={`bg-[#0a0b0d] overflow-hidden transition-all ${isScoresCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 p-5'}`}>
          <div className="space-y-5">
            {/* X Analysis Score */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase tracking-wider text-[#666]">Min X Score</label>
                <span className="text-sm font-semibold text-white">{minXScore}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={minXScore}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  setMinXScore(value)
                  setFilters(prev => ({ ...prev, minXScore: value }))
                }}
                className="w-full h-2 bg-[#1a1c1f] rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #00ff88 0%, #00ff88 ${((minXScore - 1) / 9) * 100}%, #1a1c1f ${((minXScore - 1) / 9) * 100}%, #1a1c1f 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] text-[#666] mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Website Analysis Score */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase tracking-wider text-[#666]">Min Website Score</label>
                <span className="text-sm font-semibold text-white">{minWebsiteScore}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={minWebsiteScore}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  setMinWebsiteScore(value)
                  setFilters(prev => ({ ...prev, minWebsiteScore: value }))
                }}
                className="w-full h-2 bg-[#1a1c1f] rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #00ff88 0%, #00ff88 ${((minWebsiteScore - 1) / 9) * 100}%, #1a1c1f ${((minWebsiteScore - 1) / 9) * 100}%, #1a1c1f 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] text-[#666] mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </div>
        </div>
          </div>
        </>
      )}
      </div>
    </div>
  )
}