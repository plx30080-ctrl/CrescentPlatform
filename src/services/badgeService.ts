import { supabase } from '../lib/supabase';
import type { BadgeStatus, PrintQueueStatus } from '../lib/constants';
import type { Badge, BadgeWithAssociate, BadgePrintJob, BadgePrintJobWithDetails, BadgeTemplate } from '../types/badge';

export async function getBadges(filters?: {
  status?: BadgeStatus;
  branch?: string;
}): Promise<BadgeWithAssociate[]> {
  let query = supabase
    .from('badges')
    .select(`
      *,
      associate:associates!eid (
        first_name,
        last_name,
        branch,
        shift,
        status
      )
    `);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch badges: ${error.message}`);
  }

  return (data as BadgeWithAssociate[]) ?? [];
}

export async function getBadge(id: string): Promise<BadgeWithAssociate> {
  const { data, error } = await supabase
    .from('badges')
    .select(`
      *,
      associate:associates!eid (
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
): Promise<Badge> {
  const { data, error } = await supabase.rpc('create_badge_for_associate', {
    p_eid: eid,
    p_photo_url: photoUrl ?? null,
    p_auto_queue: autoQueue ?? false,
  });

  if (error) {
    throw new Error(`Failed to create badge for associate ${eid}: ${error.message}`);
  }

  return data as Badge;
}

export async function updateBadge(
  id: string,
  updates: Partial<Pick<Badge, 'status' | 'photo_url' | 'template_id' | 'notes' | 'expiry_date' | 'updated_by'>>
): Promise<Badge> {
  const { data, error } = await supabase
    .from('badges')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update badge ${id}: ${error.message}`);
  }

  return data as Badge;
}

export async function deleteBadge(id: string): Promise<void> {
  const { error } = await supabase
    .from('badges')
    .delete()
    .eq('id', id);

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
        associate:associates!eid (
          first_name,
          last_name,
          branch,
          shift,
          status
        )
      )
    `);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('priority', { ascending: false }).order('queued_at', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch print queue: ${error.message}`);
  }

  return (data as BadgePrintJobWithDetails[]) ?? [];
}

export async function addToPrintQueue(
  badgeId: string,
  priority?: number
): Promise<BadgePrintJob> {
  const { data, error } = await supabase
    .from('badge_print_queue')
    .insert({
      badge_id: badgeId,
      status: 'Queued' as PrintQueueStatus,
      priority: priority ?? 0,
      queued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add badge to print queue: ${error.message}`);
  }

  return data as BadgePrintJob;
}

export async function updatePrintJob(
  id: string,
  status: PrintQueueStatus,
  errorMessage?: string
): Promise<BadgePrintJob> {
  const updates: Record<string, unknown> = { status };

  if (status === 'Printing') {
    updates.started_at = new Date().toISOString();
  }

  if (status === 'Completed' || status === 'Failed') {
    updates.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { data, error } = await supabase
    .from('badge_print_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update print job ${id}: ${error.message}`);
  }

  return data as BadgePrintJob;
}

export async function getTemplates(): Promise<BadgeTemplate[]> {
  const { data, error } = await supabase
    .from('badge_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch badge templates: ${error.message}`);
  }

  return (data as BadgeTemplate[]) ?? [];
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<BadgeTemplate, 'name' | 'description' | 'layout_config' | 'is_default'>>
): Promise<BadgeTemplate> {
  const { data, error } = await supabase
    .from('badge_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update template ${id}: ${error.message}`);
  }

  return data as BadgeTemplate;
}
