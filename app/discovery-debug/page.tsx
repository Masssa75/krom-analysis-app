/**
 * TOKEN DISCOVERY DEBUG INTERFACE
 * Shows ALL tokens from token_discovery table with websites
 * Displays diagnostic metrics to identify scraping issues
 * Location: /app/discovery-debug/page.tsx
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebsiteAnalysisTooltip } from '@/components/WebsiteAnalysisTooltip';

interface TokenDiscovery {
  id: string;
  symbol: string;
  name: string;
  network: string;
  contract_address: string;
  website_url: string;
  website_analyzed_at: string | null;
  website_stage1_score: number | null;
  website_stage1_tier: string | null;
  website_stage1_analysis: {
    category_scores?: any;
    scrape_metrics?: {
      text_length: number;
      html_length: number;
      link_count: number;
      header_count: number;
      has_meta_description: boolean;
      has_og_tags: boolean;
      meta_exists: boolean;
      load_indicators_found: string[];
      javascript_heavy: boolean;
      script_count: number;
      body_length: number;
      response_time_ms: number;
    };
    extracted_signals?: {
      partnerships_mentioned: string[];
      user_count_claims: string | null;
      funding_mentioned: string | null;
      has_whitepaper: boolean;
      has_github: boolean;
      team_members_found: number;
    };
    quick_take?: string;
    quick_assessment?: string;
    reasoning?: string;
    fast_track_triggered?: boolean;
    fast_track_reason?: string | null;
  } | null;
  current_liquidity_usd: number | null;
  current_volume_24h: number | null;
  current_market_cap: number | null;
  first_seen_at: string;
  twitter_url: string | null;
  telegram_url: string | null;
  discord_url: string | null;
  website_screenshot_url: string | null;
  website_screenshot_captured_at: string | null;
}

// Determine scrape health based on metrics
function getScrapeHealth(token: TokenDiscovery) {
  const metrics = token.website_stage1_analysis?.scrape_metrics;
  if (!metrics) return { color: 'bg-gray-600', label: 'Not Analyzed', emoji: '⚫' };
  
  const textLength = metrics.text_length || 0;
  if (textLength === 0) return { color: 'bg-gray-600', label: 'No Content', emoji: '⚫' };
  if (textLength < 100) return { color: 'bg-red-600', label: 'Failed', emoji: '🔴' };
  if (textLength < 500) return { color: 'bg-orange-600', label: 'Partial', emoji: '🟠' };
  if (textLength < 1000) return { color: 'bg-yellow-600', label: 'Limited', emoji: '🟡' };
  return { color: 'bg-green-600', label: 'Success', emoji: '🟢' };
}

// Get tier color
function getTierColor(tier: string | null) {
  if (!tier) return 'text-gray-400';
  switch(tier.toUpperCase()) {
    case 'ALPHA': return 'text-purple-400';
    case 'SOLID': return 'text-green-400';
    case 'BASIC': return 'text-yellow-400';
    case 'TRASH': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

// Format large numbers
function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export default function DiscoveryDebugPage() {
  const [tokens, setTokens] = useState<TokenDiscovery[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'analyzed' | 'unanalyzed' | 'lowscore' | 'scrape_failed' | 'promoted'>('all');
  const [sortBy, setSortBy] = useState<'first_seen_at' | 'website_stage1_score' | 'current_liquidity_usd'>('first_seen_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [capturingScreenshots, setCapturingScreenshots] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    analyzed: 0,
    promotable: 0,
    scrapeFailed: 0
  });
  
  const observer = useRef<IntersectionObserver>();
  const lastTokenRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch tokens
  const fetchTokens = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (loading && !reset) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        filter,
        sortBy,
        sortOrder
      });

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`/api/discovery-debug?${params}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.tokens) {
        if (reset) {
          setTokens(data.tokens);
        } else {
          setTokens(prev => [...prev, ...data.tokens]);
        }
        setHasMore(data.hasMore);
        
        // Update stats
        if (data.stats) {
          setStats(data.stats);
        }
        
        // Trigger screenshot capture for tokens without screenshots
        data.tokens.forEach(async (token: TokenDiscovery) => {
          if (!token.website_screenshot_url && token.website_url && !capturingScreenshots.has(token.id)) {
            // Don't show loading spinner immediately - wait to see if it's cached
            let loadingTimeout: NodeJS.Timeout | null = null;
            
            // Only show loading after 100ms (if not cached)
            loadingTimeout = setTimeout(() => {
              setCapturingScreenshots(prev => new Set(prev).add(token.id));
            }, 100);
            
            try {
              const captureResponse = await fetch('/api/capture-screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: token.website_url,
                  tokenId: token.id,
                  table: 'token_discovery',
                  forceRefresh: false
                })
              });
              
              // Clear the loading timeout if we get a quick response
              if (loadingTimeout) {
                clearTimeout(loadingTimeout);
              }
              
              if (captureResponse.ok) {
                const result = await captureResponse.json();
                // Update the token with the screenshot URL
                setTokens(prev => prev.map(t => 
                  t.id === token.id 
                    ? { ...t, website_screenshot_url: result.screenshot_url || result.screenshotUrl, website_screenshot_captured_at: result.captured_at || new Date().toISOString() }
                    : t
                ));
                
                // Log if it was cached (for debugging)
                if (result.cached) {
                  console.log(`Screenshot for ${token.symbol} was cached (captured: ${result.captured_at})`);
                } else {
                  console.log(`Screenshot for ${token.symbol} newly captured`);
                }
              }
            } catch (error) {
              console.error('Screenshot capture failed for', token.symbol, error);
              if (loadingTimeout) {
                clearTimeout(loadingTimeout);
              }
            } finally {
              // Remove from capturing set
              setCapturingScreenshots(prev => {
                const newSet = new Set(prev);
                newSet.delete(token.id);
                return newSet;
              });
            }
          }
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Request timed out after 15 seconds');
        alert('The request is taking too long. Please try again or select fewer results.');
      } else {
        console.error('Failed to fetch tokens:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy, sortOrder, loading, capturingScreenshots]);

  // Initial load and filter/sort changes
  useEffect(() => {
    setPage(1);
    setTokens([]);
    fetchTokens(1, true);
  }, [filter, sortBy, sortOrder]);

  // Load more on page change
  useEffect(() => {
    if (page > 1) {
      fetchTokens(page);
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-black text-green-400 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold mb-2">Token Discovery Debug Interface</h1>
        <p className="text-gray-400">
          Showing ALL tokens from token_discovery table with websites. 
          Debug metrics help identify scraping issues.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-400">Total with Websites</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.analyzed}</div>
          <div className="text-sm text-gray-400">Analyzed</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{stats.promotable}</div>
          <div className="text-sm text-gray-400">Promotable (≥7)</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">{stats.scrapeFailed}</div>
          <div className="text-sm text-gray-400">Scrape Issues</div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="max-w-7xl mx-auto mb-6 space-y-4">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-4 py-2 rounded-lg transition-all ${filter === 'all' ? 'bg-[#00ff88] text-black font-semibold' : 'bg-[#1a1c1f] hover:bg-[#2a2d31] text-[#888]'}`}
          >
            All with Websites
          </button>
          <button 
            onClick={() => setFilter('analyzed')} 
            className={`px-4 py-2 rounded-lg transition-all ${filter === 'analyzed' ? 'bg-[#00ff88] text-black font-semibold' : 'bg-[#1a1c1f] hover:bg-[#2a2d31] text-[#888]'}`}
          >
            Analyzed
          </button>
          <button 
            onClick={() => setFilter('unanalyzed')} 
            className={`px-4 py-2 rounded-lg transition-all ${filter === 'unanalyzed' ? 'bg-[#00ff88] text-black font-semibold' : 'bg-[#1a1c1f] hover:bg-[#2a2d31] text-[#888]'}`}
          >
            Not Analyzed
          </button>
          <button 
            onClick={() => setFilter('lowscore')} 
            className={`px-4 py-2 rounded-lg transition-all ${filter === 'lowscore' ? 'bg-[#00ff88] text-black font-semibold' : 'bg-[#1a1c1f] hover:bg-[#2a2d31] text-[#888]'}`}
          >
            Low Score (≤6)
          </button>
          <button 
            onClick={() => setFilter('scrape_failed')} 
            className={`px-4 py-2 rounded-lg transition-all ${filter === 'scrape_failed' ? 'bg-[#00ff88] text-black font-semibold' : 'bg-[#1a1c1f] hover:bg-[#2a2d31] text-[#888]'}`}
          >
            Scrape Issues
          </button>
          <button 
            onClick={() => setFilter('promoted')} 
            className={`px-4 py-2 rounded-lg transition-all ${filter === 'promoted' ? 'bg-[#00ff88] text-black font-semibold' : 'bg-[#1a1c1f] hover:bg-[#2a2d31] text-[#888]'}`}
          >
            Promoted (≥7)
          </button>
        </div>

        {/* Sorting Controls */}
        <div className="flex gap-4 items-center">
          <span className="text-[#666]">Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#1a1c1f] text-[#00ff88] px-3 py-1 rounded-lg border border-[#2a2d31]"
          >
            <option value="first_seen_at">Discovery Date</option>
            <option value="website_stage1_score">Score</option>
            <option value="current_liquidity_usd">Liquidity</option>
          </select>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-[#1a1c1f] hover:bg-[#2a2d31] px-3 py-1 rounded-lg border border-[#2a2d31] text-[#00ff88]"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Token Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tokens.map((token, index) => {
          const health = getScrapeHealth(token);
          const metrics = token.website_stage1_analysis?.scrape_metrics;
          const signals = token.website_stage1_analysis?.extracted_signals;
          const isLastToken = tokens.length === index + 1;
          
          return (
            <div 
              key={token.id}
              ref={isLastToken ? lastTokenRef : null}
              className="bg-[#111214] rounded-2xl border border-[#2a2d31] hover:border-[#00ff88] transition-all hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Screenshot or Placeholder - Taller for phone-like dimensions */}
              <div className="relative h-[420px] bg-[#0a0b0d] overflow-hidden">
                {token.website_screenshot_url ? (
                  <div className="w-full h-full overflow-y-auto scrollbar-hide">
                    <img 
                      src={token.website_screenshot_url} 
                      alt={`${token.symbol} website`}
                      className="w-full h-auto object-top"
                    />
                  </div>
                ) : capturingScreenshots.has(token.id) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="relative">
                      {/* Animated pulse effect */}
                      <div className="absolute inset-0 bg-[#00ff88] rounded-full opacity-20 animate-ping"></div>
                      {/* Spinner */}
                      <div className="relative w-16 h-16 border-4 border-[#1a1c1f] border-t-[#00ff88] rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-[#666] text-sm">Capturing screenshot...</p>
                    <p className="mt-1 text-[#444] text-xs">This may take a few seconds</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-[#666] text-center">
                      <div className="text-6xl mb-2 opacity-50">🌐</div>
                      <p className="text-sm">No screenshot</p>
                    </div>
                  </div>
                )}
                
                {/* Scrape Health Badge */}
                <div className={`absolute top-2 right-2 ${health.color} px-2 py-1 rounded text-xs text-white font-bold`}>
                  {health.emoji} {health.label}
                </div>
                
                {/* Score Badge */}
                {token.website_stage1_score !== null && (
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded">
                    <span className="text-lg font-bold">
                      {token.website_stage1_score}/21
                    </span>
                    <span className={`text-xs ml-1 ${getTierColor(token.website_stage1_tier)}`}>
                      {token.website_stage1_tier}
                    </span>
                  </div>
                )}
              </div>

              {/* Token Info */}
              <div className="p-5 space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{token.symbol}</h3>
                      <span className="text-xs text-gray-500">{token.network}</span>
                    </div>
                    <a 
                      href={token.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      {token.website_url?.replace(/^https?:\/\/(www\.)?/, '').slice(0, 30)}...
                    </a>
                  </div>
                  
                  {/* Analysis Tooltip */}
                  {token.website_stage1_analysis && (
                    <WebsiteAnalysisTooltip 
                      fullAnalysis={token.website_stage1_analysis}
                    >
                      <div className="cursor-pointer text-green-400 hover:text-green-300">
                        ℹ️
                      </div>
                    </WebsiteAnalysisTooltip>
                  )}
                </div>

                {/* Diagnostic Metrics */}
                {metrics && (
                  <div className="bg-gray-950 rounded p-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Text/HTML:</span>
                      <span className={metrics.text_length < 500 ? 'text-red-400' : 'text-green-400'}>
                        {metrics.text_length.toLocaleString()} / {metrics.html_length.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Links/Headers:</span>
                      <span>{metrics.link_count} / {metrics.header_count}</span>
                    </div>
                    {metrics.load_indicators_found?.length > 0 && (
                      <div className="text-yellow-400">
                        ⚠️ Loading indicators: {metrics.load_indicators_found.join(', ')}
                      </div>
                    )}
                    {metrics.javascript_heavy && (
                      <div className="text-orange-400">
                        ⚠️ JS-heavy: {metrics.script_count} scripts, body {metrics.body_length} chars
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Signals */}
                {signals && (
                  <div className="space-y-1 text-xs">
                    {signals.partnerships_mentioned?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-green-400">🤝</span>
                        <span className="text-gray-300">{signals.partnerships_mentioned.join(', ')}</span>
                      </div>
                    )}
                    {signals.user_count_claims && (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-400">👥</span>
                        <span className="text-gray-300">{signals.user_count_claims}</span>
                      </div>
                    )}
                    {signals.funding_mentioned && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">💰</span>
                        <span className="text-gray-300">{signals.funding_mentioned}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {signals.has_whitepaper && <span className="text-gray-500">📄 WP</span>}
                      {signals.has_github && <span className="text-gray-500">🔧 GitHub</span>}
                      {signals.team_members_found > 0 && <span className="text-gray-500">👤 Team ({signals.team_members_found})</span>}
                    </div>
                  </div>
                )}

                {/* Quick Take */}
                {token.website_stage1_analysis?.quick_take && (
                  <div className="text-xs text-gray-400 italic">
                    "{token.website_stage1_analysis.quick_take}"
                  </div>
                )}

                {/* Market Data */}
                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-800">
                  <span>Liq: {formatNumber(token.current_liquidity_usd)}</span>
                  <span>Vol: {formatNumber(token.current_volume_24h)}</span>
                  <span>MCap: {formatNumber(token.current_market_cap)}</span>
                </div>

                {/* Promotion Status */}
                {token.website_stage1_score !== null && (
                  <div className={`text-xs text-center p-1 rounded ${
                    token.website_stage1_score >= 7 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-gray-800 text-gray-500'
                  }`}>
                    {token.website_stage1_score >= 7 
                      ? '✅ Qualifies for promotion to crypto_calls' 
                      : `❌ Below threshold (needs 7+, got ${token.website_stage1_score})`
                    }
                  </div>
                )}

                {/* Debug Info for Failed Scrapes */}
                {metrics && metrics.text_length < 500 && (
                  <div className="bg-red-900/20 border border-red-800 rounded p-2 text-xs text-red-400">
                    <div className="font-bold mb-1">⚠️ Scraping Issue Detected</div>
                    <ul className="space-y-1 text-red-300">
                      <li>• Text: {metrics.text_length} chars (expected 1000+)</li>
                      <li>• HTML: {metrics.html_length} chars</li>
                      <li>• Ratio: {(metrics.text_length / metrics.html_length * 100).toFixed(1)}%</li>
                    </ul>
                    <div className="mt-1 text-gray-400">
                      Likely: JavaScript rendering issue or loading screen
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading more tokens...</p>
        </div>
      )}

      {/* End Message */}
      {!hasMore && tokens.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No more tokens to load
        </div>
      )}
    </div>
  );
}