import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../lib/supabase/server';

export const prerender = false;

// Full listing set for the admin dashboard's management table — unlike
// the public browse map, this isn't scoped to status='approved'.
export const GET: APIRoute = async ({ request, url }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const status = url.searchParams.get('status');

  let query = supabaseAdmin.from('listings').select('*').order('created_at', { ascending: false });
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ listings: data }), {
    headers: { 'content-type': 'application/json' },
  });
};
