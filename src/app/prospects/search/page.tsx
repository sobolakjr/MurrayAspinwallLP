'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  ExternalLink,
  AlertCircle,
  DollarSign,
  Link as LinkIcon,
} from 'lucide-react';

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
  zestimate?: number;
  rent_estimate?: number;
}

// Extract ZPID from Zillow URL
function extractZpidFromUrl(url: string): string | null {
  const match = url.match(/(\d+)_zpid/);
  return match ? match[1] : null;
}

export default function ProspectSearchPage() {
  const [searchType, setSearchType] = useState<'url' | 'location' | 'address'>('url');
  const [zillowUrl, setZillowUrl] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setResults([]);

    try {
      let query: string;
      let type: string;

      if (searchType === 'url') {
        const zpid = extractZpidFromUrl(zillowUrl);
        if (!zpid) {
          throw new Error('Invalid Zillow URL. Make sure it contains a property ID (e.g., 12345678_zpid)');
        }
        query = zpid;
        type = 'zpid';
      } else if (searchType === 'location') {
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
    // TODO: Save to Supabase
    alert(`Added ${result.address} to prospects!`);
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
            Search Zillow for investment properties by location or address
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Zillow Property Search</CardTitle>
          <CardDescription>
            Paste a Zillow URL, search by location, or enter a specific address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={searchType === 'url' ? 'default' : 'outline'}
              onClick={() => setSearchType('url')}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Paste URL
            </Button>
            <Button
              variant={searchType === 'location' ? 'default' : 'outline'}
              onClick={() => setSearchType('location')}
            >
              By Location
            </Button>
            <Button
              variant={searchType === 'address' ? 'default' : 'outline'}
              onClick={() => setSearchType('address')}
            >
              By Address
            </Button>
          </div>

          {searchType === 'url' ? (
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label>Zillow Property URL</Label>
                <Input
                  placeholder="Paste Zillow URL (e.g., https://www.zillow.com/homedetails/...)"
                  value={zillowUrl}
                  onChange={(e) => setZillowUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && zillowUrl && handleSearch()}
                />
                <p className="text-xs text-muted-foreground">
                  Copy the URL from your browser while viewing a property on Zillow
                </p>
              </div>
              <div className="flex items-end pb-5">
                <Button onClick={handleSearch} disabled={isLoading || !zillowUrl}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Fetch Property
                </Button>
              </div>
            </div>
          ) : searchType === 'location' ? (
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label>City, State or Zip Code</Label>
                <Input
                  placeholder="e.g., Columbus, OH or 43215"
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
                  placeholder="e.g., 123 Main St, Columbus, OH 43215"
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
                        {result.photo_url ? (
                          <img
                            src={result.photo_url}
                            alt={result.address}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Home className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{result.address}</h4>
                          {result.mls_number && (
                            <Badge variant="outline" className="font-mono text-xs">
                              ZPID: {result.mls_number}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {result.city}, {result.state} {result.zip}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          <span className="font-semibold text-lg">
                            ${result.list_price?.toLocaleString() || 'N/A'}
                          </span>
                          <span className="text-muted-foreground">
                            {result.bedrooms || '?'} bed | {result.bathrooms || '?'} bath | {result.sqft?.toLocaleString() || '?'} sqft
                          </span>
                          {result.year_built > 0 && (
                            <span className="text-muted-foreground">
                              Built {result.year_built}
                            </span>
                          )}
                          {result.days_on_market > 0 && (
                            <span className="text-muted-foreground">
                              {result.days_on_market} days on Zillow
                            </span>
                          )}
                        </div>
                        {(result.zestimate || result.rent_estimate) && (
                          <div className="mt-1 flex gap-4 text-sm">
                            {result.zestimate && (
                              <span className="text-blue-600">
                                Zestimate: ${result.zestimate.toLocaleString()}
                              </span>
                            )}
                            {result.rent_estimate && (
                              <span className="text-green-600">
                                Rent Est: ${result.rent_estimate.toLocaleString()}/mo
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`https://www.zillow.com/homes/${result.mls_number}_zpid/`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Zillow
                        </a>
                      </Button>
                      <Button size="sm" onClick={() => handleAddProspect(result)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Prospects
                      </Button>
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
