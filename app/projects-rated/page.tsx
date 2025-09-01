'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebsiteAnalysisTooltip } from '@/components/WebsiteAnalysisTooltip';
import FilterSidebar from '@/components/FilterSidebar';
import { useDebounce } from '@/lib/useDebounce';

interface CryptoProject {
  id: number;
  symbol: string;
  name: string;
  network: string;
  contract_address: string;
  website_url: string;
  website_screenshot_url: string | null;
  website_stage1_score: number;
  website_stage1_tier: string;
  website_stage1_analysis: any;
  website_stage1_analyzed_at: string;
  current_liquidity_usd: number;
  current_market_cap: number;
  current_price_usd: number;
  current_roi_percent: number;
  is_imposter: boolean;
  is_rugged: boolean;
  is_dead: boolean;
  twitter_url: string | null;
  telegram_url: string | null;
  created_at: string;
  
  // Add X analysis fields
  x_analysis_score?: number;
  x_analysis_tier?: string;
  analysis_token_type?: string; // For token type filtering
}

interface FilterState {
  tokenType: 'all' | 'meme' | 'utility'
  networks: string[]
  excludeRugs?: boolean
  excludeImposters?: boolean
  minXScore?: number
  minWebsiteScore?: number
}

export default function ProjectsRatedPage() {
  const [projects, setProjects] = useState<CryptoProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<string>('website_stage1_score');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    tokenType: 'all',
    networks: ['ethereum', 'solana', 'bsc', 'base'],
    excludeRugs: true,
    excludeImposters: true,
    minXScore: 1,
    minWebsiteScore: 1
  });
  
  // Debounce filters with 400ms delay
  const debouncedFilters = useDebounce(filters, 400);
  
  const [capturingScreenshots, setCapturingScreenshots] = useState<Set<number>>(new Set());
  const [attemptedScreenshots, setAttemptedScreenshots] = useState<Set<number>>(() => {
    // Initialize from sessionStorage on mount
    if (typeof window !== 'undefined') {
      const attempted = new Set<number>();
      const now = Date.now();
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('screenshot_attempt_')) {
          const id = parseInt(key.replace('screenshot_attempt_', ''));
          const timestamp = parseInt(sessionStorage.getItem(key) || '0');
          // Only include if attempted within last 5 minutes
          if (now - timestamp < 5 * 60 * 1000) {
            attempted.add(id);
          }
        }
      }
      return attempted;
    }
    return new Set();
  });
  
  const observer = useRef<IntersectionObserver>();
  const lastProjectRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch projects
  const fetchProjects = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        sortBy,
        sortOrder,
        search: searchQuery,
      });
      
      // Add filter parameters
      if (debouncedFilters.tokenType && debouncedFilters.tokenType !== 'all') {
        params.append('tokenType', debouncedFilters.tokenType);
      }
      
      if (debouncedFilters.networks && debouncedFilters.networks.length > 0) {
        params.append('networks', debouncedFilters.networks.join(','));
      }
      
      if (debouncedFilters.excludeRugs === false) {
        params.append('includeRugs', 'true');
      }
      
      if (debouncedFilters.excludeImposters === false) {
        params.append('includeImposters', 'true');
      }
      
      if (debouncedFilters.minXScore && debouncedFilters.minXScore > 1) {
        params.append('minXScore', debouncedFilters.minXScore.toString());
      }
      
      if (debouncedFilters.minWebsiteScore && debouncedFilters.minWebsiteScore > 1) {
        params.append('minWebsiteScore', debouncedFilters.minWebsiteScore.toString());
      }

      const response = await fetch(`/api/crypto-projects-rated?${params}`);
      const data = await response.json();

      if (data.data) {
        if (reset) {
          setProjects(data.data);
        } else {
          // Filter out any duplicates when appending
          setProjects(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProjects = data.data.filter((p: CryptoProject) => !existingIds.has(p.id));
            return [...prev, ...newProjects];
          });
        }
        setHasMore(data.pagination.hasMore);
        
        // Trigger screenshot capture for projects without screenshots
        data.data.forEach(async (project: CryptoProject) => {
          if (!project.website_screenshot_url && project.website_url) {
            // Skip if already attempted recently
            if (attemptedScreenshots.has(project.id)) {
              return;
            }
            
            const attemptKey = `screenshot_attempt_${project.id}`;
            const now = Date.now();
            
            // Mark as capturing
            setCapturingScreenshots(prev => new Set(prev).add(project.id));
            
            try {
              const captureResponse = await fetch('/api/capture-screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: project.website_url,
                  tokenId: project.id,
                  table: 'crypto_projects_rated',
                  forceRefresh: false
                })
              });
              
              if (captureResponse.ok) {
                const result = await captureResponse.json();
                // Update the project with the new screenshot URL
                setProjects(prev => prev.map(p => 
                  p.id === project.id 
                    ? { ...p, website_screenshot_url: result.screenshot_url }
                    : p
                ));
              } else {
                // Store failed attempt timestamp and add to attempted set
                sessionStorage.setItem(attemptKey, now.toString());
                setAttemptedScreenshots(prev => new Set(prev).add(project.id));
                const error = await captureResponse.text();
                console.warn(`Screenshot capture failed for ${project.symbol}:`, error);
              }
            } catch (err) {
              // Store failed attempt timestamp and add to attempted set
              sessionStorage.setItem(attemptKey, now.toString());
              setAttemptedScreenshots(prev => new Set(prev).add(project.id));
              console.error(`Failed to capture screenshot for ${project.symbol}:`, err);
            } finally {
              // Remove from capturing set
              setCapturingScreenshots(prev => {
                const newSet = new Set(prev);
                newSet.delete(project.id);
                return newSet;
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, searchQuery, debouncedFilters, loading, attemptedScreenshots]);

  // Reset and fetch when filters change
  useEffect(() => {
    setProjects([]);
    setPage(1);
    setHasMore(true);
    fetchProjects(1, true);
  }, [sortBy, sortOrder, searchQuery, debouncedFilters]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchProjects(page);
    }
  }, [page]);

  // Format functions
  const formatMarketCap = (value: number | null) => {
    if (!value) return 'N/A';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const getTierColor = (tier: string | null | undefined) => {
    if (!tier) return { bg: '#88888822', text: '#888' };
    
    const colors: { [key: string]: { bg: string, text: string } } = {
      ALPHA: { bg: '#9333ea22', text: '#a855f7' },  // Purple for ALPHA
      SOLID: { bg: '#00ff8822', text: '#00ff88' },  // Green for SOLID
      BASIC: { bg: '#ffcc0022', text: '#ffcc00' },  // Yellow for BASIC
      TRASH: { bg: '#ff444422', text: '#ff4444' }   // Red for TRASH
    };
    return colors[tier.toUpperCase()] || { bg: '#88888822', text: '#888' };
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 9) return { bg: '#9333ea22', text: '#a855f7' };  // Purple
    if (score >= 7) return { bg: '#00ff8822', text: '#00ff88' };  // Green
    if (score >= 5) return { bg: '#ffcc0022', text: '#ffcc00' };  // Yellow
    return { bg: '#ff444422', text: '#ff4444' };  // Red
  };

  const getNetworkBadge = (network: string) => {
    const colors: { [key: string]: { bg: string, text: string } } = {
      ethereum: { bg: '#627eea22', text: '#627eea' },
      solana: { bg: '#14f19522', text: '#14f195' },
      bsc: { bg: '#f0b90b22', text: '#f0b90b' },
      base: { bg: '#0052ff22', text: '#0052ff' },
      polygon: { bg: '#8247e522', text: '#8247e5' },
      arbitrum: { bg: '#28a0f022', text: '#28a0f0' }
    };
    return colors[network.toLowerCase()] || { bg: '#88888822', text: '#888' };
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="fixed inset-0 flex bg-[#0a0b0d]">
      {/* Filter Sidebar */}
      <FilterSidebar onFiltersChange={handleFiltersChange} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">✨ KROM Projects Rated</h1>
            <p className="text-lg text-[#888]">High-Quality Crypto Projects with Websites</p>
          </div>

          {/* Top Controls Bar */}
          <div className="max-w-7xl mx-auto mb-6 bg-[#111214] border border-[#2a2d31] rounded-xl p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search symbol or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#1a1c1f] text-white border border-[#2a2d31] rounded-lg px-3 py-1 text-sm hover:border-[#333] focus:outline-none focus:border-[#00ff88] w-48"
                />
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <label className="text-[#888] text-sm">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#1a1c1f] text-white border border-[#2a2d31] rounded-lg px-3 py-1 text-sm hover:border-[#333] focus:outline-none focus:border-[#00ff88]"
                >
                  <option value="website_stage1_score">Score</option>
                  <option value="current_liquidity_usd">Liquidity</option>
                  <option value="current_market_cap">Market Cap</option>
                  <option value="current_roi_percent">ROI %</option>
                  <option value="created_at">Date Added</option>
                  <option value="website_stage1_analyzed_at">Analysis Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="bg-[#1a1c1f] text-white border border-[#2a2d31] rounded-lg px-3 py-1 text-sm hover:bg-[#252729] hover:border-[#333]"
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>

              {/* Project Count */}
              <div className="text-[#666] text-sm">
                Showing {projects.length} projects
              </div>
            </div>
          </div>

          {/* Project Grid */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project, index) => (
              <div
                key={project.id}
                ref={index === projects.length - 1 ? lastProjectRef : null}
                className="bg-[#111214] rounded-2xl border border-[#2a2d31] hover:border-[#00ff88] transition-all hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Preview Area */}
                <div className="relative h-[420px] bg-[#0a0b0d] overflow-hidden">

                  {/* Show loading state if capturing screenshot */}
                  {capturingScreenshots.has(project.id) && !project.website_screenshot_url ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#00ff88] rounded-full opacity-20 animate-ping"></div>
                        <div className="relative w-16 h-16 border-4 border-[#1a1c1f] border-t-[#00ff88] rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-4 text-[#666] text-sm">Capturing screenshot...</p>
                      <p className="mt-1 text-[#444] text-xs">This may take a few seconds</p>
                    </div>
                  ) : (
                    <div className="w-full h-full overflow-y-auto scrollbar-hide">
                      <img
                        src={
                          project.website_screenshot_url || 
                          `https://via.placeholder.com/400x600/1a1c1f/666666?text=${encodeURIComponent(project.name || project.symbol)}`
                        }
                        alt={`${project.name || project.symbol} screenshot`}
                        className="w-full h-auto object-top"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/400x600/1a1c1f/666666?text=${encodeURIComponent(project.name || project.symbol)}`;
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Project Info */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {project.symbol}
                        {project.name && project.name !== project.symbol && (
                          <span className="text-sm text-[#666] font-normal">({project.name})</span>
                        )}
                      </h3>
                      {/* Status badges and network */}
                      <div className="flex gap-1 mt-1 items-center">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium uppercase"
                          style={{ 
                            backgroundColor: getNetworkBadge(project.network).bg,
                            color: getNetworkBadge(project.network).text
                          }}
                        >
                          {project.network}
                        </span>
                        {project.is_imposter && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-500">IMPOSTER</span>
                        )}
                        {project.is_rugged && (
                          <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-500">RUGGED</span>
                        )}
                        {project.is_dead && (
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-500">DEAD</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      {project.website_stage1_tier && (
                        <WebsiteAnalysisTooltip 
                          fullAnalysis={project.website_stage1_analysis}
                        >
                          <span 
                            className="px-2 py-0.5 rounded text-xs font-semibold uppercase inline-block cursor-help"
                            style={{ 
                              backgroundColor: getTierColor(project.website_stage1_tier).bg,
                              color: getTierColor(project.website_stage1_tier).text
                            }}
                          >
                            {project.website_stage1_tier}
                          </span>
                        </WebsiteAnalysisTooltip>
                      )}
                      <p className="text-xs text-[#666] mt-1">{formatDate(project.created_at)}</p>
                    </div>
                  </div>
                  
                  {/* Quick Take from analysis */}
                  {project.website_stage1_analysis?.quick_take && (
                    <p className="text-[#888] text-sm mb-4 line-clamp-2">
                      {project.website_stage1_analysis.quick_take}
                    </p>
                  )}
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-[#1a1c1f] rounded-lg border border-[#2a2d31]">
                      <p className="text-xs text-[#666]">Market Cap</p>
                      <p className="text-sm font-semibold text-white">{formatMarketCap(project.current_market_cap)}</p>
                    </div>
                    <div className="text-center p-2 bg-[#1a1c1f] rounded-lg border border-[#2a2d31]">
                      <p className="text-xs text-[#666]">Liquidity</p>
                      <p className="text-sm font-semibold text-white">{formatMarketCap(project.current_liquidity_usd)}</p>
                    </div>
                    <div className="text-center p-2 bg-[#1a1c1f] rounded-lg border border-[#2a2d31]">
                      <p className="text-xs text-[#666]">ROI</p>
                      <p className={`text-sm font-semibold ${project.current_roi_percent && project.current_roi_percent > 0 ? 'text-[#00ff88]' : project.current_roi_percent && project.current_roi_percent < 0 ? 'text-[#ff4444]' : 'text-[#888]'}`}>
                        {project.current_roi_percent ? `${project.current_roi_percent > 0 ? '+' : ''}${project.current_roi_percent.toFixed(0)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#00ff88] text-black text-center py-2 rounded-lg hover:bg-[#00cc66] transition-colors text-sm font-semibold"
                    >
                      Visit Website ↗
                    </a>
                    {project.contract_address && (
                      <a
                        href={`https://dexscreener.com/${project.network}/${project.contract_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#1a1c1f] text-[#888] py-2 rounded-lg hover:bg-[#252729] hover:text-white transition-colors text-center text-sm border border-[#2a2d31]"
                      >
                        Chart 📊
                      </a>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center mt-8">
              <div className="w-12 h-12 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* No More Results */}
          {!hasMore && projects.length > 0 && (
            <div className="text-center mt-8 text-[#666]">
              <p>No more projects to load</p>
            </div>
          )}

          {/* No Results */}
          {!loading && projects.length === 0 && (
            <div className="text-center mt-8">
              <p className="text-xl mb-2 text-white">No projects found</p>
              <p className="text-[#666]">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}