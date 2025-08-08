'use client'

import { Map, Cpu, Smartphone, Link, TrendingUp, Users, PieChart, Award, Globe, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FloatingMenu from '@/components/FloatingMenu'

interface RoadmapItem {
  status: 'completed' | 'in-progress' | 'planned'
  icon: React.ReactNode
  title: string
  description: string
  tags: string[]
  quarter: string
}

export default function RoadmapPage() {
  const router = useRouter()
  const roadmapItems: RoadmapItem[] = [
    {
      status: 'completed',
      icon: <Cpu size={24} />,
      title: 'Enhanced AI Analysis Engine',
      description: 'Core upgrade to GPT-4 Turbo for improved token analysis',
      tags: ['AI', 'Core'],
      quarter: 'Q1 2025'
    },
    {
      status: 'in-progress',
      icon: <Smartphone size={24} />,
      title: 'Mobile App Beta',
      description: 'Launch iOS and Android apps with real-time notifications for high-score calls and portfolio tracking.',
      tags: ['Mobile', 'UX'],
      quarter: 'Q1 2025'
    },
    {
      status: 'in-progress',
      icon: <Link size={24} />,
      title: 'DeFi Integration Suite',
      description: 'Direct integration with Uniswap, PancakeSwap, and other DEXs for instant trading from the platform.',
      tags: ['DeFi', 'Trading'],
      quarter: 'Q2 2025'
    },
    {
      status: 'in-progress',
      icon: <TrendingUp size={24} />,
      title: 'Advanced Charting Tools',
      description: 'TradingView integration with custom indicators specific to memecoin and altcoin trading patterns.',
      tags: ['Charts', 'Analytics'],
      quarter: 'Q2 2025'
    },
    {
      status: 'planned',
      icon: <Users size={24} />,
      title: 'Social Trading Features',
      description: 'Follow top performers, copy trades, and share insights with the KROM community.',
      tags: ['Social', 'Community'],
      quarter: 'Q3 2025'
    },
    {
      status: 'completed',
      icon: <PieChart size={24} />,
      title: 'Automated Portfolio Tracking',
      description: 'Connect wallets to track P&L, get tax reports, and monitor portfolio performance across all chains.',
      tags: ['Portfolio', 'Automation'],
      quarter: 'Q3 2025'
    },
    {
      status: 'planned',
      icon: <Award size={24} />,
      title: 'DAO Governance Launch',
      description: 'Decentralized governance for platform decisions, fee structures, and feature prioritization.',
      tags: ['DAO', 'Governance'],
      quarter: 'Q4 2025'
    },
    {
      status: 'planned',
      icon: <Globe size={24} />,
      title: 'Cross-Chain Support',
      description: 'Expand beyond EVM chains to support Solana, Cosmos, and other emerging ecosystems.',
      tags: ['Multi-chain', 'Infrastructure'],
      quarter: 'Q4 2025'
    }
  ]

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[#00ff88]'
      case 'in-progress':
        return 'bg-[#ffaa00]'
      default:
        return 'bg-[#2a2d31]'
    }
  }

  const getItemBorderClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-[#00ff88]'
      case 'in-progress':
        return 'border-[#ffaa00]'
      default:
        return 'border-[#1a1c1f]'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d]">
      {/* Header */}
      <div className="bg-[#111214] border-b border-[#1a1c1f] px-6 py-8 lg:px-12">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[#00ff88] hover:text-[#00ff88]/80 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back to Dashboard</span>
        </button>
        <h1 className="text-5xl font-extralight tracking-widest text-white mb-2">
          KROM ROADMAP
        </h1>
        <div className="text-[#00ff88] text-sm tracking-[0.1em] uppercase">
          Development Timeline 2025
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-6">
          {roadmapItems.map((item, index) => (
            <div
              key={index}
              className={`relative bg-[#111214] border-2 ${getItemBorderClass(item.status)} rounded-2xl p-7 cursor-pointer transition-all duration-300 hover:border-[#2a2d31] hover:translate-x-1`}
            >
              {/* Status Dot */}
              <div className={`absolute -left-[11px] top-8 w-5 h-5 rounded-full border-[3px] border-[#0a0b0d] ${getStatusDotClass(item.status)}`} />
              
              {/* Connecting Line */}
              {index < roadmapItems.length - 1 && (
                <div className="absolute left-[-1px] top-14 bottom-[-1.5rem] w-[2px] bg-gradient-to-b from-[#1a1c1f] to-transparent" />
              )}

              {/* Item Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-[#00ff88] opacity-80 flex-shrink-0">
                  {item.icon}
                </div>
                <h3 className="text-[1.35rem] font-normal tracking-[0.02em] text-[#e0e0e0]">
                  {item.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-[#888] text-base leading-relaxed mb-5 pl-10">
                {item.description}
              </p>

              {/* Meta Information */}
              <div className="flex gap-4 items-center pl-10">
                <div className="flex gap-2 flex-1">
                  {item.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="bg-[#1a1c1f] text-[#666] px-3 py-1.5 rounded-[10px] text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-[#555] text-sm">
                  {item.quarter}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Floating Menu */}
      <FloatingMenu />
    </div>
  )
}