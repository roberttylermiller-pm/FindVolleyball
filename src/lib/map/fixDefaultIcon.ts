import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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
