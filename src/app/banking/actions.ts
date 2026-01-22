'use server';

import { createTransactions } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import type { Transaction } from '@/types';

interface ImportTransactionInput {
  property_id: string | null;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  vendor?: string;
}

export async function importTransactionsAction(
  transactions: ImportTransactionInput[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const transactionsToCreate = transactions.map((tx) => ({
      property_id: tx.property_id === 'none' ? null : tx.property_id,
      date: tx.date,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      vendor: tx.vendor || null,
      imported_from: 'csv' as const,
      external_id: null,
    }));

    const created = await createTransactions(transactionsToCreate);

    if (!created || created.length === 0) {
      return { success: false, error: 'Failed to import transactions' };
    }

    revalidatePath('/banking');
    revalidatePath('/');

    return { success: true, count: created.length };
  } catch (error) {
    console.error('Error importing transactions:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
