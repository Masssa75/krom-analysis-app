'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink, Copy, Clock, Cpu, Hash, MessageSquare, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TokenTypeBadge } from '@/components/token-type-badge'

interface AnalysisDetailPanelProps {
  call: any
  isOpen: boolean
  mode: 'call' | 'x'
  onClose: () => void
  onCommentSaved?: (krom_id: string, hasComment: boolean) => void
}

export function AnalysisDetailPanel({ call, isOpen, mode, onClose, onCommentSaved }: AnalysisDetailPanelProps) {
  const [comment, setComment] = useState('')
  const [originalComment, setOriginalComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [commentUpdatedAt, setCommentUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && call) {
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
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{call.token}</h2>
                  <TokenTypeBadge type={call.token_type} className="scale-110" />
                  <span className="text-sm text-muted-foreground">
                    {mode === 'call' ? 'Call Analysis' : 'X Analysis'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">
                    {mode === 'call' ? call.score : call.x_score}/10
                  </span>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                    mode === 'call' 
                      ? getTierClass(tier) 
                      : getTierClass(call.x_tier || getTier(call.x_score))
                  }`}>
                    {mode === 'call' ? tier : (call.x_tier || getTier(call.x_score))}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Legitimacy: {mode === 'call' ? call.legitimacy_factor : call.x_legitimacy_factor || 'Unknown'}
                  </span>
                </div>
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
              <h3 className="text-lg font-semibold mb-3">
                {mode === 'call' ? 'AI Analysis' : 'Social Media Analysis'}
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                {mode === 'call' ? (
                  <p className="text-sm leading-relaxed">
                    {call.analysis_reasoning || 'No detailed analysis available.'}
                  </p>
                ) : (
                  <>
                    {call.x_score ? (
                      <>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{call.x_tweet_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Tweets Analyzed</div>
                          </div>
                        </div>
                        {call.x_best_tweet && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold mb-1">Most Relevant Tweet:</h4>
                            <div className="bg-background/50 rounded p-3 text-sm italic">
                              "{call.x_best_tweet}"
                            </div>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">
                          {call.x_analysis_reasoning || 'No detailed X analysis available.'}
                        </p>
                      </>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground">
                        <p>No X analysis available for this call yet.</p>
                        <p className="text-xs mt-1">Run X batch analysis to score social media presence.</p>
                      </div>
                    )}
                  </>
                )}
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
                  <span className="font-mono">
                    {mode === 'call' ? (call.analysis_model || 'Unknown') : 'claude-3-haiku'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Analyzed:</span>
                  <span>
                    {mode === 'call' 
                      ? (call.analyzed_at ? new Date(call.analyzed_at).toLocaleDateString() : 'N/A')
                      : (call.x_analyzed_at ? new Date(call.x_analyzed_at).toLocaleDateString() : 'N/A')
                    }
                  </span>
                </div>
                {mode === 'x' && call.x_score && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Data Source:</span>
                    <span className="text-xs">X/Twitter via Nitter</span>
                  </div>
                )}
              </div>
            </div>

            {/* Prompt Used - Only for Call Analysis */}
            {mode === 'call' && call.analysis_prompt_used && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Analysis Prompt</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {call.analysis_prompt_used}
                  </pre>
                </div>
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