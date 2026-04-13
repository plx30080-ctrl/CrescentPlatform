import type { CorrectiveAction as CorrectiveActionType, Shift } from '../lib/constants';
import type { Associate } from './associate';

export interface EarlyLeave {
  id: string;
  eid: string;
  date: string;
  shift: Shift;
  branch: string | null;
  time_left: string;
  hours_worked: number | null;
  reason: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface EarlyLeaveWithAssociate extends EarlyLeave {
  associate?: Pick<Associate, 'first_name' | 'last_name' | 'branch' | 'shift' | 'status'>;
}

export interface CorrectiveAction {
  id: string;
  eid: string;
  date: string;
  action_type: CorrectiveActionType;
  reason: string | null;
  early_leave_id: string | null;
  issued_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CorrectiveActionWithAssociate extends CorrectiveAction {
  associate?: Pick<Associate, 'first_name' | 'last_name' | 'branch' | 'shift' | 'status'>;
}

export interface EarlyLeaveFilters {
  start_date?: string;
  end_date?: string;
  eid?: string;
  shift?: Shift;
  branch?: string;
  page?: number;
  pageSize?: number;
}

export interface EarlyLeaveStats {
  total_early_leaves: number;
  avg_hours_worked: number;
  by_shift: Record<string, number>;
  by_branch: Record<string, number>;
  top_offenders: Array<{
    eid: string;
    first_name: string;
    last_name: string;
    count: number;
  }>;
}
