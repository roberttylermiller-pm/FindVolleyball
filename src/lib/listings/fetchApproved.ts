import { supabase } from '../supabase/client';
import type { Listing } from '../../types/listing';

// RLS already restricts anon reads to approved listings — the explicit
// filter here is just to make that intent clear at the call site.
export async function fetchApprovedListings(): Promise<Listing[]> {
  const { data, error } = await supabase.from('listings').select('*').eq('status', 'approved');

  if (error) {
    throw new Error(`Failed to fetch approved listings: ${error.message}`);
  }

  return (data ?? []) as Listing[];
}
