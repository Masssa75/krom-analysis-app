'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

interface TopPerformer {
  ticker: string
  group: string
  source: string
  ath_roi_percent: number
  current_roi_percent: number
  contract_address: string
  network: string
  buy_timestamp: string
}

export function TopPerformersTicker() {
  const [performers, setPerformers] = useState<TopPerformer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopPerformers()
  }, [])

  const fetchTopPerformers = async () => {
    try {
      const response = await fetch('/api/top-performers')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setPerformers(data.performers || [])
    } catch (error) {
      console.error('Failed to fetch top performers:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatROI = (roi: number) => {
    if (!roi || roi <= 0) return null
    return `${roi.toFixed(0)}X`
  }

  const getIlluminationClass = (roi: number) => {
    if (roi >= 100) return 'text-yellow-400 font-black animate-pulse' // 100X+ - gold and pulsing
    if (roi >= 50) return 'text-orange-400 font-bold' // 50X+ - orange and bold
    if (roi >= 20) return 'text-green-400 font-semibold' // 20X+ - green
    if (roi >= 10) return 'text-blue-400' // 10X+ - blue
    return 'text-gray-400' // Under 10X
  }

  const getGroupDisplay = (group: string, source: string) => {
    // Clean up group names for display
    const cleanGroup = group?.replace(/^Group:\s*/i, '').trim() || 'Unknown'
    
    // For really high performers, make the group stand out
    return cleanGroup
  }

  if (loading || performers.length === 0) return null

  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="relative overflow-hidden h-10">
        <div className="absolute flex items-center h-full animate-scroll">
          {/* Duplicate the list for seamless scrolling */}
          {[...performers, ...performers].map((performer, index) => {
            const roi = performer.ath_roi_percent || performer.current_roi_percent
            const roiDisplay = formatROI(roi)
            
            if (!roiDisplay) return null

            return (
              <div
                key={`${performer.ticker}-${index}`}
                className="flex items-center px-6 whitespace-nowrap"
              >
                <span className="text-gray-500 text-sm">${performer.ticker}</span>
                <span className={`ml-2 ${getIlluminationClass(roi)}`}>
                  {roiDisplay}
                </span>
                <span className="ml-2 text-gray-600 text-xs">
                  by {getGroupDisplay(performer.group, performer.source)}
                </span>
                {performer.contract_address && (
                  <a
                    href={`https://dexscreener.com/${performer.network}/${performer.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-gray-700 hover:text-gray-500 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}