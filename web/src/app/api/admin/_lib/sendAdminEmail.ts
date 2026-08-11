import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendAdminEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!resend) {
    console.warn('[Admin Email] RESEND_API_KEY is missing. Email dispatch skipped:', { to, subject });
    return false;
  }
  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Picklers <onboarding@resend.dev>';
    await resend.emails.send({
      from: fromAddress,
      to: to,
      subject: subject,
      text: body,
    });
    return true;
  } catch (err) {
    console.error('[Admin Email] Error dispatching Resend email:', err);
    return false;
  }
}
