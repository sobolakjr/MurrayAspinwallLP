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
} from 'lucide-react';
import type { Prospect, ProspectStatus } from '@/types';
import { updateProspectAction, deleteProspectAction } from '../actions';

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
      </div>
    </div>
  );
}
