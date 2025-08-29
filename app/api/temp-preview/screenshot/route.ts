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
    // Use the REAL Screenly API
    const apiKey = process.env.SCREENLY_API_KEY;
    
    if (!apiKey) {
      console.error('SCREENLY_API_KEY not found in environment variables');
      throw new Error('Screenshot service not configured');
    }
    
    // Screenly API endpoint with proper parameters
    const screenshotUrl = `https://api.screenly.com/v1/screenshot?url=${encodeURIComponent(targetUrl)}&key=${apiKey}&width=1280&height=800&delay=3000`;
    
    console.log('Fetching screenshot from Screenly for:', targetUrl);
    
    // Fetch the screenshot from Screenly
    const imageResponse = await fetch(screenshotUrl);
    
    if (!imageResponse.ok) {
      console.error(`Screenly API returned ${imageResponse.status}`);
      throw new Error(`Screenshot service error: ${imageResponse.status}`);
    }
    
    // Get the image as a buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Return the actual image buffer with caching
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Vary': 'url', // Important: vary cache by URL parameter
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