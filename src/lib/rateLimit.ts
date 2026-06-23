import type { SupabaseClient } from '@supabase/supabase-js';

// Service-role-only counter (see rate_limit_events migration) — checks
// how many events with this key landed within the window, then records
// this attempt regardless of outcome (a blocked attempt still counts,
// so a script hammering the endpoint can't reset its own window by
// retrying).
export async function checkRateLimit(
  client: SupabaseClient,
  key: string,
  { windowMs, max }: { windowMs: number; max: number },
): Promise<{ allowed: boolean }> {
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count, error: countError } = await client
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', since);

  if (countError) {
    // Fails open — a counting error shouldn't block real submissions,
    // and this table has no other consumers that would be harmed by it.
    console.error('Rate limit check failed:', countError.message);
    return { allowed: true };
  }

  await client.from('rate_limit_events').insert({ key });

  return { allowed: (count ?? 0) < max };
}

// IPv4/IPv6 may both show up as a comma-separated list when requests
// pass through Vercel's edge network — the first entry is the original
// client.
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}
