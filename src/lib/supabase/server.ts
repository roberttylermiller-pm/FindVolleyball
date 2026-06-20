import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-only client. Uses the service role key, which bypasses Row Level
// Security — never import this file from client-facing components.
// Intended for admin actions (review queue, reports viewer) run in Astro
// server endpoints/middleware. Untyped until real types are generated
// (`supabase gen types`).
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});
