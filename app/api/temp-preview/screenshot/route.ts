/**
 * TEMPORARY SCREENSHOT API FOR MOCKUPS
 * Can be deleted after mockup testing is complete
 * Location: /app/api/temp-preview/screenshot/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';

// Get Screenly API key from environment
const SCREENLY_API_KEY = process.env.SCREEENLY_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    // First try Screenly v3 if we have an API key
    if (SCREENLY_API_KEY) {
      console.log('Using Screenly v3 API for screenshot');
      
      // Screenly v3 API endpoint
      const screenlyResponse = await fetch('https://3.screeenly.com/api/v1/shots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SCREENLY_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          url: targetUrl,
          viewport_width: 1280,
          viewport_height: 800,
          format: 'png',
          full_page: false,
          wait_for_event: 'load',
          delay: 1000, // Wait 1 second after load for dynamic content
        }),
      });
      
      if (screenlyResponse.ok) {
        const data = await screenlyResponse.json();
        console.log('Screenly response:', data);
        
        // Screenly returns a URL to the screenshot
        if (data.screenshot_url || data.url || data.data?.url) {
          const imageUrl = data.screenshot_url || data.url || data.data?.url;
          
          // Fetch the actual image
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          
          return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
          });
        }
      } else {
        const errorText = await screenlyResponse.text();
        console.error('Screenly API failed:', screenlyResponse.status, errorText);
      }
    }
    
    // Fallback to Microlink as backup
    console.log('Falling back to Microlink API');
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
    
    const response = await fetch(microlinkUrl);
    const data = await response.json();
    
    if (data.status === 'success' && data.data?.screenshot?.url) {
      // Fetch and return the screenshot
      const imageResponse = await fetch(data.data.screenshot.url);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
        },
      });
    }
    
    // Final fallback: placeholder
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
          Screenshot Loading...
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
          Screenshot Unavailable
        </text>
        <text x="200" y="200" font-family="Arial" font-size="10" fill="#444" text-anchor="middle">
          ${error instanceof Error ? error.message : 'Unknown error'}
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