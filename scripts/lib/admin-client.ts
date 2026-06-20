import { createClient } from '@supabase/supabase-js';

// Scripts run as plain Node (via tsx), not through Astro/Vite — so they
// can't use import.meta.env like src/lib/supabase/server.ts does. Callers
// must load .env (e.g. `import 'dotenv/config'`) before calling this.
export function createAdminClient() {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}
