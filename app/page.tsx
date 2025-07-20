'use client'

import { useState, useEffect } from 'react'
import { BarChart, LineChart, Activity, TrendingUp, Users, Clock } from 'lucide-react'

export default function HomePage() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    uniqueGroups: 0,
    avgROI: 0,
    successRate: 0
  })

  useEffect(() => {
    // Placeholder for fetching stats
    setStats({
      totalCalls: 98040,
      uniqueGroups: 127,
      avgROI: 2.45,
      successRate: 34.2
    })
  }, [])

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">
          KROM Analysis Dashboard
        </h1>
        <p className="text-muted-foreground">
          Advanced cryptocurrency call analysis and monitoring platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Calls"
          value={stats.totalCalls.toLocaleString()}
          icon={<Activity className="w-5 h-5" />}
          trend="+12.5%"
        />
        <StatCard
          title="Unique Groups"
          value={stats.uniqueGroups}
          icon={<Users className="w-5 h-5" />}
          trend="+3"
        />
        <StatCard
          title="Average ROI"
          value={`${stats.avgROI}x`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="+0.3x"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={<BarChart className="w-5 h-5" />}
          trend="-2.1%"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 bg-muted/50 rounded-md animate-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Token #{i}</p>
                    <p className="text-sm text-muted-foreground">Group Name • 2 minutes ago</p>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    +{(Math.random() * 10).toFixed(1)}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Performers
          </h2>
          <div className="space-y-3">
            {['Alpha Signals', 'Crypto Whales', 'Moon Hunters', 'Degen Plays'].map((group, i) => (
              <div key={group} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">#{i + 1}</span>
                  <span className="font-medium">{group}</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {(5 - i) * 12}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, trend }: {
  title: string
  value: string | number
  icon: React.ReactNode
  trend: string
}) {
  const isPositive = trend.startsWith('+')
  
  return (
    <div className="bg-card p-6 rounded-lg border card-hover">
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground">{icon}</span>
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trend}
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  )
}