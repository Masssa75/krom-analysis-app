'use client'

import { ReactNode } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CallAnalysisTooltipProps {
  children: ReactNode
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
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        align="center"
        className="max-w-md p-3 bg-[#1a1a1a] border border-[#333] shadow-xl"
      >
        <div className="space-y-2">
          {/* Header with score and tier */}
          <div className="flex items-center justify-between border-b border-[#333] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">CALL ANALYSIS</span>
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
            <div className="text-xs text-gray-400 italic">
              {getTierExplanation(tier)}
            </div>
          )}

          {/* Key findings */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-300">Key Findings:</div>
            {keyPoints.map((point, i) => (
              <div key={i} className="text-xs text-gray-400 pl-2">
                • {point}
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}