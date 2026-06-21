import type { Visibility } from '../../types/listing';

// "Open Gym"/"Private/Club" read oddly for Grass/Beach listings (no gym
// involved) — just "Open"/"Private" works across all surface types.
export function formatVisibilityLabel(visibility: Visibility): string {
  return visibility === 'public' ? 'Open' : 'Private';
}
