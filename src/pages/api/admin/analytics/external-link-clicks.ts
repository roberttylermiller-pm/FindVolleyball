import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const prerender = false;

interface ClickRow {
  listing_id: string;
  created_at: string;
  listings: { name: string | null; type: string; slug: string | null; listing_kind: string } | null;
}

// Aggregated server-side rather than shipping every raw row to the
// client — the dashboard only ever needs per-listing totals, and this
// table has no cap on how many rows a popular listing can accumulate.
export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { data, error } = await supabaseAdmin
    .from('external_link_clicks')
    .select('listing_id, created_at, listings(name, type, slug, listing_kind)')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const rows = (data ?? []) as unknown as ClickRow[];
  const byListing = new Map<
    string,
    { listingId: string; name: string | null; type: string; slug: string | null; listingKind: string; count: number; lastClickedAt: string }
  >();

  for (const row of rows) {
    const existing = byListing.get(row.listing_id);
    if (existing) {
      existing.count += 1;
      continue;
    }
    byListing.set(row.listing_id, {
      listingId: row.listing_id,
      name: row.listings?.name ?? null,
      type: row.listings?.type ?? 'unknown',
      slug: row.listings?.slug ?? null,
      listingKind: row.listings?.listing_kind ?? 'recurring',
      count: 1,
      // Rows are ordered newest-first, so the first row seen per listing
      // is that listing's most recent click.
      lastClickedAt: row.created_at,
    });
  }

  const clicks = [...byListing.values()].sort((a, b) => b.count - a.count);

  return new Response(JSON.stringify({ clicks, total: rows.length }), {
    headers: { 'content-type': 'application/json' },
  });
};
