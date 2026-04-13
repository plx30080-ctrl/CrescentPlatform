import type { BadgeStatus, PrintQueueStatus } from '../lib/constants';
import type { Associate } from './associate';

export interface Badge {
  id: string;
  associate_eid: string;
  badge_number: string;
  photo_url: string | null;
  status: BadgeStatus;
  printed_at: string | null;
  printed_by: string | null;
  issued_at: string | null;
  issued_by: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  notes: string | null;
}

export interface BadgeWithAssociate extends Badge {
  associate?: Pick<Associate, 'first_name' | 'last_name' | 'branch' | 'shift' | 'status' | 'eid'>;
}

export interface BadgePrintJob {
  id: string;
  badge_id: string;
  priority: string;
  status: PrintQueueStatus;
  queued_at: string;
  queued_by: string | null;
  completed_at: string | null;
  error: string | null;
}

export interface BadgePrintJobWithDetails extends BadgePrintJob {
  badge?: BadgeWithAssociate;
}

export interface BadgeTemplate {
  id: string;
  name: string;
  is_default: boolean;
  card_size: { width: number; height: number };
  elements: Array<Record<string, unknown>>;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}
