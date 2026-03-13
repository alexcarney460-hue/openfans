import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function AcceptableUsePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Acceptable Use Policy
          </h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: March 13, 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Purpose</h2>
              <p>
                This Acceptable Use Policy (&quot;AUP&quot;) defines the rules and guidelines for
                using the OpenFans platform. All users, including Creators and Subscribers, must
                comply with this policy at all times. Violation of this policy may result in
                content removal, account suspension, permanent ban, and referral to law
                enforcement where applicable.
              </p>
              <p className="mt-3">
                This AUP supplements our{" "}
                <a href="/terms" className="text-[#00AFF0] hover:underline">Terms of Service</a>{" "}
                and should be read in conjunction with it.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Prohibited Content</h2>
              <p>
                The following types of content are strictly prohibited on OpenFans. Uploading,
                sharing, promoting, or soliciting any of the following will result in immediate
                action:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Child Sexual Abuse Material (CSAM):</strong> Any content that depicts,
                  promotes, or solicits the sexual exploitation of minors. This includes real,
                  simulated, and AI-generated content depicting minors in sexual situations.
                </li>
                <li>
                  <strong>Non-Consensual Content:</strong> Intimate images or videos shared without
                  the consent of the individual depicted, including &quot;revenge&quot; content,
                  deepfakes, and hidden recordings.
                </li>
                <li>
                  <strong>Violence &amp; Gore:</strong> Content that promotes, glorifies, or
                  incites real-world violence, graphic depictions of serious injury or death, or
                  content designed to shock or disgust.
                </li>
                <li>
                  <strong>Terrorism &amp; Extremism:</strong> Content that promotes, supports, or
                  recruits for terrorist organizations or extremist ideologies.
                </li>
                <li>
                  <strong>Bestiality:</strong> Any content depicting sexual acts involving animals.
                </li>
                <li>
                  <strong>Illegal Drugs:</strong> Content that promotes the sale, manufacture, or
                  distribution of illegal controlled substances.
                </li>
                <li>
                  <strong>Fraud &amp; Deception:</strong> Phishing, scams, impersonation,
                  misleading content designed to defraud users, or any content intended to deceive
                  others for financial or personal gain.
                </li>
                <li>
                  <strong>Hate Speech:</strong> Content that attacks individuals or groups based on
                  race, ethnicity, religion, gender, sexual orientation, disability, or other
                  protected characteristics.
                </li>
                <li>
                  <strong>Self-Harm &amp; Suicide:</strong> Content that promotes, encourages, or
                  provides instructions for self-harm or suicide.
                </li>
                <li>
                  <strong>Malware &amp; Harmful Code:</strong> Distribution of viruses, malware,
                  spyware, or any other harmful software through the Platform.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Creator Obligations</h2>
              <p>
                Creators on OpenFans have specific responsibilities beyond general user conduct:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Age Verification:</strong> Complete mandatory identity verification
                  confirming you are at least 18 years of age before publishing any content.
                </li>
                <li>
                  <strong>Performer Consent:</strong> Obtain and maintain documented consent from
                  all individuals who appear in your content. You must be able to provide proof
                  of consent upon request.
                </li>
                <li>
                  <strong>Record Keeping:</strong> Maintain age verification records for all
                  performers in accordance with 18 U.S.C. &sect; 2257 requirements (see our{" "}
                  <a href="/usc2257" className="text-[#00AFF0] hover:underline">2257 Compliance Statement</a>).
                </li>
                <li>
                  <strong>Content Labeling:</strong> Accurately describe and categorize your
                  content. Do not use misleading titles, descriptions, or thumbnails.
                </li>
                <li>
                  <strong>Tax Compliance:</strong> Comply with all applicable tax reporting and
                  payment obligations in your jurisdiction.
                </li>
                <li>
                  <strong>Original Content:</strong> Only upload content you have created or for
                  which you hold all necessary rights and licenses.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Subscriber Obligations</h2>
              <p>
                Subscribers (fans) on OpenFans must adhere to the following rules:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>No Redistribution:</strong> Do not download, record, screenshot,
                  redistribute, share, or resell any content obtained through the Platform without
                  the explicit written permission of the Creator.
                </li>
                <li>
                  <strong>No Harassment:</strong> Do not harass, threaten, stalk, doxx, or abuse
                  Creators or other users through messages, comments, or any other communication
                  channel on the Platform.
                </li>
                <li>
                  <strong>Respect Boundaries:</strong> Respect Creator boundaries and content
                  guidelines. Do not pressure Creators to produce content they are not comfortable
                  with.
                </li>
                <li>
                  <strong>Accurate Information:</strong> Provide accurate information during
                  registration and do not create accounts using false identities.
                </li>
                <li>
                  <strong>No Chargebacks:</strong> Do not initiate fraudulent chargebacks or
                  disputes for legitimately purchased content or subscriptions.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Prohibited Activities</h2>
              <p>
                In addition to content restrictions, the following activities are prohibited on
                OpenFans:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Using the Platform for any illegal purpose or in violation of any applicable law</li>
                <li>Creating multiple accounts to circumvent bans, restrictions, or enforcement actions</li>
                <li>Using bots, scripts, or automated tools to interact with the Platform without authorization</li>
                <li>Attempting to gain unauthorized access to other users&apos; accounts or Platform systems</li>
                <li>Interfering with the proper operation of the Platform or its infrastructure</li>
                <li>Engaging in price manipulation, artificial engagement, or other deceptive practices</li>
                <li>Soliciting or facilitating prostitution, escort services, or any illegal sexual services</li>
                <li>Money laundering or using the Platform to obscure the origins of illicit funds</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Enforcement</h2>
              <p>
                OpenFans enforces this Acceptable Use Policy through the following escalating
                measures, depending on the severity of the violation:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Content Removal:</strong> Offending content is removed from the Platform.
                </li>
                <li>
                  <strong>Warning:</strong> A formal warning is issued to the account holder
                  explaining the violation and expected corrective behavior.
                </li>
                <li>
                  <strong>Temporary Suspension:</strong> The account is temporarily suspended for a
                  defined period (typically 7 to 30 days) during which the user cannot access the
                  Platform.
                </li>
                <li>
                  <strong>Permanent Ban:</strong> The account is permanently terminated and the
                  user is prohibited from creating new accounts.
                </li>
                <li>
                  <strong>Law Enforcement Referral:</strong> For violations involving illegal
                  activity, evidence is preserved and referred to the appropriate law enforcement
                  authorities.
                </li>
              </ul>
              <p className="mt-3">
                OpenFans reserves the right to skip escalation steps and take immediate action,
                including permanent bans and law enforcement referral, for severe violations such
                as CSAM, non-consensual content, terrorism, or human trafficking.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Appeals</h2>
              <p>
                If you believe enforcement action was taken against your account in error, you may
                file an appeal by emailing{" "}
                <a href="mailto:complaints@openfans.online" className="text-[#00AFF0] hover:underline">
                  complaints@openfans.online
                </a>{" "}
                with &quot;APPEAL&quot; in the subject line. Appeals are reviewed by a different
                team member than the one who made the original decision. You will receive a
                response within ten (10) business days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact</h2>
              <p>
                If you have questions about this Acceptable Use Policy or wish to report a
                violation, please contact us at{" "}
                <a href="mailto:complaints@openfans.online" className="text-[#00AFF0] hover:underline">
                  complaints@openfans.online
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
