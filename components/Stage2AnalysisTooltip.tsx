'use client'

import { useState } from 'react'

interface Stage2Analysis {
  verdict: string
  final_score: number
  smoking_guns?: string[]
  technical_assessment?: {
    score: number
    findings: string[]
  }
  investment_red_flags?: {
    score: number
    issues: string[]
  }
  summary?: string
}

interface Stage2AnalysisTooltipProps {
  children: React.ReactNode
  score?: number
  analysis?: Stage2Analysis
}

export function Stage2AnalysisTooltip({ children, score, analysis }: Stage2AnalysisTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  if (!analysis) {
    return <>{children}</>
  }

  const getVerdictColor = (verdict: string) => {
    const verdictLower = verdict?.toLowerCase() || ''
    if (verdictLower.includes('honeypot')) return '#ff4444'
    if (verdictLower.includes('legitimate')) return '#00ff88'
    if (verdictLower.includes('suspicious')) return '#ffaa00'
    if (verdictLower.includes('risky')) return '#ff8800'
    return '#888888'
  }

  const getScoreColor = (score: number) => {
    if (score >= 7) return '#00ff88'
    if (score >= 5) return '#ffcc00'
    if (score >= 3) return '#ff9944'
    return '#ff4444'
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
          <div className="bg-[#1a1c1f] rounded-lg shadow-xl border border-[#333] min-w-[400px] max-w-[500px]">
            <div className="p-4 space-y-3">
              {/* Header with Verdict and Score */}
              <div className="flex items-center justify-between border-b border-[#2a2d31] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#888]">CONTRACT ANALYSIS</span>
                  <span 
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ 
                      backgroundColor: getVerdictColor(analysis.verdict) + '22',
                      color: getVerdictColor(analysis.verdict)
                    }}
                  >
                    {analysis.verdict}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#666]">Score:</span>
                  <span 
                    className="text-lg font-bold"
                    style={{ color: getScoreColor(analysis.final_score) }}
                  >
                    {analysis.final_score}/10
                  </span>
                </div>
              </div>

              {/* Smoking Guns - Most Important */}
              {analysis.smoking_guns && analysis.smoking_guns.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#ff4444] text-lg">🚨</span>
                    <span className="text-xs font-semibold text-[#ff8888]">CRITICAL ISSUES</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {analysis.smoking_guns.map((gun, idx) => (
                      <li key={idx} className="text-xs text-[#ffaaaa] flex items-start">
                        <span className="text-[#ff6666] mr-2">•</span>
                        <span>{gun}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Assessment */}
              {analysis.technical_assessment && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#888]">Technical Assessment</span>
                    <span className="text-xs text-[#666]">
                      Score: {analysis.technical_assessment.score}/10
                    </span>
                  </div>
                  {analysis.technical_assessment.findings && analysis.technical_assessment.findings.length > 0 && (
                    <ul className="space-y-0.5 ml-3">
                      {analysis.technical_assessment.findings.slice(0, 3).map((finding, idx) => (
                        <li key={idx} className="text-xs text-[#aaa] truncate">
                          • {finding}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Investment Red Flags */}
              {analysis.investment_red_flags && analysis.investment_red_flags.issues && 
               analysis.investment_red_flags.issues.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#ff9944]">Investment Risk</span>
                    <span className="text-xs text-[#666]">
                      Score: {analysis.investment_red_flags.score}/10
                    </span>
                  </div>
                  <ul className="space-y-0.5 ml-3">
                    {analysis.investment_red_flags.issues.slice(0, 3).map((issue, idx) => (
                      <li key={idx} className="text-xs text-[#ffaa88] truncate">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              {analysis.summary && (
                <div className="pt-2 border-t border-[#2a2d31]">
                  <p className="text-xs text-[#ccc] leading-relaxed line-clamp-3">
                    {analysis.summary}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-2 border-t border-[#2a2d31]">
                <p className="text-[10px] text-[#666] italic">
                  Deep contract analysis via Etherscan + AI
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}