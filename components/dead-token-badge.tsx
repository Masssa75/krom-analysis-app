import React from 'react'
import { Skull } from 'lucide-react'

export function DeadTokenBadge({ className = '' }: { className?: string }) {
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 ${className}`}
      title="Dead token - no liquidity"
    >
      <Skull className="h-3 w-3" />
      Dead
    </span>
  )
}