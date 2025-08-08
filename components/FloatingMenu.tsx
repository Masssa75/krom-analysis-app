'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Award, BarChart2, Map, TrendingUp, Plus } from 'lucide-react'

interface MenuItem {
  label: string
  icon: React.ReactNode
  onClick: () => void
}

export default function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const menuItems: MenuItem[] = [
    {
      label: 'Settings',
      icon: <Settings size={20} />,
      onClick: () => {
        console.log('Settings clicked')
        setIsOpen(false)
      }
    },
    {
      label: 'Leaderboard',
      icon: <Award size={20} />,
      onClick: () => {
        console.log('Leaderboard clicked')
        setIsOpen(false)
      }
    },
    {
      label: 'Analytics',
      icon: <BarChart2 size={20} />,
      onClick: () => {
        console.log('Analytics clicked')
        setIsOpen(false)
      }
    },
    {
      label: 'Roadmap',
      icon: <Map size={20} />,
      onClick: () => {
        router.push('/roadmap')
        setIsOpen(false)
      }
    },
    {
      label: 'Charts',
      icon: <TrendingUp size={20} />,
      onClick: () => {
        console.log('Charts clicked')
        setIsOpen(false)
      }
    }
  ]

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[999]"
          onClick={toggleMenu}
        />
      )}

      {/* Floating Action Button Container */}
      <div className={`fixed bottom-[30px] right-[30px] z-[1000] ${isOpen ? 'open' : ''}`}>
        {/* Menu Items */}
        <div className={`absolute bottom-[70px] right-0 flex flex-col gap-[15px] transition-all duration-300 ${
          isOpen 
            ? 'opacity-100 pointer-events-auto scale-100 translate-y-0' 
            : 'opacity-0 pointer-events-none scale-[0.8] translate-y-[20px]'
        }`}>
          {menuItems.map((item, index) => (
            <button 
              key={index}
              onClick={item.onClick}
              className="flex items-center justify-end gap-3 group"
              style={{
                animation: isOpen ? `slideIn 0.3s ease-out ${index * 0.05}s both` : 'none'
              }}
            >
              <span className="bg-[#1a1c1f] text-white px-3 py-2 rounded-md text-[13px] font-medium whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-[#2a2d31] transition-all group-hover:bg-[#2a2d31]">
                {item.label}
              </span>
              <div className="w-[50px] h-[50px] rounded-full bg-[#111214] border-2 border-[#2a2d31] text-[#00ff88] flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)] group-hover:bg-[#1a1c1f] group-hover:scale-110 group-hover:border-[#00ff88]">
                {item.icon}
              </div>
            </button>
          ))}
        </div>

        {/* Main FAB Button */}
        <button 
          onClick={toggleMenu}
          className={`w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#00ff88] to-[#00cc6a] border-none text-black flex items-center justify-center cursor-pointer transition-all shadow-[0_6px_20px_rgba(0,255,136,0.4)] hover:scale-110 hover:shadow-[0_8px_25px_rgba(0,255,136,0.6)] ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}