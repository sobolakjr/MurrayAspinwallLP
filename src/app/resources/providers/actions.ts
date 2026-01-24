'use server';

import {
  createServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
} from '@/lib/database';
import { revalidatePath } from 'next/cache';
import type { ServiceProvider, ServiceProviderType } from '@/types';

interface CreateProviderInput {
  name: string;
  type: ServiceProviderType;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_name: string | null;
  rating: number | null;
  total_spend: number | null;
  notes: string | null;
}

export async function createServiceProviderAction(
  input: CreateProviderInput
): Promise<{ success: boolean; provider?: ServiceProvider; error?: string }> {
  try {
    const provider = await createServiceProvider(input);

    if (!provider) {
      return { success: false, error: 'Failed to create service provider' };
    }

    revalidatePath('/resources/providers');

    return { success: true, provider };
  } catch (error) {
    console.error('Error creating service provider:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateServiceProviderAction(
  id: string,
  updates: Partial<ServiceProvider>
): Promise<{ success: boolean; provider?: ServiceProvider; error?: string }> {
  try {
    const provider = await updateServiceProvider(id, updates);

    if (!provider) {
      return { success: false, error: 'Failed to update service provider' };
    }

    revalidatePath('/resources/providers');

    return { success: true, provider };
  } catch (error) {
    console.error('Error updating service provider:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteServiceProviderAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await deleteServiceProvider(id);

    if (!success) {
      return { success: false, error: 'Failed to delete service provider' };
    }

    revalidatePath('/resources/providers');

    return { success: true };
  } catch (error) {
    console.error('Error deleting service provider:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
