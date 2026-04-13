import { supabase } from '../lib/supabase';
import type { Shift } from '../lib/constants';
import type {
  OnPremiseData,
  HoursData,
  HoursEmployeeDetail,
  BranchMetrics,
  DashboardSummary,
  HeadcountTrendPoint,
} from '../types/metrics';

export async function getOnPremiseData(
  startDate: string,
  endDate: string,
  shift?: Shift
): Promise<OnPremiseData[]> {
  let query = supabase
    .from('on_premise_data')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);

  if (shift) {
    query = query.eq('shift', shift);
  }

  query = query.order('date', { ascending: false });
  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch on-premise data: ${error.message}`);
  return (data as OnPremiseData[]) ?? [];
}

export async function submitOnPremiseData(params: {
  date: string;
  shift: Shift;
  requested: number;
  required: number;
  working: number;
  new_starts: number;
  send_homes?: number;
  line_cuts?: number;
  new_start_eids?: string[];
  notes?: string;
  submitted_by?: string;
}): Promise<{ success: boolean; on_premise_id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('submit_on_premise_data', {
    p_date: params.date,
    p_shift: params.shift,
    p_requested: params.requested,
    p_required: params.required,
    p_working: params.working,
    p_new_starts: params.new_starts,
    p_send_homes: params.send_homes ?? 0,
    p_line_cuts: params.line_cuts ?? 0,
    p_new_start_eids: params.new_start_eids ?? [],
    p_notes: params.notes ?? null,
    p_submitted_by: params.submitted_by ?? null,
  });

  if (error) throw new Error(`Failed to submit on-premise data: ${error.message}`);
  return data as { success: boolean; on_premise_id?: string; error?: string };
}

export async function getHoursData(startDate?: string, endDate?: string): Promise<HoursData[]> {
  let query = supabase.from('hours_data').select('*');
  if (startDate) query = query.gte('week_ending', startDate);
  if (endDate) query = query.lte('week_ending', endDate);
  query = query.order('week_ending', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch hours data: ${error.message}`);
  return (data as HoursData[]) ?? [];
}

export async function submitHoursData(
  hoursData: Omit<HoursData, 'id' | 'submitted_at'>,
  employeeDetails: Omit<HoursEmployeeDetail, 'id' | 'hours_data_id'>[]
): Promise<{ hoursData: HoursData; employeeCount: number }> {
  const { data: inserted, error: hErr } = await supabase
    .from('hours_data')
    .upsert(hoursData, { onConflict: 'week_ending' })
    .select()
    .single();

  if (hErr) throw new Error(`Failed to submit hours data: ${hErr.message}`);
  const typedHours = inserted as HoursData;

  if (employeeDetails.length > 0) {
    const rows = employeeDetails.map((d) => ({ ...d, hours_data_id: typedHours.id }));
    const { error: dErr } = await supabase.from('hours_employee_detail').upsert(rows, {
      onConflict: 'hours_data_id,associate_eid,labor_type',
    });
    if (dErr) throw new Error(`Failed to submit employee details: ${dErr.message}`);
  }

  return { hoursData: typedHours, employeeCount: employeeDetails.length };
}

export async function getBranchMetrics(
  startDate?: string,
  endDate?: string,
  branch?: string
): Promise<BranchMetrics[]> {
  let query = supabase.from('branch_metrics').select('*');
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (branch) query = query.eq('branch', branch);
  query = query.order('date', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch branch metrics: ${error.message}`);
  return (data as BranchMetrics[]) ?? [];
}

export async function submitBranchMetrics(
  metrics: Omit<BranchMetrics, 'id' | 'submitted_at'>
): Promise<BranchMetrics> {
  const { data, error } = await supabase
    .from('branch_metrics')
    .insert(metrics)
    .select()
    .single();

  if (error) throw new Error(`Failed to submit branch metrics: ${error.message}`);
  return data as BranchMetrics;
}

export async function getDashboardSummary(
  startDate?: string,
  endDate?: string
): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    p_start_date: startDate ?? undefined,
    p_end_date: endDate ?? undefined,
  });

  if (error) throw new Error(`Failed to fetch dashboard summary: ${error.message}`);
  return data as DashboardSummary;
}

export async function getHeadcountTrend(days?: number): Promise<HeadcountTrendPoint[]> {
  const lookback = days ?? 30;
  const start = new Date();
  start.setDate(start.getDate() - lookback);
  const startStr = start.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('on_premise_data')
    .select('date, shift, requested, required, working')
    .gte('date', startStr)
    .order('date', { ascending: true });

  if (error) throw new Error(`Failed to fetch headcount trend: ${error.message}`);

  return ((data ?? []) as Array<{ date: string; shift: string; requested: number; required: number; working: number }>).map((r) => ({
    date: r.date,
    shift: r.shift,
    requested: r.requested,
    required: r.required,
    working: r.working,
    fill_rate: r.required > 0 ? Math.round((r.working / r.required) * 100 * 10) / 10 : 0,
  }));
}

export async function getFillRates(
  startDate: string,
  endDate: string,
  shift?: Shift
): Promise<Array<{ date: string; shift: string; fill_rate: number }>> {
  let query = supabase
    .from('on_premise_data')
    .select('date, shift, required, working')
    .gte('date', startDate)
    .lte('date', endDate);

  if (shift) query = query.eq('shift', shift);
  query = query.order('date', { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch fill rates: ${error.message}`);

  return ((data ?? []) as Array<{ date: string; shift: string; required: number; working: number }>).map((r) => ({
    date: r.date,
    shift: r.shift,
    fill_rate: r.required > 0 ? Math.round((r.working / r.required) * 100 * 10) / 10 : 0,
  }));
}
