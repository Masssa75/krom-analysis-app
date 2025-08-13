'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export default function SearchInput({ onSearch, placeholder = "Search ticker or CA..." }: SearchInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleInputChange = (value: string) => {
    setQuery(value)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      onSearch(value)
    }, 300)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="ml-3 p-1.5 rounded hover:bg-[#1a1c1f] transition-colors"
        aria-label="Search"
      >
        <Search className="w-4 h-4 text-[#666]" />
      </button>
    )
  }

  return (
    <div className="ml-3 flex items-center gap-2 bg-[#1a1c1f] rounded px-3 py-1.5">
      <Search className="w-4 h-4 text-[#666] flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-sm text-white placeholder-[#666] w-[200px]"
      />
      <button
        onClick={handleClear}
        className="p-0.5 rounded hover:bg-[#2a2d31] transition-colors"
        aria-label="Clear search"
      >
        <X className="w-3.5 h-3.5 text-[#666]" />
      </button>
    </div>
  )
}