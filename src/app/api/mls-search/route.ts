import { NextRequest, NextResponse } from 'next/server';
import {
  searchPropertiesByLocation,
  searchPropertyByAddress,
  getPropertyByZpid,
  isRapidApiConfigured,
} from '@/lib/rapidapi';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'location';
  const query = searchParams.get('query') || '';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  if (!isRapidApiConfigured()) {
    return NextResponse.json(
      { error: 'RapidAPI key not configured. Please add your key to .env.local' },
      { status: 500 }
    );
  }

  try {
    let results;

    switch (type) {
      case 'zpid':
        // Search by Zillow Property ID
        const property = await getPropertyByZpid(query);
        results = property ? [property] : [];
        break;

      case 'address':
        // Search by full address
        const addressResult = await searchPropertyByAddress(query);
        results = addressResult ? [addressResult] : [];
        break;

      case 'location':
      default:
        // Search by city, zip, or neighborhood
        results = await searchPropertiesByLocation(query);
        break;
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('MLS search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
