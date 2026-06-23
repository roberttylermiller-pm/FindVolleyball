import { createClient } from '@supabase/supabase-js';

export interface UserAuthResult {
  userId: string;
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Same Bearer-token verification as requireAdmin.ts, minus the
// is_admin check — for endpoints any signed-in user can call (listing
// submission), where the server still needs to know *which* user so it
// can set submitted_by itself rather than trusting a client-supplied
// value.
export async function requireUser(request: Request): Promise<UserAuthResult | Response> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return jsonError(401, 'Missing Authorization header');
  }

  const authClient = createClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
  const { data: userData, error: userError } = await authClient.auth.getUser(token);

  if (userError || !userData.user) {
    return jsonError(401, 'Invalid or expired session');
  }

  return { userId: userData.user.id };
}
