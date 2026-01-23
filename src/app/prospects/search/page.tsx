'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MapPin,
  Home,
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { addProspectAction } from '../actions';

interface SearchResult {
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
  latitude?: number;
  longitude?: number;
  owner_occupied?: boolean;
  last_sale_date?: string;
  api_data?: Record<string, unknown>;
}

export default function ProspectSearchPage() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<'location' | 'address'>('address');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setResults([]);

    try {
      let query: string;
      let type: string;

      if (searchType === 'location') {
        query = location;
        type = 'location';
      } else {
        query = address;
        type = 'address';
      }

      const response = await fetch(`/api/mls-search?type=${type}&query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProspect = async (result: SearchResult) => {
    const id = result.mls_number || result.address;
    setAddingId(id);

    try {
      const response = await addProspectAction({
        mls_number: result.mls_number,
        address: result.address,
        city: result.city,
        state: result.state,
        zip: result.zip,
        list_price: result.list_price,
        property_type: result.property_type,
        bedrooms: result.bedrooms,
        bathrooms: result.bathrooms,
        sqft: result.sqft,
        lot_size: result.lot_size,
        year_built: result.year_built,
        days_on_market: result.days_on_market,
        api_data: result.api_data,
      });

      if (response.success) {
        setAddedIds(prev => new Set(prev).add(id));
      } else {
        setError(response.error || 'Failed to add prospect');
      }
    } catch (err) {
      setError('Failed to add prospect');
    } finally {
      setAddingId(null);
    }
  };

  const formatPropertyType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'single_family': 'Single Family',
      'multi_family': 'Multi Family',
      'condo': 'Condo',
      'townhouse': 'Townhouse',
      'duplex': 'Duplex',
      'triplex': 'Triplex',
      'land': 'Land',
      'other': 'Other',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/prospects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Properties</h1>
          <p className="text-muted-foreground">
            Search for investment properties by location or address
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Property Search</CardTitle>
          <CardDescription>
            Search by location (city, state, zip) or enter a specific address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={searchType === 'address' ? 'default' : 'outline'}
              onClick={() => setSearchType('address')}
            >
              By Address
            </Button>
            <Button
              variant={searchType === 'location' ? 'default' : 'outline'}
              onClick={() => setSearchType('location')}
            >
              By Location
            </Button>
          </div>

          {searchType === 'location' ? (
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label>City, State or Zip Code</Label>
                <Input
                  placeholder="e.g., Pittsburgh, PA or 15201"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && location && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={isLoading || !location}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label>Full Address</Label>
                <Input
                  placeholder="e.g., 5319 Camelia St, Pittsburgh, PA 15201"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && address && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={isLoading || !address}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Search Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {hasSearched && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {isLoading ? 'Searching...' : `${results.length} properties found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={result.mls_number || index}
                    className="flex items-start justify-between rounded-lg border p-4"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted overflow-hidden">
                        <Home className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{result.address}</h4>
                          <Badge variant="outline" className="text-xs">
                            {formatPropertyType(result.property_type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {result.city}, {result.state} {result.zip}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          {result.list_price > 0 && (
                            <span className="font-semibold text-lg">
                              ${result.list_price.toLocaleString()}
                              <span className="text-xs text-muted-foreground ml-1">last sale</span>
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {result.bedrooms || '?'} bed | {result.bathrooms || '?'} bath | {result.sqft?.toLocaleString() || '?'} sqft
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {result.year_built > 0 && (
                            <span>Built {result.year_built}</span>
                          )}
                          {result.lot_size && (
                            <span>Lot: {result.lot_size.toLocaleString()} sqft</span>
                          )}
                          {result.owner_occupied !== undefined && (
                            <Badge variant={result.owner_occupied ? 'secondary' : 'outline'} className="text-xs">
                              {result.owner_occupied ? 'Owner Occupied' : 'Not Owner Occupied'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {addedIds.has(result.mls_number || result.address) ? (
                        <Button size="sm" variant="outline" disabled className="text-green-600">
                          <Check className="mr-2 h-4 w-4" />
                          Added
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddProspect(result)}
                          disabled={addingId === (result.mls_number || result.address)}
                        >
                          {addingId === (result.mls_number || result.address) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Add to Prospects
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  Try a different location or address
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
