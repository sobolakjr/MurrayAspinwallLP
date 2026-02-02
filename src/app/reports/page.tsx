import { getProperties, getTransactions } from '@/lib/database';
import { ReportsClient } from './reports-client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [properties, transactions] = await Promise.all([
    getProperties(),
    getTransactions(),
  ]);

  return (
    <ReportsClient
      properties={properties}
      transactions={transactions}
    />
  );
}
