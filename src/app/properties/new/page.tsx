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
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { createPropertyAction } from '../actions';

export default function NewPropertyPage() {
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
    purchase_price: '',
    purchase_date: '',
    current_value: '',
    mortgage_balance: '',
    mortgage_rate: '',
    mortgage_payment: '',
    status: 'rented',
    monthly_rent: '',
    avg_nightly_rent: '',
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
      const result = await createPropertyAction({
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        sqft: formData.sqft ? parseInt(formData.sqft) : undefined,
        lot_size: formData.lot_size ? parseFloat(formData.lot_size) : undefined,
        year_built: formData.year_built ? parseInt(formData.year_built) : undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        purchase_date: formData.purchase_date || undefined,
        current_value: formData.current_value ? parseFloat(formData.current_value) : undefined,
        mortgage_balance: formData.mortgage_balance ? parseFloat(formData.mortgage_balance) : undefined,
        mortgage_rate: formData.mortgage_rate ? parseFloat(formData.mortgage_rate) : undefined,
        mortgage_payment: formData.mortgage_payment ? parseFloat(formData.mortgage_payment) : undefined,
        status: formData.status,
        monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : undefined,
        avg_nightly_rent: formData.avg_nightly_rent ? parseFloat(formData.avg_nightly_rent) : undefined,
        notes: formData.notes || undefined,
      });

      if (result.success && result.property) {
        router.push(`/properties/${result.property.id}`);
      } else {
        setError(result.error || 'Failed to create property');
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Property</h1>
          <p className="text-muted-foreground">Add a new property to your portfolio</p>
        </div>
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
              <CardDescription>Basic information about the property</CardDescription>
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="listed_rent">Listed (Rent)</SelectItem>
                      <SelectItem value="listed_sell">Listed (Sell)</SelectItem>
                      <SelectItem value="reno_changeover">Reno/Changeover</SelectItem>
                      <SelectItem value="listed_str">Listed (ST Rental)</SelectItem>
                    </SelectContent>
                  </Select>
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

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Purchase and mortgage information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => handleChange('purchase_price', e.target.value)}
                    placeholder="250000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleChange('purchase_date', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_value">Current Value ($)</Label>
                <Input
                  id="current_value"
                  type="number"
                  value={formData.current_value}
                  onChange={(e) => handleChange('current_value', e.target.value)}
                  placeholder="275000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mortgage_balance">Mortgage Balance ($)</Label>
                <Input
                  id="mortgage_balance"
                  type="number"
                  value={formData.mortgage_balance}
                  onChange={(e) => handleChange('mortgage_balance', e.target.value)}
                  placeholder="200000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mortgage_rate">Interest Rate (%)</Label>
                  <Input
                    id="mortgage_rate"
                    type="number"
                    step="0.01"
                    value={formData.mortgage_rate}
                    onChange={(e) => handleChange('mortgage_rate', e.target.value)}
                    placeholder="6.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mortgage_payment">Monthly Payment ($)</Label>
                  <Input
                    id="mortgage_payment"
                    type="number"
                    value={formData.mortgage_payment}
                    onChange={(e) => handleChange('mortgage_payment', e.target.value)}
                    placeholder="1500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_rent">Monthly Rent ($)</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) => handleChange('monthly_rent', e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avg_nightly_rent">Avg Nightly Rent ($)</Label>
                  <Input
                    id="avg_nightly_rent"
                    type="number"
                    value={formData.avg_nightly_rent}
                    onChange={(e) => handleChange('avg_nightly_rent', e.target.value)}
                    placeholder="150"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Add any notes about this property..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/properties">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Property
          </Button>
        </div>
      </form>
    </div>
  );
}
