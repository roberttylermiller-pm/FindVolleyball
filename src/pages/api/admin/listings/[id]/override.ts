import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../../../lib/supabase/server';

export const prerender = false;

interface OverrideBody {
  decayed?: boolean;
  status?: 'approved' | 'rejected';
}

// No dedicated "removed"/"inactive" status exists in the schema — marking
// a previously-approved listing inactive reuses status='rejected' (it
// already means "not shown publicly"), rather than adding a new enum
// value for what's functionally the same outcome. See decisions log.
export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing listing id' }), { status: 400 });
  }

  const body = (await request.json()) as OverrideBody;
  const update: Record<string, unknown> = {};

  if (typeof body.decayed === 'boolean') {
    update.decayed = body.decayed;
  }
  if (body.status === 'approved' || body.status === 'rejected') {
    update.status = body.status;
  }

  if (Object.keys(update).length === 0) {
    return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });
  }

  const { error } = await supabaseAdmin.from('listings').update(update).eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
