'use server';

import { createTransaction, createTransactions, createBankAccount, updateBankAccount, deleteBankAccount } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import type { Transaction, BankAccount, BankAccountType } from '@/types';

interface TransactionInput {
  property_id: string | null;
  bank_account_id?: string | null;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  vendor?: string;
}

interface BankAccountInput {
  name: string;
  institution: string | null;
  account_type: BankAccountType;
  account_number_last4: string | null;
  current_balance: number | null;
  is_default: boolean;
  notes: string | null;
}

export async function createBankAccountAction(
  input: BankAccountInput
): Promise<{ success: boolean; account?: BankAccount; error?: string }> {
  try {
    const account = await createBankAccount(input);

    if (!account) {
      return { success: false, error: 'Failed to create bank account' };
    }

    revalidatePath('/banking');

    return { success: true, account };
  } catch (error) {
    console.error('Error creating bank account:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteBankAccountAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await deleteBankAccount(id);

    if (!success) {
      return { success: false, error: 'Failed to delete bank account' };
    }

    revalidatePath('/banking');

    return { success: true };
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateBankAccountAction(
  id: string,
  input: Partial<BankAccountInput>
): Promise<{ success: boolean; account?: BankAccount; error?: string }> {
  try {
    const account = await updateBankAccount(id, input);

    if (!account) {
      return { success: false, error: 'Failed to update bank account' };
    }

    revalidatePath('/banking');

    return { success: true, account };
  } catch (error) {
    console.error('Error updating bank account:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function createTransactionAction(
  input: TransactionInput
): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  try {
    const transaction = await createTransaction({
      property_id: input.property_id === 'none' ? null : input.property_id,
      bank_account_id: input.bank_account_id === 'none' ? null : (input.bank_account_id || null),
      date: input.date,
      amount: input.amount,
      type: input.type,
      category: input.category,
      description: input.description,
      vendor: input.vendor || null,
      imported_from: 'manual',
      external_id: null,
    });

    if (!transaction) {
      return { success: false, error: 'Failed to create transaction' };
    }

    revalidatePath('/banking');
    revalidatePath('/');

    return { success: true, transaction };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

interface ImportTransactionInput {
  property_id: string | null;
  bank_account_id?: string | null;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  vendor?: string;
}

export async function importTransactionsAction(
  transactions: ImportTransactionInput[],
  bankAccountId?: string | null
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const transactionsToCreate = transactions.map((tx) => ({
      property_id: tx.property_id === 'none' ? null : tx.property_id,
      bank_account_id: bankAccountId === 'none' ? null : (bankAccountId || null),
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
