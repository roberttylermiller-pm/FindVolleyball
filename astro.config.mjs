// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import vercel from '@astrojs/vercel';

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
    }),
  ]
});