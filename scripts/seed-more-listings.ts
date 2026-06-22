import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { assignPseoFields, findUniqueSlug } from '../src/lib/listings/pseo';
import { createAdminClient } from './lib/admin-client';
import { moreListings } from './seed-data/more-listings';

const supabaseAdmin = createAdminClient();

// Nominatim's usage policy caps anonymous use at ~1 request/second.
const GEOCODE_DELAY_MS = 1100;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Same approach as seed.ts (ROB-17), split into its own script/file
// rather than appended to sfv-listings.ts so the two batches (and their
// separate provenance/review) stay easy to tell apart.
async function main() {
  const rows = [];
  for (const listing of moreListings) {
    const id = randomUUID();

    try {
      const pseo = await assignPseoFields({
        id,
        lat: listing.lat,
        lng: listing.lng,
        type: listing.type,
        name: listing.name,
      });
      const slug = await findUniqueSlug(supabaseAdmin, pseo.slug);
      rows.push({ ...listing, id, status: 'approved' as const, ...pseo, slug });
    } catch (err) {
      console.error(`Skipping "${listing.name ?? id}":`, err instanceof Error ? err.message : err);
    }

    await sleep(GEOCODE_DELAY_MS);
  }

  if (rows.length === 0) {
    console.log('No listings were successfully geocoded — nothing to insert.');
    process.exitCode = 1;
    return;
  }

  const { data, error } = await supabaseAdmin.from('listings').insert(rows).select('id');

  if (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
    return;
  }

  console.log(`Seeded ${data?.length ?? 0} listing(s).`);
}

main();
