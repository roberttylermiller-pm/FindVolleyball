import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../lib/rateLimit';
import { sendAdminNotification } from '../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as { message?: string; website?: string } | null;

  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  // Honeypot — see votes.ts.
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  const message = body.message?.trim();
  if (!message || message.length > 250) {
    return new Response(JSON.stringify({ error: 'Missing or invalid fields' }), { status: 400 });
  }

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(supabaseAdmin, `feedback:${ip}`, { windowMs: 10 * 60 * 1000, max: 5 });
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many submissions — please slow down.' }), { status: 429 });
  }

  // See submit.ts for why this is awaited rather than fire-and-forget.
  await sendAdminNotification('New feedback submitted on FindVolleyball', message);

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
