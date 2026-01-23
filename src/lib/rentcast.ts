// Rentcast API integration for property data

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY || '';
const RENTCAST_BASE_URL = 'https://api.rentcast.io/v1';

// Full Rentcast API response type
export interface RentcastApiResponse {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  stateFips?: string;
  zipCode: string;
  county?: string;
  countyFips?: string;
  latitude?: number;
  longitude?: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize?: number;
  yearBuilt: number;
  assessorID?: string;
  legalDescription?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  ownerOccupied?: boolean;
  features?: {
    architectureType?: string;
    exteriorType?: string;
    floorCount?: number;
    garage?: boolean;
    garageSpaces?: number;
    garageType?: string;
    heating?: boolean;
    heatingType?: string;
    cooling?: boolean;
    coolingType?: string;
    roofType?: string;
    roomCount?: number;
    unitCount?: number;
    pool?: boolean;
    fireplace?: boolean;
  };
  taxAssessments?: Record<string, {
    year: number;
    value: number;
    land?: number;
    improvements?: number;
  }>;
  propertyTaxes?: Record<string, {
    year: number;
    total: number;
  }>;
  history?: Record<string, {
    event: string;
    date: string;
    price?: number;
  }>;
  owner?: {
    names?: string[];
    type?: string;
    mailingAddress?: {
      id?: string;
      formattedAddress?: string;
      addressLine1?: string;
      addressLine2?: string | null;
      city?: string;
      state?: string;
      stateFips?: string;
      zipCode?: string;
    };
  };
}

// Compatible interface with existing code
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
  // New fields from Rentcast
  latitude?: number;
  longitude?: number;
  owner_occupied?: boolean;
  last_sale_date?: string;
  // Raw API data for detailed view
  api_data?: RentcastApiResponse;
}

// Search property by address
export async function searchPropertyByAddress(
  address: string
): Promise<PropertySearchResult | null> {
  if (!RENTCAST_API_KEY) {
    throw new Error('Rentcast API key not configured');
  }

  const response = await fetch(
    `${RENTCAST_BASE_URL}/properties?address=${encodeURIComponent(address)}`,
    {
      method: 'GET',
      headers: {
        'X-Api-Key': RENTCAST_API_KEY,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    throw new Error(`Rentcast API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // API returns array, get first result
  const prop: RentcastApiResponse = Array.isArray(data) ? data[0] : data;

  if (!prop || !prop.id) {
    return null;
  }

  return mapRentcastToSearchResult(prop);
}

// Search properties by location (city/state or zip)
export async function searchPropertiesByLocation(
  city: string,
  state: string,
  zipCode?: string
): Promise<PropertySearchResult[]> {
  if (!RENTCAST_API_KEY) {
    throw new Error('Rentcast API key not configured');
  }

  // Build query params
  const params = new URLSearchParams();
  if (zipCode) {
    params.append('zipCode', zipCode);
  } else {
    params.append('city', city);
    params.append('state', state);
  }
  params.append('limit', '50');

  const response = await fetch(
    `${RENTCAST_BASE_URL}/properties?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'X-Api-Key': RENTCAST_API_KEY,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Rentcast API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return data ? [mapRentcastToSearchResult(data)] : [];
  }

  return data.map(mapRentcastToSearchResult);
}

// Get property by Rentcast ID
export async function getPropertyById(
  id: string
): Promise<PropertySearchResult | null> {
  if (!RENTCAST_API_KEY) {
    throw new Error('Rentcast API key not configured');
  }

  const response = await fetch(
    `${RENTCAST_BASE_URL}/properties/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: {
        'X-Api-Key': RENTCAST_API_KEY,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    throw new Error(`Rentcast API error: ${response.status} - ${error}`);
  }

  const prop: RentcastApiResponse = await response.json();

  if (!prop || !prop.id) {
    return null;
  }

  return mapRentcastToSearchResult(prop);
}

// Map Rentcast property to our standard interface
function mapRentcastToSearchResult(prop: RentcastApiResponse): PropertySearchResult {
  return {
    mls_number: prop.id,
    address: prop.addressLine1 || prop.formattedAddress || '',
    city: prop.city || '',
    state: prop.state || '',
    zip: prop.zipCode || '',
    list_price: prop.lastSalePrice || 0,
    property_type: mapPropertyType(prop.propertyType),
    bedrooms: prop.bedrooms || 0,
    bathrooms: prop.bathrooms || 0,
    sqft: prop.squareFootage || 0,
    lot_size: prop.lotSize || null,
    year_built: prop.yearBuilt || 0,
    days_on_market: 0, // Not available in Rentcast
    photo_url: undefined, // Not available in Rentcast
    zestimate: undefined, // Not available in Rentcast
    rent_estimate: undefined, // Not available in Rentcast
    latitude: prop.latitude,
    longitude: prop.longitude,
    owner_occupied: prop.ownerOccupied,
    last_sale_date: prop.lastSaleDate,
    api_data: prop, // Include full raw API response
  };
}

function mapPropertyType(type: string | undefined): string {
  if (!type) return 'single_family';

  const typeMap: Record<string, string> = {
    'Single Family': 'single_family',
    'SingleFamily': 'single_family',
    'Multi Family': 'multi_family',
    'MultiFamily': 'multi_family',
    'Condo': 'condo',
    'Condominium': 'condo',
    'Townhouse': 'townhouse',
    'Townhome': 'townhouse',
    'Duplex': 'duplex',
    'Triplex': 'triplex',
    'Quadruplex': 'multi_family',
    'Apartment': 'multi_family',
    'Mobile': 'other',
    'Land': 'land',
  };

  return typeMap[type] || 'single_family';
}

export function isRentcastConfigured(): boolean {
  return Boolean(RENTCAST_API_KEY && RENTCAST_API_KEY !== 'your_rentcast_api_key_here');
}
