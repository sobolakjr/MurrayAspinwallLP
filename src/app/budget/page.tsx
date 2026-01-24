import { getProperties, getTransactions } from '@/lib/database';
import { BudgetClient } from './budget-client';

export const dynamic = 'force-dynamic';

export default async function BudgetPage() {
  const [properties, transactions] = await Promise.all([
    getProperties(),
    getTransactions(),
  ]);

  return (
    <BudgetClient
      properties={properties}
      transactions={transactions}
    />
  );
}
