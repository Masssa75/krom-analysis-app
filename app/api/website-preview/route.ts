import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Method 1: Try to get screenshot using free screenshot service
    const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
    
    const response = await fetch(screenshotUrl);
    const data = await response.json();
    
    if (data.status === 'success' && data.data?.screenshot?.url) {
      // Return the screenshot URL
      return NextResponse.json({
        success: true,
        screenshotUrl: data.data.screenshot.url,
        method: 'microlink'
      });
    }

    // Method 2: Try to get Open Graph image as fallback
    const metaUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
    const metaResponse = await fetch(metaUrl);
    const metaData = await metaResponse.json();
    
    if (metaData.status === 'success') {
      const imageUrl = metaData.data?.image?.url || metaData.data?.logo?.url;
      if (imageUrl) {
        return NextResponse.json({
          success: true,
          screenshotUrl: imageUrl,
          method: 'opengraph'
        });
      }
    }

    // Method 3: Generate a placeholder based on the domain
    const domain = new URL(url).hostname;
    const placeholderUrl = `https://via.placeholder.com/400x600/667eea/ffffff?text=${encodeURIComponent(domain)}`;
    
    return NextResponse.json({
      success: true,
      screenshotUrl: placeholderUrl,
      method: 'placeholder'
    });

  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate preview',
      fallbackUrl: `https://via.placeholder.com/400x600/667eea/ffffff?text=Preview+Unavailable`
    }, { status: 200 }); // Return 200 to avoid breaking the UI
  }
}

// Optional: POST endpoint for batch preview generation
export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
    }

    const previews = await Promise.all(
      urls.map(async (url) => {
        try {
          const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
          const response = await fetch(screenshotUrl);
          const data = await response.json();
          
          return {
            url,
            success: true,
            screenshotUrl: data.data?.screenshot?.url || null
          };
        } catch (error) {
          return {
            url,
            success: false,
            screenshotUrl: null
          };
        }
      })
    );

    return NextResponse.json({ previews });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process batch request' }, { status: 500 });
  }
}