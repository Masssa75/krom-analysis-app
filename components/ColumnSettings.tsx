'use client'

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'

export interface ColumnVisibility {
  // Main toggles for each analysis type
  callAnalysis: boolean
  xAnalysis: boolean
  websiteAnalysis: boolean
  
  // Sub-toggles for what to show
  showScores: boolean
  showBadges: boolean
}

interface ColumnSettingsProps {
  onSettingsChange: (settings: ColumnVisibility) => void
}

export default function ColumnSettings({ onSettingsChange }: ColumnSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<ColumnVisibility>({
    callAnalysis: true,
    xAnalysis: true,
    websiteAnalysis: false, // Default to off until we have data
    showScores: true,
    showBadges: true
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('columnVisibility')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Ensure new fields exist for backward compatibility
        const updatedSettings = {
          ...settings,
          ...parsed,
          showScores: parsed.showScores !== undefined ? parsed.showScores : true,
          showBadges: parsed.showBadges !== undefined ? parsed.showBadges : true
        }
        setSettings(updatedSettings)
        onSettingsChange(updatedSettings)
      } catch (e) {
        console.error('Failed to parse saved settings:', e)
      }
    }
  }, [])

  const handleToggle = (key: keyof ColumnVisibility) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
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
          <div className="bg-[#111214] border border-[#2a2d31] rounded-lg p-6 w-[450px]">
            <h3 className="text-[#00ff88] text-lg font-semibold mb-5">
              Column Visibility Settings
            </h3>
            
            {/* Analysis Types Section */}
            <div className="mb-5">
              <h4 className="text-[#666] text-xs uppercase tracking-wider mb-3">Analysis Types</h4>
              <div className="space-y-3 pl-2">
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
            </div>

            {/* Display Options Section */}
            <div className="mb-5 pt-4 border-t border-[#2a2d31]">
              <h4 className="text-[#666] text-xs uppercase tracking-wider mb-3">Display Options</h4>
              <div className="space-y-3 pl-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[#888]">Show Scores</span>
                  <input
                    type="checkbox"
                    checked={settings.showScores}
                    onChange={() => handleToggle('showScores')}
                    className="w-4 h-4 rounded border-[#2a2d31] bg-[#1a1c1f] text-[#00ff88] focus:ring-[#00ff88] focus:ring-offset-0"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[#888]">Show Tier Badges</span>
                  <input
                    type="checkbox"
                    checked={settings.showBadges}
                    onChange={() => handleToggle('showBadges')}
                    className="w-4 h-4 rounded border-[#2a2d31] bg-[#1a1c1f] text-[#00ff88] focus:ring-[#00ff88] focus:ring-offset-0"
                  />
                </label>
              </div>
            </div>

            <div className="text-[#555] text-xs mb-4">
              Tip: You can show scores, badges, both, or neither for enabled analysis types.
            </div>

            <div className="flex justify-end">
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