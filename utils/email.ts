/**
 * Email notification utility for OpenFans.
 *
 * Uses the Resend API when RESEND_API_KEY is set.
 * When the key is missing the email is silently skipped so that
 * the platform continues to work (notifications are still persisted
 * in the database via `createNotification`).
 *
 * All public functions are fire-and-forget safe — they never throw.
 */

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function wrapEmailTemplate(title: string, body: string): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #00AFF0; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">OpenFans</h2>
    </div>
    <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">${title}</h3>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">${body}</p>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      You're receiving this because you're a creator on <a href="https://openfans.online" style="color: #00AFF0; text-decoration: none;">OpenFans</a>.
    </p>
  </div>`;
}

// ---------------------------------------------------------------------------
// Core sender
// ---------------------------------------------------------------------------

interface SendEmailOptions {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

async function sendEmail({ to, subject, body }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[Email skipped - no RESEND_API_KEY] To: ${to}, Subject: ${subject}`);
    return;
  }

  const html = wrapEmailTemplate(subject, body);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "OpenFans <notifications@openfans.online>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown");
    console.error(`[Email failed] Status ${response.status}: ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Public raw sender — for pre-built HTML (e.g. onboarding templates)
// ---------------------------------------------------------------------------

/**
 * Send an email with pre-built HTML (no wrapper applied).
 * Fire-and-forget safe — resolves silently on missing API key or error.
 */
export async function sendRawEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[Email skipped - no RESEND_API_KEY] To: ${to}, Subject: ${subject}`);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OpenFans <notifications@openfans.online>",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "unknown");
      console.error(`[Email failed] Status ${response.status}: ${text}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Email error]`, error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public helpers — fire-and-forget (never throw, never block)
// ---------------------------------------------------------------------------

/**
 * Send a "new subscriber" email to a creator.
 */
export function sendNewSubscriberEmail(
  creatorEmail: string,
  subscriberName: string,
): void {
  sendEmail({
    to: creatorEmail,
    subject: "You have a new subscriber!",
    body: `<strong>@${subscriberName}</strong> just subscribed to your page. Keep creating great content!`,
  }).catch(() => {});
}

/**
 * Send a "new tip" email to a creator.
 */
export function sendNewTipEmail(
  creatorEmail: string,
  tipperName: string,
  amountDollars: string,
): void {
  sendEmail({
    to: creatorEmail,
    subject: `You received a $${amountDollars} tip!`,
    body: `<strong>@${tipperName}</strong> tipped you <strong>$${amountDollars} USDC</strong>. Nice work!`,
  }).catch(() => {});
}

/**
 * Send a "payout completed" email to a creator.
 */
export function sendPayoutCompletedEmail(
  creatorEmail: string,
  amountDollars: string,
): void {
  sendEmail({
    to: creatorEmail,
    subject: `Your payout of $${amountDollars} has been sent`,
    body: `Your payout of <strong>$${amountDollars} USDC</strong> has been sent to your wallet. It should arrive shortly.`,
  }).catch(() => {});
}

/**
 * Send a "PPV purchase" email to a creator.
 */
export function sendPpvPurchaseEmail(
  creatorEmail: string,
  postTitle: string,
  amountDollars: string,
): void {
  sendEmail({
    to: creatorEmail,
    subject: "Someone purchased your post!",
    body: `Someone just unlocked your post "<strong>${postTitle}</strong>" for <strong>$${amountDollars} USDC</strong>.`,
  }).catch(() => {});
}
