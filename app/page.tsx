'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Copy, ExternalLink, ChevronRight, MessageSquare } from 'lucide-react'
import { AnalysisDetailPanel } from '@/components/analysis-detail-panel'

export default function HomePage() {
  const [count, setCount] = useState('5')
  const [model, setModel] = useState('claude-3-haiku-20240307')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState<any>(null)
  const [analyzedCalls, setAnalyzedCalls] = useState<any[]>([])
  const [analyzedCount, setAnalyzedCount] = useState(0)
  const [loadingAnalyzed, setLoadingAnalyzed] = useState(true)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Fetch analyzed calls on mount
  useEffect(() => {
    fetchAnalyzedCalls()
  }, [])

  const fetchAnalyzedCalls = async () => {
    setLoadingAnalyzed(true)
    try {
      const response = await fetch('/api/analyzed?limit=20')
      const data = await response.json()
      
      if (data.success) {
        setAnalyzedCalls(data.results)
        setAnalyzedCount(data.count)
      }
    } catch (err) {
      console.error('Failed to fetch analyzed calls:', err)
    } finally {
      setLoadingAnalyzed(false)
    }
  }

  const startAnalysis = async () => {
    setIsAnalyzing(true)
    setError('')
    setResults(null)
    setProgress(0)
    setStatus('Connecting to database...')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: parseInt(count),
          model: model
        })
      })

      const data = await response.json()
      
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

  const openDetailPanel = (call: any) => {
    setSelectedCall(call)
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

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">KROM Historical Analysis Tool</CardTitle>
          <CardDescription>
            Analyze cryptocurrency calls with AI-powered scoring
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Call Analysis Column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Call Analysis</CardTitle>
            <CardDescription>
              Analyze based on call messages
            </CardDescription>
          </CardHeader>
        
        <CardContent className="space-y-6">
          {!results ? (
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
                
                <div>
                  <Label htmlFor="model">AI Model</Label>
                  <Select value={model} onValueChange={setModel} disabled={isAnalyzing}>
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet (Better)</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
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
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Analysis Results</h2>
                <p className="text-sm text-muted-foreground">
                  Analyzed {results.count} calls • {results.model} • Completed in {results.duration}s
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-2 font-medium text-muted-foreground">Token</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Score</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Tier</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Legitimacy</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((result: any, index: number) => {
                      const tier = getTier(result.score)
                      const legitimacyColor = result.legitimacy_factor === 'High' ? 'text-green-600 dark:text-green-400' : 
                                             result.legitimacy_factor === 'Medium' ? 'text-orange-600 dark:text-orange-400' : 
                                             'text-muted-foreground'
                      return (
                        <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              {result.contract ? (
                                <a
                                  href={`https://dexscreener.com/${result.network === 'solana' ? 'solana' : 'ethereum'}/${result.contract}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-sm hover:underline"
                                >
                                  {result.token}
                                </a>
                              ) : (
                                <span className="font-mono text-sm">{result.token}</span>
                              )}
                              {result.has_comment && (
                                <span title="Has comment">
                                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                </span>
                              )}
                              {result.contract && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(result.contract)}
                                  title="Copy contract address"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 font-semibold">{result.score.toFixed(1)}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getTierClass(tier)}`}>
                              {tier}
                            </span>
                          </td>
                          <td className={`py-3 px-2 ${legitimacyColor}`}>{result.legitimacy_factor}</td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDetailPanel(result)}
                              className="text-xs"
                            >
                              View Details
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={downloadCSV} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
                <Button onClick={resetAnalysis} variant="outline" className="flex-1">
                  New Analysis
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* X Analysis Column */}
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
                value="5"
                min="1"
                max="100"
                disabled={true}
              />
            </div>
            
            <div>
              <Label htmlFor="x-model">AI Model</Label>
              <Select value="claude-3-haiku-20240307" disabled={true}>
                <SelectTrigger id="x-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4">
              <Button 
                disabled={true}
                className="w-full"
                size="lg"
              >
                Start X Analysis
              </Button>
            </div>
          </div>
          
          <div className="text-center text-muted-foreground p-8">
            <p className="text-sm">X analysis will be available soon</p>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Previously Analyzed Calls */}
      {analyzedCalls.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Previously Analyzed Calls</CardTitle>
            <CardDescription>
              {analyzedCount} total calls analyzed • Showing most recent {analyzedCalls.length}
            </CardDescription>
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
                      <th className="py-3 px-2 font-medium text-muted-foreground">Score</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Tier</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground">Legitimacy</th>
                      <th className="py-3 px-2 font-medium text-muted-foreground text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyzedCalls.map((call) => {
                      const tier = getTier(call.score)
                      const legitimacyColor = call.legitimacy_factor === 'High' ? 'text-green-600 dark:text-green-400' : 
                                             call.legitimacy_factor === 'Medium' ? 'text-orange-600 dark:text-orange-400' : 
                                             'text-muted-foreground'
                      return (
                        <tr key={call.krom_id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              {call.contract ? (
                                <a
                                  href={`https://dexscreener.com/${call.network === 'solana' ? 'solana' : 'ethereum'}/${call.contract}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-sm hover:underline"
                                >
                                  {call.token}
                                </a>
                              ) : (
                                <span className="font-mono text-sm">{call.token}</span>
                              )}
                              {call.has_comment && (
                                <span title="Has comment">
                                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                </span>
                              )}
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
                          <td className="py-3 px-2 font-semibold">{call.score.toFixed(1)}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getTierClass(tier)}`}>
                              {tier}
                            </span>
                          </td>
                          <td className={`py-3 px-2 ${legitimacyColor}`}>{call.legitimacy_factor}</td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDetailPanel(call)}
                              className="text-xs"
                            >
                              View Details
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Detail Panel */}
      <AnalysisDetailPanel
        call={selectedCall}
        isOpen={isPanelOpen}
        onClose={closeDetailPanel}
        onCommentSaved={onCommentSaved}
      />
    </div>
  )
}