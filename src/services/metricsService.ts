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

  if (error) {
    throw new Error(`Failed to fetch on-premise data: ${error.message}`);
  }

  return (data as OnPremiseData[]) ?? [];
}

export async function submitOnPremiseData(params: {
  date: string;
  shift: Shift;
  branch: string;
  headcount: number;
  target_headcount: number;
  absent_count: number;
  ncns_count: number;
  early_leave_count: number;
  new_start_count: number;
  notes?: string;
  submitted_by?: string;
}): Promise<OnPremiseData> {
  const { data, error } = await supabase.rpc('submit_on_premise_data', {
    p_date: params.date,
    p_shift: params.shift,
    p_branch: params.branch,
    p_headcount: params.headcount,
    p_target_headcount: params.target_headcount,
    p_absent_count: params.absent_count,
    p_ncns_count: params.ncns_count,
    p_early_leave_count: params.early_leave_count,
    p_new_start_count: params.new_start_count,
    p_notes: params.notes ?? null,
    p_submitted_by: params.submitted_by ?? null,
  });

  if (error) {
    throw new Error(`Failed to submit on-premise data: ${error.message}`);
  }

  return data as OnPremiseData;
}

export async function getHoursData(
  startDate?: string,
  endDate?: string
): Promise<HoursData[]> {
  let query = supabase
    .from('hours_data')
    .select('*');

  if (startDate) {
    query = query.gte('week_ending', startDate);
  }

  if (endDate) {
    query = query.lte('week_ending', endDate);
  }

  query = query.order('week_ending', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch hours data: ${error.message}`);
  }

  return (data as HoursData[]) ?? [];
}

export async function submitHoursData(
  hoursData: Omit<HoursData, 'id' | 'created_at' | 'updated_at'>,
  employeeDetails: Omit<HoursEmployeeDetail, 'id' | 'hours_data_id' | 'created_at'>[]
): Promise<{ hoursData: HoursData; employeeDetails: HoursEmployeeDetail[] }> {
  const { data: insertedHours, error: hoursError } = await supabase
    .from('hours_data')
    .insert(hoursData)
    .select()
    .single();

  if (hoursError) {
    throw new Error(`Failed to submit hours data: ${hoursError.message}`);
  }

  const typedHours = insertedHours as HoursData;

  const detailsWithId = employeeDetails.map((detail) => ({
    ...detail,
    hours_data_id: typedHours.id,
  }));

  const { data: insertedDetails, error: detailsError } = await supabase
    .from('hours_employee_detail')
    .insert(detailsWithId)
    .select();

  if (detailsError) {
    throw new Error(`Failed to submit employee details: ${detailsError.message}`);
  }

  return {
    hoursData: typedHours,
    employeeDetails: (insertedDetails as HoursEmployeeDetail[]) ?? [],
  };
}

export async function getBranchMetrics(
  startDate?: string,
  endDate?: string,
  branch?: string
): Promise<BranchMetrics[]> {
  let query = supabase
    .from('branch_metrics')
    .select('*');

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  if (branch) {
    query = query.eq('branch', branch);
  }

  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch branch metrics: ${error.message}`);
  }

  return (data as BranchMetrics[]) ?? [];
}

export async function submitBranchMetrics(
  metrics: Omit<BranchMetrics, 'id' | 'created_at' | 'updated_at'>
): Promise<BranchMetrics> {
  const { data, error } = await supabase
    .from('branch_metrics')
    .insert(metrics)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit branch metrics: ${error.message}`);
  }

  return data as BranchMetrics;
}

export async function getDashboardSummary(
  startDate?: string,
  endDate?: string
): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    p_start_date: startDate ?? null,
    p_end_date: endDate ?? null,
  });

  if (error) {
    throw new Error(`Failed to fetch dashboard summary: ${error.message}`);
  }

  return data as DashboardSummary;
}

export async function getHeadcountTrend(days?: number): Promise<HeadcountTrendPoint[]> {
  const lookbackDays = days ?? 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('on_premise_data')
    .select('date, shift, headcount, target_headcount')
    .gte('date', startDateStr)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch headcount trend: ${error.message}`);
  }

  return (data as HeadcountTrendPoint[]) ?? [];
}

export async function getFillRates(
  startDate: string,
  endDate: string,
  shift?: Shift
): Promise<Array<{ date: string; shift: Shift; fill_rate: number }>> {
  let query = supabase
    .from('on_premise_data')
    .select('date, shift, headcount, target_headcount')
    .gte('date', startDate)
    .lte('date', endDate);

  if (shift) {
    query = query.eq('shift', shift);
  }

  query = query.order('date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch fill rates: ${error.message}`);
  }

  const rows = (data as Array<{ date: string; shift: Shift; headcount: number; target_headcount: number }>) ?? [];

  return rows.map((row) => ({
    date: row.date,
    shift: row.shift,
    fill_rate: row.target_headcount > 0 ? (row.headcount / row.target_headcount) * 100 : 0,
  }));
}
