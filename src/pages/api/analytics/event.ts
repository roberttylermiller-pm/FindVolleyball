import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

export const prerender = false;

const ALLOWED_EVENTS = new Set(['list_opened', 'list_card_clicked']);

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as { event?: string } | null;

  if (!body?.event || !ALLOWED_EVENTS.has(body.event)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid event' }), { status: 400 });
  }

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(supabaseAdmin, `usage-event:${ip}`, {
    windowMs: 10 * 60 * 1000,
    max: 120,
  });
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
  }

  const { error } = await supabaseAdmin.from('usage_events').insert({ event: body.event });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
