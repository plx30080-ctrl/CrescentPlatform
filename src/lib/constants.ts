export const ASSOCIATE_STATUS = ['Active', 'Inactive', 'DNR', 'Terminated'] as const;
export type AssociateStatus = (typeof ASSOCIATE_STATUS)[number];

export const PIPELINE_STATUS = [
  'Applied',
  'Interviewing',
  'Background Check',
  'Orientation',
  'Started',
  'Declined',
] as const;
export type PipelineStatus = (typeof PIPELINE_STATUS)[number];

export const SHIFTS = ['1st', '2nd'] as const;
export type Shift = (typeof SHIFTS)[number];

export const USER_ROLES = ['admin', 'market_manager', 'recruiter', 'onsite_manager'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CORRECTIVE_ACTIONS = ['None', 'Warning', '5 Day Suspension', 'DNR'] as const;
export type CorrectiveAction = (typeof CORRECTIVE_ACTIONS)[number];

export const BADGE_STATUS = ['Pending', 'Cleared', 'Not Cleared', 'Suspended'] as const;
export type BadgeStatus = (typeof BADGE_STATUS)[number];

export const PRINT_QUEUE_STATUS = ['Queued', 'Printing', 'Completed', 'Failed'] as const;
export type PrintQueueStatus = (typeof PRINT_QUEUE_STATUS)[number];

export const UPLOAD_TYPES = ['append', 'replace', 'upsert'] as const;
export type UploadType = (typeof UPLOAD_TYPES)[number];

export const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  // Associate statuses
  Active: 'success',
  Inactive: 'default',
  DNR: 'error',
  Terminated: 'error',

  // Pipeline statuses
  Applied: 'info',
  Interviewing: 'info',
  'Background Check': 'warning',
  Orientation: 'warning',
  Started: 'success',
  Declined: 'error',

  // Badge statuses
  Pending: 'warning',
  Cleared: 'success',
  'Not Cleared': 'error',
  Suspended: 'error',

  // Print queue statuses
  Queued: 'info',
  Printing: 'warning',
  Completed: 'success',
  Failed: 'error',

  // Corrective actions
  None: 'default',
  Warning: 'warning',
  '5 Day Suspension': 'error',
  // DNR already defined above
};
