import type { BadgeStatus, PrintQueueStatus } from '../lib/constants';
import type { Associate } from './associate';

export interface Badge {
  id: string;
  eid: string;
  photo_url: string | null;
  status: BadgeStatus;
  template_id: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface BadgeWithAssociate extends Badge {
  associate?: Pick<Associate, 'first_name' | 'last_name' | 'branch' | 'shift' | 'status'>;
}

export interface BadgePrintJob {
  id: string;
  badge_id: string;
  status: PrintQueueStatus;
  priority: number;
  error_message: string | null;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
}

export interface BadgePrintJobWithDetails extends BadgePrintJob {
  badge?: BadgeWithAssociate;
}

export interface BadgeTemplate {
  id: string;
  name: string;
  description: string | null;
  layout_config: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
