import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function RefundPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Refund Policy
          </h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: March 13, 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. General Policy</h2>
              <p>
                OpenFans provides access to digital content through paid subscriptions, pay-per-view
                (PPV) purchases, and tips. Due to the nature of digital content, all purchases are
                generally <strong>non-refundable</strong> once the content has been accessed or
                delivered. By completing a purchase on the Platform, you acknowledge and agree to
                this policy.
              </p>
              <p className="mt-3">
                All payments on OpenFans are processed in USDC on the Solana blockchain. Once a
                blockchain transaction is confirmed, it cannot be reversed by OpenFans or any
                third party. Refunds, where approved, are processed as new transactions to your
                platform wallet.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Subscription Cancellations</h2>
              <p>
                You may cancel your subscription to any Creator at any time through your account
                settings. Cancellation terms are as follows:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>No Refund for Current Period:</strong> When you cancel a subscription,
                  you will retain access to the Creator&apos;s content for the remainder of your
                  current billing period. No refund will be issued for the unused portion of the
                  current period.
                </li>
                <li>
                  <strong>Stops Future Renewal:</strong> Cancellation prevents automatic renewal
                  at the end of the current billing period. You will not be charged again unless
                  you re-subscribe.
                </li>
                <li>
                  <strong>Immediate Effect:</strong> If you cancel and wish to lose access
                  immediately rather than at the end of the billing period, you may do so, but no
                  refund will be provided.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Pay-Per-View (PPV) Content</h2>
              <p>
                PPV content purchases are non-refundable once the content has been unlocked and
                accessed. A refund may be considered in the following limited circumstances:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Content Not Delivered:</strong> If you purchased PPV content and it
                  failed to unlock or was not accessible due to a technical error on the
                  Platform&apos;s side.
                </li>
                <li>
                  <strong>Misleading Description:</strong> If the content was materially different
                  from what was described or advertised by the Creator, and a complaint has been
                  verified by our moderation team.
                </li>
                <li>
                  <strong>Creator Account Terminated:</strong> If the Creator&apos;s account is
                  terminated by OpenFans and the PPV content becomes permanently inaccessible
                  before you had a reasonable opportunity to view it.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Tips</h2>
              <p>
                Tips sent to Creators are voluntary payments made at your sole discretion.
                <strong> All tips are non-refundable.</strong> Tips are immediately credited to
                the Creator&apos;s platform wallet (minus the platform fee) and cannot be reversed.
                Please ensure you intend to send a tip before confirming the transaction.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Fraud &amp; Unauthorized Charges</h2>
              <p>
                If you believe your account has been compromised or that unauthorized transactions
                have been made from your platform wallet, please contact us immediately:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  Email{" "}
                  <a href="mailto:support@openfans.online" className="text-[#00AFF0] hover:underline">
                    support@openfans.online
                  </a>{" "}
                  with &quot;UNAUTHORIZED TRANSACTION&quot; in the subject line.
                </li>
                <li>Include your username, the transaction details, and the approximate date and time of the unauthorized activity.</li>
                <li>Secure your account by changing your password immediately.</li>
              </ul>
              <p className="mt-3">
                We will investigate all reports of unauthorized transactions. If we determine that
                a transaction was indeed unauthorized, we will issue a refund to your platform
                wallet and take appropriate action to secure your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. How to Request a Refund</h2>
              <p>
                To request a refund for an eligible purchase, please follow these steps:
              </p>
              <ul className="mt-2 list-decimal space-y-1.5 pl-5">
                <li>
                  Send an email to{" "}
                  <a href="mailto:support@openfans.online" className="text-[#00AFF0] hover:underline">
                    support@openfans.online
                  </a>{" "}
                  with &quot;REFUND REQUEST&quot; in the subject line.
                </li>
                <li>Include your username and the email address associated with your account.</li>
                <li>Provide the transaction ID or details of the purchase you are requesting a refund for.</li>
                <li>Explain the reason for your refund request.</li>
                <li>Attach any supporting evidence (screenshots, error messages, etc.).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Processing Timeframes</h2>
              <p>
                Refund requests are processed according to the following timeframes:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Acknowledgment:</strong> You will receive a confirmation that your refund
                  request has been received within two (2) business days.
                </li>
                <li>
                  <strong>Review:</strong> Refund requests are reviewed within five (5) to ten (10)
                  business days of submission.
                </li>
                <li>
                  <strong>Resolution:</strong> If your refund is approved, the USDC amount will be
                  credited to your platform wallet within three (3) business days of approval. If
                  denied, you will receive a written explanation.
                </li>
                <li>
                  <strong>Withdrawal:</strong> Once the refund is in your platform wallet, you
                  may withdraw it to your external Solana wallet at any time, subject to standard
                  withdrawal minimums and network fees.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Exceptions</h2>
              <p>
                OpenFans may issue refunds outside the scope of this policy at its sole discretion,
                including in cases where applicable consumer protection laws require it. Nothing
                in this policy affects your statutory rights as a consumer in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Contact</h2>
              <p>
                For refund requests or billing questions, please contact us at{" "}
                <a href="mailto:support@openfans.online" className="text-[#00AFF0] hover:underline">
                  support@openfans.online
                </a>. For general legal inquiries, contact{" "}
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
