import { supabase } from '../supabase/client';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const BUCKET = 'listing-photos';

export type PhotoUploadResult = { ok: true; url: string } | { ok: false; error: string };

// Client-side checks are just fast-fail UX — the bucket itself enforces
// allowed_mime_types/file_size_limit server-side (see the M4 photo
// migration), so a request that lies about content-type still gets
// rejected even if this check were bypassed.
export async function uploadListingPhoto(file: File): Promise<PhotoUploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Photo must be a JPEG, PNG, or WebP image.' };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false, error: 'Photo must be 5MB or smaller.' };
  }

  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);

  if (uploadError) {
    return { ok: false, error: `Photo upload failed: ${uploadError.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
