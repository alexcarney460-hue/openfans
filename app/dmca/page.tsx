import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function DmcaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            DMCA Policy
          </h1>
          <p className="text-sm text-gray-400 mb-6">Last updated: March 13, 2026</p>

          <Link
            href="/dmca/submit"
            className="mb-10 inline-flex items-center justify-center rounded-lg bg-[#00AFF0] px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0090c0] focus:outline-none focus:ring-2 focus:ring-[#00AFF0]/50 focus:ring-offset-2"
          >
            Submit DMCA Takedown Request
          </Link>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Overview</h2>
              <p>
                OpenFans respects the intellectual property rights of others and expects its users
                to do the same. In accordance with the Digital Millennium Copyright Act of 1998
                (&quot;DMCA&quot;), Title 17, United States Code, Section 512, OpenFans will
                respond expeditiously to claims of copyright infringement committed using the
                Platform that are reported to our designated copyright agent.
              </p>
              <p className="mt-3">
                This policy outlines how copyright owners can report alleged infringement, how
                users who receive a takedown notice can file a counter-notification, and how
                OpenFans handles repeat infringers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Filing a DMCA Takedown Notice</h2>
              <p>
                If you are a copyright owner, or authorized to act on behalf of one, and you
                believe that content hosted on OpenFans infringes your copyright, you may submit
                a written DMCA takedown notice to our designated agent. Your notice must include
                all of the following elements as required by 17 U.S.C. &sect; 512(c)(3):
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  A physical or electronic signature of the copyright owner or a person authorized
                  to act on their behalf.
                </li>
                <li>
                  Identification of the copyrighted work claimed to have been infringed. If
                  multiple works are covered by a single notification, a representative list of
                  such works.
                </li>
                <li>
                  Identification of the material that is claimed to be infringing or to be the
                  subject of infringing activity, and information reasonably sufficient to permit
                  OpenFans to locate the material on the Platform (e.g., direct URL links).
                </li>
                <li>
                  Information reasonably sufficient to permit OpenFans to contact the complaining
                  party, such as an address, telephone number, and email address.
                </li>
                <li>
                  A statement that the complaining party has a good faith belief that use of the
                  material in the manner complained of is not authorized by the copyright owner,
                  its agent, or the law.
                </li>
                <li>
                  A statement that the information in the notification is accurate, and under
                  penalty of perjury, that the complaining party is authorized to act on behalf
                  of the owner of an exclusive right that is allegedly infringed.
                </li>
              </ul>
              <p className="mt-3">
                <strong>Important:</strong> Knowingly submitting a materially false DMCA takedown
                notice may subject the claimant to liability for damages, including costs and
                attorney&apos;s fees, under 17 U.S.C. &sect; 512(f).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Designated Agent</h2>
              <p>
                All DMCA takedown notices should be sent to our designated copyright agent at:
              </p>
              <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
                <p><strong>OpenFans DMCA Agent</strong></p>
                <p className="mt-1">OpenFans Legal Department</p>
                <p>
                  Email:{" "}
                  <a href="mailto:dmca@openfans.online" className="text-[#00AFF0] hover:underline">
                    dmca@openfans.online
                  </a>
                </p>
              </div>
              <p className="mt-3">
                We aim to acknowledge receipt of all valid DMCA notices within two (2) business
                days and to process takedowns expeditiously, typically within five (5) business
                days of receiving a complete and valid notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Counter-Notification Process</h2>
              <p>
                If you are a user whose content has been removed or disabled as a result of a DMCA
                takedown notice, and you believe the removal was made in error or that you have
                authorization to use the material, you may file a counter-notification. Your
                counter-notification must include:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Your physical or electronic signature.</li>
                <li>
                  Identification of the material that has been removed or to which access has been
                  disabled, and the location at which the material appeared before it was removed
                  or disabled.
                </li>
                <li>
                  A statement under penalty of perjury that you have a good faith belief that the
                  material was removed or disabled as a result of mistake or misidentification.
                </li>
                <li>
                  Your name, address, and telephone number, and a statement that you consent to
                  the jurisdiction of the federal district court for the judicial district in which
                  your address is located (or, if outside the United States, any judicial district
                  in which OpenFans may be found), and that you will accept service of process from
                  the person who provided the original DMCA notification or an agent of such person.
                </li>
              </ul>
              <p className="mt-3">
                Upon receipt of a valid counter-notification, OpenFans will forward it to the
                original complainant. If the complainant does not file a court action seeking a
                restraining order against the user within ten (10) to fourteen (14) business days,
                OpenFans will restore the removed content.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Repeat Infringer Policy</h2>
              <p>
                OpenFans maintains a strict repeat infringer policy in accordance with the DMCA.
                Users who are the subject of repeated valid DMCA takedown notices will be subject
                to the following escalating enforcement:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>First offense:</strong> Content removal and written warning sent to the
                  account holder.
                </li>
                <li>
                  <strong>Second offense:</strong> Content removal, temporary account suspension
                  (up to 14 days), and a final written warning.
                </li>
                <li>
                  <strong>Third offense:</strong> Permanent termination of the account. The user
                  will be prohibited from creating new accounts on the Platform.
                </li>
              </ul>
              <p className="mt-3">
                OpenFans reserves the right to terminate any account at any time for egregious or
                willful copyright infringement, regardless of the number of prior offenses.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Safe Harbor Statement</h2>
              <p>
                OpenFans operates as an online service provider under the safe harbor provisions of
                the DMCA (17 U.S.C. &sect; 512). OpenFans does not monitor, screen, or editorially
                control user-uploaded content before it is posted. As a platform that hosts
                user-generated content, OpenFans qualifies for safe harbor protection provided that
                it:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  Does not have actual knowledge that the material on the Platform is infringing.
                </li>
                <li>
                  Is not aware of facts or circumstances from which infringing activity is apparent.
                </li>
                <li>
                  Acts expeditiously to remove or disable access to infringing material upon
                  obtaining knowledge or awareness of infringement.
                </li>
                <li>
                  Does not receive a financial benefit directly attributable to the infringing
                  activity, where it has the right and ability to control such activity.
                </li>
                <li>
                  Has designated an agent to receive DMCA takedown notifications and has registered
                  that agent with the U.S. Copyright Office.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Contact</h2>
              <p>
                For all DMCA-related inquiries, please contact our designated agent at{" "}
                <a href="mailto:dmca@openfans.online" className="text-[#00AFF0] hover:underline">
                  dmca@openfans.online
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
