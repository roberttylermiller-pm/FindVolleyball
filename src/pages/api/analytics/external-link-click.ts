import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as { listing_id?: string } | null;

  if (!body?.listing_id) {
    return new Response(JSON.stringify({ error: 'Missing listing_id' }), { status: 400 });
  }

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(supabaseAdmin, `external-link-click:${ip}`, {
    windowMs: 10 * 60 * 1000,
    max: 60,
  });
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
  }

  const { error } = await supabaseAdmin.from('external_link_clicks').insert({ listing_id: body.listing_id });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
