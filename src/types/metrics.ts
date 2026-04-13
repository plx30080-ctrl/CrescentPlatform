import type { Shift } from '../lib/constants';

export interface OnPremiseData {
  id: string;
  date: string;
  shift: Shift;
  branch: string;
  headcount: number;
  target_headcount: number;
  absent_count: number;
  ncns_count: number;
  early_leave_count: number;
  new_start_count: number;
  notes: string | null;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnPremiseNewStart {
  id: string;
  on_premise_id: string;
  eid: string;
  first_name: string;
  last_name: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface HoursData {
  id: string;
  week_ending: string;
  branch: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  total_employees: number;
  avg_hours_per_employee: number;
  notes: string | null;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HoursEmployeeDetail {
  id: string;
  hours_data_id: string;
  eid: string;
  first_name: string;
  last_name: string;
  regular_hours: number;
  overtime_hours: number;
  total_hours: number;
  shift: Shift | null;
  created_at: string;
}

export interface BranchMetrics {
  id: string;
  date: string;
  branch: string;
  revenue: number | null;
  gp_margin: number | null;
  bill_rate: number | null;
  pay_rate: number | null;
  spread: number | null;
  fill_rate: number | null;
  turnover_rate: number | null;
  avg_tenure_days: number | null;
  notes: string | null;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_active_associates: number;
  total_headcount_today: number;
  target_headcount_today: number;
  fill_rate: number;
  absent_count: number;
  ncns_count: number;
  early_leave_count: number;
  new_starts_this_week: number;
  pipeline_counts: Record<string, number>;
}

export interface HeadcountTrendPoint {
  date: string;
  shift: Shift;
  headcount: number;
  target_headcount: number;
}
