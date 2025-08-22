'use client'

import { ReactNode } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface XAnalysisTooltipProps {
  children: ReactNode
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
    <Tooltip>
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
                <span className="text-xs font-semibold text-gray-400">X/TWITTER ANALYSIS</span>
                {score && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#333] text-white">
                    Score: {score}/10
                  </span>
                )}
              </div>
            </div>

            {/* Tier explanation */}
            {tier && (
              <div className="text-xs text-gray-400 italic">
                {getTierExplanation(tier)}
              </div>
            )}

            {/* Summary data if available */}
            {summaryData && (
              <div className="space-y-1.5">
                {summaryData.projectPurpose && (
                  <div className="text-xs">
                    <span className="text-gray-500">Purpose:</span>{' '}
                    <span className="text-gray-300">{summaryData.projectPurpose}</span>
                  </div>
                )}
                {summaryData.team && (
                  <div className="text-xs">
                    <span className="text-gray-500">Team:</span>{' '}
                    <span className="text-gray-300">{summaryData.team}</span>
                  </div>
                )}
                {summaryData.keyDetail && (
                  <div className="text-xs">
                    <span className="text-gray-500">Details:</span>{' '}
                    <span className="text-gray-300">{summaryData.keyDetail}</span>
                  </div>
                )}
                {summaryData.redFlags && summaryData.redFlags.length > 0 && (
                  <div className="text-xs">
                    <span className="text-red-400">⚠️ Risks:</span>
                    {summaryData.redFlags.map((flag, i) => (
                      <div key={i} className="text-gray-400 pl-3">• {flag}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fallback to reasoning if no summary */}
            {!summaryData && reasoning && (
              <div className="text-xs text-gray-400">
                {getReasoningHighlight()}
              </div>
            )}

            {/* Best tweet if available */}
            {bestTweet && (
              <div className="pt-2 border-t border-[#333]">
                <div className="text-xs font-semibold text-gray-400 mb-1">Sample Tweet:</div>
                <div className="text-xs text-gray-300 italic">
                  "{bestTweet.length > 150 ? bestTweet.substring(0, 147) + '...' : bestTweet}"
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
    </Tooltip>
  )
}