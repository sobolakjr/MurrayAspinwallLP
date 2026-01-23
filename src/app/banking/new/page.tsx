import { getProperties } from '@/lib/database';
import { NewTransactionClient } from './new-transaction-client';

export const dynamic = 'force-dynamic';

export default async function NewTransactionPage() {
  const properties = await getProperties();

  return <NewTransactionClient properties={properties} />;
}
