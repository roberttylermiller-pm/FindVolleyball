import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-only client. Uses the service role key, which bypasses Row Level
// Security — never import this file from client-facing components.
// Intended for admin actions (review queue, reports viewer) run in Astro
// server endpoints/middleware.
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});
