'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink, Copy, Clock, Cpu, Hash, MessageSquare, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface AnalysisDetailPanelProps {
  call: any
  isOpen: boolean
  onClose: () => void
  onCommentSaved?: (krom_id: string, hasComment: boolean) => void
}

export function AnalysisDetailPanel({ call, isOpen, onClose, onCommentSaved }: AnalysisDetailPanelProps) {
  const [batchCalls, setBatchCalls] = useState<any[]>([])
  const [loadingBatch, setLoadingBatch] = useState(false)
  const [comment, setComment] = useState('')
  const [originalComment, setOriginalComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [commentUpdatedAt, setCommentUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && call) {
      // Fetch batch calls if available
      if (call.analysis_batch_id) {
        fetchBatchCalls()
      }
      // Fetch existing comment
      fetchComment()
    }
  }, [isOpen, call])
  
  // Reset comment when panel closes
  useEffect(() => {
    if (!isOpen) {
      setComment('')
      setOriginalComment('')
      setCommentUpdatedAt(null)
    }
  }, [isOpen])

  const fetchBatchCalls = async () => {
    setLoadingBatch(true)
    try {
      const response = await fetch(`/api/batch/${call.analysis_batch_id}`)
      const data = await response.json()
      if (data.success) {
        setBatchCalls(data.results.filter((c: any) => c.krom_id !== call.krom_id))
      }
    } catch (error) {
      console.error('Failed to fetch batch calls:', error)
    } finally {
      setLoadingBatch(false)
    }
  }
  
  const fetchComment = async () => {
    if (!call?.krom_id) return
    
    try {
      const response = await fetch(`/api/comment?krom_id=${call.krom_id}`)
      const data = await response.json()
      
      if (data.comment) {
        setComment(data.comment)
        setOriginalComment(data.comment)
        setCommentUpdatedAt(data.updated_at)
      }
    } catch (error) {
      console.error('Failed to fetch comment:', error)
    }
  }
  
  const saveComment = async () => {
    if (!call?.krom_id || comment === originalComment) return
    
    setSavingComment(true)
    try {
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          krom_id: call.krom_id,
          comment: comment.trim()
        }),
      })
      
      if (response.ok) {
        setOriginalComment(comment)
        setCommentUpdatedAt(new Date().toISOString())
        // Call the callback to update the comment indicator
        if (onCommentSaved) {
          onCommentSaved(call.krom_id, !!comment)
        }
      } else {
        const error = await response.json()
        console.error('Failed to save comment:', error)
        alert('Failed to save comment. Please try again.')
      }
    } catch (error) {
      console.error('Failed to save comment:', error)
      alert('Failed to save comment. Please try again.')
    } finally {
      setSavingComment(false)
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
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!call) return null

  const tier = getTier(call.score)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-xl bg-background border-l shadow-lg transform transition-transform z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{call.token}</h2>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getTierClass(tier)}`}>
                  {tier}
                </span>
                <span className="text-2xl font-bold">{call.score}/10</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Analysis Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">AI Analysis</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed">
                  {call.analysis_reasoning || 'No detailed analysis available.'}
                </p>
              </div>
            </div>

            {/* User Comments Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Feedback
              </h3>
              <div className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your feedback about this analysis. Was the score accurate? What was missed?"
                  className="min-h-[100px] resize-y"
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {commentUpdatedAt && (
                      <span>Last updated: {new Date(commentUpdatedAt).toLocaleString()}</span>
                    )}
                  </div>
                  <Button
                    onClick={saveComment}
                    disabled={savingComment || comment === originalComment}
                    size="sm"
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {savingComment ? 'Saving...' : 'Save Feedback'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Technical Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-mono">{call.analysis_model || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Response Time:</span>
                  <span>{call.analysis_duration_ms ? `${call.analysis_duration_ms}ms` : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Batch ID:</span>
                  <span className="font-mono text-xs">{call.analysis_batch_id || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Prompt Used */}
            {call.analysis_prompt_used && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Analysis Prompt</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {call.analysis_prompt_used}
                  </pre>
                </div>
              </div>
            )}

            {/* Batch Calls */}
            {call.analysis_batch_id && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Other Calls in Batch
                  {batchCalls.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({batchCalls.length} calls)
                    </span>
                  )}
                </h3>
                {loadingBatch ? (
                  <p className="text-sm text-muted-foreground">Loading batch calls...</p>
                ) : batchCalls.length > 0 ? (
                  <div className="space-y-2">
                    {batchCalls.map((batchCall) => {
                      const batchTier = getTier(batchCall.score)
                      return (
                        <div
                          key={batchCall.krom_id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm">{batchCall.token}</span>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getTierClass(batchTier)}`}>
                              {batchTier}
                            </span>
                            <span className="text-sm font-semibold">{batchCall.score}/10</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No other calls in this batch.</p>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t">
            <div className="flex gap-3">
              {call.contract && (
                <>
                  <a
                    href={`https://dexscreener.com/${call.network === 'solana' ? 'solana' : 'ethereum'}/${call.contract}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on DexScreener
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => copyToClipboard(call.contract)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Contract
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}