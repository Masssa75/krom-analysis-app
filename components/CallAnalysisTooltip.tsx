'use client'

import React from 'react'

interface CallAnalysisTooltipProps {
  children: React.ReactNode
  score?: number
  reasoning?: string
  tokenType?: string
  tier?: string
}

export function CallAnalysisTooltip({ 
  children, 
  score,
  reasoning,
  tokenType,
  tier
}: CallAnalysisTooltipProps) {
  const [showTooltip, setShowTooltip] = React.useState(false)

  if (!reasoning) {
    return <>{children}</>
  }

  // Extract key points from reasoning (first 3 sentences)
  const sentences = reasoning.split('. ').filter(s => s.length > 10)
  const keyPoints = sentences.slice(0, 3).map(s => {
    // Truncate long sentences
    if (s.length > 150) {
      return s.substring(0, 147) + '...'
    }
    return s
  })

  // Get tier explanation
  const getTierExplanation = (tier: string) => {
    switch(tier) {
      case 'ALPHA':
        return 'Exceptional legitimacy with verified team/backing'
      case 'SOLID':
        return 'Good fundamentals with moderate confidence'
      case 'BASIC':
        return 'Mixed signals, proceed with caution'
      case 'TRASH':
        return 'High risk, likely pump & dump'
      case 'FAILED':
        return 'Analysis failed to complete'
      default:
        return ''
    }
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
                <span className="text-xs font-bold text-[#888] uppercase tracking-wider">📊 CALL ANALYSIS</span>
                {score && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#333] text-white">
                    Score: {score}/10
                  </span>
                )}
              </div>
              {tokenType && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#222] text-gray-300">
                  {tokenType}
                </span>
              )}
            </div>

            {/* Tier explanation */}
            {tier && (
              <div className="text-xs text-gray-400 italic mb-3">
                {getTierExplanation(tier)}
              </div>
            )}

            {/* Key findings */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#aaa] mb-2">Key Findings:</div>
              {keyPoints.map((point, i) => (
                <div key={i} className="text-[11px] text-[#999] pl-2 flex items-start">
                  <span className="text-[#666] mr-1.5">•</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>

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