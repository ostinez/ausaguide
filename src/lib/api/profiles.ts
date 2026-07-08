import { supabase } from '../supabase';
import type { Profile } from '../types';

// Fetch a profile by ID
export async function fetchProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

// Update a profile
export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string;
    bio?: string;
    location?: string;
    languages?: string[];
    host_type?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) throw error;
}

// Fetch all hosts (for explore page)
export async function fetchHostProfiles(limit = 6): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'host')
    .order('full_name')
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
