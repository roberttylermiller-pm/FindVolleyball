import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../../../lib/supabase/server';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing listing id' }), { status: 400 });
  }

  const { error } = await supabaseAdmin.from('listings').update({ status: 'rejected' }).eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
