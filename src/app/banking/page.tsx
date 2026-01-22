import { getTransactions, getProperties } from '@/lib/database';
import { BankingClient } from './banking-client';

export const dynamic = 'force-dynamic';

export default async function BankingPage() {
  const [transactions, properties] = await Promise.all([
    getTransactions(),
    getProperties(),
  ]);

  return (
    <BankingClient
      initialTransactions={transactions}
      properties={properties}
    />
  );
}
