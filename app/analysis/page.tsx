'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Copy, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AnalysisResult {
  token: string
  contract: string
  score: number
  tier: string
  legitimacy_factor: string
  explanation: string
}

export default function AnalysisPage() {
  const [count, setCount] = useState('5')
  const [model, setModel] = useState('claude-3-haiku-20240307')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [summary, setSummary] = useState('')

  const startAnalysis = async () => {
    setLoading(true)
    setError('')
    setResults([])
    setProgress(10)
    setStatus('Connecting to database...')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: parseInt(count),
          model: model
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      setResults(data.results)
      setSummary(`Analyzed ${data.count} calls • ${data.model} • Completed in ${data.duration}s`)
      setProgress(100)
      setStatus('Analysis complete!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    // Show toast or feedback
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ALPHA': return 'bg-blue-100 text-blue-800'
      case 'SOLID': return 'bg-cyan-100 text-cyan-800'
      case 'BASIC': return 'bg-gray-100 text-gray-800'
      case 'TRASH': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Historical Analysis Tool</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Batch Analysis</CardTitle>
          <CardDescription>
            Analyze crypto calls from oldest to newest to identify high-potential tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="count">Number of calls to analyze (from oldest)</Label>
              <Input
                id="count"
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                min="1"
                max="100"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select value={model} onValueChange={setModel} disabled={loading}>
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
          </div>

          <Button 
            onClick={startAnalysis} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Analyzing...' : 'Start Analysis'}
          </Button>

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">{status}</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>{summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Legitimacy Factor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {result.token}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {result.contract ? 
                          `${result.contract.slice(0, 6)}...${result.contract.slice(-4)}` : 
                          'N/A'
                        }
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                        {result.score.toFixed(1)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(result.tier)}`}>
                          {result.tier}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.legitimacy_factor}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          {result.contract && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(result.contract)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy CA
                              </Button>
                              <a
                                href={`https://dexscreener.com/search/${result.contract}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                DexScreener
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-4">
              <Button variant="outline" onClick={() => window.location.href = '/api/download-csv'}>
                Download CSV
              </Button>
              <Button variant="outline" onClick={() => {
                setResults([])
                setSummary('')
              }}>
                New Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}