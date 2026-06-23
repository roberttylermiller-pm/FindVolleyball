import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../lib/rateLimit';

export const prerender = false;

const VOTE_TYPES = new Set(['up', 'down']);

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as
    | { listing_id?: string; vote_type?: string; website?: string }
    | null;

  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  // Honeypot — a real user's browser never fills this (it's visually
  // hidden), so a non-empty value means a bot blindly filled every
  // field. Respond as if it worked rather than tipping it off.
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  if (!body.listing_id || !body.vote_type || !VOTE_TYPES.has(body.vote_type)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid fields' }), { status: 400 });
  }

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(supabaseAdmin, `vote:${ip}`, { windowMs: 10 * 60 * 1000, max: 20 });
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many votes — please slow down.' }), { status: 429 });
  }

  const { error } = await supabaseAdmin
    .from('votes')
    .insert({ listing_id: body.listing_id, vote_type: body.vote_type });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
