// Some listings (private clubs without an online signup page) only have
// an email contact rather than a URL — detect that case and render a
// mailto: link instead of assuming external_link is always http(s).
export function isEmailAddress(value: string): boolean {
  return !value.includes('://') && value.includes('@');
}

export function buildExternalLinkHref(value: string): string {
  return isEmailAddress(value) ? `mailto:${value}` : value;
}
