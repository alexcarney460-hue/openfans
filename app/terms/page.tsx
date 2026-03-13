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
          <p className="text-sm text-gray-400 mb-10">Last updated: March 13, 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. About the Platform</h2>
              <p>
                OpenFans is a creator subscription platform that enables content creators
                (&quot;Creators&quot;) to monetize their work through paid subscriptions from fans
                (&quot;Subscribers&quot;). The Platform operates on the Solana blockchain and processes
                all payments in USDC (USD Coin), a dollar-pegged stablecoin. By accessing and using
                OpenFans (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
                If you do not agree with any part of these terms, you must not use the Platform.
              </p>
              <p className="mt-3">
                We reserve the right to modify these terms at any time. Material changes will be
                communicated via email or an in-app notification at least 14 days before they take
                effect. Your continued use of the Platform after changes become effective constitutes
                acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Eligibility &amp; Accounts</h2>
              <p>
                You must be at least 18 years of age to create an account or use the Platform. By
                registering, you represent and warrant that you meet this age requirement and have the
                legal capacity to enter into a binding agreement in your jurisdiction.
              </p>
              <p className="mt-3">
                You are responsible for maintaining the confidentiality of your account credentials,
                including your email, password, and connected Solana wallet. You must notify us
                immediately of any unauthorized use. Each user may maintain only one account. Creating
                multiple accounts to circumvent restrictions, bans, or to manipulate the Platform in
                any way is strictly prohibited and may result in permanent suspension of all associated
                accounts.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. User Responsibilities</h2>
              <p>As a user of OpenFans, you agree to:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Provide accurate and current information during registration and at all times</li>
                <li>Comply with all applicable local, state, national, and international laws</li>
                <li>Not engage in any activity that disrupts or interferes with the Platform</li>
                <li>Not attempt to gain unauthorized access to any part of the Platform or its systems</li>
                <li>Not use automated tools, bots, or scripts to interact with the Platform without authorization</li>
                <li>Not impersonate any person or entity or misrepresent your affiliation</li>
                <li>Safeguard your Solana wallet private keys; the Platform has no ability to recover lost wallet access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Content Ownership &amp; Licensing</h2>
              <p>
                Creators retain full ownership of all content they upload to the Platform. By posting
                content, you grant OpenFans a non-exclusive, worldwide, royalty-free license to display,
                distribute, cache, and promote your content solely within the Platform and in marketing
                materials related to the Platform. This license terminates when you delete your content
                or close your account, except for cached copies that may persist for a reasonable period.
              </p>
              <p className="mt-3">
                You represent and warrant that you have all necessary rights, licenses, and permissions
                to the content you upload, and that your content does not infringe on the intellectual
                property rights of any third party. Subscribers may not redistribute, resell, or share
                any content obtained through the Platform without the explicit written consent of the
                Creator.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Prohibited Content</h2>
              <p>The following types of content are strictly prohibited on OpenFans:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Content that exploits, harms, or endangers minors in any way</li>
                <li>Non-consensual intimate imagery or &quot;revenge&quot; content</li>
                <li>Content that promotes violence, terrorism, or self-harm</li>
                <li>Illegal content, including but not limited to content depicting illegal activities</li>
                <li>Content that constitutes or promotes fraud, phishing, or scams</li>
                <li>Malware, viruses, or any other harmful software or code</li>
                <li>Content that violates the privacy rights of others without their consent</li>
                <li>Spam, misleading metadata, or deceptive practices</li>
              </ul>
              <p className="mt-3">
                We reserve the right to remove any content that violates these guidelines without
                prior notice and to suspend or permanently terminate the accounts of repeat offenders.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Payments &amp; Fees</h2>
              <p>
                All payments on OpenFans are processed using USDC on the Solana blockchain. The
                Platform charges a <strong>5% platform fee</strong> on all subscription payments and
                tips received by Creators. This fee is automatically deducted before funds are
                credited to the Creator&apos;s platform wallet.
              </p>
              <p className="mt-3">
                Subscription prices are set by Creators in USDC. Subscribers fund their platform
                wallet by depositing USDC from an external Solana wallet. Monthly subscription fees
                are automatically charged from the Subscriber&apos;s platform wallet balance. It is
                the Subscriber&apos;s responsibility to maintain sufficient balance; subscriptions
                with insufficient funds will be paused until the balance is replenished.
              </p>
              <p className="mt-3">
                Creators may withdraw their earnings to any Solana wallet that supports USDC.
                Withdrawals are subject to a minimum threshold and are processed on-chain. Blockchain
                network fees (gas fees) for withdrawals are the responsibility of the Creator.
              </p>
              <p className="mt-3">
                Refunds are handled on a case-by-case basis. Subscription payments are generally
                non-refundable once the billing period has begun, unless required by applicable law.
                You are responsible for any taxes associated with your use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. DMCA &amp; Copyright</h2>
              <p>
                OpenFans respects intellectual property rights and complies with the Digital Millennium
                Copyright Act (DMCA). If you believe your copyrighted work has been infringed upon,
                please submit a DMCA takedown notice to our designated agent at{" "}
                <a href="mailto:legal@openfans.online" className="text-[#00AFF0] hover:underline">
                  legal@openfans.online
                </a>. Your notice must include identification of the copyrighted work, the infringing
                material and its location on the Platform, your contact information, and a statement
                of good faith belief.
              </p>
              <p className="mt-3">
                Repeat infringers will have their accounts terminated. Counter-notifications may be
                filed if you believe content was removed in error, and we will process such
                notifications in accordance with applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Account Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violation
                of these terms, illegal activity, or any other reason we deem necessary to protect the
                Platform and its users. Upon termination:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Creators will have 30 days to withdraw any remaining earnings from their platform wallet</li>
                <li>Active subscriptions will be cancelled and Subscribers will not be charged further</li>
                <li>Content may be removed from the Platform</li>
                <li>On-chain transaction records will persist on the Solana blockchain and cannot be deleted</li>
              </ul>
              <p className="mt-3">
                You may voluntarily close your account at any time through your account settings.
                Account deletion is permanent and cannot be reversed.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                OpenFans is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We
                make no warranties, expressed or implied, regarding the reliability, availability, or
                accuracy of the Platform. In no event shall OpenFans, its officers, directors,
                employees, or agents be liable for any indirect, incidental, special, consequential,
                or punitive damages arising from your use of the Platform, including but not limited
                to loss of funds due to blockchain transactions, wallet compromise, or smart contract
                failures.
              </p>
              <p className="mt-3">
                The Platform does not provide custody of your cryptocurrency. You are solely
                responsible for the security of your wallet and private keys.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Governing Law &amp; Disputes</h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with the laws
                of the State of Delaware, United States, without regard to its conflict of law
                provisions. Any disputes arising from these terms or your use of the Platform shall
                be resolved through binding arbitration in accordance with the rules of the American
                Arbitration Association.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contact</h2>
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
