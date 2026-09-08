import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const prerender = false;

interface ClickRow {
  listing_id: string;
  created_at: string;
  listings: { name: string | null; type: string; slug: string | null; listing_kind: string } | null;
}

interface ListingClickSummary {
  listingId: string;
  name: string | null;
  type: string;
  slug: string | null;
  listingKind: string;
  count: number;
}

// Aggregated server-side rather than shipping every raw row to the
// client — the dashboard only ever needs per-listing totals (plus a
// per-day breakdown for the "what got clicked on date X" card), and
// this table has no cap on how many rows a popular listing can
// accumulate.
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
  const byListing = new Map<string, ListingClickSummary & { lastClickedAt: string }>();
  // Keyed by the UTC calendar date ("YYYY-MM-DD") each click's
  // created_at falls on, so the client can show "what was clicked on
  // date X" without needing every raw row.
  const byDate = new Map<string, Map<string, ListingClickSummary>>();

  for (const row of rows) {
    const existing = byListing.get(row.listing_id);
    if (existing) {
      existing.count += 1;
    } else {
      byListing.set(row.listing_id, {
        listingId: row.listing_id,
        name: row.listings?.name ?? null,
        type: row.listings?.type ?? 'unknown',
        slug: row.listings?.slug ?? null,
        listingKind: row.listings?.listing_kind ?? 'recurring',
        count: 1,
        // Rows are ordered newest-first, so the first row seen per
        // listing is that listing's most recent click.
        lastClickedAt: row.created_at,
      });
    }

    const dateKey = row.created_at.slice(0, 10);
    let dayMap = byDate.get(dateKey);
    if (!dayMap) {
      dayMap = new Map();
      byDate.set(dateKey, dayMap);
    }
    const dayEntry = dayMap.get(row.listing_id);
    if (dayEntry) {
      dayEntry.count += 1;
    } else {
      dayMap.set(row.listing_id, {
        listingId: row.listing_id,
        name: row.listings?.name ?? null,
        type: row.listings?.type ?? 'unknown',
        slug: row.listings?.slug ?? null,
        listingKind: row.listings?.listing_kind ?? 'recurring',
        count: 1,
      });
    }
  }

  const clicks = [...byListing.values()].sort((a, b) => b.count - a.count);
  const byDateJson = Object.fromEntries(
    [...byDate.entries()].map(([date, dayMap]) => [date, [...dayMap.values()].sort((a, b) => b.count - a.count)]),
  );

  return new Response(JSON.stringify({ clicks, total: rows.length, byDate: byDateJson }), {
    headers: { 'content-type': 'application/json' },
  });
};
