'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    }
  );
}

export interface NotificationPreferences {
  id?: string;
  lease_expiration_reminders: boolean;
  maintenance_alerts: boolean;
  payment_reminders: boolean;
  notification_email: string;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .single();

  if (error) {
    // If table doesn't exist or no data, return defaults
    if (error.code === 'PGRST116' || error.code === '42P01') {
      return null;
    }
    console.error('Error fetching preferences:', error);
    return null;
  }

  return data;
}

export async function saveNotificationPreferences(
  preferences: Omit<NotificationPreferences, 'id'>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabase();

  // Check if preferences already exist
  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('id')
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('notification_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error: error.message };
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from('notification_preferences')
      .insert({
        ...preferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error inserting preferences:', error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath('/settings');
  return { success: true };
}

export interface UserProfile {
  name: string;
  email: string;
  company: string;
}

export interface DefaultValues {
  vacancy_rate: number;
  mgmt_fee: number;
  maintenance_reserve: number;
  appreciation_rate: number;
  rent_growth_rate: number;
  interest_rate: number;
}

export async function saveUserProfile(
  profile: UserProfile
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabase();

  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .single();

  const profileData = {
    name: profile.name,
    email: profile.email,
    company: profile.company,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from('user_settings')
      .update(profileData)
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('user_settings')
      .insert({
        ...profileData,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error inserting profile:', error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('user_settings')
    .select('name, email, company')
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function saveDefaultValues(
  values: DefaultValues
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabase();

  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .single();

  const valueData = {
    default_vacancy_rate: values.vacancy_rate,
    default_mgmt_fee: values.mgmt_fee,
    default_maintenance_reserve: values.maintenance_reserve,
    default_appreciation_rate: values.appreciation_rate,
    default_rent_growth_rate: values.rent_growth_rate,
    default_interest_rate: values.interest_rate,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from('user_settings')
      .update(valueData)
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating defaults:', error);
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('user_settings')
      .insert({
        ...valueData,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error inserting defaults:', error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function getDefaultValues(): Promise<DefaultValues | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from('user_settings')
    .select('default_vacancy_rate, default_mgmt_fee, default_maintenance_reserve, default_appreciation_rate, default_rent_growth_rate, default_interest_rate')
    .single();

  if (error) {
    return null;
  }

  return {
    vacancy_rate: data.default_vacancy_rate ?? 5,
    mgmt_fee: data.default_mgmt_fee ?? 10,
    maintenance_reserve: data.default_maintenance_reserve ?? 5,
    appreciation_rate: data.default_appreciation_rate ?? 3,
    rent_growth_rate: data.default_rent_growth_rate ?? 2,
    interest_rate: data.default_interest_rate ?? 7,
  };
}

// Test notification email sending
export async function sendTestNotification(
  email: string,
  type: 'lease_expiration' | 'maintenance_alert' | 'payment_reminder'
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const testData = {
    lease_expiration: {
      tenantName: 'Test Tenant',
      propertyAddress: '123 Test Street',
      leaseEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      daysRemaining: 30,
    },
    maintenance_alert: {
      propertyAddress: '123 Test Street',
      issueDescription: 'HVAC not cooling properly',
      priority: 'medium',
      reportedDate: new Date().toLocaleDateString(),
    },
    payment_reminder: {
      tenantName: 'Test Tenant',
      propertyAddress: '123 Test Street',
      rentAmount: 1500,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    },
  };

  try {
    const response = await fetch(`${baseUrl}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        data: testData[type],
        recipientEmail: email,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to send' };
    }

    return { success: true };
  } catch (error) {
    console.error('Test notification error:', error);
    return { success: false, error: 'Failed to send test notification' };
  }
}
