import { supabase } from '../lib/supabase';
import type {
  EarlyLeave,
  EarlyLeaveWithAssociate,
  CorrectiveAction,
  CorrectiveActionWithAssociate,
  EarlyLeaveFilters,
  EarlyLeaveStats,
} from '../types/earlyLeave';

export async function getEarlyLeaves(
  filters?: EarlyLeaveFilters
): Promise<{ data: EarlyLeaveWithAssociate[]; count: number }> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('early_leaves')
    .select(
      `
      *,
      associate:associates!associate_eid (
        eid,
        first_name,
        last_name,
        branch,
        shift,
        status
      )
    `,
      { count: 'exact' }
    );

  if (filters?.start_date) {
    query = query.gte('date', filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte('date', filters.end_date);
  }

  if (filters?.associate_eid) {
    query = query.eq('associate_eid', filters.associate_eid);
  }

  if (filters?.search) {
    query = query.or(`associate_eid.ilike.%${filters.search}%`);
  }

  if (filters?.shift) {
    query = query.eq('shift', filters.shift);
  }

  query = query.order('date', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch early leaves: ${error.message}`);
  }

  return {
    data: (data as EarlyLeaveWithAssociate[]) ?? [],
    count: count ?? 0,
  };
}

export async function createEarlyLeave(
  earlyLeave: Omit<EarlyLeave, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
): Promise<EarlyLeave> {
  const { data, error } = await supabase
    .from('early_leaves')
    .insert(earlyLeave)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create early leave: ${error.message}`);
  }

  return data as EarlyLeave;
}

export async function updateEarlyLeave(
  id: string,
  updates: Partial<Omit<EarlyLeave, 'id' | 'created_at' | 'updated_at'>>
): Promise<EarlyLeave> {
  const { data, error } = await supabase
    .from('early_leaves')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update early leave ${id}: ${error.message}`);
  }

  return data as EarlyLeave;
}

export async function deleteEarlyLeave(id: string): Promise<void> {
  const { error } = await supabase
    .from('early_leaves')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete early leave ${id}: ${error.message}`);
  }
}

export async function getCorrectiveActions(
  eid?: string
): Promise<CorrectiveActionWithAssociate[]> {
  let query = supabase
    .from('corrective_actions')
    .select(
      `
      *,
      associate:associates!associate_eid (
        eid,
        first_name,
        last_name
      )
    `
    );

  if (eid) {
    query = query.eq('associate_eid', eid);
  }

  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch corrective actions: ${error.message}`);
  }

  return (data as CorrectiveActionWithAssociate[]) ?? [];
}

export async function getEarlyLeaveStats(
  startDate?: string,
  endDate?: string
): Promise<EarlyLeaveStats> {
  let query = supabase
    .from('early_leaves')
    .select(
      `
      id,
      associate_eid,
      shift,
      hours_worked,
      corrective_action,
      associate:associates!associate_eid (
        first_name,
        last_name
      )
    `
    );

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch early leave stats: ${error.message}`);
  }

  type Row = {
    id: string;
    associate_eid: string;
    shift: string;
    hours_worked: number | null;
    corrective_action: string;
    associate: { first_name: string; last_name: string } | null;
  };

  const rows = (data as Row[]) ?? [];

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  let dnrCount = 0;
  let warningCount = 0;
  for (const r of rows) {
    if (r.corrective_action === 'DNR') dnrCount++;
    if (r.corrective_action === 'Warning') warningCount++;
  }

  return {
    total_this_week: rows.length,
    total_this_month: rows.length,
    dnr_count: dnrCount,
    warning_count: warningCount,
  };
}
