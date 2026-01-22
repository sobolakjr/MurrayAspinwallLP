import { notFound } from 'next/navigation';
import { getProperty, getTenantsByProperty, getMaintenanceByProperty, getTransactions } from '@/lib/database';
import { PropertyDetailClient } from './property-detail-client';

export const dynamic = 'force-dynamic';

interface PropertyDetailPageProps {
  params: { id: string };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const [property, tenants, maintenance, transactions] = await Promise.all([
    getProperty(params.id),
    getTenantsByProperty(params.id),
    getMaintenanceByProperty(params.id),
    getTransactions(params.id),
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
    />
  );
}
