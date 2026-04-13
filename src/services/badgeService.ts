import { supabase } from '../lib/supabase';
import type { BadgeStatus, PrintQueueStatus } from '../lib/constants';
import type { Badge, BadgeWithAssociate, BadgePrintJob, BadgePrintJobWithDetails, BadgeTemplate } from '../types/badge';

export async function getBadges(filters?: {
  status?: BadgeStatus;
  page?: number;
  pageSize?: number;
}): Promise<{ data: BadgeWithAssociate[]; count: number }> {
  let query = supabase
    .from('badges')
    .select(`
      *,
      associate:associates!associate_eid (
        eid,
        first_name,
        last_name,
        branch,
        shift,
        status
      )
    `, { count: 'exact' });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch badges: ${error.message}`);
  }

  return { data: (data as BadgeWithAssociate[]) ?? [], count: count ?? 0 };
}

export async function getBadge(id: string): Promise<BadgeWithAssociate> {
  const { data, error } = await supabase
    .from('badges')
    .select(`
      *,
      associate:associates!associate_eid (
        eid,
        first_name,
        last_name,
        branch,
        shift,
        status
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch badge ${id}: ${error.message}`);
  }

  return data as BadgeWithAssociate;
}

export async function createBadge(
  eid: string,
  photoUrl?: string | null,
  autoQueue?: boolean
): Promise<{ success: boolean; badge_id?: string; badge_number?: string; error?: string }> {
  const { data, error } = await supabase.rpc('create_badge_for_associate', {
    p_eid: eid,
    p_photo_url: photoUrl ?? null,
    p_auto_queue: autoQueue ?? false,
  });

  if (error) {
    throw new Error(`Failed to create badge: ${error.message}`);
  }

  return data as { success: boolean; badge_id?: string; badge_number?: string; error?: string };
}

export async function updateBadge(
  id: string,
  updates: Partial<Pick<Badge, 'status' | 'photo_url' | 'notes'>>
): Promise<Badge> {
  const { data, error } = await supabase
    .from('badges')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update badge ${id}: ${error.message}`);
  }

  return data as Badge;
}

export async function deleteBadge(id: string): Promise<void> {
  const { error } = await supabase.from('badges').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete badge ${id}: ${error.message}`);
  }
}

export async function getPrintQueue(status?: PrintQueueStatus): Promise<BadgePrintJobWithDetails[]> {
  let query = supabase
    .from('badge_print_queue')
    .select(`
      *,
      badge:badges!badge_id (
        *,
        associate:associates!associate_eid (
          eid,
          first_name,
          last_name,
          shift
        )
      )
    `);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('queued_at', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch print queue: ${error.message}`);
  }

  return (data as BadgePrintJobWithDetails[]) ?? [];
}

export async function addToPrintQueue(badgeId: string, priority?: string): Promise<BadgePrintJob> {
  const { data, error } = await supabase
    .from('badge_print_queue')
    .insert({
      badge_id: badgeId,
      priority: priority ?? 'Normal',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add to print queue: ${error.message}`);
  }

  return data as BadgePrintJob;
}

export async function updatePrintJob(id: string, status: PrintQueueStatus, errorMsg?: string): Promise<BadgePrintJob> {
  const updates: Record<string, unknown> = { status };
  if (status === 'Completed' || status === 'Failed') {
    updates.completed_at = new Date().toISOString();
  }
  if (errorMsg) {
    updates.error = errorMsg;
  }

  const { data, error } = await supabase
    .from('badge_print_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update print job: ${error.message}`);
  }

  return data as BadgePrintJob;
}

export async function getTemplates(): Promise<BadgeTemplate[]> {
  const { data, error } = await supabase
    .from('badge_templates')
    .select('*')
    .order('is_default', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return (data as BadgeTemplate[]) ?? [];
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<BadgeTemplate, 'name' | 'card_size' | 'elements' | 'is_default'>>
): Promise<BadgeTemplate> {
  const { data, error } = await supabase
    .from('badge_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update template: ${error.message}`);
  }

  return data as BadgeTemplate;
}
