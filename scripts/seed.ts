import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { assignPseoFields } from '../src/lib/listings/pseo';
import { createAdminClient } from './lib/admin-client';
import { seedListings } from './seed-data/sfv-listings';

const supabaseAdmin = createAdminClient();

// Nominatim's usage policy caps anonymous use at ~1 request/second.
const GEOCODE_DELAY_MS = 1100;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (seedListings.length === 0) {
    console.log('No seed listings defined yet — add entries to scripts/seed-data/sfv-listings.ts');
    return;
  }

  // Seed data is Robert's own first-hand organizer knowledge, not a public
  // submission — inserted as already approved, bypassing the review queue.
  // pSEO fields (city/neighborhood/slug) are assigned up front so each
  // listing has a working /courts/[slug] page as soon as it's seeded.
  const rows = [];
  for (const listing of seedListings) {
    const id = randomUUID();
    const pseo = await assignPseoFields({
      id,
      lat: listing.lat,
      lng: listing.lng,
      type: listing.type,
      name: listing.name,
    });
    rows.push({ ...listing, id, status: 'approved' as const, ...pseo });
    await sleep(GEOCODE_DELAY_MS);
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
