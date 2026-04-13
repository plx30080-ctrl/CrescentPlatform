import { supabase } from '../lib/supabase';
import type { Associate, AssociateFormData, AssociateFilters, PaginatedAssociates } from '../types/associate';

const DEFAULT_PAGE_SIZE = 25;

export async function getAssociates(filters?: AssociateFilters): Promise<PaginatedAssociates> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('associates')
    .select('*', { count: 'exact' });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.pipeline_status) {
    query = query.eq('pipeline_status', filters.pipeline_status);
  }

  if (filters?.shift) {
    query = query.eq('shift', filters.shift);
  }

  if (filters?.branch) {
    query = query.eq('branch', filters.branch);
  }

  if (filters?.search) {
    const search = filters.search.trim();
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,eid.ilike.%${search}%`
    );
  }

  query = query.order('last_name', { ascending: true }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch associates: ${error.message}`);
  }

  const totalCount = count ?? 0;

  return {
    data: (data as Associate[]) ?? [],
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getAssociate(eid: string): Promise<Associate> {
  const { data, error } = await supabase
    .from('associates')
    .select('*')
    .eq('eid', eid)
    .single();

  if (error) {
    throw new Error(`Failed to fetch associate ${eid}: ${error.message}`);
  }

  return data as Associate;
}

export async function getAssociateProfile(eid: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('get_associate_profile', { p_eid: eid });

  if (error) {
    throw new Error(`Failed to fetch associate profile ${eid}: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

export async function createAssociate(formData: AssociateFormData): Promise<Associate> {
  const { data, error } = await supabase
    .from('associates')
    .insert(formData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create associate: ${error.message}`);
  }

  return data as Associate;
}

export async function updateAssociate(
  eid: string,
  formData: Partial<AssociateFormData>
): Promise<Associate> {
  const { data, error } = await supabase
    .from('associates')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('eid', eid)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update associate ${eid}: ${error.message}`);
  }

  return data as Associate;
}

export async function deleteAssociate(eid: string): Promise<void> {
  const { error } = await supabase
    .from('associates')
    .delete()
    .eq('eid', eid);

  if (error) {
    throw new Error(`Failed to delete associate ${eid}: ${error.message}`);
  }
}

export async function searchAssociates(query: string): Promise<Associate[]> {
  const search = query.trim();

  if (!search) {
    return [];
  }

  const { data, error } = await supabase
    .from('associates')
    .select('*')
    .or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,eid.ilike.%${search}%`
    )
    .order('last_name', { ascending: true })
    .limit(20);

  if (error) {
    throw new Error(`Failed to search associates: ${error.message}`);
  }

  return (data as Associate[]) ?? [];
}
