import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Browser-side client. Uses the anon key, safe to expose to the client —
// table access is restricted by Supabase Row Level Security policies.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
