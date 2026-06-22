import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const WIDTH = 1200;
const HEIGHT = 630;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// One-off generator for the social share card (og:image) — run manually
// with `npx tsx scripts/generate-og-image.ts` whenever the logo or
// copy changes. Not part of the build; output is committed to public/.
async function main() {
  const logoPath = path.resolve(__dirname, '../src/assets/logo.png');
  const logoSize = 260;
  const pageBackground = { r: 247, g: 248, b: 250, alpha: 1 }; // #f7f8fa
  // logo.png (204x194) isn't quite square, so fit:'contain' into a square
  // box pads it — sharp defaults that padding to opaque black unless told
  // otherwise, which showed up as a stray bar above/below the mark.
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: pageBackground })
    .toBuffer();

  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${WIDTH}" height="${HEIGHT}" fill="#f7f8fa" />
      <rect x="0" y="0" width="${WIDTH}" height="10" fill="#ff7a00" />
      <text x="600" y="430" font-family="Arial, sans-serif" font-size="80" font-weight="700" fill="#1a1a1a" text-anchor="middle">FindVolleyball</text>
      <text x="600" y="485" font-family="Arial, sans-serif" font-size="34" fill="#555" text-anchor="middle">Find local volleyball meetups near you</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .composite([{ input: logo, top: 110, left: (WIDTH - logoSize) / 2 }])
    .png()
    .toFile(path.resolve(__dirname, '../public/og-image.png'));

  console.log('Wrote public/og-image.png');
}

main();
