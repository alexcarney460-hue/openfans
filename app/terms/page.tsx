import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: March 12, 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Terms of Use</h2>
              <p>
                By accessing and using OpenFans (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the Platform. We reserve the right to modify these terms at any time, and your continued use of the Platform constitutes acceptance of any changes.
              </p>
              <p className="mt-3">
                You must be at least 18 years of age to create an account or use the Platform. By using OpenFans, you represent and warrant that you meet this age requirement and have the legal capacity to enter into a binding agreement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
              <p className="mt-3">
                Each user may only maintain one account. Creating multiple accounts to circumvent restrictions, bans, or to manipulate the Platform in any way is strictly prohibited and may result in permanent suspension.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Content Policy</h2>
              <p>
                Creators retain ownership of all content they upload to the Platform. By posting content, you grant OpenFans a non-exclusive, worldwide license to display, distribute, and promote your content within the Platform. You represent that you have all necessary rights to the content you upload.
              </p>
              <p className="mt-3">
                Content that is illegal, fraudulent, defamatory, or that infringes on the intellectual property rights of others is strictly prohibited. We reserve the right to remove any content that violates these guidelines without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Payments</h2>
              <p>
                All payments on OpenFans are processed using USDC on the Solana blockchain. Subscription fees, tips, and content purchases are subject to a platform fee as outlined in our pricing page. Creators receive payouts according to the schedule and terms outlined in their creator agreement.
              </p>
              <p className="mt-3">
                Refunds are handled on a case-by-case basis. Subscription payments are non-refundable once the billing period has begun unless required by applicable law. You are responsible for any taxes associated with your use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. DMCA &amp; Copyright</h2>
              <p>
                OpenFans respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe your copyrighted work has been infringed upon, please submit a DMCA takedown notice to our designated agent at legal@openfans.online.
              </p>
              <p className="mt-3">
                Repeat infringers will have their accounts terminated. Counter-notifications may be filed if you believe content was removed in error, and we will process such notifications in accordance with applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Privacy</h2>
              <p>
                Your use of OpenFans is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Platform, you consent to the data practices described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
              <p>
                OpenFans is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We make no warranties, expressed or implied, regarding the reliability, availability, or accuracy of the Platform. In no event shall OpenFans be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:legal@openfans.online" className="text-[#00AFF0] hover:underline">
                  legal@openfans.online
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
