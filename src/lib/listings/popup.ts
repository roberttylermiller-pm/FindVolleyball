import { supabase } from '../supabase/client';
import { formatDayTime } from './formatDayTime';
import { capitalize } from '../text';
import type { Listing } from '../../types/listing';

// Builds a real DOM element (not an HTML string) so vote/report buttons
// can have listeners attached directly — Leaflet's bindPopup() accepts
// either, and an element is the only way to wire up interactivity without
// re-binding on every popupopen event. Each marker gets its own element,
// so there's no delegation/cleanup to worry about.
export function buildListingPopupContent(listing: Listing): HTMLElement {
  const container = document.createElement('div');
  container.className = 'listing-popup';

  const title = listing.name ?? `${listing.type} volleyball`;
  const schedule = listing.days_times.length > 0 ? listing.days_times.map(formatDayTime).join(', ') : null;

  container.innerHTML = `
    <div class="popup-title-row">
      <strong class="popup-title">${title}</strong>
      ${listing.decayed ? '<span class="popup-decayed">Decayed</span>' : ''}
    </div>
    <div class="popup-meta">${capitalize(listing.type)} &middot; ${capitalize(listing.cost)} &middot; ${listing.visibility === 'public' ? 'Open Gym' : 'Private/Club'}</div>
    ${schedule ? `<div class="popup-row">${schedule}</div>` : ''}
    <div class="popup-row">Sign-up required: ${listing.signup_required ? 'Yes' : 'No'}</div>
    ${listing.min_skill_level ? `<div class="popup-row">Min skill: ${listing.min_skill_level}</div>` : ''}
    ${listing.equipment_supplied !== null ? `<div class="popup-row">Equipment supplied: ${listing.equipment_supplied ? 'Yes' : 'No'}</div>` : ''}
    ${listing.notes ? `<div class="popup-notes">${listing.notes}</div>` : ''}
    ${
      listing.external_link
        ? `<a class="popup-link" href="${listing.external_link}" target="_blank" rel="noopener noreferrer">Join / view this meetup ↗</a>`
        : ''
    }
    <div class="popup-votes">
      <span>Still happening?</span>
      <button type="button" class="popup-vote-up" aria-label="Still active">👍</button>
      <button type="button" class="popup-vote-down" aria-label="No longer active">👎</button>
      <span class="popup-vote-message"></span>
    </div>
    <button type="button" class="popup-report-toggle">Report an issue</button>
    <form class="popup-report-form" hidden>
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

    const { error } = await supabase.from('votes').insert({ listing_id: listing.id, vote_type: voteType });

    if (voteMessage) {
      voteMessage.textContent = error ? 'Something went wrong.' : 'Thanks!';
    }
  }

  voteUp?.addEventListener('click', () => castVote('up'));
  voteDown?.addEventListener('click', () => castVote('down'));

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
    if (!note) return;

    const { error } = await supabase.from('reports').insert({ listing_id: listing.id, note });

    if (reportMessage) {
      reportMessage.textContent = error ? 'Something went wrong.' : "Thanks — we'll take a look.";
    }

    if (!error) {
      reportForm.reset();
      reportForm.hidden = true;
    }
  });

  return container;
}
