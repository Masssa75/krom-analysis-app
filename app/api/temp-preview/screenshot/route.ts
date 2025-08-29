/**
 * TEMPORARY SCREENSHOT API FOR MOCKUPS
 * Can be deleted after mockup testing is complete
 * Location: /app/api/temp-preview/screenshot/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    // For demo purposes, use pre-configured screenshot URLs that work
    // In production, you'd use a proper screenshot service with API key
    
    // Map URLs to working screenshot examples
    const screenshotMap: Record<string, string> = {
      'https://www.fedora.club': 'https://shots.codepen.io/username/pen/poEKGdm-1280.jpg?version=1612345',
      'https://www.ainu.pro': 'https://shots.codepen.io/username/pen/abcdefg-1280.jpg?version=1612346',
      'https://www.uiui.wtf': 'https://shots.codepen.io/username/pen/hijklmn-1280.jpg?version=1612347',
      'https://bio.xyz': 'https://shots.codepen.io/username/pen/opqrstu-1280.jpg?version=1612348'
    };
    
    // Use placeholder service with unique colors for each domain
    const hostname = new URL(targetUrl).hostname.replace('www.', '');
    const colors: Record<string, string> = {
      'fedora.club': '667eea',
      'ainu.pro': '10b981',
      'uiui.wtf': 'f59e0b',
      'bio.xyz': 'ef4444'
    };
    
    const bgColor = colors[hostname] || '1e293b';
    const placeholderUrl = `https://via.placeholder.com/1280x800/${bgColor}/ffffff?text=${encodeURIComponent(hostname.toUpperCase())}`;
    
    console.log('Generating screenshot placeholder for:', targetUrl);
    
    // Fetch the placeholder image
    const imageResponse = await fetch(placeholderUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Placeholder service returned ${imageResponse.status}`);
    }
    
    // Get the image as a buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Return the actual image buffer with caching
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Vary': 'url', // Vary cache by URL parameter
      },
    });
    
  } catch (error) {
    console.error('Screenshot service error:', error);
    
    // Try to extract hostname for placeholder
    let hostname = 'Website';
    try {
      hostname = new URL(targetUrl).hostname;
    } catch {}
    
    // Return a nice placeholder SVG
    const placeholderSvg = `
      <svg width="1280" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="1280" height="800" fill="url(#gradient)"/>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
          </linearGradient>
        </defs>
        <text x="640" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="48" fill="white" text-anchor="middle">
          📸 Preview Unavailable
        </text>
        <text x="640" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="white" opacity="0.8" text-anchor="middle">
          ${hostname}
        </text>
        <text x="640" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="white" opacity="0.6" text-anchor="middle">
          Screenshot service temporarily unavailable
        </text>
      </svg>
    `;
    
    return new NextResponse(placeholderSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // Cache placeholder for 5 minutes
      },
    });
  }
}