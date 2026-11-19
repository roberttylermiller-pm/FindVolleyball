import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const prerender = false;

// Per-day counts per event ("YYYY-MM-DD" is the UTC date of created_at,
// same convention as the external link clicks summary), so the dashboard
// can show today / last 7 days / all time without shipping every row.
export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { data, error } = await supabaseAdmin
    .from('usage_events')
    .select('event, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const byDate: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const dateKey = (row.created_at as string).slice(0, 10);
    byDate[dateKey] ??= {};
    byDate[dateKey][row.event] = (byDate[dateKey][row.event] ?? 0) + 1;
  }

  return new Response(JSON.stringify({ byDate }), { headers: { 'content-type': 'application/json' } });
};
