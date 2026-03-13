import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function AntiSlaveryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Anti-Slavery &amp; Human Trafficking Statement
          </h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: March 13, 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Our Commitment</h2>
              <p>
                OpenFans is committed to preventing modern slavery and human trafficking in all
                aspects of our business and supply chain. This statement is made pursuant to
                Section 54 of the UK Modern Slavery Act 2015 and the California Transparency in
                Supply Chains Act of 2010 (SB 657).
              </p>
              <p className="mt-3">
                We recognize that modern slavery is a serious crime and a grave violation of
                fundamental human rights. It takes various forms, including servitude, forced and
                compulsory labor, and human trafficking, all of which involve the deprivation of
                a person&apos;s liberty by another in order to exploit them for personal or
                commercial gain.
              </p>
              <p className="mt-3">
                OpenFans has a zero-tolerance approach to modern slavery and human trafficking.
                We are committed to acting ethically and with integrity in all our business
                dealings and relationships, and to implementing and enforcing effective systems
                and controls to ensure modern slavery is not taking place anywhere within our
                business or in any part of our supply chain.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Our Business &amp; Supply Chain</h2>
              <p>
                OpenFans operates a digital platform that enables content creators to monetize
                their work through paid subscriptions and direct support from fans. Our supply
                chain primarily consists of:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Technology infrastructure providers (cloud hosting, databases, blockchain services)</li>
                <li>Payment processing services and blockchain networks</li>
                <li>Identity verification and compliance service providers</li>
                <li>Professional service providers (legal, accounting, consulting)</li>
                <li>Content creators who use our Platform as independent contractors</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Due Diligence Processes</h2>
              <p>
                OpenFans has implemented the following due diligence processes to identify and
                mitigate the risk of modern slavery and human trafficking:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Creator Verification:</strong> All Creators must complete mandatory
                  identity verification, including government-issued ID verification and live
                  selfie matching, before they can publish content. This helps ensure that all
                  individuals producing content on the Platform are doing so voluntarily and are
                  of legal age.
                </li>
                <li>
                  <strong>Content Moderation:</strong> We employ a combination of automated
                  detection tools and human review to monitor content uploaded to the Platform.
                  Our moderation team is trained to identify indicators of coercion, exploitation,
                  or trafficking.
                </li>
                <li>
                  <strong>Supplier Assessment:</strong> We evaluate our technology and service
                  providers for their own anti-slavery and human rights commitments, giving
                  preference to partners with robust compliance programs.
                </li>
                <li>
                  <strong>Risk Assessment:</strong> We conduct periodic risk assessments of our
                  business operations and supply chain to identify areas where modern slavery
                  risks may be elevated.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Reporting Mechanisms</h2>
              <p>
                OpenFans provides multiple channels for reporting suspected modern slavery, human
                trafficking, or exploitation:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>In-Platform Reporting:</strong> Users can report suspicious content or
                  activity directly through the Platform&apos;s reporting tools available on every
                  content page and user profile.
                </li>
                <li>
                  <strong>Email:</strong> Reports can be submitted to{" "}
                  <a href="mailto:complaints@openfans.online" className="text-[#00AFF0] hover:underline">
                    complaints@openfans.online
                  </a>{" "}
                  at any time.
                </li>
                <li>
                  <strong>Anonymous Reporting:</strong> We accept anonymous reports and will
                  investigate all credible allegations regardless of the source.
                </li>
              </ul>
              <p className="mt-3">
                All reports are treated confidentially and are investigated promptly by our
                compliance team. Where appropriate, findings are referred to law enforcement
                authorities without delay.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Training &amp; Awareness</h2>
              <p>
                OpenFans ensures that all employees and contractors involved in content moderation,
                creator onboarding, customer support, and compliance functions receive regular
                training on:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Recognizing the signs and indicators of modern slavery and human trafficking</li>
                <li>Understanding the legal and regulatory framework surrounding modern slavery</li>
                <li>Proper procedures for reporting and escalating suspected cases</li>
                <li>Trauma-informed approaches when interacting with potential victims</li>
                <li>Platform-specific risks and red flags in the creator economy context</li>
              </ul>
              <p className="mt-3">
                Training is provided during onboarding and refreshed at least annually. Additional
                training is provided when new risks or trends are identified.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Zero-Tolerance Policy</h2>
              <p>
                OpenFans maintains a strict zero-tolerance policy toward modern slavery and human
                trafficking. Any Creator, user, employee, or contractor found to be involved in or
                facilitating modern slavery or human trafficking will be subject to:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Immediate suspension and permanent termination of their account or employment</li>
                <li>Removal of all associated content from the Platform</li>
                <li>Referral to the relevant law enforcement and regulatory authorities</li>
                <li>Full cooperation with any subsequent criminal investigation</li>
                <li>Termination of any contractual relationship without notice or compensation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Annual Review</h2>
              <p>
                This statement and the effectiveness of the measures described herein are reviewed
                and updated at least annually by the OpenFans leadership team. We are committed to
                continuous improvement of our practices to combat modern slavery and human
                trafficking.
              </p>
              <p className="mt-3">
                As part of our annual review, we assess the effectiveness of our due diligence
                processes, evaluate new risks, incorporate lessons learned from any reports or
                investigations, and update our training programs accordingly.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact</h2>
              <p>
                If you have any questions about this statement or wish to report a concern, please
                contact us at{" "}
                <a href="mailto:complaints@openfans.online" className="text-[#00AFF0] hover:underline">
                  complaints@openfans.online
                </a>{" "}
                or{" "}
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
