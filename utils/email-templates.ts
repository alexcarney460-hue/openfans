/**
 * Onboarding email templates for new creators.
 *
 * Each function returns { subject, html } ready for Resend.
 * All HTML uses inline styles and the OpenFans brand color #00AFF0.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://openfans.online";

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

function ctaButton(text: string, href: string): string {
  return `<a href="${href}" style="display: inline-block; background-color: #00AFF0; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-top: 16px;">${text}</a>`;
}

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #00AFF0; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">OpenFans</h1>
    </div>
    <!-- Card -->
    <div style="background: #ffffff; border-radius: 12px; padding: 32px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827;">${title}</h2>
      <div style="font-size: 15px; line-height: 1.7; color: #374151;">
        ${bodyHtml}
      </div>
    </div>
    <!-- Footer -->
    <div style="text-align: center; padding: 0 16px;">
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
        You're receiving this because you signed up as a creator on
        <a href="${BASE_URL}" style="color: #00AFF0; text-decoration: none;">OpenFans</a>.
        <br />If you no longer wish to receive onboarding tips, you can ignore this email &mdash;
        the sequence ends automatically after 7 days.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface EmailTemplate {
  readonly subject: string;
  readonly html: string;
}

/**
 * Step 0 -- Sent immediately on creator signup.
 */
export function welcomeCreatorEmail(name: string): EmailTemplate {
  return {
    subject: "Welcome to OpenFans -- let's get you set up!",
    html: layout(
      `Welcome aboard, ${name}!`,
      `<p>Congrats on creating your OpenFans creator account! You're one step closer to earning from the content you love making.</p>
       <p>Your first move: head to your dashboard and complete your profile. A polished profile helps subscribers find and trust you.</p>
       ${ctaButton("Complete Your Profile", `${BASE_URL}/dashboard/settings`)}`,
    ),
  };
}

/**
 * Step 1 -- Day 1: remind to complete avatar, bio, and subscription price.
 */
export function profileReminderEmail(name: string): EmailTemplate {
  return {
    subject: "Quick reminder: finish your creator profile",
    html: layout(
      `Hey ${name}, your profile needs a few finishing touches`,
      `<p>Creators with a photo, bio, and subscription price set get <strong>3x more subscribers</strong> in their first week.</p>
       <p>Take two minutes to add:</p>
       <ul style="padding-left: 20px; margin: 12px 0;">
         <li>A profile photo or avatar</li>
         <li>A short bio telling fans what to expect</li>
         <li>Your subscription price</li>
       </ul>
       ${ctaButton("Update Profile", `${BASE_URL}/dashboard/settings`)}`,
    ),
  };
}

/**
 * Step 2 -- Day 3: nudge to publish their first post.
 */
export function firstPostNudgeEmail(name: string): EmailTemplate {
  return {
    subject: "Ready to make your first post?",
    html: layout(
      `${name}, your audience is waiting`,
      `<p>The best time to publish your first post is <strong>now</strong>. Even a simple introduction post helps potential subscribers see what you're about.</p>
       <p>Tips for a great first post:</p>
       <ul style="padding-left: 20px; margin: 12px 0;">
         <li>Introduce yourself and what you'll be sharing</li>
         <li>Set it as <strong>free</strong> so anyone can see it</li>
         <li>Add a photo or short video for extra engagement</li>
       </ul>
       ${ctaButton("Create Your First Post", `${BASE_URL}/dashboard/posts/new`)}`,
    ),
  };
}

/**
 * Step 3 -- Day 5: connect Solana wallet for payouts.
 */
export function walletSetupEmail(name: string): EmailTemplate {
  return {
    subject: "Connect your wallet to start getting paid",
    html: layout(
      `${name}, let's connect your payout wallet`,
      `<p>You've been putting in the work -- make sure you can actually receive your earnings! Connect a Solana wallet so payouts land directly in your account.</p>
       <p>We support any Solana-compatible wallet (Phantom, Solflare, Backpack, etc.). Payouts are sent in <strong>USDC</strong> with only a 5% platform fee.</p>
       ${ctaButton("Connect Wallet", `${BASE_URL}/dashboard/settings`)}`,
    ),
  };
}

/**
 * Step 4 -- Day 7: complete KYC / identity verification.
 */
export function verificationReminderEmail(name: string): EmailTemplate {
  return {
    subject: "Get verified and unlock full creator features",
    html: layout(
      `${name}, verification unlocks everything`,
      `<p>Verified creators earn more trust, appear higher in search, and unlock all platform features.</p>
       <p>The process is quick:</p>
       <ol style="padding-left: 20px; margin: 12px 0;">
         <li>Upload a government-issued ID</li>
         <li>Take a quick selfie for identity match</li>
         <li>Our team reviews within 24 hours</li>
       </ol>
       <p>Your data is encrypted and stored securely -- we only use it for compliance verification.</p>
       ${ctaButton("Start Verification", `${BASE_URL}/dashboard/settings`)}`,
    ),
  };
}
