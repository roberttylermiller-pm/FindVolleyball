import 'dotenv/config';
import { assignPseoFields, findUniqueSlug } from '../src/lib/listings/pseo';
import { createAdminClient } from './lib/admin-client';

const supabaseAdmin = createAdminClient();

// Nominatim's usage policy caps anonymous use at ~1 request/second.
const GEOCODE_DELAY_MS = 1100;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
      const slug = await findUniqueSlug(supabaseAdmin, candidateSlug);

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
