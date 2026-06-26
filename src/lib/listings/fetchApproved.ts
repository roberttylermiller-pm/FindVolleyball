import { supabase } from '../supabase/client';
import type { Listing } from '../../types/listing';

// RLS already restricts anon reads to approved listings — the explicit
// filter here is just to make that intent clear at the call site.
//
// Also excludes tournaments whose end_date has already passed (ROB-113)
// — unlike a recurring meetup, which just fades via the decay flag once
// it goes quiet, a finished tournament has zero ongoing relevance to
// someone browsing the map. Its permalink page stays reachable directly
// (courts/[slug].astro has no such filter) for SEO/historical reference.
export async function fetchApprovedListings(): Promise<Listing[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .or(`end_date.is.null,end_date.gte.${today}`);

  if (error) {
    throw new Error(`Failed to fetch approved listings: ${error.message}`);
  }

  return (data ?? []) as Listing[];
}
