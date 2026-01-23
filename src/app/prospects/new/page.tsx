'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, Search } from 'lucide-react';
import { addProspectAction } from '../actions';

export default function NewProspectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    property_type: 'single_family',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    lot_size: '',
    year_built: '',
    list_price: '',
    days_on_market: '',
    mls_number: '',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addProspectAction({
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : 0,
        sqft: formData.sqft ? parseInt(formData.sqft) : 0,
        lot_size: formData.lot_size ? parseFloat(formData.lot_size) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : 0,
        list_price: formData.list_price ? parseFloat(formData.list_price) : 0,
        days_on_market: formData.days_on_market ? parseInt(formData.days_on_market) : 0,
        mls_number: formData.mls_number || '',
      });

      if (result.success && result.prospect) {
        router.push(`/prospects/${result.prospect.id}`);
      } else {
        setError(result.error || 'Failed to create prospect');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/prospects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Prospect</h1>
            <p className="text-muted-foreground">Add a property you're researching</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/prospects/search">
            <Search className="mr-2 h-4 w-4" />
            Search Zillow Instead
          </Link>
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>Basic information about the prospect</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Columbus"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="OH"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">Zip *</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleChange('zip', e.target.value)}
                    placeholder="43215"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_type">Property Type</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => handleChange('property_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="multi_family">Multi Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mls_number">MLS # / ZPID</Label>
                  <Input
                    id="mls_number"
                    value={formData.mls_number}
                    onChange={(e) => handleChange('mls_number', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange('bathrooms', e.target.value)}
                    placeholder="2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sqft">Square Feet</Label>
                  <Input
                    id="sqft"
                    type="number"
                    value={formData.sqft}
                    onChange={(e) => handleChange('sqft', e.target.value)}
                    placeholder="1500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lot_size">Lot Size (acres)</Label>
                  <Input
                    id="lot_size"
                    type="number"
                    step="0.01"
                    value={formData.lot_size}
                    onChange={(e) => handleChange('lot_size', e.target.value)}
                    placeholder="0.25"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year_built">Year Built</Label>
                <Input
                  id="year_built"
                  type="number"
                  value={formData.year_built}
                  onChange={(e) => handleChange('year_built', e.target.value)}
                  placeholder="1990"
                />
              </div>
            </CardContent>
          </Card>

          {/* Listing Details */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
              <CardDescription>Pricing and market information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="list_price">List Price ($) *</Label>
                <Input
                  id="list_price"
                  type="number"
                  value={formData.list_price}
                  onChange={(e) => handleChange('list_price', e.target.value)}
                  placeholder="250000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="days_on_market">Days on Market</Label>
                <Input
                  id="days_on_market"
                  type="number"
                  value={formData.days_on_market}
                  onChange={(e) => handleChange('days_on_market', e.target.value)}
                  placeholder="14"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={6}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Add any notes about this prospect..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/prospects">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Prospect
          </Button>
        </div>
      </form>
    </div>
  );
}
