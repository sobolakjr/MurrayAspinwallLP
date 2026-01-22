import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/database';
import { PropertyEditClient } from './property-edit-client';

export const dynamic = 'force-dynamic';

interface PropertyEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyEditPage({ params }: PropertyEditPageProps) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  return <PropertyEditClient property={property} />;
}
