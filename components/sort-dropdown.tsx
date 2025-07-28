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
      case 'quality': return 'Quality'
      case 'roi_percent': return 'ROI %'
      case 'ath_roi_percent': return 'ATH ROI %'
      case 'current_market_cap': return 'Current Market Cap'
      case 'market_cap_at_call': return 'Market Cap at Call'
      case 'created_at': return 'Date Called'
      case 'ticker': return 'Token Name'
      default: return value
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium">Sort by:</Label>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Date Called</SelectItem>
          <SelectItem value="analysis_score">Call Score</SelectItem>
          <SelectItem value="x_analysis_score">X Score</SelectItem>
          <SelectItem value="quality">
            <span 
              title="Combined score based on call analysis, X analysis, and market performance (higher = better overall quality)"
              className="cursor-help"
            >
              Quality ⓘ
            </span>
          </SelectItem>
          <SelectItem value="roi_percent">ROI %</SelectItem>
          <SelectItem value="ath_roi_percent">ATH ROI %</SelectItem>
          <SelectItem value="current_market_cap">Current Market Cap</SelectItem>
          <SelectItem value="market_cap_at_call">Market Cap at Call</SelectItem>
          <SelectItem value="ticker">Token Name</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        size="sm"
        variant="outline"
        onClick={toggleSortOrder}
        className="px-2"
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