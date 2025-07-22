import React from 'react'

interface TokenTypeBadgeProps {
  type: 'meme' | 'utility' | 'hybrid' | string
  className?: string
}

export function TokenTypeBadge({ type, className = '' }: TokenTypeBadgeProps) {
  const getTypeStyles = () => {
    switch (type?.toLowerCase()) {
      case 'meme':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'utility':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'hybrid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getTypeEmoji = () => {
    switch (type?.toLowerCase()) {
      case 'meme':
        return '🎪'
      case 'utility':
        return '⚙️'
      case 'hybrid':
        return '🔀'
      default:
        return '❓'
    }
  }

  const getTypeLabel = () => {
    if (!type) return 'Unknown'
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getTypeStyles()} ${className}`}>
      <span className="text-[10px]">{getTypeEmoji()}</span>
      {getTypeLabel()}
    </span>
  )
}