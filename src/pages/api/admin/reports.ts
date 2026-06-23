import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../lib/supabase/server';

export const prerender = false;

// Reports have no public select policy (see M1 migrations) — admin
// review only happens through this service-role-backed endpoint.
export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  // Archived reports stay in the table (nothing's deleted) but drop out
  // of the dashboard's default view so the list reflects what's still
  // unprocessed instead of growing forever.
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('id, listing_id, note, created_at, listings(name, type, status)')
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ reports: data }), {
    headers: { 'content-type': 'application/json' },
  });
};
