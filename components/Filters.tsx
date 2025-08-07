'use client'

import { useState } from 'react'

interface FiltersProps {
  onFiltersChange: (filters: FilterState) => void
}

export interface FilterState {
  tokenType: 'all' | 'utility' | 'meme'
}

export default function Filters({ onFiltersChange }: FiltersProps) {
  const [tokenType, setTokenType] = useState<FilterState['tokenType']>('all')

  const handleTokenTypeChange = (type: FilterState['tokenType']) => {
    setTokenType(type)
    onFiltersChange({ tokenType: type })
  }

  return (
    <div className="bg-[#1a1c1f] border border-[#2a2d31] rounded-lg p-4 mb-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-[#888] text-xs uppercase tracking-wider">Token Type:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleTokenTypeChange('all')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                tokenType === 'all'
                  ? 'bg-[#00ff88] text-black font-semibold'
                  : 'bg-[#2a2d31] text-white hover:bg-[#3a3d41]'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => handleTokenTypeChange('meme')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                tokenType === 'meme'
                  ? 'bg-[#ff00ff] text-white font-semibold'
                  : 'bg-[#2a2d31] text-white hover:bg-[#3a3d41]'
              }`}
            >
              MEME
            </button>
            <button
              onClick={() => handleTokenTypeChange('utility')}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                tokenType === 'utility'
                  ? 'bg-[#00a8ff] text-white font-semibold'
                  : 'bg-[#2a2d31] text-white hover:bg-[#3a3d41]'
              }`}
            >
              UTILITY
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}