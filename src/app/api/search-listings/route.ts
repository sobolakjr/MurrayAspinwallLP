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

  // Generate listing URLs for each platform
  const listings = [
    {
      source: 'Zillow',
      url: `https://www.zillow.com/homes/${encodeURIComponent(zillowAddress)}-${encodeURIComponent(zillowCity)}-${zillowState}_rb/`,
      searchUrl: `https://www.zillow.com/homes/${encodeURIComponent(fullAddress).replace(/%20/g, '-')}_rb/`,
      icon: 'zillow',
    },
    {
      source: 'Redfin',
      url: `https://www.redfin.com/search?search=${encodeURIComponent(fullAddress)}`,
      searchUrl: `https://www.redfin.com/search?search=${encodeURIComponent(fullAddress)}`,
      icon: 'redfin',
    },
    {
      source: 'Realtor.com',
      url: `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(fullAddress).replace(/%20/g, '_')}`,
      searchUrl: `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(fullAddress).replace(/%20/g, '_')}`,
      icon: 'realtor',
    },
    {
      source: 'Trulia',
      url: `https://www.trulia.com/home/${encodeURIComponent(fullAddress).replace(/%20/g, '-')}`,
      searchUrl: `https://www.trulia.com/for_sale/${encodeURIComponent(city)},${state}/`,
      icon: 'trulia',
    },
  ];

  return NextResponse.json({ listings, address: fullAddress });
}
