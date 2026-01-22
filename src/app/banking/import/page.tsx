import { getProperties } from '@/lib/database';
import { ImportClient } from './import-client';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const properties = await getProperties();

  return <ImportClient properties={properties} />;
}
