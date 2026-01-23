import { NextRequest, NextResponse } from 'next/server';
import {
  searchPropertiesByLocation,
  searchPropertyByAddress,
  getPropertyById,
  isRentcastConfigured,
} from '@/lib/rentcast';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'location';
  const query = searchParams.get('query') || '';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  if (!isRentcastConfigured()) {
    return NextResponse.json(
      { error: 'Rentcast API key not configured. Please add your key to .env.local' },
      { status: 500 }
    );
  }

  try {
    let results;

    switch (type) {
      case 'id':
        // Search by Rentcast Property ID
        const property = await getPropertyById(query);
        results = property ? [property] : [];
        break;

      case 'address':
        // Search by full address
        const addressResult = await searchPropertyByAddress(query);
        results = addressResult ? [addressResult] : [];
        break;

      case 'location':
      default:
        // Search by city/state or zip code
        // Parse location - could be "Pittsburgh, PA" or "15201"
        const isZipCode = /^\d{5}(-\d{4})?$/.test(query.trim());

        if (isZipCode) {
          results = await searchPropertiesByLocation('', '', query.trim());
        } else {
          // Parse "City, State" format
          const parts = query.split(',').map(p => p.trim());
          const city = parts[0] || '';
          const state = parts[1] || '';
          results = await searchPropertiesByLocation(city, state);
        }
        break;
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Property search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
