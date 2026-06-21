// Shared by login.astro, signup.astro, and GoogleSignInButton.astro so a
// "?redirect=/submit" param survives sign-in regardless of which auth
// method (or which of login/signup) the user ends up using.
export function getRedirectParam(): string {
  return new URLSearchParams(window.location.search).get('redirect') || '/';
}
