import { getProperties, getProspects, getDocuments } from '@/lib/database';
import { DocumentsClient } from './documents-client';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const [properties, prospects, documents] = await Promise.all([
    getProperties(),
    getProspects(),
    getDocuments(),
  ]);

  return (
    <DocumentsClient
      properties={properties}
      prospects={prospects}
      initialDocuments={documents}
    />
  );
}
