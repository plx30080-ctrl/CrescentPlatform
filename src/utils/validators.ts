import { z } from 'zod';

// ============================================================
// Associate Schema
// ============================================================
export const associateSchema = z.object({
  eid: z
    .string()
    .min(1, 'EID is required')
    .max(50, 'EID must be 50 characters or fewer'),
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or fewer'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or fewer'),
  email: z
    .string()
    .email('Invalid email address')
    .nullish()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone must be 20 characters or fewer')
    .nullish()
    .or(z.literal('')),
  status: z.enum(['Active', 'Inactive', 'DNR', 'Terminated'], {
    message: 'Invalid associate status',
  }),
  pipeline_status: z.enum(
    ['Applied', 'Interviewing', 'Background Check', 'Orientation', 'Started', 'Declined'],
    { message: 'Invalid pipeline status' }
  ),
  shift: z
    .enum(['1st', '2nd'], {
      message: 'Shift must be 1st or 2nd',
    })
    .nullish(),
  branch: z
    .string()
    .max(100, 'Branch must be 100 characters or fewer')
    .nullish(),
  recruiter: z
    .string()
    .max(100, 'Recruiter name must be 100 characters or fewer')
    .nullish(),
  recruiter_uid: z.string().uuid('Invalid recruiter UID').nullish().or(z.literal('')),
  process_date: z.string().nullish(),
  planned_start_date: z.string().nullish(),
  actual_start_date: z.string().nullish(),
  termination_date: z.string().nullish(),
  termination_reason: z.string().max(500, 'Termination reason must be 500 characters or fewer').nullish(),
  eligible_for_rehire: z.boolean().nullish(),
  i9_cleared: z.boolean().default(false),
  background_check_status: z.string().nullish(),
  photo_url: z.string().url('Invalid photo URL').nullish().or(z.literal('')),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').nullish(),
  updated_by: z.string().uuid().nullish().or(z.literal('')),
});

export type AssociateInput = z.infer<typeof associateSchema>;

// ============================================================
// On-Premise Data Schema
// ============================================================
export const onPremiseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  shift: z.enum(['1st', '2nd'], {
    message: 'Shift must be 1st or 2nd',
  }),
  requested: z.coerce.number().int().min(0, 'Requested must be 0 or greater').default(0),
  required: z.coerce.number().int().min(0, 'Required must be 0 or greater').default(0),
  working: z.coerce.number().int().min(0, 'Working must be 0 or greater').default(0),
  new_starts: z.coerce.number().int().min(0, 'New starts must be 0 or greater').default(0),
  send_homes: z.coerce.number().int().min(0, 'Send homes must be 0 or greater').default(0),
  line_cuts: z.coerce.number().int().min(0, 'Line cuts must be 0 or greater').default(0),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').nullish(),
});

export type OnPremiseInput = z.infer<typeof onPremiseSchema>;

// ============================================================
// Early Leave Schema
// ============================================================
export const earlyLeaveSchema = z.object({
  associate_eid: z.string().min(1, 'Associate EID is required'),
  date: z.string().min(1, 'Date is required'),
  shift: z
    .enum(['1st', '2nd'], {
      message: 'Shift must be 1st or 2nd',
    })
    .nullish(),
  leave_time: z.string().nullish(),
  scheduled_end: z.string().nullish(),
  hours_worked: z.coerce.number().min(0, 'Hours worked must be 0 or greater').nullish(),
  reason: z.string().max(500, 'Reason must be 500 characters or fewer').nullish(),
  corrective_action: z
    .enum(['None', 'Warning', '5 Day Suspension', 'DNR'], {
      message: 'Invalid corrective action',
    })
    .default('None'),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').nullish(),
});

export type EarlyLeaveInput = z.infer<typeof earlyLeaveSchema>;

// ============================================================
// Branch Metrics Schema
// ============================================================
export const branchMetricsSchema = z.object({
  date: z.string().nullish(),
  week_ending: z.string().nullish(),
  branch: z.string().min(1, 'Branch is required').max(100, 'Branch must be 100 characters or fewer'),
  is_weekly_summary: z.boolean().default(false),
  interviews_scheduled: z.coerce.number().int().min(0).default(0),
  interview_shows: z.coerce.number().int().min(0).default(0),
  shift1_processed: z.coerce.number().int().min(0).default(0),
  shift2_processed: z.coerce.number().int().min(0).default(0),
  shift2_confirmations: z.coerce.number().int().min(0).default(0),
  next_day_confirmations: z.coerce.number().int().min(0).default(0),
  total_applicants: z.coerce.number().int().min(0).nullish(),
  total_processed: z.coerce.number().int().min(0).nullish(),
  total_headcount: z.coerce.number().int().min(0).nullish(),
  on_premise_count: z.coerce.number().int().min(0).nullish(),
  scheduled_count: z.coerce.number().int().min(0).nullish(),
  attendance_pct: z.coerce.number().min(0).max(100, 'Attendance % must be between 0 and 100').nullish(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').nullish(),
});

export type BranchMetricsInput = z.infer<typeof branchMetricsSchema>;

// ============================================================
// Validation helper functions
// ============================================================

export function validateAssociate(data: unknown): { success: true; data: AssociateInput } | { success: false; errors: Record<string, string> } {
  const result = associateSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}

export function validateOnPremise(data: unknown): { success: true; data: OnPremiseInput } | { success: false; errors: Record<string, string> } {
  const result = onPremiseSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}

export function validateEarlyLeave(data: unknown): { success: true; data: EarlyLeaveInput } | { success: false; errors: Record<string, string> } {
  const result = earlyLeaveSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}

export function validateBranchMetrics(data: unknown): { success: true; data: BranchMetricsInput } | { success: false; errors: Record<string, string> } {
  const result = branchMetricsSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}
