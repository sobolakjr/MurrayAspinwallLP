import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Validate URL
    const parsedUrl = new URL(url);
    const isZillow = parsedUrl.hostname.includes('zillow.com');
    const isRedfin = parsedUrl.hostname.includes('redfin.com');
    const isRealtor = parsedUrl.hostname.includes('realtor.com');

    if (!isZillow && !isRedfin && !isRealtor) {
      return NextResponse.json({
        success: false,
        error: 'Only Zillow, Redfin, and Realtor.com URLs are supported',
      });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch listing: ${response.status}`,
      });
    }

    const html = await response.text();
    let listPrice: number | null = null;
    let address: string | null = null;

    if (isZillow) {
      // Try to extract price from Zillow HTML
      // Zillow embeds JSON-LD data in script tags
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatch) {
        for (const match of jsonLdMatch) {
          try {
            const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
            const data = JSON.parse(jsonContent);
            if (data['@type'] === 'SingleFamilyResidence' || data['@type'] === 'Product') {
              if (data.offers?.price) {
                listPrice = Number(data.offers.price);
              }
              if (data.name) {
                address = data.name;
              }
            }
          } catch {
            // Continue trying other matches
          }
        }
      }

      // Fallback: try to find price in meta tags or common patterns
      if (!listPrice) {
        const priceMatch = html.match(/\$([0-9,]+)(?:\s*\/mo)?/);
        if (priceMatch) {
          const priceStr = priceMatch[1].replace(/,/g, '');
          const price = parseInt(priceStr, 10);
          // Only use if it looks like a home price (> $50,000)
          if (price > 50000) {
            listPrice = price;
          }
        }
      }

      // Try to get price from Zillow's data layer
      const zillowDataMatch = html.match(/"price":(\d+)/);
      if (zillowDataMatch && !listPrice) {
        listPrice = parseInt(zillowDataMatch[1], 10);
      }
    } else if (isRedfin) {
      // Redfin price extraction
      const priceMatch = html.match(/\$([0-9,]+)(?:<\/span>)?(?:\s*List Price)?/i);
      if (priceMatch) {
        const priceStr = priceMatch[1].replace(/,/g, '');
        const price = parseInt(priceStr, 10);
        if (price > 50000) {
          listPrice = price;
        }
      }
    } else if (isRealtor) {
      // Realtor.com price extraction
      const priceMatch = html.match(/"list_price":(\d+)/);
      if (priceMatch) {
        listPrice = parseInt(priceMatch[1], 10);
      }
    }

    return NextResponse.json({
      success: true,
      listPrice,
      address,
      source: isZillow ? 'zillow' : isRedfin ? 'redfin' : 'realtor',
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch listing',
    });
  }
}
