'use client'

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'

export interface ColumnVisibility {
  callAnalysis: boolean
  xAnalysis: boolean
  websiteAnalysis: boolean
}

interface ColumnSettingsProps {
  onSettingsChange: (settings: ColumnVisibility) => void
}

export default function ColumnSettings({ onSettingsChange }: ColumnSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<ColumnVisibility>({
    callAnalysis: true,
    xAnalysis: true,
    websiteAnalysis: false // Default to off until we have data
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('columnVisibility')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings(parsed)
        onSettingsChange(parsed)
      } catch (e) {
        console.error('Failed to parse saved settings:', e)
      }
    }
  }, [])

  const handleToggle = (column: keyof ColumnVisibility) => {
    const newSettings = {
      ...settings,
      [column]: !settings[column]
    }
    setSettings(newSettings)
    localStorage.setItem('columnVisibility', JSON.stringify(newSettings))
    onSettingsChange(newSettings)
  }

  return (
    <>
      {/* Settings Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="ml-2 p-1.5 rounded hover:bg-[#1a1c1f] transition-colors"
        title="Column Settings"
      >
        <Settings className="w-4 h-4 text-[#666] hover:text-[#00ff88]" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#111214] border border-[#2a2d31] rounded-lg p-6 w-[400px]">
            <h3 className="text-[#00ff88] text-lg font-semibold mb-4">
              Column Visibility Settings
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#888]">Call Analysis</span>
                <input
                  type="checkbox"
                  checked={settings.callAnalysis}
                  onChange={() => handleToggle('callAnalysis')}
                  className="w-4 h-4 rounded border-[#2a2d31] bg-[#1a1c1f] text-[#00ff88] focus:ring-[#00ff88] focus:ring-offset-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#888]">X Analysis</span>
                <input
                  type="checkbox"
                  checked={settings.xAnalysis}
                  onChange={() => handleToggle('xAnalysis')}
                  className="w-4 h-4 rounded border-[#2a2d31] bg-[#1a1c1f] text-[#00ff88] focus:ring-[#00ff88] focus:ring-offset-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#888]">Website Analysis</span>
                <input
                  type="checkbox"
                  checked={settings.websiteAnalysis}
                  onChange={() => handleToggle('websiteAnalysis')}
                  className="w-4 h-4 rounded border-[#2a2d31] bg-[#1a1c1f] text-[#00ff88] focus:ring-[#00ff88] focus:ring-offset-0"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-[#00ff88] text-black rounded hover:bg-[#00cc66] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}