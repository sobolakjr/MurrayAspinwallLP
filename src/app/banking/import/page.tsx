import { getProperties, getBankAccounts, getTransactions } from '@/lib/database';
import { ImportClient } from './import-client';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const [properties, bankAccounts, existingTransactions] = await Promise.all([
    getProperties(),
    getBankAccounts(),
    getTransactions(),
  ]);

  return (
    <ImportClient
      properties={properties}
      bankAccounts={bankAccounts}
      existingTransactions={existingTransactions}
    />
  );
}
