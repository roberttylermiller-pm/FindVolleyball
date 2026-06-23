// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import vercel from '@astrojs/vercel';

// /courts/[slug] moved to SSR (ROB-72, ROB-73) so listing pages always
// reflect the live DB instead of going stale until the next deploy —
// but @astrojs/sitemap only auto-discovers prerendered routes from the
// build output, so without this it'd silently drop every court page
// from the sitemap. Fetched directly via REST rather than the
// supabase-js client to avoid pulling that dependency into config-time
// Node code; failures here shouldn't fail the build, just omit pages.
async function fetchCourtPageUrls() {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return [];

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/listings?select=slug&status=eq.approved&slug=not.is.null`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    );
    if (!response.ok) return [];
    const rows = await response.json();
    return rows.map((/** @type {{ slug: string }} */ row) => `https://findvolleyball.app/courts/${row.slug}/`);
  } catch {
    return [];
  }
}

const courtPageUrls = await fetchCourtPageUrls();

// https://astro.build/config
export default defineConfig({
  // Placeholder until the real domain is decided at deploy (ROB-36) —
  // required for the sitemap/canonical URLs to be absolute.
  site: 'https://findvolleyball.app',

  adapter: vercel(),

  integrations: [
    sitemap({
      // /admin is prerendered (just a client-rendered shell) so it'd
      // otherwise show up here despite being disallowed in robots.txt.
      filter: (page) => !page.includes('/admin'),
      customPages: courtPageUrls,
    }),
  ]
});