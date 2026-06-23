import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../lib/rateLimit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as
    | { listing_id?: string; note?: string; website?: string }
    | null;

  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  // Honeypot — see votes.ts.
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  const note = body.note?.trim();
  if (!body.listing_id || !note || note.length > 250) {
    return new Response(JSON.stringify({ error: 'Missing or invalid fields' }), { status: 400 });
  }

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(supabaseAdmin, `report:${ip}`, { windowMs: 10 * 60 * 1000, max: 5 });
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many reports — please slow down.' }), { status: 429 });
  }

  const { error } = await supabaseAdmin.from('reports').insert({ listing_id: body.listing_id, note });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
