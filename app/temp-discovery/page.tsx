/**
 * TEMPORARY DISCOVERY PAGE FOR TESTING PREVIEWS
 * Can be deleted after mockup testing is complete
 * Location: /app/temp-discovery/page.tsx
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebsiteAnalysisTooltip } from '@/components/WebsiteAnalysisTooltip';

interface Token {
  id: string;
  name: string;
  ticker: string;
  url: string;
  websiteScore: number;
  websiteAnalysis: any;
  websiteAnalysisFull: any;
  description: string;
  marketCap: number;
  liquidity: number;
  callDate: string;
  network: string;
  contractAddress: string;
  analysisScore: number;
  analysisTier: string;
  analysisReasoning: string;
  roi: number;
  currentPrice: number;
  priceAtCall: number;
  screenshotUrl?: string;
  screenshotCapturedAt?: string;
}

export default function TempDiscoveryPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'buy_timestamp' | 'website_score'>('buy_timestamp');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [minWebsiteScore, setMinWebsiteScore] = useState(0);
  
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
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '8',
        sortBy,
        sortOrder,
        minWebsiteScore: minWebsiteScore.toString()
      });

      const response = await fetch(`/api/discovery-tokens?${params}`);
      const data = await response.json();

      if (data.tokens) {
        if (reset) {
          setTokens(data.tokens);
        } else {
          setTokens(prev => [...prev, ...data.tokens]);
        }
        setHasMore(pageNum < data.pagination.totalPages);
        
        // Trigger screenshot capture for tokens without screenshots
        data.tokens.forEach(async (token: Token) => {
          if (!token.screenshotUrl && token.url) {
            try {
              const captureResponse = await fetch('/api/capture-screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: token.url,
                  tokenId: token.id,
                  forceRefresh: false
                })
              });
              
              if (captureResponse.ok) {
                const result = await captureResponse.json();
                // Update the token with the new screenshot URL
                setTokens(prev => prev.map(t => 
                  t.id === token.id 
                    ? { ...t, screenshotUrl: result.screenshot_url }
                    : t
                ));
              }
            } catch (err) {
              console.error(`Failed to capture screenshot for ${token.ticker}:`, err);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, minWebsiteScore, loading]);

  // Reset and fetch when filters change
  useEffect(() => {
    setTokens([]);
    setPage(1);
    setHasMore(true);
    fetchTokens(1, true);
  }, [sortBy, sortOrder, minWebsiteScore]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchTokens(page);
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
      ALPHA: { bg: '#00ff8822', text: '#00ff88' },
      SOLID: { bg: '#ffcc0022', text: '#ffcc00' },
      BASIC: { bg: '#ff994422', text: '#ff9944' },
      TRASH: { bg: '#ff444422', text: '#ff4444' }
    };
    return colors[tier.toUpperCase()] || { bg: '#88888822', text: '#888' };
  };


  return (
    <div className="min-h-screen bg-[#0a0b0d] p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">🚀 KROM Discovery</h1>
        <p className="text-lg text-[#888]">Utility Tokens with Websites</p>
      </div>

      {/* Filters and Sorting */}
      <div className="max-w-7xl mx-auto mb-6 bg-[#111214] border border-[#2a2d31] rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-[#888] text-sm">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'buy_timestamp' | 'website_score')}
              className="bg-[#1a1c1f] text-white border border-[#2a2d31] rounded-lg px-3 py-1 text-sm hover:border-[#333] focus:outline-none focus:border-[#00ff88]"
            >
              <option value="buy_timestamp">Date Called</option>
              <option value="website_score">Website Score</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="bg-[#1a1c1f] text-white border border-[#2a2d31] rounded-lg px-3 py-1 text-sm hover:bg-[#252729] hover:border-[#333]"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          {/* Website Score Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[#888] text-sm">Min Website Score:</label>
            <select
              value={minWebsiteScore}
              onChange={(e) => setMinWebsiteScore(parseInt(e.target.value))}
              className="bg-[#1a1c1f] text-white border border-[#2a2d31] rounded-lg px-3 py-1 text-sm hover:border-[#333] focus:outline-none focus:border-[#00ff88]"
            >
              <option value="0">All</option>
              <option value="5">5+</option>
              <option value="10">10+</option>
              <option value="15">15+</option>
              <option value="18">18+</option>
            </select>
          </div>

          {/* Token Count */}
          <div className="text-[#666] text-sm">
            Showing {tokens.length} tokens
          </div>
        </div>
      </div>

      {/* Token Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tokens.map((token, index) => (
          <div
            key={token.id}
            ref={index === tokens.length - 1 ? lastTokenRef : null}
            className="bg-[#111214] rounded-2xl border border-[#2a2d31] hover:border-[#00ff88] transition-all hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Preview Area - Taller for phone-like dimensions */}
            <div className="relative h-[420px] bg-[#0a0b0d] overflow-hidden">
              <div className="w-full h-full overflow-y-auto scrollbar-hide">
                <img
                  src={
                    token.screenshotUrl || 
                    `https://via.placeholder.com/400x600/1a1c1f/666666?text=${encodeURIComponent(token.name)}`
                  }
                  alt={`${token.name} screenshot`}
                  className="w-full h-auto object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // If stored screenshot fails, show placeholder
                    target.src = `https://via.placeholder.com/400x600/1a1c1f/666666?text=${encodeURIComponent(token.name)}`;
                  }}
                />
              </div>
            </div>

            {/* Token Info */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-white">{token.name}</h3>
                  <p className="text-sm text-[#666]">{token.ticker}</p>
                </div>
                <div className="text-right relative z-10">
                  {token.analysisTier && (
                    <WebsiteAnalysisTooltip 
                      fullAnalysis={{
                        ...token.websiteAnalysisFull,
                        type_reasoning: token.analysisReasoning
                      }}
                    >
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-semibold uppercase inline-block"
                        style={{ 
                          backgroundColor: getTierColor(token.analysisTier).bg,
                          color: getTierColor(token.analysisTier).text
                        }}
                      >
                        {token.analysisTier}
                      </span>
                    </WebsiteAnalysisTooltip>
                  )}
                  <p className="text-xs text-[#666] mt-1">{formatDate(token.callDate)}</p>
                </div>
              </div>
              
              <p className="text-[#888] text-sm mb-4 line-clamp-2">
                {token.description || <span className="text-[#666] italic">No description available</span>}
              </p>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-[#1a1c1f] rounded-lg border border-[#2a2d31]">
                  <p className="text-xs text-[#666]">Market Cap</p>
                  <p className="text-sm font-semibold text-white">{formatMarketCap(token.marketCap)}</p>
                </div>
                <div className="text-center p-2 bg-[#1a1c1f] rounded-lg border border-[#2a2d31]">
                  <p className="text-xs text-[#666]">Liquidity</p>
                  <p className="text-sm font-semibold text-white">{formatMarketCap(token.liquidity)}</p>
                </div>
                <div className="text-center p-2 bg-[#1a1c1f] rounded-lg border border-[#2a2d31]">
                  <p className="text-xs text-[#666]">ROI</p>
                  <p className={`text-sm font-semibold ${token.roi && token.roi > 0 ? 'text-[#00ff88]' : token.roi && token.roi < 0 ? 'text-[#ff4444]' : 'text-[#888]'}`}>
                    {token.roi ? `${token.roi > 0 ? '+' : ''}${token.roi.toFixed(0)}%` : 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={token.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#00ff88] text-black text-center py-2 rounded-lg hover:bg-[#00cc66] transition-colors text-sm font-semibold"
                >
                  Visit Website ↗
                </a>
                {token.contractAddress && (
                  <a
                    href={`https://dexscreener.com/${token.network}/${token.contractAddress}`}
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
      {!hasMore && tokens.length > 0 && (
        <div className="text-center mt-8 text-[#666]">
          <p>No more tokens to load</p>
        </div>
      )}

      {/* No Results */}
      {!loading && tokens.length === 0 && (
        <div className="text-center mt-8">
          <p className="text-xl mb-2 text-white">No tokens found</p>
          <p className="text-[#666]">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}