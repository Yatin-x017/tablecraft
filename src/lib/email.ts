const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/** True only when all three EmailJS keys are present in .env. */
export const isEmailConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

// Dynamic import keeps the EmailJS lib out of the main bundle until it's
// actually configured and a confirmation is being sent.
type EmailJSModule = typeof import("@emailjs/browser");
let emailjsPromise: Promise<EmailJSModule> | null = null;
function loadEmailJS(): Promise<EmailJSModule> {
  emailjsPromise ??= import("@emailjs/browser");
  return emailjsPromise;
}

export interface ConfirmationEmailPayload {
  toName: string;
  toEmail: string;
  confirmationCode: string;
  startTime: string;
  endTime: string;
  partySize: number;
  dateLabel: string;
  timeLabel: string;
}

/**
 * Fires the transactional confirmation email via EmailJS (TRD §4).
 * Resolves false (never throws) when EmailJS isn't configured, so the
 * optimistic confirmation screen is never blocked on email delivery.
 */
export async function sendConfirmationEmail(payload: ConfirmationEmailPayload): Promise<boolean> {
  if (!isEmailConfigured) return false;
  try {
    const emailjs = await loadEmailJS();
    await emailjs.send(
      SERVICE_ID!,
      TEMPLATE_ID!,
      {
        to_name: payload.toName,
        to_email: payload.toEmail,
        confirmation_code: payload.confirmationCode,
        start_time: payload.timeLabel,
        date: payload.dateLabel,
        party_size: String(payload.partySize),
        restaurant_name: "Crumb & Confetti",
      },
      { publicKey: PUBLIC_KEY! }
    );
    return true;
  } catch {
    return false;
  }
}
