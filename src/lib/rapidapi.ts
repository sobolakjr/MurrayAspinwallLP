// Zillow API integration via RapidAPI

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'zillow-com1.p.rapidapi.com';

export interface ZillowProperty {
  zpid: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
  };
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  lotSize?: number;
  yearBuilt: number;
  propertyType: string;
  daysOnZillow: number;
  imgSrc?: string;
  zestimate?: number;
  rentZestimate?: number;
}

export interface PropertySearchResult {
  mls_number: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  list_price: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lot_size: number | null;
  year_built: number;
  days_on_market: number;
  photo_url?: string;
  zestimate?: number;
  rent_estimate?: number;
}

// Search properties by location
export async function searchPropertiesByLocation(
  location: string,
  status: 'forSale' | 'forRent' = 'forSale'
): Promise<PropertySearchResult[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured');
  }

  const response = await fetch(
    `https://${RAPIDAPI_HOST}/propertyExtendedSearch?location=${encodeURIComponent(location)}&status_type=${status === 'forSale' ? 'ForSale' : 'ForRent'}&home_type=Houses`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zillow API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.props || !Array.isArray(data.props)) {
    return [];
  }

  return data.props.map((prop: any) => ({
    mls_number: prop.zpid?.toString() || '',
    address: prop.address || prop.streetAddress || '',
    city: prop.city || '',
    state: prop.state || '',
    zip: prop.zipcode || '',
    list_price: prop.price || 0,
    property_type: mapPropertyType(prop.propertyType),
    bedrooms: prop.bedrooms || 0,
    bathrooms: prop.bathrooms || 0,
    sqft: prop.livingArea || 0,
    lot_size: prop.lotAreaValue || null,
    year_built: prop.yearBuilt || 0,
    days_on_market: prop.daysOnZillow || 0,
    photo_url: prop.imgSrc || null,
    zestimate: prop.zestimate || null,
    rent_estimate: prop.rentZestimate || null,
  }));
}

// Search property by address
export async function searchPropertyByAddress(
  address: string
): Promise<PropertySearchResult | null> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured');
  }

  const response = await fetch(
    `https://${RAPIDAPI_HOST}/propertyByAddress?address=${encodeURIComponent(address)}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    throw new Error(`Zillow API error: ${response.status} - ${error}`);
  }

  const prop = await response.json();

  if (!prop || !prop.zpid) {
    return null;
  }

  return {
    mls_number: prop.zpid?.toString() || '',
    address: prop.address?.streetAddress || prop.streetAddress || '',
    city: prop.address?.city || prop.city || '',
    state: prop.address?.state || prop.state || '',
    zip: prop.address?.zipcode || prop.zipcode || '',
    list_price: prop.price || prop.zestimate || 0,
    property_type: mapPropertyType(prop.propertyType || prop.homeType),
    bedrooms: prop.bedrooms || 0,
    bathrooms: prop.bathrooms || 0,
    sqft: prop.livingArea || 0,
    lot_size: prop.lotSize || prop.lotAreaValue || null,
    year_built: prop.yearBuilt || 0,
    days_on_market: prop.daysOnZillow || 0,
    photo_url: prop.imgSrc || prop.hiResImageLink || null,
    zestimate: prop.zestimate || null,
    rent_estimate: prop.rentZestimate || null,
  };
}

// Get property details by Zillow Property ID (zpid)
export async function getPropertyByZpid(
  zpid: string
): Promise<PropertySearchResult | null> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured');
  }

  const response = await fetch(
    `https://${RAPIDAPI_HOST}/property?zpid=${zpid}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    throw new Error(`Zillow API error: ${response.status} - ${error}`);
  }

  const prop = await response.json();

  if (!prop) {
    return null;
  }

  return {
    mls_number: prop.zpid?.toString() || zpid,
    address: prop.address?.streetAddress || prop.streetAddress || '',
    city: prop.address?.city || prop.city || '',
    state: prop.address?.state || prop.state || '',
    zip: prop.address?.zipcode || prop.zipcode || '',
    list_price: prop.price || prop.zestimate || 0,
    property_type: mapPropertyType(prop.propertyType || prop.homeType),
    bedrooms: prop.bedrooms || 0,
    bathrooms: prop.bathrooms || 0,
    sqft: prop.livingArea || 0,
    lot_size: prop.lotSize || prop.lotAreaValue || null,
    year_built: prop.yearBuilt || 0,
    days_on_market: prop.daysOnZillow || 0,
    photo_url: prop.imgSrc || prop.hiResImageLink || null,
    zestimate: prop.zestimate || null,
    rent_estimate: prop.rentZestimate || null,
  };
}

function mapPropertyType(type: string | undefined): string {
  if (!type) return 'single_family';

  const typeMap: Record<string, string> = {
    'SINGLE_FAMILY': 'single_family',
    'SingleFamily': 'single_family',
    'MULTI_FAMILY': 'multi_family',
    'MultiFamily': 'multi_family',
    'CONDO': 'condo',
    'Condo': 'condo',
    'TOWNHOUSE': 'townhouse',
    'Townhouse': 'townhouse',
    'DUPLEX': 'duplex',
    'Duplex': 'duplex',
    'TRIPLEX': 'triplex',
    'APARTMENT': 'multi_family',
  };

  return typeMap[type] || 'single_family';
}

export function isRapidApiConfigured(): boolean {
  return Boolean(RAPIDAPI_KEY && RAPIDAPI_KEY !== 'your_rapidapi_key_here');
}
