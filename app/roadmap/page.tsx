'use client'

import { useState } from 'react'
import { Smartphone, Gift, Bot, Bell, ChartBar, Trophy, Coins, Rocket, FileText, Users, MessageSquare, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FloatingMenu from '@/components/FloatingMenu'

interface RoadmapItem {
  status: 'completed' | 'in-progress' | 'planned'
  icon: React.ReactNode
  title: string
  description: string
  detailedDescription?: string
  tags: string[]
  quarter: string
}

export default function RoadmapPage() {
  const router = useRouter()
  const [expandedItem, setExpandedItem] = useState<number | null>(null)
  
  const roadmapItems: RoadmapItem[] = [
    {
      status: 'in-progress',
      icon: <Gift size={24} />,
      title: 'Telegram Referral Program',
      description: 'Earn KROM tokens by referring users to our Telegram group',
      detailedDescription: 'A comprehensive referral bot for the Telegram group where users earn tokens for inviting others. Top referrers will receive several thousand dollars worth of KROM tokens from our supply allocation. The program will track invites, prevent gaming, and automatically distribute rewards.',
      tags: ['Rewards', 'Community'],
      quarter: 'Q1 2025'
    },
    {
      status: 'in-progress',
      icon: <Bot size={24} />,
      title: 'AI New Token Analysis',
      description: 'Analyze 40+ new GeckoTerminal tokens per minute',
      detailedDescription: 'Our AI will continuously scan and analyze new tokens appearing on GeckoTerminal (40+ per minute). The system will identify the most promising opportunities based on multiple signals and immediately notify users when high-potential tokens are detected.',
      tags: ['AI', 'Analysis'],
      quarter: 'Q1 2025'
    },
    {
      status: 'completed',
      icon: <Bell size={24} />,
      title: 'Push Notifications',
      description: 'Instant Telegram alerts for high-rated projects and ATHs',
      detailedDescription: 'Already implemented internally, this feature sends instant notifications to your Telegram for: high-scoring tokens (8+), major ATH achievements, and other important signals. Simply connect your Telegram to receive personalized alerts directly to your phone.',
      tags: ['Notifications', 'Telegram'],
      quarter: 'Q1 2025'
    },
    {
      status: 'planned',
      icon: <ChartBar size={24} />,
      title: 'PhD Data Analysis',
      description: 'Advanced signal detection with professional data analysis',
      detailedDescription: 'Partnership with a PhD data analyst to run comprehensive analysis on our database. They will identify the most profitable patterns and signals, which will be made available to KROM holders. This deep analysis will uncover hidden alpha in the data.',
      tags: ['Analytics', 'Premium'],
      quarter: 'Q2 2025'
    },
    {
      status: 'planned',
      icon: <Coins size={24} />,
      title: 'Token Gating',
      description: 'Premium features for KROM holders',
      detailedDescription: 'Certain advanced features will be exclusively available to users who hold and stake KROM tokens. The more KROM you hold, the more features you unlock, including premium signals, early alerts, and advanced analytics.',
      tags: ['Tokenomics', 'Premium'],
      quarter: 'Q2 2025'
    },
    {
      status: 'planned',
      icon: <Trophy size={24} />,
      title: 'Group Leaderboards',
      description: 'Rankings for the most successful call groups',
      detailedDescription: 'Comprehensive leaderboards showing which call groups have the highest success rates across different categories (ROI, win rate, ATH achievements). This helps users identify and follow the most reliable sources.',
      tags: ['Social', 'Analytics'],
      quarter: 'Q2 2025'
    },
    {
      status: 'planned',
      icon: <Smartphone size={24} />,
      title: 'Mobile Responsiveness',
      description: 'Fully responsive design for seamless mobile experience',
      detailedDescription: 'Complete mobile optimization of the KROM app to ensure perfect functionality on all devices. Users will be able to analyze tokens, view charts, and receive notifications directly on their phones with an optimized UI.',
      tags: ['Mobile', 'UX'],
      quarter: 'Q2 2025'
    },
    {
      status: 'planned',
      icon: <Rocket size={24} />,
      title: 'Vibe Coding Launchpad',
      description: 'Launch your own token with our integrated launchpad',
      detailedDescription: 'Already built launchpad integration allowing users to create and launch their own tokens easily. Includes tutorials on using no-code tools like Lovable and Claude to build apps. Instant monetization through token creation with full support from KROM ecosystem.',
      tags: ['Launchpad', 'DeFi'],
      quarter: 'Q3 2025'
    },
    {
      status: 'planned',
      icon: <FileText size={24} />,
      title: 'Paper Trading & User Calls',
      description: 'Track user predictions and promote successful callers',
      detailedDescription: 'Users can post their own token calls which we track and analyze. Successful callers with proven track records get their calls featured on the main dashboard. This creates a meritocracy where the best analysts rise to the top.',
      tags: ['Community', 'Trading'],
      quarter: 'Q3 2025'
    },
    {
      status: 'planned',
      icon: <Users size={24} />,
      title: 'Project Self-Promotion',
      description: 'Projects can submit for AI and manual review',
      detailedDescription: 'Projects can submit themselves for analysis. Our AI performs initial screening, then the best projects receive manual review. Approved projects get featured on the platform with full notification support to users.',
      tags: ['Projects', 'Marketing'],
      quarter: 'Q4 2025'
    },
    {
      status: 'planned',
      icon: <MessageSquare size={24} />,
      title: 'Community Feature Requests',
      description: 'Vote on new features, data sources, and improvements',
      detailedDescription: 'Community members can suggest new features, analysis methods, data sources, or any improvements. The most popular suggestions (by community vote) will be implemented rapidly. This ensures the platform evolves based on real user needs.',
      tags: ['Community', 'Governance'],
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
              onClick={() => setExpandedItem(expandedItem === index ? null : index)}
              className={`relative bg-[#111214] border-2 ${getItemBorderClass(item.status)} rounded-2xl ${expandedItem === index ? 'p-7' : 'p-5'} cursor-pointer transition-all duration-300 hover:border-[#2a2d31] hover:translate-x-1`}
            >
              {/* Status Dot */}
              <div className={`absolute -left-[11px] ${expandedItem === index ? 'top-8' : 'top-6'} w-5 h-5 rounded-full border-[3px] border-[#0a0b0d] ${getStatusDotClass(item.status)}`} />
              
              {/* Connecting Line */}
              {index < roadmapItems.length - 1 && (
                <div className={`absolute left-[-1px] ${expandedItem === index ? 'top-14' : 'top-12'} bottom-[-1.5rem] w-[2px] bg-gradient-to-b from-[#1a1c1f] to-transparent`} />
              )}

              {/* Item Header */}
              <div className={`flex items-center gap-4 ${expandedItem === index ? 'mb-4' : ''}`}>
                <div className="text-[#00ff88] opacity-80 flex-shrink-0">
                  {item.icon}
                </div>
                <h3 className="text-[1.35rem] font-normal tracking-[0.02em] text-[#e0e0e0] flex-1">
                  {item.title}
                </h3>
                {/* Show quarter when collapsed */}
                {expandedItem !== index && (
                  <span className="text-[#555] text-sm mr-2">
                    {item.quarter}
                  </span>
                )}
                <div className="text-[#666] transition-transform duration-300">
                  {expandedItem === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedItem === index && (
                <div className="animate-fadeIn">
                  {/* Short Description */}
                  <p className="text-[#888] text-base leading-relaxed mb-5 pl-10">
                    {item.description}
                  </p>
                  
                  {/* Detailed Description */}
                  {item.detailedDescription && (
                    <div className="pl-10 mb-5 pt-4 border-t border-[#1a1c1f]">
                      <p className="text-[#aaa] leading-relaxed">
                        {item.detailedDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Meta Information - Only show when expanded */}
              {expandedItem === index && (
                <div className="flex gap-4 items-center pl-10">
                  <div className="flex gap-2 flex-1 flex-wrap">
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
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Floating Menu */}
      <FloatingMenu />
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}