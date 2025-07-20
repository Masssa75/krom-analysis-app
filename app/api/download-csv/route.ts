import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data, filename = 'krom-analysis.csv' } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Build CSV content
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Handle special cases
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          // Escape commas in strings
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('CSV download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for direct download links
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'sample';
  
  // Sample data for demonstration
  const sampleData = [
    {
      ticker: 'BTC',
      price: 45000,
      change_24h: 2.5,
      volume: 1000000,
      market_cap: 850000000000,
      timestamp: new Date().toISOString()
    },
    {
      ticker: 'ETH',
      price: 3000,
      change_24h: -1.2,
      volume: 500000,
      market_cap: 350000000000,
      timestamp: new Date().toISOString()
    }
  ];

  // Build CSV
  const headers = Object.keys(sampleData[0]);
  let csv = headers.join(',') + '\n';
  
  sampleData.forEach(row => {
    const values = headers.map(header => row[header as keyof typeof row]);
    csv += values.join(',') + '\n';
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="krom-${type}-data.csv"`,
    },
  });
}