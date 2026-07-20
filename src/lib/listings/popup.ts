import { formatDayTime } from './formatDayTime';
import { formatDateRange } from './formatDateRange';
import { formatListingActivityLabel } from './activityLabel';
import { capitalize } from '../text';
import { formatListingTypeLabel } from './typeLabel';
import { formatListingKindLabel } from './kindLabel';
import { formatVisibilityLabel } from './visibility';
import { isEmailAddress, buildExternalLinkHref, getExternalLinkLabel } from './externalLink';
import { buildMapsHref, formatAddressDisplay } from './address';
import { logExternalLinkClick } from '../analytics/logExternalLinkClick';
import type { Listing } from '../../types/listing';

// Builds a real DOM element (not an HTML string) so vote/report buttons
// can have listeners attached directly — Leaflet's bindPopup() accepts
// either, and an element is the only way to wire up interactivity without
// re-binding on every popupopen event. Each marker gets its own element,
// so there's no delegation/cleanup to worry about.
export function buildListingPopupContent(listing: Listing): HTMLElement {
  const container = document.createElement('div');
  container.className = 'listing-popup';

  const title = listing.name ?? `${formatListingTypeLabel(listing.type).toLowerCase()} volleyball`;
  const schedule =
    listing.start_date && listing.end_date
      ? formatDateRange(listing.start_date, listing.end_date)
      : listing.days_times.length > 0
        ? listing.days_times.map(formatDayTime).join(', ')
        : null;

  container.innerHTML = `
    ${listing.photo_url ? `<img class="popup-photo" src="${listing.photo_url}" alt="${title}" />` : ''}
    <div class="popup-title-row">
      <strong class="popup-title">${title}</strong>
      <span class="popup-kind-badge popup-kind-${listing.listing_kind}">${formatListingKindLabel(listing.listing_kind)}</span>
      ${listing.decayed ? '<span class="popup-decayed">Decayed</span>' : ''}
    </div>
    ${
      listing.decayed
        ? '<div class="popup-decayed-notice">Not confirmed in over 60 days — it may no longer be happening. Vote below if you know it still is.</div>'
        : ''
    }
    ${
      formatAddressDisplay(listing)
        ? `<a class="popup-address" href="${buildMapsHref(listing)}" target="_blank" rel="noopener noreferrer">📍 ${formatAddressDisplay(listing)}</a>`
        : ''
    }
    <div class="popup-meta">${formatListingTypeLabel(listing.type)} &middot; ${listing.cost ? capitalize(listing.cost) : 'Cost unknown'} &middot; ${formatVisibilityLabel(listing.visibility)}</div>
    ${schedule ? `<div class="popup-row"><span class="popup-label">When</span>${schedule}</div>` : ''}
    ${
      // Tournaments/leagues always require signup to play in — showing
      // "Sign-up required: Yes" on every single one is just noise, not
      // information (ROB follow-up to the sign-up-required cleanup).
      listing.listing_kind === 'recurring'
        ? `<div class="popup-row"><span class="popup-label">Sign-up required</span>${listing.signup_required === null ? 'Not specified' : listing.signup_required ? 'Yes' : 'No'}</div>`
        : ''
    }
    ${listing.min_skill_level ? `<div class="popup-row"><span class="popup-label">Min skill</span>${listing.min_skill_level}</div>` : ''}
    ${listing.equipment_supplied !== null ? `<div class="popup-row"><span class="popup-label">Equipment supplied</span>${listing.equipment_supplied ? 'Yes' : 'No'}</div>` : ''}
    ${listing.payment_types ? `<div class="popup-row"><span class="popup-label">Payment</span>${listing.payment_types}</div>` : ''}
    ${listing.team_required !== null ? `<div class="popup-row"><span class="popup-label">Team required</span>${listing.team_required ? 'Yes' : 'No'}</div>` : ''}
    ${listing.notes ? `<div class="popup-notes">${listing.notes}</div>` : ''}
    ${
      listing.external_link
        ? `<a class="popup-link" href="${buildExternalLinkHref(listing.external_link)}"${isEmailAddress(listing.external_link) ? '' : ' target="_blank" rel="noopener noreferrer"'}>${getExternalLinkLabel(listing.external_link, listing.listing_kind)}${isEmailAddress(listing.external_link) ? '' : ' ↗'}</a>`
        : ''
    }
    <div class="popup-votes">
      <span>Still happening?</span>
      <button type="button" class="popup-vote-up" aria-label="Still active">👍</button>
      <button type="button" class="popup-vote-down" aria-label="No longer active">👎</button>
      <span class="popup-vote-message"></span>
    </div>
    <div class="popup-activity-date">${formatListingActivityLabel(listing.created_at, listing.updated_at)}</div>
    <button type="button" class="popup-report-toggle">Report an issue</button>
    <form class="popup-report-form" hidden>
      <label class="popup-honeypot" aria-hidden="true">
        Website
        <input type="text" name="website" tabindex="-1" autocomplete="off" />
      </label>
      <textarea name="note" maxlength="250" required placeholder="What's wrong? (250 char max)"></textarea>
      <button type="submit">Submit</button>
    </form>
    <p class="popup-report-message"></p>
    ${listing.slug ? `<a class="popup-permalink" href="/courts/${listing.slug}">Permalink</a>` : ''}
  `;

  const voteUp = container.querySelector<HTMLButtonElement>('.popup-vote-up');
  const voteDown = container.querySelector<HTMLButtonElement>('.popup-vote-down');
  const voteMessage = container.querySelector<HTMLSpanElement>('.popup-vote-message');

  async function castVote(voteType: 'up' | 'down') {
    voteUp?.setAttribute('disabled', 'true');
    voteDown?.setAttribute('disabled', 'true');

    const response = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listing_id: listing.id, vote_type: voteType }),
    });

    if (voteMessage) {
      voteMessage.textContent = response.ok ? 'Thanks!' : 'Something went wrong.';
    }
  }

  voteUp?.addEventListener('click', () => castVote('up'));
  voteDown?.addEventListener('click', () => castVote('down'));

  container.querySelector<HTMLAnchorElement>('.popup-link')?.addEventListener('click', () => {
    logExternalLinkClick(listing.id);
  });

  const reportToggle = container.querySelector<HTMLButtonElement>('.popup-report-toggle');
  const reportForm = container.querySelector<HTMLFormElement>('.popup-report-form');
  const reportMessage = container.querySelector<HTMLParagraphElement>('.popup-report-message');

  reportToggle?.addEventListener('click', () => {
    if (reportForm) reportForm.hidden = !reportForm.hidden;
  });

  reportForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(reportForm);
    const note = String(formData.get('note') ?? '').trim();
    const website = String(formData.get('website') ?? '');
    if (!note) return;

    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listing_id: listing.id, note, website }),
    });

    if (reportMessage) {
      reportMessage.textContent = response.ok ? "Thanks — we'll take a look." : 'Something went wrong.';
    }

    if (response.ok) {
      reportForm.reset();
      reportForm.hidden = true;
    }
  });

  return container;
}
