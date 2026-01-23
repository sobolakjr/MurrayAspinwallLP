import { getProperties, getProspects } from '@/lib/database';
import { DocumentsClient } from './documents-client';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const [properties, prospects] = await Promise.all([
    getProperties(),
    getProspects(),
  ]);

  return <DocumentsClient properties={properties} prospects={prospects} />;
}
