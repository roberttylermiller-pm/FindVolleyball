// Admin notification emails (ROB-102) — new listing submissions and
// reports. Uses Resend's REST API directly (no SDK dependency needed
// for a single endpoint call). Sends from Resend's shared
// onboarding@resend.dev address, which works for any account with no
// domain verification required — fine for an admin-only internal
// notification; switch to a findvolleyball.app sender once that
// domain is verified in Resend if a nicer "from" address matters.
const ADMIN_EMAIL = 'robert.tyler.miller@gmail.com';
const FROM_ADDRESS = 'FindVolleyball <onboarding@resend.dev>';

export async function sendAdminNotification(subject: string, body: string): Promise<void> {
  const apiKey = import.meta.env.RESEND_API_KEY;

  // No-op rather than throw when unconfigured — a missing notification
  // email should never break the submission/report flow it's attached
  // to. Logged so it's visible in Vercel function logs if it's
  // unexpectedly still unset.
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping admin notification:', subject);
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: ADMIN_EMAIL,
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      console.error('Admin notification email failed:', response.status, await response.text().catch(() => ''));
    }
  } catch (err) {
    console.error('Admin notification email failed:', err instanceof Error ? err.message : err);
  }
}
