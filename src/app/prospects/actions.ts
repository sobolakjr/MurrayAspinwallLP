'use server';

import { createProspect, updateProspect, deleteProspect } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import type { Prospect } from '@/types';

interface CreateProspectInput {
  mls_number: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  list_price: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lot_size: number | null;
  year_built: number;
  days_on_market: number;
  api_data?: Record<string, unknown>;
}

export async function addProspectAction(input: CreateProspectInput): Promise<{ success: boolean; prospect?: Prospect; error?: string }> {
  try {
    const prospect = await createProspect({
      mls_number: input.mls_number,
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      list_price: input.list_price,
      property_type: input.property_type as Prospect['property_type'],
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      sqft: input.sqft,
      lot_size: input.lot_size,
      year_built: input.year_built,
      days_on_market: input.days_on_market,
      status: 'researching',
      api_data: input.api_data || null,
      notes: null,
    });

    if (!prospect) {
      return { success: false, error: 'Failed to create prospect' };
    }

    revalidatePath('/prospects');
    revalidatePath('/');

    return { success: true, prospect };
  } catch (error) {
    console.error('Error creating prospect:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateProspectAction(
  id: string,
  updates: Partial<Prospect>
): Promise<{ success: boolean; prospect?: Prospect; error?: string }> {
  try {
    const prospect = await updateProspect(id, updates);

    if (!prospect) {
      return { success: false, error: 'Failed to update prospect' };
    }

    revalidatePath('/prospects');
    revalidatePath(`/prospects/${id}`);
    revalidatePath('/');

    return { success: true, prospect };
  } catch (error) {
    console.error('Error updating prospect:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteProspectAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await deleteProspect(id);

    if (!success) {
      return { success: false, error: 'Failed to delete prospect' };
    }

    revalidatePath('/prospects');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting prospect:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
