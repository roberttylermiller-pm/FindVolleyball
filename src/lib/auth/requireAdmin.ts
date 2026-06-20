import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../supabase/server';

export interface AdminAuthResult {
  userId: string;
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Verifies the request's Bearer token belongs to a signed-in admin
// (profiles.is_admin = true). Admin actions run through the service-role
// client, which bypasses RLS entirely — this check is what stands in for
// RLS on those routes. Callers do:
//   const result = await requireAdmin(request);
//   if (result instanceof Response) return result;
export async function requireAdmin(request: Request): Promise<AdminAuthResult | Response> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return jsonError(401, 'Missing Authorization header');
  }

  // Short-lived client just to validate this one token — doesn't persist
  // a session like the shared browser client does.
  const authClient = createClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
  const { data: userData, error: userError } = await authClient.auth.getUser(token);

  if (userError || !userData.user) {
    return jsonError(401, 'Invalid or expired session');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return jsonError(403, 'Not authorized');
  }

  return { userId: userData.user.id };
}
