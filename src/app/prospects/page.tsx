import { getProspects } from '@/lib/database';
import { ProspectsClient } from './prospects-client';

export const dynamic = 'force-dynamic';

export default async function ProspectsPage() {
  const prospects = await getProspects();

  return <ProspectsClient initialProspects={prospects} />;
}
