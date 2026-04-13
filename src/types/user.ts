import type { UserRole } from '../lib/constants';

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  branch: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
}
