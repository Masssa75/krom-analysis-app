'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Copy, ExternalLink, ChevronRight, MessageSquare, RefreshCw, Search, ChevronLeft, Trash2, Star, DollarSign, Ban } from 'lucide-react'
import { AnalysisDetailPanel } from '@/components/analysis-detail-panel'
import { TokenTypeBadge } from '@/components/token-type-badge'
import { PriceDisplay } from '@/components/price-display'
import { GeckoTerminalPanel } from '@/components/geckoterminal-panel'
import { FilterPanel, FilterValues } from '@/components/filter-panel'
import { SortDropdown } from '@/components/sort-dropdown'

export default function HomePage() {
  const [count, setCount] = useState('5')
  const [model, setModel] = useState('moonshotai/kimi-k2')
  const [useBatchMode, setUseBatchMode] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState<any>(null)
  const [analyzedCalls, setAnalyzedCalls] = useState<any[]>([])
  const [analyzedCount, setAnalyzedCount] = useState(0)
  const [loadingAnalyzed, setLoadingAnalyzed] = useState(true)
  const [athRoiAverage, setAthRoiAverage] = useState<number | null>(null)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [detailMode, setDetailMode] = useState<'call' | 'x'>('call')
  
  // X Analysis states
  const [xCount, setXCount] = useState('5')
  const [isXAnalyzing, setIsXAnalyzing] = useState(false)
  const [xProgress, setXProgress] = useState(0)
  const [xStatus, setXStatus] = useState('')
  const [xError, setXError] = useState('')
  const [xResults, setXResults] = useState<any>(null)
  const [xAnalyzingCall, setXAnalyzingCall] = useState<any>(null)
  
  // Reanalysis states
  const [reanalyzingCalls, setReanalyzingCalls] = useState<Set<string>>(new Set())
  const [reanalyzingXCalls, setReanalyzingXCalls] = useState<Set<string>>(new Set())
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showOnlyCoinsOfInterest, setShowOnlyCoinsOfInterest] = useState(false)
  const itemsPerPage = 20
  
  // Batch price fetching state
  const [isFetchingPrices, setIsFetchingPrices] = useState(false)
  const [priceFetchProgress, setPriceFetchProgress] = useState(0)
  
  // GeckoTerminal panel state
  const [selectedTokenForChart, setSelectedTokenForChart] = useState<any>(null)
  
  // Filter state
  const [filters, setFilters] = useState<FilterValues>({
    minCallScore: 1,
    minXScore: 1,
    tokenTypes: [],
    networks: [],
    onlyProfitable: false,
    minROI: null,
    minAthROI: null,
    minCurrentMcap: null,
    minBuyMcap: null,
    maxBuyMcap: null
  })
  
  // Sort state
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Analysis counts state
  const [analysisCounts, setAnalysisCounts] = useState<{
    total: number
    callAnalysis: number
    xAnalysis: number
    withContracts: number
    pricesFetched: number
  }>({ total: 0, callAnalysis: 0, xAnalysis: 0, withContracts: 0, pricesFetched: 0 })

  // Fetch analyzed calls on mount and when page/search/filter/sort changes
  useEffect(() => {
    fetchAnalyzedCalls()
    fetchAnalysisCounts()
  }, [currentPage, searchQuery, showOnlyCoinsOfInterest, filters, sortBy, sortOrder])

  const fetchAnalysisCounts = async () => {
    try {
      const response = await fetch('/api/analysis-counts')
      const data = await response.json()
      if (response.ok) {
        setAnalysisCounts(data)
      }
    } catch (err) {
      console.error('Failed to fetch analysis counts:', err)
    }
  }

  const fetchAnalyzedCalls = async () => {
    setLoadingAnalyzed(true)
    setIsSearching(!!searchQuery)
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      })
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      if (showOnlyCoinsOfInterest) {
        params.append('coinsOfInterest', 'true')
      }
      
      // Add filter parameters
      if (filters.minCallScore > 1) {
        params.append('minCallScore', filters.minCallScore.toString())
      }
      if (filters.minXScore > 1) {
        params.append('minXScore', filters.minXScore.toString())
      }
      if (filters.tokenTypes.length > 0) {
        params.append('tokenTypes', filters.tokenTypes.join(','))
      }
      if (filters.networks.length > 0) {
        params.append('networks', filters.networks.join(','))
      }
      if (filters.onlyProfitable) {
        params.append('onlyProfitable', 'true')
      }
      if (filters.minROI !== null) {
        params.append('minROI', filters.minROI.toString())
      }
      if (filters.minAthROI !== null) {
        params.append('minAthROI', filters.minAthROI.toString())
      }
      if (filters.minCurrentMcap !== null) {
        params.append('minCurrentMcap', filters.minCurrentMcap.toString())
      }
      if (filters.minBuyMcap !== null) {
        params.append('minBuyMcap', filters.minBuyMcap.toString())
      }
      if (filters.maxBuyMcap !== null) {
        params.append('maxBuyMcap', filters.maxBuyMcap.toString())
      }
      
      // Add sort parameters
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      
      const response = await fetch(`/api/analyzed?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setAnalyzedCalls(data.results)
        setAnalyzedCount(data.count)
        setAthRoiAverage(data.athRoiAverage)
      }
    } catch (err) {
      console.error('Failed to fetch analyzed calls:', err)
    } finally {
      setLoadingAnalyzed(false)
      setIsSearching(false)
    }
  }

  const startAnalysis = async () => {
    setIsAnalyzing(true)
    setError('')
    setResults(null)
    setProgress(0)
    setStatus('Connecting to database...')

    try {
      // Use batch endpoint for Gemini 2.5 Pro when batch mode is enabled
      const endpoint = (model === 'google/gemini-2.5-pro' && useBatchMode) 
        ? '/api/analyze-batch-gemini' 
        : '/api/analyze'
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: parseInt(count),
          model: model
        })
      })

      let data
      try {
        const responseText = await response.text()
        console.log('Raw response:', responseText)
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        // If parsing fails but response was ok, the analysis might have succeeded
        if (response.ok) {
          // Refresh the page data to see if analysis was saved
          await fetchAnalyzedCalls()
          await fetchAnalysisCounts()
          setIsAnalyzing(false)
          setProgress(0)
          setStatus('')
          return
        }
        throw new Error('Invalid response from server')
      }
      
      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      // Update progress based on actual analysis
      setProgress(50)
      setStatus('Analyzing with AI...')
      
      // Simulate progress update
      setTimeout(() => {
        setProgress(100)
        setStatus('Analysis complete!')
        setResults(data)
        // Refresh analyzed calls list
        fetchAnalyzedCalls()
        fetchAnalysisCounts()
      }, 500)
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect to analysis service')
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
      setStatus('')
    }
  }

  const getTier = (score: number) => {
    if (score >= 8) return 'ALPHA'
    if (score >= 6) return 'SOLID'
    if (score >= 4) return 'BASIC'
    return 'TRASH'
  }

  const getTierClass = (tier: string) => {
    switch (tier) {
      case 'ALPHA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'SOLID': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400'
      case 'BASIC': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'TRASH': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return ''
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadCSV = async () => {
    if (!results) return

    const response = await fetch('/api/download-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: results.results,
        filename: 'krom-analysis.csv'
      })
    })

    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'krom-analysis.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }

  const resetAnalysis = () => {
    setResults(null)
    setError('')
  }

  const openDetailPanel = (call: any, mode: 'call' | 'x' = 'call') => {
    setSelectedCall(call)
    setDetailMode(mode)
    setIsPanelOpen(true)
  }

  const closeDetailPanel = () => {
    setIsPanelOpen(false)
    // Delay clearing selected call to allow exit animation
    setTimeout(() => setSelectedCall(null), 300)
  }
  
  const onCommentSaved = (krom_id: string, hasComment: boolean) => {
    // Update the comment status in results
    if (results) {
      setResults({
        ...results,
        results: results.results.map((r: any) => 
          r.krom_id === krom_id ? { ...r, has_comment: hasComment } : r
        )
      })
    }
    
    // Update the comment status in analyzed calls
    setAnalyzedCalls(prev => 
      prev.map(call => 
        call.krom_id === krom_id ? { ...call, has_comment: hasComment } : call
      )
    )
  }
  
  const toggleCoinOfInterest = async (call: any) => {
    const newStatus = !call.is_coin_of_interest
    
    try {
      const response = await fetch('/api/mark-coin-of-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          krom_id: call.krom_id,
          is_marked: newStatus
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to update coin of interest')
      }
      
      // Update the status in results
      if (results) {
        setResults({
          ...results,
          results: results.results.map((r: any) => 
            r.krom_id === call.krom_id ? { ...r, is_coin_of_interest: newStatus } : r
          )
        })
      }
      
      // Update the status in analyzed calls
      setAnalyzedCalls(prev => 
        prev.map(c => 
          c.krom_id === call.krom_id ? { ...c, is_coin_of_interest: newStatus } : c
        )
      )
      
    } catch (err: any) {
      console.error('Failed to toggle coin of interest:', err)
      alert(`Failed to update: ${err.message}`)
    }
  }
  
  const startXAnalysis = async () => {
    setIsXAnalyzing(true)
    setXError('')
    setXResults(null)
    setXProgress(0)
    setXStatus('Starting batch X analysis...')
    
    try {
      const response = await fetch('/api/x-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: parseInt(xCount),
          model: model
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'X batch analysis failed')
      }
      
      if (result.analyzed === 0) {
        throw new Error('No calls found that need X analysis')
      }
      
      // Update progress during analysis
      setXProgress(50)
      setXStatus(`Analyzed ${result.analyzed} calls with existing tweets`)
      
      // Show results
      setXProgress(100)
      setXStatus('X batch analysis complete!')
      setXResults(result)
      
      // Refresh analyzed calls
      fetchAnalyzedCalls()
      fetchAnalysisCounts()
      
    } catch (err: any) {
      setXError(err.message || 'Failed to analyze X data')
    } finally {
      setIsXAnalyzing(false)
      setXProgress(0)
      setXStatus('')
    }
  }
  
  const resetXAnalysis = () => {
    setXResults(null)
    setXError('')
    setXAnalyzingCall(null)
  }
  
  const fetchAllPrices = () => {
    // Find all "Get Price" buttons
    const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent?.includes('Get Price')
    )
    
    if (buttons.length === 0) {
      alert('All items on this page already have price data!')
      return
    }
    
    setIsFetchingPrices(true)
    setPriceFetchProgress(0)
    
    console.log(`Found ${buttons.length} items without prices`)
    
    // Click each button with a delay using the simple approach that works
    // Increased delay to 4 seconds to avoid rate limiting
    const delayBetweenFetches = 4000 // 4 seconds instead of 2.5
    
    buttons.forEach((button, index) => {
      setTimeout(() => {
        button.click()
        
        // Update progress
        const progress = Math.round((index + 1) / buttons.length * 100)
        setPriceFetchProgress(progress)
        
        console.log(`Fetching price ${index + 1} of ${buttons.length}...`)
        
        // If this is the last button, clean up
        if (index === buttons.length - 1) {
          setTimeout(() => {
            alert(`Successfully fetched prices for ${buttons.length} items!`)
            setIsFetchingPrices(false)
            setPriceFetchProgress(0)
          }, delayBetweenFetches)
        }
      }, index * delayBetweenFetches)
    })
  }
  
  const clearPrices = async () => {
    // Get all krom_ids from the current page
    const kromIds = analyzedCalls.map(call => call.krom_id)
    
    if (kromIds.length === 0) {
      alert('No calls on this page to clear prices for!')
      return
    }
    
    if (!confirm(`Clear price data for ${kromIds.length} calls on this page?`)) {
      return
    }
    
    try {
      const response = await fetch('/api/clear-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kromIds })
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear prices')
      }
      
      const result = await response.json()
      
      // Refresh the analyzed calls to show updated data
      await fetchAnalyzedCalls()
      
      alert(result.message)
    } catch (error) {
      console.error('Error clearing prices:', error)
      alert('Failed to clear prices. Please try again.')
    }
  }
  
  const fetchPricesViaEdgeFunction = async () => {
    setIsFetchingPrices(true)
    setPriceFetchProgress(0)
    
    try {
      // Call the Supabase Edge Function directly
      const response = await fetch('https://eucfoommxxvqmmwdbkdv.supabase.co/functions/v1/crypto-price-fetcher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({})
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Edge function error: ${error}`)
      }
      
      const result = await response.json()
      
      // Refresh the analyzed calls to show updated data
      await fetchAnalyzedCalls()
      
      alert(`Edge Function: Processed ${result.processed} calls. ${result.successful} successful, ${result.failed} failed.`)
    } catch (error) {
      console.error('Error calling edge function:', error)
      alert(`Failed to fetch prices via edge function: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFetchingPrices(false)
      setPriceFetchProgress(0)
    }
  }
  
  // Handle search with debouncing
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setCurrentPage(1) // Reset to first page on new search
    }, 300) // 300ms debounce
    
    return () => clearTimeout(timer)
  }, [searchInput])
  
  // Calculate total pages
  const totalPages = Math.ceil(analyzedCount / itemsPerPage)
  
  const reanalyzeCall = async (call: any) => {
    setReanalyzingCalls(prev => new Set(prev).add(call.krom_id))
    
    try {
      const response = await fetch('/api/reanalyze-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          krom_id: call.krom_id,
          model: model
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to reanalyze call')
      }
      
      // Refresh the analyzed calls list
      await fetchAnalyzedCalls()
      await fetchAnalysisCounts()
      
      // Update results if it's in the current results
      if (results) {
        setResults({
          ...results,
          results: results.results.map((r: any) => 
            r.krom_id === call.krom_id ? { ...r, ...data.result } : r
          )
        })
      }
      
    } catch (err: any) {
      console.error('Failed to reanalyze call:', err)
      alert(`Failed to reanalyze: ${err.message}`)
    } finally {
      setReanalyzingCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(call.krom_id)
        return newSet
      })
    }
  }
  
  const reanalyzeX = async (call: any) => {
    setReanalyzingXCalls(prev => new Set(prev).add(call.krom_id))
    
    try {
      const response = await fetch('/api/reanalyze-x', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          krom_id: call.krom_id,
          model: model
        })
      })
      
      const data = await response.json()
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to reanalyze X data')
      }
      
      // Refresh the analyzed calls list
      await fetchAnalyzedCalls()
      await fetchAnalysisCounts()
      
    } catch (err: any) {
      console.error('Failed to reanalyze X:', err)
      alert(`Failed to reanalyze X: ${err.message}`)
    } finally {
      setReanalyzingXCalls(prev => {
        const newSet = new Set(prev)
        newSet.delete(call.krom_id)
        return newSet
      })
    }
  }

  const deleteAnalysis = async (call: any) => {
    if (!confirm(`Are you sure you want to delete the analysis for ${call.token}? This will only remove the new analysis scores, keeping the original tier analysis.`)) {
      return
    }

    try {
      const response = await fetch('/api/delete-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          krom_id: call.krom_id
        })
      })

      const data = await response.json()
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to delete analysis')
      }
      
      // Refresh the analyzed calls list
      await fetchAnalyzedCalls()
      await fetchAnalysisCounts()
      
    } catch (err: any) {
      console.error('Failed to delete analysis:', err)
      alert(`Failed to delete analysis: ${err.message}`)
    }
  }

  const toggleInvalidate = async (call: any) => {
    const isInvalidating = !call.is_invalidated
    const reason = isInvalidating 
      ? prompt('Reason for invalidating this token? (optional)', 'Incorrect/unrealistic data')
      : null

    try {
      const response = await fetch('/api/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          krom_id: call.krom_id,
          is_invalidated: isInvalidating,
          reason: reason
        })
      })

      const data = await response.json()
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to update invalidation status')
      }
      
      // Refresh the analyzed calls list
      await fetchAnalyzedCalls()
      await fetchAnalysisCounts()
      
    } catch (err: any) {
      console.error('Failed to toggle invalidation:', err)
      alert(`Failed to update: ${err.message}`)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <CardTitle className="text-3xl">KROM Historical Analysis Tool</CardTitle>
            <a
              href="https://majestic-centaur-0d5fcc.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              title="KROM API Explorer - Browse and test KROM API data"
            >
              <ExternalLink className="h-3 w-3" />
              API Explorer
            </a>
          </div>
          <CardDescription>
            Analyze cryptocurrency calls with AI-powered scoring
          </CardDescription>
          {analysisCounts.total > 0 && (
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-semibold text-2xl">{analysisCounts.callAnalysis.toLocaleString()}</div>
                <div className="text-muted-foreground">Call Analysis</div>
                <div className="text-xs text-muted-foreground">
                  ({((analysisCounts.callAnalysis / analysisCounts.total) * 100).toFixed(1)}%)
                </div>
              </div>
              <div className="text-center border-l px-6">
                <div className="font-semibold text-2xl">{analysisCounts.xAnalysis.toLocaleString()}</div>
                <div className="text-muted-foreground">X Analysis</div>
                <div className="text-xs text-muted-foreground">
                  ({((analysisCounts.xAnalysis / analysisCounts.total) * 100).toFixed(1)}%)
                </div>
              </div>
              <div className="text-center border-l px-6">
                <div className="font-semibold text-2xl">{analysisCounts.pricesFetched.toLocaleString()}</div>
                <div className="text-muted-foreground">Prices Fetched</div>
                <div className="text-xs text-muted-foreground">
                  ({analysisCounts.withContracts > 0 ? ((analysisCounts.pricesFetched / analysisCounts.withContracts) * 100).toFixed(1) : 0}%)
                </div>
              </div>
              <div className="text-center border-l px-6">
                <div className="font-semibold text-2xl">{analysisCounts.total.toLocaleString()}</div>
                <div className="text-muted-foreground">Total Calls</div>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Analysis Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Call Analysis</CardTitle>
              <CardDescription>
                Analyze based on call messages
              </CardDescription>
            </CardHeader>
          
            <CardContent className="space-y-6">
              {!results && (
                <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="count">Number of calls to analyze (from oldest)</Label>
                  <Input
                    id="count"
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    min="1"
                    max="100"
                    disabled={isAnalyzing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Select value={model} onValueChange={setModel} disabled={isAnalyzing}>
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet (Better)</SelectItem>
                      <SelectItem value="openai/gpt-4">GPT-4 (Most Accurate)</SelectItem>
                      <SelectItem value="moonshotai/kimi-k2">Kimi K2 (Good Value)</SelectItem>
                      <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (Needs 4K tokens)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {model === 'google/gemini-2.5-pro' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="batch-mode"
                      checked={useBatchMode}
                      onChange={(e) => setUseBatchMode(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="batch-mode" className="text-sm">
                      Use batch processing (cost-effective, analyzes {count} calls in one request)
                    </Label>
                  </div>
                )}
                
                <div className="pt-4">
                  <Button 
                    onClick={startAnalysis} 
                    disabled={isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                  </Button>
                </div>
              </div>
              
              {isAnalyzing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">{status}</p>
                </div>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>Error: {error}</AlertDescription>
                </Alert>
              )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Call Analysis Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Call Analysis Results</CardTitle>
                <CardDescription>
                  Analyzed {results.count} calls • {results.model} • Completed in {results.duration}s
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 px-2 font-medium text-muted-foreground">Token</th>
                        <th className="py-2 px-2 font-medium text-muted-foreground">Score</th>
                        <th className="py-2 px-2 font-medium text-muted-foreground">Tier</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((result: any, index: number) => {
                        const tier = getTier(result.score)
                        return (
                          <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs">{result.token}</span>
                                <TokenTypeBadge type={result.token_type} />
                                {result.has_comment && (
                                  <span title="Has comment">
                                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                )}
                                <button
                                  onClick={() => toggleCoinOfInterest(result)}
                                  className="hover:text-yellow-500 transition-colors"
                                  title={result.is_coin_of_interest ? "Unmark as coin of interest" : "Mark as coin of interest"}
                                >
                                  <Star className={`h-3 w-3 ${result.is_coin_of_interest ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-2 font-semibold text-xs">{result.score.toFixed(1)}</td>
                            <td className="py-2 px-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${getTierClass(tier)}`}>
                                {tier}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDetailPanel(result, 'call')}
                                className="text-xs h-7 px-2"
                                title="View Call Analysis Details"
                              >
                                Details
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex gap-4 mt-4">
                  <Button onClick={downloadCSV} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </Button>
                  <Button onClick={resetAnalysis} variant="outline" className="flex-1">
                    New Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* X Analysis Column */}
        <div className="space-y-6">
          <Card>
        <CardHeader>
          <CardTitle className="text-xl">X (Twitter) Analysis</CardTitle>
          <CardDescription>
            Analyze based on social media sentiment
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="x-count">Number of calls to analyze (from oldest)</Label>
              <Input
                id="x-count"
                type="number"
                value={xCount}
                onChange={(e) => setXCount(e.target.value)}
                min="1"
                max="100"
                disabled={isXAnalyzing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Batch analyzes using existing stored tweets (no new fetching)
              </p>
              <p className="text-xs text-muted-foreground">
                Starts from oldest calls • Scores 1-10 based on tweet quality
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="x-model">AI Model</Label>
              <Select 
                value={model} 
                onValueChange={setModel}
                disabled={isXAnalyzing}
              >
                <SelectTrigger id="x-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</SelectItem>
                  <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet (Better)</SelectItem>
                  <SelectItem value="openai/gpt-4">GPT-4 (Most Accurate)</SelectItem>
                  <SelectItem value="moonshotai/kimi-k2">Kimi K2 (Good Value)</SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (Needs 4K tokens)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={() => startXAnalysis()}
                disabled={isXAnalyzing}
                className="w-full"
                size="lg"
              >
                {isXAnalyzing ? 'Analyzing...' : 'Start X Analysis'}
              </Button>
            </div>
          </div>
          
          {isXAnalyzing && (
            <div className="space-y-3">
              <Progress value={xProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">{xStatus}</p>
            </div>
          )}
          
          {xError && (
            <Alert variant="destructive">
              <AlertDescription>{xError}</AlertDescription>
            </Alert>
          )}
            </CardContent>
          </Card>
          
          {/* X Analysis Results */}
          {xResults && (
            <Card>
              <CardHeader>
                <CardTitle>X Batch Analysis Results</CardTitle>
                <CardDescription>
                  Analyzed {xResults.analyzed} calls • Model: {xResults.model_used}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {xResults.results && xResults.results.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Token</th>
                          <th className="text-left py-2 px-2">Score</th>
                          <th className="text-left py-2 px-2">Tier</th>
                          <th className="text-left py-2 px-2">Legitimacy</th>
                          <th className="text-left py-2 px-2">Tweets</th>
                        </tr>
                      </thead>
                      <tbody>
                        {xResults.results.map((result: any) => {
                          const tier = result.tier
                          return (
                            <tr key={result.krom_id} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2 font-mono text-xs">{result.ticker}</td>
                              <td className="py-2 px-2 font-semibold text-xs">{result.score}/10</td>
                              <td className="py-2 px-2">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${getTierClass(tier)}`}>
                                  {tier}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-xs">{result.legitimacy_factor}</td>
                              <td className="py-2 px-2 text-xs">{result.tweet_count}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {xResults.errors && xResults.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-red-600 mb-2">Errors:</h4>
                    <ul className="text-xs space-y-1">
                      {xResults.errors.map((error: any, i: number) => (
                        <li key={i}>{error.ticker}: {error.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-4 text-xs text-muted-foreground">
                  Batch ID: {xResults.batch_id}<br/>
                  Duration: {xResults.total_duration_ms}ms
                </div>
                
                <div className="flex gap-4 mt-4">
                  <Button onClick={resetXAnalysis} variant="outline" className="flex-1">
                    New Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel onFiltersChange={(newFilters) => {
        setFilters(newFilters)
        setCurrentPage(1) // Reset to first page when filters change
      }} />

      {/* Previously Analyzed Calls */}
      {analyzedCalls.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>Previously Analyzed Calls</CardTitle>
                <CardDescription>
                  {searchQuery ? (
                    <>Found {analyzedCount} results for "{searchQuery}"</>
                  ) : (
                    <>{analyzedCount} total calls analyzed • Page {currentPage} of {totalPages}</>
                  )}
                </CardDescription>
              </div>
              {athRoiAverage !== null && (
                <div className="text-right mr-4">
                  <div className="text-sm text-muted-foreground">Avg ATH ROI</div>
                  <div className="text-2xl font-bold text-green-600">
                    +{athRoiAverage.toFixed(0)}%
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search by token name..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <SortDropdown 
                      onSortChange={(newSortBy, newSortOrder) => {
                        setSortBy(newSortBy)
                        setSortOrder(newSortOrder)
                        setCurrentPage(1) // Reset to first page when sort changes
                      }}
                    />
                  </div>
                </div>
                <Button
                  onClick={fetchAllPrices}
                  disabled={isFetchingPrices}
                  variant="outline"
                >
                  {isFetchingPrices ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {priceFetchProgress > 0 ? `Fetching... ${priceFetchProgress}%` : 'Starting...'}
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Fetch All Prices
                    </>
                  )}
                </Button>
                <Button
                  onClick={clearPrices}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Prices
                </Button>
                <Button
                  onClick={fetchPricesViaEdgeFunction}
                  variant="outline"
                  className="text-blue-600 hover:text-blue-700"
                  disabled={isFetchingPrices}
                >
                  {isFetchingPrices ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Edge Function Test
                    </>
                  )}
                </Button>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="coins-of-interest"
                    checked={showOnlyCoinsOfInterest}
                    onChange={(e) => {
                      setShowOnlyCoinsOfInterest(e.target.checked)
                      setCurrentPage(1) // Reset to first page when filter changes
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="coins-of-interest" className="text-sm cursor-pointer flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    Show only coins of interest
                  </Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAnalyzed ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-2 font-medium text-muted-foreground">Token</th>
                      <th className="py-3 px-4 font-medium text-muted-foreground">Date</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground" colSpan={3}>Call Analysis</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground" colSpan={3}>X Analysis</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Price/ROI</th>
                      <th className="py-3 px-2"></th>
                    </tr>
                    <tr className="border-b text-left text-xs">
                      <th className="py-2 px-2"></th>
                      <th className="py-2 px-2 font-normal text-muted-foreground">Score</th>
                      <th className="py-2 px-2 font-normal text-muted-foreground">Tier</th>
                      <th className="py-2 px-2 font-normal text-muted-foreground border-r"></th>
                      <th className="py-2 px-2 font-normal text-muted-foreground">Score</th>
                      <th className="py-2 px-2 font-normal text-muted-foreground">Tier</th>
                      <th className="py-2 px-2 font-normal text-muted-foreground border-r"></th>
                      <th className="py-2 px-2"></th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyzedCalls.map((call) => {
                      const callTier = getTier(call.score)
                      const xTier = call.x_score ? getTier(call.x_score) : null
                      return (
                        <tr key={call.krom_id} className={`border-b hover:bg-muted/50 transition-colors ${call.is_invalidated ? 'opacity-50' : ''}`}>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              {call.contract ? (
                                <button
                                  onClick={() => setSelectedTokenForChart({
                                    ticker: call.token,
                                    contract: call.contract,
                                    network: call.network,
                                    kromId: call.krom_id,
                                    priceData: {
                                      currentPrice: call.current_price,
                                      priceAtCall: call.price_at_call,
                                      roi: call.roi_percent,
                                      currentMcap: call.current_market_cap,
                                      currentFdv: call.current_fdv,
                                      ath: call.ath_price,
                                      athROI: call.ath_roi_percent,
                                      marketCapAtCall: call.market_cap_at_call,
                                      athMarketCap: call.ath_market_cap,
                                      athFdv: call.ath_fdv
                                    },
                                    callTimestamp: call.call_timestamp || call.buy_timestamp
                                  })}
                                  className="font-mono text-sm hover:underline text-left"
                                >
                                  {call.token}
                                </button>
                              ) : (
                                <span className="font-mono text-sm">{call.token}</span>
                              )}
                              {call.has_comment && (
                                <span title="Has comment">
                                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                </span>
                              )}
                              <button
                                onClick={() => toggleCoinOfInterest(call)}
                                className="hover:text-yellow-500 transition-colors"
                                title={call.is_coin_of_interest ? "Unmark as coin of interest" : "Mark as coin of interest"}
                              >
                                <Star className={`h-3 w-3 ${call.is_coin_of_interest ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                              </button>
                              {call.contract && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(call.contract)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                            {call.call_timestamp || call.buy_timestamp ? (
                              <span 
                                title={`${new Date(call.call_timestamp || call.buy_timestamp).toLocaleString('en-US', {
                                  timeZone: 'Asia/Bangkok',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })} (Thai Time)`}
                                className="cursor-help border-b border-dotted border-muted-foreground/30"
                              >
                                {new Date(call.call_timestamp || call.buy_timestamp).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric'
                                })}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-2 font-semibold">{call.score.toFixed(1)}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getTierClass(callTier)}`}>
                                {callTier}
                              </span>
                              <TokenTypeBadge type={call.token_type} className="scale-90" />
                            </div>
                          </td>
                          <td className="py-3 px-2 border-r">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDetailPanel(call, 'call')}
                                className="text-xs"
                                title="View Call Analysis Details"
                              >
                                Details
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => reanalyzeCall(call)}
                                disabled={reanalyzingCalls.has(call.krom_id)}
                                className="text-xs"
                                title="Reanalyze Call"
                              >
                                <RefreshCw className={`h-3 w-3 ${reanalyzingCalls.has(call.krom_id) ? 'animate-spin' : ''}`} />
                              </Button>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-semibold">
                            {call.x_score ? `${call.x_score}/10` : '-'}
                          </td>
                          <td className="py-3 px-2">
                            {xTier ? (
                              <div className="flex items-center gap-2">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getTierClass(xTier)}`}>
                                  {xTier}
                                </span>
                                {call.x_token_type && (
                                  <TokenTypeBadge type={call.x_token_type} className="scale-90" />
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {call.x_score ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDetailPanel(call, 'x')}
                                  className="text-xs"
                                  title="View X Analysis Details"
                                >
                                  Details
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => reanalyzeX(call)}
                                  disabled={reanalyzingXCalls.has(call.krom_id)}
                                  className="text-xs"
                                  title="Reanalyze X"
                                >
                                  <RefreshCw className={`h-3 w-3 ${reanalyzingXCalls.has(call.krom_id) ? 'animate-spin' : ''}`} />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => reanalyzeX(call)}
                                disabled={reanalyzingXCalls.has(call.krom_id)}
                                className="text-xs"
                                title="Analyze X for first time"
                              >
                                <RefreshCw className={`h-3 w-3 ${reanalyzingXCalls.has(call.krom_id) ? 'animate-spin' : ''}`} />
                                Analyze
                              </Button>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <PriceDisplay 
                              contractAddress={call.contract}
                              callTimestamp={call.call_timestamp || call.buy_timestamp}
                              kromId={call.krom_id}
                              network={call.network}
                              rawData={call.raw_data}
                              existingPriceData={call.price_at_call ? {
                                priceAtCall: call.price_at_call,
                                currentPrice: call.current_price,
                                ath: call.ath_price,
                                athDate: call.ath_timestamp,
                                roi: call.roi_percent,
                                athROI: call.ath_roi_percent,
                                drawdownFromATH: call.ath_price && call.current_price 
                                  ? ((call.ath_price - call.current_price) / call.ath_price) * 100 
                                  : null,
                                marketCapAtCall: call.market_cap_at_call,
                                currentMarketCap: call.current_market_cap,
                                athMarketCap: call.ath_market_cap,
                                fdvAtCall: call.fdv_at_call,
                                currentFDV: call.current_fdv,
                                athFDV: call.ath_fdv
                              } : null}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleInvalidate(call)}
                                className={`text-xs ${call.is_invalidated ? 'text-orange-600 hover:text-orange-700' : 'text-gray-600 hover:text-gray-700'}`}
                                title={call.is_invalidated ? 'Restore token (mark as valid)' : 'Invalidate token (bad data)'}
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteAnalysis(call)}
                                className="text-xs text-destructive hover:text-destructive/90"
                                title="Delete new analysis (keeps original tier analysis)"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {!searchQuery && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="Go to first page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
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
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Go to last page"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Detail Panel */}
      <AnalysisDetailPanel
        call={selectedCall}
        isOpen={isPanelOpen}
        mode={detailMode}
        onClose={closeDetailPanel}
        onCommentSaved={onCommentSaved}
      />
      
      {/* GeckoTerminal Chart Panel */}
      {selectedTokenForChart && (
        <GeckoTerminalPanel
          token={selectedTokenForChart}
          onClose={() => setSelectedTokenForChart(null)}
        />
      )}
    </div>
  )
}