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
    // Use free screenshot service (Microlink)
    const screenshotApiUrl = `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
    
    const response = await fetch(screenshotApiUrl);
    const data = await response.json();
    
    if (data.status === 'success' && data.data?.screenshot?.url) {
      // Fetch the actual screenshot image
      const imageResponse = await fetch(data.data.screenshot.url);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Return the image directly
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    }
    
    // Fallback: return a placeholder image
    const placeholderSvg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="url(#grad)"/>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <text x="200" y="140" font-family="Arial" font-size="18" fill="white" text-anchor="middle">
          Preview Loading...
        </text>
        <text x="200" y="165" font-family="Arial" font-size="12" fill="white" opacity="0.8" text-anchor="middle">
          ${new URL(targetUrl).hostname}
        </text>
      </svg>
    `;
    
    return new NextResponse(placeholderSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('Screenshot error:', error);
    
    // Error placeholder
    const errorSvg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#1a1c1f"/>
        <text x="200" y="140" font-family="Arial" font-size="48" fill="#666" text-anchor="middle">🌐</text>
        <text x="200" y="180" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">
          No Preview Available
        </text>
      </svg>
    `;
    
    return new NextResponse(errorSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }
}