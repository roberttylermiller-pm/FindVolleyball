import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { seedListings } from './seed-data/sfv-listings';

// Runs as a plain Node script (via tsx), not through Astro/Vite — so it
// can't use import.meta.env like src/lib/supabase/server.ts does. Loads
// .env directly and builds its own admin client instead.
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  if (seedListings.length === 0) {
    console.log('No seed listings defined yet — add entries to scripts/seed-data/sfv-listings.ts');
    return;
  }

  // Seed data is Robert's own first-hand organizer knowledge, not a public
  // submission — inserted as already approved, bypassing the review queue.
  const { data, error } = await supabaseAdmin
    .from('listings')
    .insert(seedListings.map((listing) => ({ ...listing, status: 'approved' as const })))
    .select('id');

  if (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
    return;
  }

  console.log(`Seeded ${data?.length ?? 0} listing(s).`);
}

main();
