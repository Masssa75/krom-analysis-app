'use client'

import TopEarlyCalls from '@/components/TopEarlyCalls'
import RecentCalls from '@/components/RecentCalls'

export default function HomePage() {
  return (
    <div className="fixed inset-0 flex bg-[#0a0b0d]">
      {/* Left Sidebar */}
      <div className="w-[300px] bg-[#111214] border-r border-[#2a2d31] flex-shrink-0 overflow-y-auto">
        <div className="p-5 border-b border-[#1a1c1f]">
          <h1 className="text-[32px] font-black tracking-[4px] text-[#00ff88] mb-1">KROM</h1>
          <p className="text-[#666] text-xs">Advanced Token Discovery</p>
        </div>

        {/* Filter Section - Title Only */}
        <div className="p-5 border-b border-[#1a1c1f]">
          <h3 className="text-[13px] uppercase tracking-[1px] text-[#888] font-semibold">FILTERS</h3>
          <p className="text-[#444] text-sm italic mt-2">Filters will be added here</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black overflow-y-auto">
        {/* Top Early Calls Section */}
        <TopEarlyCalls />

        {/* Recent Calls Section */}
        <RecentCalls />
      </div>
    </div>
  )
}