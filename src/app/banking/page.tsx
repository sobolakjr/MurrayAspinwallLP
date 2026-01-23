import { getTransactions, getProperties, getBankAccounts } from '@/lib/database';
import { BankingClient } from './banking-client';

export const dynamic = 'force-dynamic';

export default async function BankingPage() {
  const [transactions, properties, bankAccounts] = await Promise.all([
    getTransactions(),
    getProperties(),
    getBankAccounts(),
  ]);

  return (
    <BankingClient
      initialTransactions={transactions}
      properties={properties}
      bankAccounts={bankAccounts}
    />
  );
}
