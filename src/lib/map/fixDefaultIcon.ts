import L from 'leaflet';
// The `?url` suffix forces a plain Vite asset import (resolves to a
// string URL). Without it, Astro's image pipeline intercepts .png
// imports project-wide and returns an ImageMetadata object instead — so
// Leaflet's iconUrl option (which requires a string) ends up being the
// literal text "[object Object]", rendering as a broken image.
import markerIcon from 'leaflet/dist/images/marker-icon.png?url';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png?url';
import markerShadow from 'leaflet/dist/images/marker-shadow.png?url';

let fixed = false;

// Leaflet's default marker icon paths assume a non-bundled asset layout;
// under Vite they 404 unless re-pointed at the bundled URLs. Idempotent
// since multiple components on a page may call this.
export function fixDefaultMarkerIcon() {
  if (fixed) return;
  fixed = true;

  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
  });
}
