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
          <p className="text-sm text-gray-400 mb-10">Last updated: March 12, 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p>
                We collect information you provide directly, including your name, email address, wallet address, and profile information. We also automatically collect usage data such as IP address, browser type, device information, and interaction patterns when you use OpenFans.
              </p>
              <p className="mt-3">
                Blockchain transactions are recorded on the Solana network and are publicly visible. We do not control or have the ability to delete on-chain transaction records.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Provide, maintain, and improve the Platform</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send you notifications related to your account and activity</li>
                <li>Detect and prevent fraud, abuse, and security incidents</li>
                <li>Comply with legal obligations and enforce our terms</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
              <p>
                We do not sell your personal information to third parties. We may share your information with service providers who assist in operating the Platform, when required by law, or to protect the rights and safety of OpenFans and its users.
              </p>
              <p className="mt-3">
                Creator profiles and public content are visible to all users of the Platform. Subscriber lists and private content are only visible to the respective creator.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information, including encryption in transit and at rest. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Cookies &amp; Tracking</h2>
              <p>
                We use essential cookies to maintain your session and preferences. We may also use analytics cookies to understand how users interact with the Platform. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:privacy@openfans.online" className="text-[#00AFF0] hover:underline">
                  privacy@openfans.online
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide services. Upon account deletion, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the Platform after changes constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@openfans.online" className="text-[#00AFF0] hover:underline">
                  privacy@openfans.online
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
