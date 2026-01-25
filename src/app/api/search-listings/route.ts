import { NextRequest, NextResponse } from 'next/server';

// Generate listing search URLs for major real estate sites
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const city = searchParams.get('city');
  const state = searchParams.get('state');
  const zip = searchParams.get('zip');

  if (!address || !city || !state) {
    return NextResponse.json(
      { error: 'Missing required parameters: address, city, state' },
      { status: 400 }
    );
  }

  // Format address for URL encoding
  const fullAddress = `${address}, ${city}, ${state}${zip ? ` ${zip}` : ''}`;

  // Create formatted address for Zillow (replace spaces with dashes, remove special chars)
  const zillowAddress = address
    .toLowerCase()
    .replace(/[#.,]/g, '')
    .replace(/\s+/g, '-');
  const zillowCity = city.toLowerCase().replace(/\s+/g, '-');
  const zillowState = state.toLowerCase();

  // Generate Zillow listing URL (most reliable for finding exact property)
  const listings = [
    {
      source: 'Zillow',
      url: `https://www.zillow.com/homes/${encodeURIComponent(zillowAddress)}-${encodeURIComponent(zillowCity)}-${zillowState}_rb/`,
      searchUrl: `https://www.zillow.com/homes/${encodeURIComponent(fullAddress).replace(/%20/g, '-')}_rb/`,
      icon: 'zillow',
    },
  ];

  return NextResponse.json({ listings, address: fullAddress });
}
