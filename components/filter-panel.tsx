'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, FilterX } from 'lucide-react'

interface FilterPanelProps {
  onFiltersChange: (filters: FilterValues) => void
}

export interface FilterValues {
  minCallScore: number
  minXScore: number
  tokenTypes: string[]
  networks: string[]
  groups: string[]
  onlyProfitable: boolean
  minROI: number | null
  minAthROI: number | null
  minCurrentMcap: number | null
  minBuyMcap: number | null
  maxBuyMcap: number | null
}

export function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [availableGroups, setAvailableGroups] = useState<string[]>([])
  const [availableChains, setAvailableChains] = useState<{value: string, label: string}[]>([])
  const [filters, setFilters] = useState<FilterValues>({
    minCallScore: 1,
    minXScore: 1,
    tokenTypes: [],
    networks: [],
    groups: [],
    onlyProfitable: false,
    minROI: null,
    minAthROI: null,
    minCurrentMcap: null,
    minBuyMcap: null,
    maxBuyMcap: null
  })

  useEffect(() => {
    // Fetch available groups
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailableGroups(data.groups);
        }
      })
      .catch(err => console.error('Failed to fetch groups:', err));
      
    // Fetch available chains
    fetch('/api/chains')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailableChains(data.chains);
        }
      })
      .catch(err => console.error('Failed to fetch chains:', err));
  }, [])

  const updateFilter = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const resetFilters = () => {
    const defaultFilters: FilterValues = {
      minCallScore: 1,
      minXScore: 1,
      tokenTypes: [],
      networks: [],
      groups: [],
      onlyProfitable: false,
      minROI: null,
      minAthROI: null,
      minCurrentMcap: null,
      minBuyMcap: null,
      maxBuyMcap: null
    }
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const hasActiveFilters = 
    filters.minCallScore > 1 ||
    filters.minXScore > 1 ||
    filters.tokenTypes.length > 0 ||
    filters.networks.length > 0 ||
    filters.groups.length > 0 ||
    filters.onlyProfitable ||
    filters.minROI !== null ||
    filters.minAthROI !== null ||
    filters.minCurrentMcap !== null ||
    filters.minBuyMcap !== null ||
    filters.maxBuyMcap !== null

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={resetFilters}
                className="h-8 px-2 text-xs"
              >
                <FilterX className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Score Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="call-score">Min Call Score</Label>
                <span className="text-sm font-semibold">{filters.minCallScore}</span>
              </div>
              <Slider
                id="call-score"
                min={1}
                max={10}
                step={1}
                value={[filters.minCallScore]}
                onValueChange={(value) => updateFilter('minCallScore', value[0])}
                className="py-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="x-score">Min X Score</Label>
                <span className="text-sm font-semibold">{filters.minXScore}</span>
              </div>
              <Slider
                id="x-score"
                min={1}
                max={10}
                step={1}
                value={[filters.minXScore]}
                onValueChange={(value) => updateFilter('minXScore', value[0])}
                className="py-2"
              />
            </div>
          </div>

          {/* Token Type & Network Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Token Type</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="meme"
                    checked={filters.tokenTypes.includes('meme')}
                    onCheckedChange={(checked) => {
                      const types = checked 
                        ? [...filters.tokenTypes, 'meme']
                        : filters.tokenTypes.filter(t => t !== 'meme')
                      updateFilter('tokenTypes', types)
                    }}
                  />
                  <Label htmlFor="meme" className="text-sm font-normal cursor-pointer">
                    Meme
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="utility"
                    checked={filters.tokenTypes.includes('utility')}
                    onCheckedChange={(checked) => {
                      const types = checked 
                        ? [...filters.tokenTypes, 'utility']
                        : filters.tokenTypes.filter(t => t !== 'utility')
                      updateFilter('tokenTypes', types)
                    }}
                  />
                  <Label htmlFor="utility" className="text-sm font-normal cursor-pointer">
                    Utility
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Network</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {availableChains.map((chain) => (
                  <div key={chain.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`chain-${chain.value}`}
                      checked={filters.networks.includes(chain.value)}
                      onCheckedChange={(checked) => {
                        const networks = checked 
                          ? [...filters.networks, chain.value]
                          : filters.networks.filter(n => n !== chain.value)
                        updateFilter('networks', networks)
                      }}
                    />
                    <Label 
                      htmlFor={`chain-${chain.value}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {chain.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Groups Filter */}
          {availableGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Call Groups</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {availableGroups.map((group) => (
                  <div key={group} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group}`}
                      checked={filters.groups.includes(group)}
                      onCheckedChange={(checked) => {
                        const groups = checked 
                          ? [...filters.groups, group]
                          : filters.groups.filter(g => g !== group)
                        updateFilter('groups', groups)
                      }}
                    />
                    <Label 
                      htmlFor={`group-${group}`} 
                      className="text-sm font-normal cursor-pointer truncate"
                      title={group}
                    >
                      {group}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROI Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="profitable"
                checked={filters.onlyProfitable}
                onCheckedChange={(checked) => updateFilter('onlyProfitable', checked)}
              />
              <Label htmlFor="profitable" className="text-sm font-normal cursor-pointer">
                Only show profitable tokens
              </Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-roi">Minimum ROI %</Label>
                <input
                  id="min-roi"
                  type="number"
                  placeholder="e.g., 100"
                  className="w-full px-3 py-1 text-sm border rounded-md"
                  value={filters.minROI || ''}
                  onChange={(e) => updateFilter('minROI', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min-ath-roi">Minimum ATH ROI %</Label>
                <input
                  id="min-ath-roi"
                  type="number"
                  placeholder="e.g., 500"
                  className="w-full px-3 py-1 text-sm border rounded-md"
                  value={filters.minAthROI || ''}
                  onChange={(e) => updateFilter('minAthROI', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
          </div>

          {/* Market Cap Filters */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Market Cap Filters</Label>
            
            <div className="space-y-2">
              <Label htmlFor="min-current-mcap">Minimum Current Market Cap</Label>
              <input
                id="min-current-mcap"
                type="number"
                placeholder="e.g., 1000000"
                className="w-full px-3 py-1 text-sm border rounded-md"
                value={filters.minCurrentMcap || ''}
                onChange={(e) => updateFilter('minCurrentMcap', e.target.value ? Number(e.target.value) : null)}
              />
              <p className="text-xs text-muted-foreground">Filter by current market cap in USD</p>
            </div>
            
            <div className="space-y-2">
              <Label>Market Cap at Call Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    id="min-buy-mcap"
                    type="number"
                    placeholder="Min (e.g., 50000)"
                    className="w-full px-3 py-1 text-sm border rounded-md"
                    value={filters.minBuyMcap || ''}
                    onChange={(e) => updateFilter('minBuyMcap', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
                <div>
                  <input
                    id="max-buy-mcap"
                    type="number"
                    placeholder="Max (e.g., 5000000)"
                    className="w-full px-3 py-1 text-sm border rounded-md"
                    value={filters.maxBuyMcap || ''}
                    onChange={(e) => updateFilter('maxBuyMcap', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Filter by market cap when the call was made</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}