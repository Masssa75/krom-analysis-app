/**
 * TEMPORARY DISCOVERY PAGE FOR TESTING PREVIEWS
 * Can be deleted after mockup testing is complete
 * Location: /app/temp-discovery/page.tsx
 */

'use client';

import { useState, useEffect } from 'react';

const tokens = [
  {
    name: 'Fedora',
    ticker: '$FEDORA',
    url: 'https://www.fedora.club',
    score: '13/21',
    description: 'Meme coin with strong branding. The gentleman\'s token.',
    marketCap: '$147K',
    liquidity: '$14.9K',
    age: '2d',
    category: 'meme'
  },
  {
    name: 'Ainu AI',
    ticker: '$AINU',
    url: 'https://www.ainu.pro',  // FIXED URL
    score: '13/21',
    description: 'AI-powered utility token with clear tokenomics.',
    marketCap: '$154K',
    liquidity: '$15.4K',
    age: '3d',
    category: 'ai'
  },
  {
    name: 'UIUI',
    ticker: '$UIUI',
    url: 'https://www.uiui.wtf',  // FIXED URL - needs www
    score: '11/21',
    description: 'UI/UX focused design toolkit for dApps.',
    marketCap: '$250K',
    liquidity: '$25K',
    age: '1d',
    category: 'defi'
  },
  {
    name: 'BIO Protocol',
    ticker: '$BIO',
    url: 'https://bio.xyz',
    score: '16/21',
    description: 'Decentralized science funding protocol.',
    marketCap: '$420K',
    liquidity: '$68K',
    age: '14d',
    category: 'defi'
  }
];

export default function TempDiscoveryPage() {
  const [previewMode, setPreviewMode] = useState<'iframe' | 'screenshot'>('screenshot');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Initialize loading states
  useEffect(() => {
    const initialStates: Record<string, boolean> = {};
    tokens.forEach(token => {
      initialStates[token.ticker] = true;
    });
    setLoadingStates(initialStates);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-6">
      {/* Header */}
      <div className="text-center text-white mb-8">
        <h1 className="text-4xl font-bold mb-2">🚀 KROM Discovery</h1>
        <p className="text-lg opacity-90">Testing Website Previews</p>
        
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
        
        <div className="mt-4 text-sm opacity-75">
          Current Mode: {previewMode === 'iframe' ? 'Live iFrame via Proxy' : 'Static Screenshots'}
        </div>
      </div>

      {/* Token Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tokens.map((token) => (
          <div
            key={token.ticker}
            className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            {/* Preview Area - Fixed height with responsive iframe */}
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
                <img
                  src={`/api/temp-preview/screenshot?url=${encodeURIComponent(token.url)}&v=${token.ticker}&t=${Date.now()}`}
                  alt={`${token.name} screenshot`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(token.name)}`;
                  }}
                />
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
                <span className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {token.score}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{token.description}</p>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Market Cap</p>
                  <p className="text-sm font-semibold">{token.marketCap}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Liquidity</p>
                  <p className="text-sm font-semibold">{token.liquidity}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="text-sm font-semibold">{token.age}</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={token.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white text-center py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Visit Website ↗
                </a>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  Chart 📊
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="max-w-4xl mx-auto mt-12 p-6 bg-white/10 backdrop-blur rounded-xl text-white">
        <h3 className="text-xl font-bold mb-3">🧪 Preview Testing</h3>
        <p className="mb-2">This is a temporary page for testing website previews. It demonstrates:</p>
        <ul className="list-disc list-inside space-y-1 text-sm opacity-90">
          <li><strong>iFrame Mode:</strong> Uses proxy at /api/temp-preview/proxy to bypass CORS</li>
          <li><strong>Screenshot Mode:</strong> Uses screenshot API at /api/temp-preview/screenshot</li>
          <li>Both endpoints are in the /app/api/temp-preview folder</li>
          <li>This entire page is in /app/temp-discovery</li>
          <li className="text-yellow-300">To remove: Delete /app/api/temp-preview and /app/temp-discovery folders</li>
        </ul>
        <div className="mt-4 p-3 bg-white/10 rounded">
          <p className="text-sm"><strong>URLs being tested:</strong></p>
          <ul className="text-xs mt-2 space-y-1">
            <li>Fedora: {tokens[0].url}</li>
            <li>Ainu: {tokens[1].url}</li>
            <li>UIUI: {tokens[2].url}</li>
            <li>BIO: {tokens[3].url}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}