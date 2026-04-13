import type { CorrectiveAction as CorrectiveActionType, Shift } from '../lib/constants';
import type { Associate } from './associate';

export interface EarlyLeave {
  id: string;
  associate_eid: string;
  date: string;
  shift: Shift | null;
  leave_time: string | null;
  scheduled_end: string | null;
  hours_worked: number | null;
  reason: string | null;
  corrective_action: CorrectiveActionType;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface EarlyLeaveWithAssociate extends EarlyLeave {
  associate?: Pick<Associate, 'first_name' | 'last_name' | 'branch' | 'shift' | 'status' | 'eid'>;
}

export interface CorrectiveAction {
  id: string;
  associate_eid: string;
  early_leave_id: string | null;
  date: string;
  action: CorrectiveActionType;
  offense_category: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CorrectiveActionWithAssociate extends CorrectiveAction {
  associate?: Pick<Associate, 'first_name' | 'last_name' | 'eid'>;
}

export interface EarlyLeaveFilters {
  start_date?: string;
  end_date?: string;
  associate_eid?: string;
  shift?: Shift;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface EarlyLeaveStats {
  total_this_week: number;
  total_this_month: number;
  dnr_count: number;
  warning_count: number;
}
