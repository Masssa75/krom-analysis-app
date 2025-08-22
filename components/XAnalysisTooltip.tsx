'use client'

import React from 'react'

interface XAnalysisTooltipProps {
  children: React.ReactNode
  score?: number
  reasoning?: string
  summary?: string
  bestTweet?: string
  tier?: string
}

export function XAnalysisTooltip({ 
  children, 
  score,
  reasoning,
  summary,
  bestTweet,
  tier
}: XAnalysisTooltipProps) {
  const [showTooltip, setShowTooltip] = React.useState(false)

  if (!reasoning && !summary) {
    return <>{children}</>
  }

  // Parse summary if it exists (it's already well-formatted)
  const parseSummary = (summaryText: string) => {
    if (!summaryText) return null
    
    const lines = summaryText.split('\n').filter(line => line.trim())
    const projectPurpose = lines.find(l => l.includes('Project purpose:'))?.replace('• Project purpose:', '').trim()
    const team = lines.find(l => l.includes('Team/backers:'))?.replace('• Team/backers:', '').trim()
    const keyDetail = lines.find(l => l.includes('Key detail:'))?.replace('• Key detail:', '').trim()
    const redFlags = lines.filter(l => l.includes('concern:') || l.includes('risk:'))
      .map(l => l.replace(/^[•\s]+/, '').replace('Main concern:', '').replace('Secondary risk:', '').trim())
    
    return { projectPurpose, team, keyDetail, redFlags }
  }

  const summaryData = parseSummary(summary || '')

  // Get tier explanation
  const getTierExplanation = (tier: string) => {
    switch(tier) {
      case 'ALPHA':
        return 'Exceptional social presence with verified influencers'
      case 'SOLID':
        return 'Strong community engagement and genuine interest'
      case 'BASIC':
        return 'Mixed social signals, moderate engagement'
      case 'TRASH':
        return 'Poor social presence, likely bots/spam'
      case 'FAILED':
        return 'Analysis failed to complete'
      default:
        return ''
    }
  }

  // Extract first 2 sentences from reasoning if no summary
  const getReasoningHighlight = () => {
    if (!reasoning) return null
    const sentences = reasoning.split('. ').filter(s => s.length > 10)
    return sentences.slice(0, 2).join('. ') + '.'
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && (
        <div className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="bg-[#1a1c1f] rounded-lg shadow-xl border border-[#333] p-4 min-w-[300px] max-w-[400px]">
            {/* Header with score and tier */}
            <div className="flex items-center justify-between border-b border-[#2a2d31] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#888] uppercase tracking-wider">🐦 X/TWITTER ANALYSIS</span>
                {score && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#333] text-white">
                    Score: {score}/10
                  </span>
                )}
              </div>
            </div>

            {/* Tier explanation */}
            {tier && (
              <div className="text-xs text-gray-400 italic mb-3">
                {getTierExplanation(tier)}
              </div>
            )}

            {/* Summary data if available */}
            {summaryData && (
              <div className="space-y-2 mb-3">
                {summaryData.projectPurpose && (
                  <div className="text-[11px]">
                    <span className="text-[#666] font-bold">Purpose:</span>{' '}
                    <span className="text-[#aaa]">{summaryData.projectPurpose}</span>
                  </div>
                )}
                {summaryData.team && (
                  <div className="text-[11px]">
                    <span className="text-[#666] font-bold">Team:</span>{' '}
                    <span className="text-[#aaa]">{summaryData.team}</span>
                  </div>
                )}
                {summaryData.keyDetail && (
                  <div className="text-[11px]">
                    <span className="text-[#666] font-bold">Details:</span>{' '}
                    <span className="text-[#aaa]">{summaryData.keyDetail}</span>
                  </div>
                )}
                {summaryData.redFlags && summaryData.redFlags.length > 0 && (
                  <div className="text-[11px]">
                    <span className="text-red-400 font-bold">⚠️ Risks:</span>
                    {summaryData.redFlags.map((flag, i) => (
                      <div key={i} className="text-[#999] pl-3 mt-1">• {flag}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fallback to reasoning if no summary */}
            {!summaryData && reasoning && (
              <div className="text-[11px] text-[#999] mb-3">
                {getReasoningHighlight()}
              </div>
            )}

            {/* Best tweet if available */}
            {bestTweet && (
              <div className="pt-3 border-t border-[#2a2d31]">
                <div className="text-xs font-bold text-[#888] mb-2">Sample Tweet:</div>
                <div className="text-[11px] text-[#aaa] italic">
                  "{bestTweet.length > 150 ? bestTweet.substring(0, 147) + '...' : bestTweet}"
                </div>
              </div>
            )}

            {/* Arrow pointing down */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 
              border-l-[8px] border-l-transparent
              border-t-[8px] border-t-[#1a1c1f]
              border-r-[8px] border-r-transparent">
            </div>
          </div>
        </div>
      )}
    </div>
  )
}