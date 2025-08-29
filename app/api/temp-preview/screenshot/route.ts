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
    // Use ScreenshotMachine free tier
    const screenshotUrl = `https://api.screenshotmachine.com?key=c1d705&url=${encodeURIComponent(targetUrl)}&dimension=1280x800&format=png&cacheLimit=0&delay=2000`;
    
    console.log('Fetching screenshot from:', screenshotUrl);
    
    // Fetch the screenshot
    const response = await fetch(screenshotUrl);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('image')) {
        const imageBuffer = await response.arrayBuffer();
        
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType || 'image/png',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          },
        });
      }
    }
    
    // Fallback to screenshot.rocks (another free service)
    console.log('Trying screenshot.rocks as fallback');
    const fallbackUrl = `https://screenshot.rocks/api/screenshot?url=${encodeURIComponent(targetUrl)}&width=1280&height=800&type=png`;
    
    const fallbackResponse = await fetch(fallbackUrl);
    
    if (fallbackResponse.ok) {
      const imageBuffer = await fallbackResponse.arrayBuffer();
      
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // Final fallback: Use a service that generates a preview image
    console.log('Using final fallback - URL2PNG style service');
    const url2pngUrl = `https://image.thum.io/get/width/1280/crop/800/${targetUrl}`;
    
    return NextResponse.redirect(url2pngUrl);
    
  } catch (error) {
    console.error('Screenshot error:', error);
    
    // Error placeholder SVG
    const errorSvg = `
      <svg width="1280" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="1280" height="800" fill="url(#grad)"/>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <text x="640" y="380" font-family="Arial" font-size="48" fill="white" text-anchor="middle">
          📸 Screenshot Service Loading...
        </text>
        <text x="640" y="440" font-family="Arial" font-size="24" fill="white" opacity="0.8" text-anchor="middle">
          ${new URL(targetUrl).hostname}
        </text>
        <text x="640" y="480" font-family="Arial" font-size="16" fill="white" opacity="0.6" text-anchor="middle">
          This may take a few seconds on first load
        </text>
      </svg>
    `;
    
    return new NextResponse(errorSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}