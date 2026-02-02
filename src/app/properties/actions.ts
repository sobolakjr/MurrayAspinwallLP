'use server';

import {
  createProperty,
  updateProperty,
  deleteProperty,
  createNeighbor,
  updateNeighbor,
  deleteNeighbor,
  createPropertyCode,
  updatePropertyCode,
  deletePropertyCode,
  createTenant,
  updateTenant,
  deleteTenant,
} from '@/lib/database';
import { revalidatePath } from 'next/cache';
import type { Property, Neighbor, PropertyCode, Tenant } from '@/types';

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
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { success: false, error: message };
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

// ============ NEIGHBORS ============

interface NeighborInput {
  property_id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  relationship?: string;
  notes?: string;
}

export async function createNeighborAction(
  input: NeighborInput
): Promise<{ success: boolean; neighbor?: Neighbor; error?: string }> {
  try {
    const neighbor = await createNeighbor({
      property_id: input.property_id,
      name: input.name,
      address: input.address || null,
      phone: input.phone || null,
      email: input.email || null,
      relationship: input.relationship || null,
      notes: input.notes || null,
    });

    if (!neighbor) {
      return { success: false, error: 'Failed to create neighbor' };
    }

    revalidatePath(`/properties/${input.property_id}`);

    return { success: true, neighbor };
  } catch (error) {
    console.error('Error creating neighbor:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateNeighborAction(
  id: string,
  updates: Partial<NeighborInput>
): Promise<{ success: boolean; neighbor?: Neighbor; error?: string }> {
  try {
    const neighbor = await updateNeighbor(id, updates as Partial<Neighbor>);

    if (!neighbor) {
      return { success: false, error: 'Failed to update neighbor' };
    }

    if (neighbor.property_id) {
      revalidatePath(`/properties/${neighbor.property_id}`);
    }

    return { success: true, neighbor };
  } catch (error) {
    console.error('Error updating neighbor:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteNeighborAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await deleteNeighbor(id);

    if (!success) {
      return { success: false, error: 'Failed to delete neighbor' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting neighbor:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============ PROPERTY CODES ============

interface PropertyCodeInput {
  property_id: string;
  name: string;
  code_type?: PropertyCode['code_type'];
  value?: string;
  holder_name?: string;
  holder_phone?: string;
  notes?: string;
}

export async function createPropertyCodeAction(
  input: PropertyCodeInput
): Promise<{ success: boolean; code?: PropertyCode; error?: string }> {
  try {
    const code = await createPropertyCode({
      property_id: input.property_id,
      name: input.name,
      code_type: input.code_type || 'lock_code',
      value: input.value || null,
      holder_name: input.holder_name || null,
      holder_phone: input.holder_phone || null,
      notes: input.notes || null,
    });

    if (!code) {
      return { success: false, error: 'Failed to create code' };
    }

    revalidatePath(`/properties/${input.property_id}`);

    return { success: true, code };
  } catch (error) {
    console.error('Error creating property code:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updatePropertyCodeAction(
  id: string,
  updates: Partial<PropertyCodeInput>
): Promise<{ success: boolean; code?: PropertyCode; error?: string }> {
  try {
    const code = await updatePropertyCode(id, updates as Partial<PropertyCode>);

    if (!code) {
      return { success: false, error: 'Failed to update code' };
    }

    if (code.property_id) {
      revalidatePath(`/properties/${code.property_id}`);
    }

    return { success: true, code };
  } catch (error) {
    console.error('Error updating property code:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deletePropertyCodeAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await deletePropertyCode(id);

    if (!success) {
      return { success: false, error: 'Failed to delete code' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting property code:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============ TENANTS ============

interface TenantInput {
  property_id: string;
  name: string;
  email?: string;
  phone?: string;
  lease_start?: string;
  lease_end?: string;
  rent_amount?: number;
  security_deposit?: number;
  status?: Tenant['status'];
  notes?: string;
}

export async function createTenantAction(
  input: TenantInput
): Promise<{ success: boolean; tenant?: Tenant; error?: string }> {
  try {
    const tenant = await createTenant({
      property_id: input.property_id,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      lease_start: input.lease_start || null,
      lease_end: input.lease_end || null,
      rent_amount: input.rent_amount || null,
      security_deposit: input.security_deposit || null,
      status: input.status || 'active',
      notes: input.notes || null,
    });

    if (!tenant) {
      return { success: false, error: 'Failed to create tenant' };
    }

    revalidatePath(`/properties/${input.property_id}`);

    return { success: true, tenant };
  } catch (error) {
    console.error('Error creating tenant:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateTenantAction(
  id: string,
  updates: Partial<TenantInput>
): Promise<{ success: boolean; tenant?: Tenant; error?: string }> {
  try {
    const tenant = await updateTenant(id, updates as Partial<Tenant>);

    if (!tenant) {
      return { success: false, error: 'Failed to update tenant' };
    }

    if (tenant.property_id) {
      revalidatePath(`/properties/${tenant.property_id}`);
    }

    return { success: true, tenant };
  } catch (error) {
    console.error('Error updating tenant:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

export async function deleteTenantAction(
  id: string,
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteTenant(id);

    revalidatePath(`/properties/${propertyId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting tenant:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}
