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
      associate:associates!eid (
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

  if (filters?.eid) {
    query = query.eq('eid', filters.eid);
  }

  if (filters?.shift) {
    query = query.eq('shift', filters.shift);
  }

  if (filters?.branch) {
    query = query.eq('branch', filters.branch);
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
      associate:associates!eid (
        first_name,
        last_name,
        branch,
        shift,
        status
      )
    `
    );

  if (eid) {
    query = query.eq('eid', eid);
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
      eid,
      shift,
      branch,
      hours_worked,
      associate:associates!eid (
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

  type EarlyLeaveRow = {
    id: string;
    eid: string;
    shift: string;
    branch: string | null;
    hours_worked: number | null;
    associate: { first_name: string; last_name: string } | null;
  };

  const rows = (data as EarlyLeaveRow[]) ?? [];

  const totalEarlyLeaves = rows.length;

  const hoursValues = rows
    .map((r) => r.hours_worked)
    .filter((h): h is number => h !== null);
  const avgHoursWorked =
    hoursValues.length > 0
      ? hoursValues.reduce((sum, h) => sum + h, 0) / hoursValues.length
      : 0;

  const byShift: Record<string, number> = {};
  for (const row of rows) {
    byShift[row.shift] = (byShift[row.shift] ?? 0) + 1;
  }

  const byBranch: Record<string, number> = {};
  for (const row of rows) {
    const branch = row.branch ?? 'Unknown';
    byBranch[branch] = (byBranch[branch] ?? 0) + 1;
  }

  const eidCounts: Record<string, { eid: string; first_name: string; last_name: string; count: number }> = {};
  for (const row of rows) {
    if (!eidCounts[row.eid]) {
      eidCounts[row.eid] = {
        eid: row.eid,
        first_name: row.associate?.first_name ?? '',
        last_name: row.associate?.last_name ?? '',
        count: 0,
      };
    }
    eidCounts[row.eid].count += 1;
  }

  const topOffenders = Object.values(eidCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total_early_leaves: totalEarlyLeaves,
    avg_hours_worked: Math.round(avgHoursWorked * 100) / 100,
    by_shift: byShift,
    by_branch: byBranch,
    top_offenders: topOffenders,
  };
}
