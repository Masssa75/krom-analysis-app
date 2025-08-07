'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface SortDropdownProps {
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
}

export function SortDropdown({ onSortChange }: SortDropdownProps) {
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSortByChange = (value: string) => {
    setSortBy(value)
    onSortChange(value, sortOrder)
  }

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(newOrder)
    onSortChange(sortBy, newOrder)
  }

  const getSortLabel = (value: string) => {
    switch (value) {
      case 'analysis_score': return 'Call Score'
      case 'x_analysis_score': return 'X Score'
      case 'roi_percent': return 'ROI %'
      case 'ath_roi_percent': return 'ATH ROI %'
      case 'current_market_cap': return 'Current Market Cap'
      case 'market_cap_at_call': return 'Market Cap at Call'
      case 'created_at': return 'Date Called'
      case 'ticker': return 'Token Name'
      case 'volume_24h': return '24h Volume'
      case 'liquidity_usd': return 'Liquidity'
      case 'price_change_24h': return '24h Price Change'
      default: return value
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[#666] text-[13px] font-medium">Sort by:</span>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-[200px] bg-[#1a1c1f] border-[#2a2d31] text-[#ccc] hover:bg-[#222426] hover:border-[#333]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1c1f] border-[#2a2d31] text-[#ccc]">
          <SelectItem value="created_at" className="text-[#ccc] focus:bg-[#222426] focus:text-white">Date Called</SelectItem>
          <SelectItem value="analysis_score" className="text-[#ccc] focus:bg-[#222426] focus:text-white">Call Score</SelectItem>
          <SelectItem value="x_analysis_score" className="text-[#ccc] focus:bg-[#222426] focus:text-white">X Score</SelectItem>
          <SelectItem value="roi_percent" className="text-[#ccc] focus:bg-[#222426] focus:text-white">ROI %</SelectItem>
          <SelectItem value="ath_roi_percent" className="text-[#ccc] focus:bg-[#222426] focus:text-white">ATH ROI %</SelectItem>
          <SelectItem value="volume_24h" className="text-[#ccc] focus:bg-[#222426] focus:text-white">24h Volume</SelectItem>
          <SelectItem value="liquidity_usd" className="text-[#ccc] focus:bg-[#222426] focus:text-white">Liquidity</SelectItem>
          <SelectItem value="price_change_24h" className="text-[#ccc] focus:bg-[#222426] focus:text-white">24h Price Change</SelectItem>
          <SelectItem value="current_market_cap" className="text-[#ccc] focus:bg-[#222426] focus:text-white">Current Market Cap</SelectItem>
          <SelectItem value="market_cap_at_call" className="text-[#ccc] focus:bg-[#222426] focus:text-white">Market Cap at Call</SelectItem>
          <SelectItem value="ticker" className="text-[#ccc] focus:bg-[#222426] focus:text-white">Token Name</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        size="sm"
        variant="outline"
        onClick={toggleSortOrder}
        className="px-2 bg-[#1a1c1f] border-[#2a2d31] text-[#888] hover:bg-[#222426] hover:border-[#333] hover:text-[#ccc]"
        title={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}