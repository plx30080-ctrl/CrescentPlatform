import type { Shift } from '../lib/constants';

export interface OnPremiseData {
  id: string;
  date: string;
  shift: Shift;
  requested: number;
  required: number;
  working: number;
  new_starts: number;
  send_homes: number;
  line_cuts: number;
  notes: string | null;
  submitted_by: string | null;
  submitted_at: string;
}

export interface OnPremiseNewStart {
  id: string;
  on_premise_id: string;
  associate_eid: string;
  validated: boolean;
  validation_message: string | null;
}

export interface HoursData {
  id: string;
  week_ending: string;
  shift1_total: number;
  shift1_direct: number;
  shift1_indirect: number;
  shift2_total: number;
  shift2_direct: number;
  shift2_indirect: number;
  employee_count: number;
  submitted_by: string | null;
  submitted_at: string;
}

export interface HoursEmployeeDetail {
  id: string;
  hours_data_id: string;
  associate_eid: string;
  shift: Shift | null;
  labor_type: 'Direct' | 'Indirect' | null;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  daily_breakdown: Record<string, number> | null;
}

export interface BranchMetrics {
  id: string;
  date: string | null;
  week_ending: string | null;
  branch: string;
  is_weekly_summary: boolean;
  interviews_scheduled: number;
  interview_shows: number;
  shift1_processed: number;
  shift2_processed: number;
  shift2_confirmations: number;
  next_day_confirmations: number;
  total_applicants: number | null;
  total_processed: number | null;
  total_headcount: number | null;
  on_premise_count: number | null;
  scheduled_count: number | null;
  attendance_pct: number | null;
  notes: string | null;
  submitted_by: string | null;
  submitted_at: string;
}

export interface HeadcountTrendPoint {
  date: string;
  shift: string;
  requested: number;
  required: number;
  working: number;
  fill_rate: number;
}

export interface DashboardSummary {
  total_associates: number;
  total_dnr: number;
  pipeline: Record<string, number> | null;
  headcount_trend: HeadcountTrendPoint[];
  recent_early_leaves: Array<{
    date: string;
    eid: string;
    name: string;
    reason: string | null;
    corrective_action: string;
  }>;
}
