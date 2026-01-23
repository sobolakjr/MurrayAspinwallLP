import { getProperties, getBankAccounts } from '@/lib/database';
import { NewTransactionClient } from './new-transaction-client';

export const dynamic = 'force-dynamic';

export default async function NewTransactionPage() {
  const [properties, bankAccounts] = await Promise.all([
    getProperties(),
    getBankAccounts(),
  ]);

  return <NewTransactionClient properties={properties} bankAccounts={bankAccounts} />;
}
