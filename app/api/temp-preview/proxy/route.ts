/**
 * TEMPORARY PREVIEW PROXY FOR MOCKUPS
 * Can be deleted after mockup testing is complete
 * Location: /app/api/temp-preview/proxy/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';

// Simple proxy to fetch website content and serve it with proper CORS headers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    // Fetch the target website
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KROM Preview Bot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    let html = await response.text();
    
    // Basic HTML modifications to make it work in iframe
    const baseUrl = new URL(targetUrl).origin;
    
    // Add base tag for relative URLs
    if (!html.includes('<base')) {
      html = html.replace('<head>', `<head><base href="${baseUrl}/">`);
    }
    
    // Remove X-Frame-Options meta tags
    html = html.replace(/<meta.*http-equiv=["']X-Frame-Options["'].*>/gi, '');
    
    // Add a simple banner showing this is a preview
    const banner = `
      <div style="position:fixed;top:0;left:0;right:0;background:#00ff88;color:black;padding:5px;text-align:center;z-index:99999;font-size:11px;">
        KROM Preview Mode - ${new URL(targetUrl).hostname}
      </div>
    `;
    html = html.replace('<body', `<body>${banner}<div style="height:30px;"></div><body`);

    // Return the modified HTML with permissive headers
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors 'self' krom1.com localhost:*",
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Return a nice error page
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, system-ui, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 300px;
              text-align: center;
            }
            .error-box {
              background: rgba(0,0,0,0.3);
              padding: 30px;
              border-radius: 15px;
              backdrop-filter: blur(10px);
            }
            .icon {
              font-size: 48px;
              margin-bottom: 15px;
            }
            .url {
              font-size: 12px;
              opacity: 0.8;
              margin-top: 10px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="error-box">
            <div class="icon">🌐</div>
            <h3>Preview Unavailable</h3>
            <p>This website cannot be previewed</p>
            <div class="url">${targetUrl}</div>
          </div>
        </body>
      </html>
    `;
    
    return new NextResponse(errorHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
      },
    });
  }
}