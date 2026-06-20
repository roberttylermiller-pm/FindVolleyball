import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Browser-side client. Uses the anon key, safe to expose to the client —
// table access is restricted by Supabase Row Level Security policies.
// Untyped until real types are generated (`supabase gen types`) — see
// the now-removed src/types/database.ts placeholder for why.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
