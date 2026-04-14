import { supabase } from '../lib/supabase';
import type { AppUser } from '../contexts/AuthContext';
import type { UserRole } from '../lib/constants';

export async function getUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .order('display_name', { ascending: true });

  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  return (data as AppUser[]) ?? [];
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update user role: ${error.message}`);
}
