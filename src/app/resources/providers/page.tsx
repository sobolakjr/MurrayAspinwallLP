import { getServiceProviders } from '@/lib/database';
import { ProvidersClient } from './providers-client';

export const dynamic = 'force-dynamic';

export default async function ProvidersPage() {
  const providers = await getServiceProviders();

  return <ProvidersClient initialProviders={providers} />;
}
