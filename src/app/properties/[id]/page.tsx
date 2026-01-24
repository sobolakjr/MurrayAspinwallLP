import { notFound } from 'next/navigation';
import { getProperty, getTenantsByProperty, getMaintenanceByProperty, getTransactions, getNeighborsByProperty, getCodesByProperty } from '@/lib/database';
import { PropertyDetailClient } from './property-detail-client';

export const dynamic = 'force-dynamic';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const [property, tenants, maintenance, transactions, neighbors, codes] = await Promise.all([
    getProperty(id),
    getTenantsByProperty(id),
    getMaintenanceByProperty(id),
    getTransactions(id),
    getNeighborsByProperty(id),
    getCodesByProperty(id),
  ]);

  if (!property) {
    notFound();
  }

  return (
    <PropertyDetailClient
      property={property}
      tenants={tenants}
      maintenance={maintenance}
      transactions={transactions}
      neighbors={neighbors}
      codes={codes}
    />
  );
}
