import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../lib/supabase/server';

export const prerender = false;

// Reports have no public select policy (see M1 migrations) — admin
// review only happens through this service-role-backed endpoint.
export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('id, listing_id, note, created_at, listings(name, type, status)')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ reports: data }), {
    headers: { 'content-type': 'application/json' },
  });
};
