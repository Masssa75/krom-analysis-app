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
    // Use thum.io - completely free, no API key needed
    const thumUrl = `https://image.thum.io/get/width/1280/crop/800/noanimate/${targetUrl}`;
    
    console.log('Using thum.io for screenshot:', thumUrl);
    
    // Simply redirect to the thum.io URL
    // The browser will fetch and display the image directly
    return NextResponse.redirect(thumUrl, { status: 302 });
    
  } catch (error) {
    console.error('Screenshot error:', error);
    
    // If thum.io fails, try another free service
    try {
      // Pikwy is another free service
      const pikwyUrl = `https://pikwy.com/api/v1/screenshot?url=${encodeURIComponent(targetUrl)}&width=1280&height=800`;
      return NextResponse.redirect(pikwyUrl, { status: 302 });
    } catch {
      // Final fallback: placeholder
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
            📸 Loading Screenshot...
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
}