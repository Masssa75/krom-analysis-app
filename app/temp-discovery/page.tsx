/**
 * TEMPORARY DISCOVERY PAGE FOR TESTING PREVIEWS
 * Can be deleted after mockup testing is complete
 * Location: /app/temp-discovery/page.tsx
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Token {
  id: string;
  name: string;
  ticker: string;
  url: string;
  websiteScore: number;
  websiteAnalysis: any;
  description: string;
  marketCap: number;
  liquidity: number;
  callDate: string;
  network: string;
  contractAddress: string;
  analysisScore: number;
  analysisTier: string;
  roi: number;
  currentPrice: number;
  priceAtCall: number;
}

export default function TempDiscoveryPage() {
  const [previewMode, setPreviewMode] = useState<'iframe' | 'screenshot'>('screenshot');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'buy_timestamp' | 'website_score'>('buy_timestamp');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [minWebsiteScore, setMinWebsiteScore] = useState(0);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
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
        
        // Initialize loading states for new tokens
        const newLoadingStates: Record<string, boolean> = {};
        data.tokens.forEach((token: Token) => {
          newLoadingStates[token.ticker] = true;
        });
        setLoadingStates(prev => ({ ...prev, ...newLoadingStates }));
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
    if (!tier) return 'bg-gray-500';
    switch (tier.toUpperCase()) {
      case 'ALPHA':
        return 'bg-green-500';
      case 'SOLID':
        return 'bg-blue-500';
      case 'BASIC':
        return 'bg-yellow-500';
      case 'TRASH':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTierTooltip = (tier: string | null | undefined) => {
    if (!tier) return 'No tier assigned';
    switch (tier.toUpperCase()) {
      case 'ALPHA':
        return 'High-quality token with strong fundamentals (8-10 score)';
      case 'SOLID':
        return 'Good token with solid potential (6-7 score)';
      case 'BASIC':
        return 'Average token with some promise (4-5 score)';
      case 'TRASH':
        return 'Low-quality token with red flags (1-3 score)';
      default:
        return 'Unknown tier';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-6">
      {/* Header */}
      <div className="text-center text-white mb-8">
        <h1 className="text-4xl font-bold mb-2">🚀 KROM Discovery</h1>
        <p className="text-lg opacity-90">Utility Tokens with Websites</p>
        
        {/* Preview Mode Toggle */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => setPreviewMode('screenshot')}
            className={`px-6 py-2 rounded-full transition-all ${
              previewMode === 'screenshot'
                ? 'bg-green-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Screenshot Mode
          </button>
          <button
            onClick={() => setPreviewMode('iframe')}
            className={`px-6 py-2 rounded-full transition-all ${
              previewMode === 'iframe'
                ? 'bg-green-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            iFrame Mode (via Proxy)
          </button>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="max-w-7xl mx-auto mb-6 bg-white/10 backdrop-blur rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-white text-sm">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'buy_timestamp' | 'website_score')}
              className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1 text-sm"
            >
              <option value="buy_timestamp">Date Called</option>
              <option value="website_score">Website Score</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1 text-sm hover:bg-white/30"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          {/* Website Score Filter */}
          <div className="flex items-center gap-2">
            <label className="text-white text-sm">Min Website Score:</label>
            <select
              value={minWebsiteScore}
              onChange={(e) => setMinWebsiteScore(parseInt(e.target.value))}
              className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1 text-sm"
            >
              <option value="0">All</option>
              <option value="5">5+</option>
              <option value="10">10+</option>
              <option value="15">15+</option>
              <option value="18">18+</option>
            </select>
          </div>

          {/* Token Count */}
          <div className="text-white text-sm opacity-75">
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
            className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            {/* Preview Area - Fixed height with scrollable content */}
            <div className="relative h-64 bg-gray-100 overflow-hidden">
              {previewMode === 'iframe' ? (
                <>
                  {loadingStates[token.ticker] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading preview...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={`/api/temp-preview/proxy?url=${encodeURIComponent(token.url)}`}
                    className="w-full h-full border-0 transform scale-75 origin-top-left"
                    style={{ width: '133.33%', height: '133.33%' }}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    onLoad={() => setLoadingStates(prev => ({ ...prev, [token.ticker]: false }))}
                    onError={() => setLoadingStates(prev => ({ ...prev, [token.ticker]: false }))}
                    title={`${token.name} preview`}
                  />
                </>
              ) : (
                <div className="w-full h-full overflow-y-auto">
                  <img
                    src={`/api/temp-preview/screenshot?url=${encodeURIComponent(token.url)}&cache=${btoa(token.url).substring(0, 8)}`}
                    alt={`${token.name} screenshot`}
                    className="w-full h-auto object-top"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(token.name)}`;
                    }}
                  />
                </div>
              )}
              
              {/* Live Indicator */}
              {previewMode === 'iframe' && !loadingStates[token.ticker] && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </div>
              )}
            </div>

            {/* Token Info */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{token.name}</h3>
                  <p className="text-sm text-gray-500">{token.ticker}</p>
                </div>
                <div className="text-right">
                  {token.analysisTier && (
                    <div className="relative inline-block group">
                      <span className={`${getTierColor(token.analysisTier)} text-white px-3 py-1 rounded-full text-sm font-semibold uppercase inline-block`}>
                        {token.analysisTier}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg">
                          <p>{getTierTooltip(token.analysisTier)}</p>
                          <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{formatDate(token.callDate)}</p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {token.description || <span className="text-gray-400 italic">No description available</span>}
              </p>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Market Cap</p>
                  <p className="text-sm font-semibold">{formatMarketCap(token.marketCap)}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Liquidity</p>
                  <p className="text-sm font-semibold">{formatMarketCap(token.liquidity)}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">ROI</p>
                  <p className={`text-sm font-semibold ${token.roi && token.roi > 0 ? 'text-green-600' : token.roi && token.roi < 0 ? 'text-red-600' : 'text-gray-600'}`}>
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-center py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Visit Website ↗
                </a>
                {token.contractAddress && (
                  <a
                    href={`https://dexscreener.com/${token.network}/${token.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm"
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
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* No More Results */}
      {!hasMore && tokens.length > 0 && (
        <div className="text-center mt-8 text-white opacity-75">
          <p>No more tokens to load</p>
        </div>
      )}

      {/* No Results */}
      {!loading && tokens.length === 0 && (
        <div className="text-center mt-8 text-white">
          <p className="text-xl mb-2">No tokens found</p>
          <p className="opacity-75">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}