import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: March 13, 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p>We collect the following types of information when you use OpenFans:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Account Information:</strong> Name, email address, username, display name,
                  profile bio, and avatar/banner images you provide during registration and profile setup.
                </li>
                <li>
                  <strong>Wallet Information:</strong> Your Solana wallet public address when you
                  connect a wallet for payouts or payments. We never have access to your private keys.
                </li>
                <li>
                  <strong>Payment Data:</strong> Transaction records including subscription payments,
                  tips, deposits, and withdrawals processed through the Platform. All USDC transactions
                  are recorded on the Solana blockchain and are publicly visible.
                </li>
                <li>
                  <strong>Content:</strong> Any content you upload, including images, videos, text posts,
                  and messages sent through the Platform.
                </li>
                <li>
                  <strong>Usage Data:</strong> IP address, browser type and version, device information,
                  operating system, referring URLs, pages visited, interaction patterns, and timestamps
                  collected automatically when you use the Platform.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Provide, maintain, and improve the Platform and its features</li>
                <li>Process payments, manage subscriptions, and calculate platform fees</li>
                <li>Send you notifications related to your account, subscriptions, and earnings</li>
                <li>Detect and prevent fraud, abuse, unauthorized access, and security incidents</li>
                <li>Enforce our Terms of Service and content policies</li>
                <li>Comply with legal obligations, including tax reporting requirements</li>
                <li>Analyze usage patterns to improve user experience and Platform performance</li>
                <li>Communicate with you about updates, changes, or issues related to your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Data Storage &amp; Infrastructure</h2>
              <p>
                Your account data, content metadata, and Platform records are stored securely using{" "}
                <strong>Supabase</strong>, a managed database platform with data centers in the
                United States. Data is encrypted in transit (TLS) and at rest (AES-256). Database
                backups are performed regularly and retained for disaster recovery purposes.
              </p>
              <p className="mt-3">
                <strong>Blockchain Data:</strong> All USDC payment transactions, subscription records,
                and wallet interactions are recorded on the Solana blockchain. On-chain data is
                permanent, publicly visible, and cannot be modified or deleted by OpenFans or any
                party. Your Solana wallet address and transaction history are inherently public
                information on the blockchain.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Information Sharing</h2>
              <p>
                We do not sell, rent, or trade your personal information to third parties for marketing
                purposes. We may share your information in the following circumstances:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Service Providers:</strong> With trusted third-party services that help us
                  operate the Platform, including Supabase (database), Solana RPC providers (blockchain
                  interaction), and analytics services. These providers are contractually bound to
                  protect your data.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law, subpoena, court order, or
                  government request, or to protect the rights, safety, and property of OpenFans and
                  its users.
                </li>
                <li>
                  <strong>Public Profiles:</strong> Creator profiles, display names, avatars, and
                  public content are visible to all users of the Platform. Subscriber lists and
                  private content are only visible to the respective Creator.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a merger, acquisition, or
                  sale of assets, your information may be transferred as part of the transaction.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Cookies &amp; Tracking</h2>
              <p>
                We use the following types of cookies and similar technologies:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Essential Cookies:</strong> Required for authentication, session management,
                  and security. These cannot be disabled without breaking core Platform functionality.
                </li>
                <li>
                  <strong>Preference Cookies:</strong> Store your settings and preferences (theme,
                  language, notification settings) to personalize your experience.
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how users interact with the
                  Platform, which pages are most visited, and where users encounter issues. We may
                  use privacy-respecting analytics tools that do not track users across websites.
                </li>
              </ul>
              <p className="mt-3">
                You can control cookie preferences through your browser settings. Disabling essential
                cookies may prevent you from using the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Third-Party Services</h2>
              <p>OpenFans integrates with the following third-party services:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Supabase:</strong> Database hosting, authentication, and file storage.
                  Subject to Supabase&apos;s privacy policy.
                </li>
                <li>
                  <strong>Solana Network:</strong> Blockchain infrastructure for USDC payments and
                  wallet interactions. On-chain data is publicly accessible and governed by the
                  decentralized Solana protocol.
                </li>
                <li>
                  <strong>Wallet Providers:</strong> When you connect a Solana wallet (Phantom,
                  Solflare, etc.), your interaction with that wallet is governed by the wallet
                  provider&apos;s own terms and privacy policy.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Your Rights (GDPR &amp; Global Privacy)</h2>
              <p>
                Regardless of your location, we respect your privacy rights. If you are a resident of
                the European Economic Area (EEA), United Kingdom, California, or any jurisdiction with
                applicable privacy legislation, you have the following rights:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Right of Access:</strong> Request a copy of the personal information we hold
                  about you.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Request correction of inaccurate or
                  incomplete personal information.
                </li>
                <li>
                  <strong>Right to Erasure:</strong> Request deletion of your account and associated
                  personal data, subject to legal retention obligations. Note that on-chain blockchain
                  data cannot be erased.
                </li>
                <li>
                  <strong>Right to Restriction:</strong> Request that we limit the processing of your
                  personal data in certain circumstances.
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> Request your data in a structured,
                  commonly used, machine-readable format.
                </li>
                <li>
                  <strong>Right to Object:</strong> Object to the processing of your personal data
                  for certain purposes, including direct marketing.
                </li>
                <li>
                  <strong>Right to Withdraw Consent:</strong> Where processing is based on consent,
                  you may withdraw it at any time without affecting the lawfulness of prior processing.
                </li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:privacy@openfans.online" className="text-[#00AFF0] hover:underline">
                  privacy@openfans.online
                </a>. We will respond to your request within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed
                to provide services. Upon account deletion:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Your profile data, content, and messages will be removed within 30 days</li>
                <li>Transaction records may be retained for up to 7 years for legal and tax compliance</li>
                <li>Anonymized, aggregated analytics data may be retained indefinitely</li>
                <li>On-chain blockchain records are permanent and cannot be deleted by any party</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information,
                including encryption in transit (TLS 1.3) and at rest (AES-256), secure authentication
                with session management, and regular security audits. Access to personal data is
                restricted to authorized personnel on a need-to-know basis.
              </p>
              <p className="mt-3">
                However, no method of transmission over the Internet or electronic storage is 100%
                secure. We cannot guarantee absolute security and recommend that you use a strong,
                unique password and enable two-factor authentication when available.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Children&apos;s Privacy</h2>
              <p>
                OpenFans is not intended for use by anyone under the age of 18. We do not knowingly
                collect personal information from minors. If we discover that a user under 18 has
                created an account, we will promptly terminate it and delete associated data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any
                material changes by posting the updated policy on this page, updating the &quot;Last
                updated&quot; date, and sending a notification via email or in-app alert. Your
                continued use of the Platform after changes become effective constitutes acceptance
                of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your data
                rights, please contact us at{" "}
                <a href="mailto:privacy@openfans.online" className="text-[#00AFF0] hover:underline">
                  privacy@openfans.online
                </a>.
              </p>
              <p className="mt-3">
                For general support inquiries, you can reach us at{" "}
                <a href="mailto:support@openfans.online" className="text-[#00AFF0] hover:underline">
                  support@openfans.online
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
