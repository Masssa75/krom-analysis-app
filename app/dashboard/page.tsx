'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Eye } from 'lucide-react';

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  lastRun?: string;
  successRate?: number;
  status?: 'success' | 'warning' | 'error';
}

interface SystemMetrics {
  athCoverage: number;
  athTotal: number;
  athProcessed: number;
  processingRate: number;
  estimatedCompletion: number;
  priceUpdatesTotal: number;
  priceUpdatesStale: number;
  apiSuccessRate: number;
  notificationsSent: number;
  highRoiAlerts: number;
  callAnalysisPending: number;
  xAnalysisPending: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      // Fetch metrics
      const metricsResponse = await fetch('/api/dashboard/metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch cron jobs
      const cronResponse = await fetch('/api/dashboard/cron-jobs');
      const cronData = await cronResponse.json();
      setCronJobs(cronData);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-50';
      case 'warning': return 'bg-yellow-50';
      case 'error': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitor</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700">All Systems Operational</span>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-600">ATH Processing</h3>
            <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
              Active
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.athCoverage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Coverage</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics?.athCoverage || 0}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="font-semibold">{metrics?.athProcessed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rate</p>
                <p className="font-semibold">{metrics?.processingRate} /min</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-600">Price Updates</h3>
            <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
              Active
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.priceUpdatesTotal.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Updated Today</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-gray-600">Stale</p>
                <p className="font-semibold text-yellow-600">{metrics?.priceUpdatesStale}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Success</p>
                <p className="font-semibold text-green-600">{metrics?.apiSuccessRate}%</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-600">Notifications</h3>
            <span className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
              Active
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.notificationsSent}
              </p>
              <p className="text-sm text-gray-600">Sent Today</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-gray-600">High ROI</p>
                <p className="font-semibold text-yellow-600">{metrics?.highRoiAlerts}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Alert</p>
                <p className="font-semibold">14m ago</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-600">Analysis Queue</h3>
            <span className="px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-full">
              Slow
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {(metrics?.callAnalysisPending || 0) + (metrics?.xAnalysisPending || 0)}
              </p>
              <p className="text-sm text-gray-600">Total Pending</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-gray-600">Call Analysis</p>
                <p className="font-semibold">{metrics?.callAnalysisPending}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">X Analysis</p>
                <p className="font-semibold">{metrics?.xAnalysisPending}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Cron Jobs Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Cron Jobs Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cronJobs.map((job) => (
                <tr key={job.jobid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{job.jobname}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 font-mono">{job.schedule}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{job.lastRun || 'Never'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBg(job.status)} ${getStatusColor(job.status)}`}>
                      {job.status === 'success' ? 'Success' : job.status === 'warning' ? 'Slow' : job.status === 'error' ? 'Error' : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${job.successRate && job.successRate >= 90 ? 'text-green-600' : job.successRate && job.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {job.successRate ? `${job.successRate}%` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Logs
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}