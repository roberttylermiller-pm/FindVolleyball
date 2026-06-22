// Some listings (private clubs without an online signup page) only have
// an email contact rather than a URL — detect that case and render a
// mailto: link instead of assuming external_link is always http(s).
export function isEmailAddress(value: string): boolean {
  return !value.includes('://') && value.includes('@');
}

export function buildExternalLinkHref(value: string): string {
  return isEmailAddress(value) ? `mailto:${value}` : value;
}

// "View this meetup" doesn't make sense for a bare email contact. The
// mailto: link only does anything if the user's OS has a default mail
// client registered — many don't — so the label shows the actual
// address rather than a generic "Contact" word, since that's the part
// that's actually useful if the click does nothing.
export function getExternalLinkLabel(value: string): string {
  return isEmailAddress(value) ? value : 'View this meetup';
}
