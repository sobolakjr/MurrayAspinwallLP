'use server';

import { createProperty, updateProperty, deleteProperty } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import type { Property } from '@/types';

interface PropertyInput {
  address: string;
  city: string;
  state: string;
  zip: string;
  purchase_price?: number;
  purchase_date?: string;
  current_value?: number;
  mortgage_balance?: number;
  mortgage_rate?: number;
  mortgage_payment?: number;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number;
  status?: string;
  monthly_rent?: number;
  avg_nightly_rent?: number;
  sold_price?: number;
  sold_date?: string;
  notes?: string;
}

export async function createPropertyAction(input: PropertyInput): Promise<{ success: boolean; property?: Property; error?: string }> {
  try {
    const property = await createProperty({
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      purchase_price: input.purchase_price || null,
      purchase_date: input.purchase_date || null,
      current_value: input.current_value || null,
      mortgage_balance: input.mortgage_balance || null,
      mortgage_rate: input.mortgage_rate || null,
      mortgage_payment: input.mortgage_payment || null,
      property_type: (input.property_type as Property['property_type']) || 'single_family',
      bedrooms: input.bedrooms || null,
      bathrooms: input.bathrooms || null,
      sqft: input.sqft || null,
      lot_size: input.lot_size || null,
      year_built: input.year_built || null,
      status: (input.status as Property['status']) || 'own',
      monthly_rent: input.monthly_rent || null,
      avg_nightly_rent: input.avg_nightly_rent || null,
      sold_price: input.sold_price || null,
      sold_date: input.sold_date || null,
      notes: input.notes || null,
    });

    if (!property) {
      return { success: false, error: 'Failed to create property' };
    }

    revalidatePath('/properties');
    revalidatePath('/');

    return { success: true, property };
  } catch (error) {
    console.error('Error creating property:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updatePropertyAction(id: string, input: Partial<PropertyInput>): Promise<{ success: boolean; property?: Property; error?: string }> {
  try {
    const property = await updateProperty(id, input as Partial<Property>);

    if (!property) {
      return { success: false, error: 'Failed to update property' };
    }

    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);
    revalidatePath('/');

    return { success: true, property };
  } catch (error) {
    console.error('Error updating property:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deletePropertyAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await deleteProperty(id);

    if (!success) {
      return { success: false, error: 'Failed to delete property' };
    }

    revalidatePath('/properties');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting property:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
