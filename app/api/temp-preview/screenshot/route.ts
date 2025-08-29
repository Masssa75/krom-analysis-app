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
    // Use ScreenshotMachine free tier (allows limited requests)
    // Customer key is a free demo key that works for testing
    const key = 'b645b8'; // Free demo key
    const screenshotUrl = `https://api.screenshotmachine.com/?key=${key}&url=${encodeURIComponent(targetUrl)}&dimension=1280x800&format=png&cacheLimit=0&delay=3000`;
    
    console.log('Fetching screenshot for:', targetUrl);
    
    // Fetch the image from ScreenshotMachine
    const imageResponse = await fetch(screenshotUrl);
    
    // Check if we got an actual image
    const contentType = imageResponse.headers.get('content-type');
    if (!imageResponse.ok || !contentType?.includes('image')) {
      console.log(`Screenshot service failed, using placeholder. Status: ${imageResponse.status}, Type: ${contentType}`);
      
      // Create a better placeholder with the actual domain
      const hostname = new URL(targetUrl).hostname.replace('www.', '');
      const placeholderUrl = `https://via.placeholder.com/1280x800/1e293b/ffffff?text=${encodeURIComponent(hostname)}`;
      
      const placeholderResponse = await fetch(placeholderUrl);
      const placeholderBuffer = await placeholderResponse.arrayBuffer();
      
      return new NextResponse(placeholderBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300', // Cache placeholder for 5 minutes
        },
      });
    }
    
    // Get the image as a buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Return the actual image buffer with caching
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'image/png',
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