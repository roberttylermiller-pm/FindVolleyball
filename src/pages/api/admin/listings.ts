import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../lib/supabase/server';

export const prerender = false;

// Full listing set for the admin dashboard's management table — unlike
// the public browse map, this isn't scoped to status='approved'.
export const GET: APIRoute = async ({ request, url }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const status = url.searchParams.get('status');

  let query = supabaseAdmin.from('listings').select('*').order('created_at', { ascending: false });
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const listingIds = (data ?? []).map((listing) => listing.id);
  const voteCounts = new Map<string, { upvotes: number; downvotes: number }>();

  if (listingIds.length > 0) {
    const { data: votes, error: votesError } = await supabaseAdmin
      .from('votes')
      .select('listing_id, vote_type')
      .in('listing_id', listingIds);

    if (votesError) {
      return new Response(JSON.stringify({ error: votesError.message }), { status: 500 });
    }

    for (const vote of votes ?? []) {
      const counts = voteCounts.get(vote.listing_id) ?? { upvotes: 0, downvotes: 0 };
      if (vote.vote_type === 'up') counts.upvotes += 1;
      if (vote.vote_type === 'down') counts.downvotes += 1;
      voteCounts.set(vote.listing_id, counts);
    }
  }

  const listings = (data ?? []).map((listing) => ({
    ...listing,
    upvotes: voteCounts.get(listing.id)?.upvotes ?? 0,
    downvotes: voteCounts.get(listing.id)?.downvotes ?? 0,
  }));

  return new Response(JSON.stringify({ listings }), {
    headers: { 'content-type': 'application/json' },
  });
};
