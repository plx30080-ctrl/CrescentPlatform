import { supabase } from '../lib/supabase';

/**
 * Uploads a photo file to the 'badge-photos' Supabase Storage bucket.
 * Returns the public URL of the uploaded file.
 *
 * Requires a public bucket named 'badge-photos' to exist in Supabase Storage.
 */
export async function uploadBadgePhoto(file: File, eid: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${eid}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('badge-photos')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Failed to upload photo: ${error.message}`);

  const { data } = supabase.storage.from('badge-photos').getPublicUrl(path);
  return data.publicUrl;
}
