import 'dotenv/config';
import { assignPseoFields } from '../src/lib/listings/pseo';
import { createAdminClient } from './lib/admin-client';

const supabaseAdmin = createAdminClient();

// Nominatim's usage policy caps anonymous use at ~1 request/second.
const GEOCODE_DELAY_MS = 1100;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function uniqueSlug(candidate: string): Promise<string> {
  let slug = candidate;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return slug;

    slug = `${candidate}-${suffix}`;
    suffix += 1;
  }
}

async function main() {
  const { data: listings, error } = await supabaseAdmin
    .from('listings')
    .select('id, lat, lng, type, name')
    .is('slug', null);

  if (error) {
    console.error('Failed to fetch listings:', error.message);
    process.exitCode = 1;
    return;
  }

  if (!listings || listings.length === 0) {
    console.log('No listings missing pSEO fields.');
    return;
  }

  for (const listing of listings) {
    try {
      const { city, neighborhood, slug: candidateSlug, last_verified_date } =
        await assignPseoFields(listing);
      const slug = await uniqueSlug(candidateSlug);

      const { error: updateError } = await supabaseAdmin
        .from('listings')
        .update({ city, neighborhood, slug, last_verified_date })
        .eq('id', listing.id);

      if (updateError) throw updateError;

      console.log(`Assigned ${slug} to listing ${listing.id}`);
    } catch (err) {
      console.error(`Failed to backfill listing ${listing.id}:`, err instanceof Error ? err.message : err);
    }

    await sleep(GEOCODE_DELAY_MS);
  }
}

main();
