import { getProperties, getBankAccounts } from '@/lib/database';
import { ImportClient } from './import-client';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const [properties, bankAccounts] = await Promise.all([
    getProperties(),
    getBankAccounts(),
  ]);

  return <ImportClient properties={properties} bankAccounts={bankAccounts} />;
}
