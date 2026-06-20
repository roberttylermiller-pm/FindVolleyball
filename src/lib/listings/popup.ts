import type { DayTime, Listing } from '../../types/listing';

function formatDayTime(dt: DayTime): string {
  const dayLabel = dt.day.charAt(0).toUpperCase() + dt.day.slice(1);
  if (!dt.start_time && !dt.end_time) return dayLabel;
  if (dt.start_time && dt.end_time) return `${dayLabel} ${dt.start_time}–${dt.end_time}`;
  return `${dayLabel} ${dt.start_time ?? dt.end_time}`;
}

// Marker popup doubles as the listing detail view (ROB-16) — full info
// inline for a quick mobile-friendly read, with a link to the static
// /courts/[slug] page (when geocoded) for the complete shareable page.
export function buildListingPopupHtml(listing: Listing): string {
  const title = listing.name ?? `${listing.type} volleyball`;
  const lines: string[] = [
    `<strong>${title}</strong>${listing.decayed ? ' <em>(decayed — may no longer be active)</em>' : ''}`,
    `${listing.type} · ${listing.cost} · ${listing.visibility === 'public' ? 'Open Gym' : 'Private/Club'}`,
  ];

  if (listing.days_times.length > 0) {
    lines.push(listing.days_times.map(formatDayTime).join(', '));
  }

  lines.push(`Sign-up required: ${listing.signup_required ? 'Yes' : 'No'}`);

  if (listing.min_skill_level) {
    lines.push(`Min skill: ${listing.min_skill_level}`);
  }

  if (listing.equipment_supplied !== null) {
    lines.push(`Equipment supplied: ${listing.equipment_supplied ? 'Yes' : 'No'}`);
  }

  if (listing.notes) {
    lines.push(listing.notes);
  }

  if (listing.slug) {
    lines.push(`<a href="/courts/${listing.slug}">View full details</a>`);
  } else if (listing.external_link) {
    lines.push(`<a href="${listing.external_link}">Join / view this meetup</a>`);
  }

  return lines.join('<br>');
}
