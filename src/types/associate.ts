import type { AssociateStatus, PipelineStatus, Shift, BadgeStatus } from '../lib/constants';

export interface Associate {
  eid: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: AssociateStatus;
  pipeline_status: PipelineStatus;
  shift: Shift | null;
  branch: string | null;
  recruiter: string | null;
  recruiter_uid: string | null;
  process_date: string | null;
  planned_start_date: string | null;
  actual_start_date: string | null;
  termination_date: string | null;
  termination_reason: string | null;
  eligible_for_rehire: boolean | null;
  i9_cleared: boolean;
  background_check_status: BadgeStatus | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface AssociateFormData {
  eid: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: AssociateStatus;
  pipeline_status: PipelineStatus;
  shift: Shift | null;
  branch: string | null;
  recruiter: string | null;
  recruiter_uid: string | null;
  process_date: string | null;
  planned_start_date: string | null;
  actual_start_date: string | null;
  termination_date: string | null;
  termination_reason: string | null;
  eligible_for_rehire: boolean | null;
  i9_cleared: boolean;
  background_check_status: BadgeStatus | null;
  photo_url: string | null;
  notes: string | null;
  updated_by: string | null;
}

export interface AssociateFilters {
  status?: AssociateStatus;
  pipeline_status?: PipelineStatus;
  shift?: Shift;
  branch?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAssociates {
  data: Associate[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
