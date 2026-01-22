import { getProperties } from '@/lib/database';
import { PropertiesClient } from './properties-client';

export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  const properties = await getProperties();

  return <PropertiesClient initialProperties={properties} />;
}
