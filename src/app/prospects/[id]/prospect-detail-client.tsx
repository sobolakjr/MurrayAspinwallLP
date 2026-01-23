'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Home,
  MapPin,
  Calendar,
  DollarSign,
  Calculator,
  Trash2,
  Save,
  Loader2,
  Database,
  Building,
  User,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { Prospect, ProspectStatus } from '@/types';
import { updateProspectAction, deleteProspectAction, refreshApiDataAction } from '../actions';

interface ProspectDetailClientProps {
  prospect: Prospect;
}

const statusColors: Record<ProspectStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  researching: 'secondary',
  offer_made: 'default',
  passed: 'outline',
  won: 'default',
  lost: 'destructive',
};

const statusLabels: Record<ProspectStatus, string> = {
  researching: 'Researching',
  offer_made: 'Offer Made',
  passed: 'Passed',
  won: 'Won',
  lost: 'Lost',
};

export function ProspectDetailClient({ prospect }: ProspectDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ProspectStatus>(prospect.status);
  const [notes, setNotes] = useState(prospect.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshApiData = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshApiDataAction(
        prospect.id,
        prospect.address,
        prospect.city,
        prospect.state,
        prospect.zip
      );
      if (result.success) {
        router.refresh();
      } else {
        console.error('Failed to refresh:', result.error);
        alert(result.error || 'Failed to refresh API data');
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      alert('Failed to refresh API data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateProspectAction(prospect.id, { status, notes });
      if (!result.success) {
        console.error('Failed to save:', result.error);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this prospect?')) return;

    setIsDeleting(true);
    try {
      const result = await deleteProspectAction(prospect.id);
      if (result.success) {
        router.push('/prospects');
      } else {
        console.error('Failed to delete:', result.error);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPropertyType = (type: string | null): string => {
    if (!type) return 'Unknown';
    const typeMap: Record<string, string> = {
      'single_family': 'Single Family',
      'multi_family': 'Multi Family',
      'condo': 'Condo',
      'townhouse': 'Townhouse',
      'duplex': 'Duplex',
      'triplex': 'Triplex',
      'fourplex': 'Fourplex',
    };
    return typeMap[type] || type;
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
            <h1 className="text-3xl font-bold tracking-tight">{prospect.address}</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {prospect.city}, {prospect.state} {prospect.zip}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshApiData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {prospect.api_data ? 'Refresh Data' : 'Fetch API Data'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/calculator?prospect=${prospect.id}`}>
              <Calculator className="mr-2 h-4 w-4" />
              Run Proforma
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Property Type</p>
                <p className="font-medium">{formatPropertyType(prospect.property_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property ID</p>
                <p className="font-medium font-mono text-sm">{prospect.mls_number || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bedrooms</p>
                <p className="font-medium">{prospect.bedrooms || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bathrooms</p>
                <p className="font-medium">{prospect.bathrooms || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sqft</p>
                <p className="font-medium">{prospect.sqft?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Year Built</p>
                <p className="font-medium">{prospect.year_built || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lot Size</p>
                <p className="font-medium">
                  {prospect.lot_size ? `${prospect.lot_size.toLocaleString()} sqft` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listing Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Listing Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">List Price</p>
              <p className="text-3xl font-bold">
                ${Number(prospect.list_price || 0).toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Days on Market</p>
                <p className="font-medium">{prospect.days_on_market || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price per Sqft</p>
                <p className="font-medium">
                  {prospect.sqft && prospect.list_price
                    ? `$${Math.round(Number(prospect.list_price) / prospect.sqft).toLocaleString()}`
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Added</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(prospect.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status & Notes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Status & Notes</CardTitle>
            <CardDescription>Update the prospect status and add notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Status</p>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ProspectStatus)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="researching">Researching</SelectItem>
                    <SelectItem value="offer_made">Offer Made</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant={statusColors[status]} className="mt-6">
                {statusLabels[status]}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this prospect..."
                rows={4}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* API Data - Only show if available */}
        {prospect.api_data && (
          <>
            {/* Features */}
            {(prospect.api_data as any).features && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Property Features
                  </CardTitle>
                  <CardDescription>Details from property records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {(prospect.api_data as any).features.architectureType && (
                      <div>
                        <p className="text-muted-foreground">Architecture</p>
                        <p className="font-medium">{(prospect.api_data as any).features.architectureType}</p>
                      </div>
                    )}
                    {(prospect.api_data as any).features.exteriorType && (
                      <div>
                        <p className="text-muted-foreground">Exterior</p>
                        <p className="font-medium">{(prospect.api_data as any).features.exteriorType}</p>
                      </div>
                    )}
                    {(prospect.api_data as any).features.roofType && (
                      <div>
                        <p className="text-muted-foreground">Roof</p>
                        <p className="font-medium">{(prospect.api_data as any).features.roofType}</p>
                      </div>
                    )}
                    {(prospect.api_data as any).features.floorCount && (
                      <div>
                        <p className="text-muted-foreground">Floors</p>
                        <p className="font-medium">{(prospect.api_data as any).features.floorCount}</p>
                      </div>
                    )}
                    {(prospect.api_data as any).features.roomCount && (
                      <div>
                        <p className="text-muted-foreground">Total Rooms</p>
                        <p className="font-medium">{(prospect.api_data as any).features.roomCount}</p>
                      </div>
                    )}
                    {(prospect.api_data as any).features.garage !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Garage</p>
                        <p className="font-medium">
                          {(prospect.api_data as any).features.garage
                            ? `Yes${(prospect.api_data as any).features.garageSpaces ? ` (${(prospect.api_data as any).features.garageSpaces} spaces)` : ''}`
                            : 'No'}
                        </p>
                      </div>
                    )}
                    {(prospect.api_data as any).features.heatingType && (
                      <div>
                        <p className="text-muted-foreground">Heating</p>
                        <p className="font-medium">{(prospect.api_data as any).features.heatingType}</p>
                      </div>
                    )}
                    {(prospect.api_data as any).features.coolingType && (
                      <div>
                        <p className="text-muted-foreground">Cooling</p>
                        <p className="font-medium">{(prospect.api_data as any).features.coolingType}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Owner Info */}
            {(prospect.api_data as any).owner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Owner Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(prospect.api_data as any).owner.names && (
                    <div>
                      <p className="text-sm text-muted-foreground">Owner Name(s)</p>
                      <p className="font-medium">{(prospect.api_data as any).owner.names.join(', ')}</p>
                    </div>
                  )}
                  {(prospect.api_data as any).owner.type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Owner Type</p>
                      <p className="font-medium">{(prospect.api_data as any).owner.type}</p>
                    </div>
                  )}
                  {(prospect.api_data as any).owner.mailingAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground">Mailing Address</p>
                      <p className="font-medium">{(prospect.api_data as any).owner.mailingAddress.formattedAddress}</p>
                    </div>
                  )}
                  {(prospect.api_data as any).ownerOccupied !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Owner Occupied</p>
                      <Badge variant={(prospect.api_data as any).ownerOccupied ? 'default' : 'secondary'}>
                        {(prospect.api_data as any).ownerOccupied ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tax & Assessment Info */}
            {((prospect.api_data as any).taxAssessments || (prospect.api_data as any).propertyTaxes) && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Tax & Assessment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Year</th>
                          <th className="text-right py-2 font-medium">Assessed Value</th>
                          <th className="text-right py-2 font-medium">Land</th>
                          <th className="text-right py-2 font-medium">Improvements</th>
                          <th className="text-right py-2 font-medium">Property Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys((prospect.api_data as any).taxAssessments || {})
                          .sort((a, b) => Number(b) - Number(a))
                          .slice(0, 5)
                          .map((year) => {
                            const assessment = (prospect.api_data as any).taxAssessments?.[year];
                            const tax = (prospect.api_data as any).propertyTaxes?.[year];
                            return (
                              <tr key={year} className="border-b">
                                <td className="py-2">{year}</td>
                                <td className="text-right py-2">
                                  {assessment?.value ? `$${assessment.value.toLocaleString()}` : '-'}
                                </td>
                                <td className="text-right py-2">
                                  {assessment?.land ? `$${assessment.land.toLocaleString()}` : '-'}
                                </td>
                                <td className="text-right py-2">
                                  {assessment?.improvements ? `$${assessment.improvements.toLocaleString()}` : '-'}
                                </td>
                                <td className="text-right py-2">
                                  {tax?.total ? `$${tax.total.toLocaleString()}` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sale History */}
            {(prospect.api_data as any).history && Object.keys((prospect.api_data as any).history).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Sale History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries((prospect.api_data as any).history)
                      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                      .map(([date, event]: [string, any]) => (
                        <div key={date} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{event.event}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.date).toLocaleDateString()}
                            </p>
                          </div>
                          {event.price && (
                            <p className="font-semibold">${event.price.toLocaleString()}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location & Legal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Additional Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {(prospect.api_data as any).county && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">County</p>
                      <p className="font-medium">{(prospect.api_data as any).county}</p>
                    </div>
                    {(prospect.api_data as any).countyFips && (
                      <div>
                        <p className="text-muted-foreground">County FIPS</p>
                        <p className="font-medium font-mono">{(prospect.api_data as any).countyFips}</p>
                      </div>
                    )}
                  </div>
                )}
                {((prospect.api_data as any).latitude || (prospect.api_data as any).longitude) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Latitude</p>
                      <p className="font-medium font-mono">{(prospect.api_data as any).latitude}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Longitude</p>
                      <p className="font-medium font-mono">{(prospect.api_data as any).longitude}</p>
                    </div>
                  </div>
                )}
                {(prospect.api_data as any).assessorID && (
                  <div>
                    <p className="text-muted-foreground">Assessor ID</p>
                    <p className="font-medium font-mono">{(prospect.api_data as any).assessorID}</p>
                  </div>
                )}
                {(prospect.api_data as any).legalDescription && (
                  <div>
                    <p className="text-muted-foreground">Legal Description</p>
                    <p className="font-medium text-xs">{(prospect.api_data as any).legalDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
