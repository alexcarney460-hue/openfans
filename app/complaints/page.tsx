import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function ComplaintsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Complaints Policy
          </h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: March 13, 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Overview</h2>
              <p>
                OpenFans is committed to maintaining a safe, respectful, and lawful environment
                for all users. We take all complaints seriously and have established a clear
                process for reporting and resolving issues related to content, users, or the
                Platform itself. This policy explains how to file a complaint, what types of
                complaints we handle, expected response times, and how complaints are escalated
                when necessary.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How to File a Complaint</h2>
              <p>
                Complaints can be submitted through any of the following channels:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>In-Platform Reporting:</strong> Use the &quot;Report&quot; button
                  available on every content post, user profile, and message to submit a complaint
                  directly within the Platform.
                </li>
                <li>
                  <strong>Email:</strong> Send a detailed complaint to{" "}
                  <a href="mailto:complaints@openfans.online" className="text-[#00AFF0] hover:underline">
                    complaints@openfans.online
                  </a>. Please include the URL of the content or profile in question, a
                  description of the issue, and any supporting evidence.
                </li>
                <li>
                  <strong>Contact Form:</strong> Use the contact form on our{" "}
                  <a href="/contact" className="text-[#00AFF0] hover:underline">Contact page</a>{" "}
                  and select &quot;Complaint&quot; as the inquiry type.
                </li>
              </ul>
              <p className="mt-3">
                Anonymous complaints are accepted. However, providing your contact information
                allows us to follow up with you regarding the resolution of your complaint.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Types of Complaints</h2>
              <p>
                OpenFans handles the following categories of complaints:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Copyright Infringement:</strong> Content that infringes on your
                  intellectual property rights. For formal DMCA takedown requests, please refer to
                  our <a href="/dmca" className="text-[#00AFF0] hover:underline">DMCA Policy</a>.
                </li>
                <li>
                  <strong>Illegal Content:</strong> Content that violates local, state, federal,
                  or international law, including but not limited to content depicting illegal
                  activities.
                </li>
                <li>
                  <strong>Child Sexual Abuse Material (CSAM):</strong> Any content suspected to
                  depict the sexual exploitation of minors. These reports receive the highest
                  priority and are immediately escalated.
                </li>
                <li>
                  <strong>Non-Consensual Content:</strong> Intimate content shared without the
                  consent of the individual depicted.
                </li>
                <li>
                  <strong>Harassment &amp; Abuse:</strong> Bullying, threats, doxxing, stalking,
                  hate speech, or any form of harassment directed at users.
                </li>
                <li>
                  <strong>Underage Users:</strong> Reports of users or Creators who appear to be
                  under the age of 18.
                </li>
                <li>
                  <strong>Fraud &amp; Scams:</strong> Deceptive content, phishing attempts, or
                  fraudulent activity on the Platform.
                </li>
                <li>
                  <strong>Platform Issues:</strong> Technical problems, billing disputes, or
                  concerns about Platform functionality.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Response Timeframes</h2>
              <p>
                OpenFans is committed to responding to complaints within the following timeframes:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>CSAM Reports:</strong> Immediate action. Content is removed within one
                  (1) hour of verification and reported to NCMEC (see Section 6).
                </li>
                <li>
                  <strong>Illegal Content &amp; Non-Consensual Content:</strong> Reviewed and
                  actioned within twenty-four (24) hours.
                </li>
                <li>
                  <strong>Copyright Infringement:</strong> Acknowledged within two (2) business
                  days; actioned within five (5) business days.
                </li>
                <li>
                  <strong>Harassment &amp; Abuse:</strong> Reviewed within forty-eight (48) hours.
                </li>
                <li>
                  <strong>General Complaints:</strong> Acknowledged within three (3) business days;
                  resolved within ten (10) business days.
                </li>
              </ul>
              <p className="mt-3">
                Complex cases may require additional time. If your complaint requires an extended
                investigation, we will notify you of the expected timeline.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Escalation Process</h2>
              <p>
                If you are not satisfied with the initial resolution of your complaint, you may
                escalate it through the following process:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Level 1 &mdash; Support Team:</strong> Your complaint is first handled
                  by our support team, who will investigate and take appropriate action.
                </li>
                <li>
                  <strong>Level 2 &mdash; Senior Review:</strong> If unsatisfied, request
                  escalation to a senior team member by replying to your complaint thread or
                  emailing{" "}
                  <a href="mailto:complaints@openfans.online" className="text-[#00AFF0] hover:underline">
                    complaints@openfans.online
                  </a>{" "}
                  with &quot;ESCALATION&quot; in the subject line.
                </li>
                <li>
                  <strong>Level 3 &mdash; Legal &amp; Compliance:</strong> For unresolved matters
                  involving legal or regulatory concerns, the complaint is escalated to our Legal
                  and Compliance team at{" "}
                  <a href="mailto:legal@openfans.online" className="text-[#00AFF0] hover:underline">
                    legal@openfans.online
                  </a>.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. NCMEC Reporting &amp; CSAM</h2>
              <p>
                OpenFans is committed to the protection of children and maintains a strict
                zero-tolerance policy toward child sexual abuse material (CSAM). In compliance
                with federal law (18 U.S.C. &sect; 2258A), OpenFans reports all instances of
                apparent CSAM to the National Center for Missing &amp; Exploited Children
                (NCMEC) through their CyberTipline.
              </p>
              <p className="mt-3">
                Upon identification of suspected CSAM:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>The content is immediately removed from the Platform and preserved for law enforcement.</li>
                <li>The associated account is immediately suspended.</li>
                <li>A CyberTipline report is filed with NCMEC.</li>
                <li>All relevant evidence is preserved and made available to law enforcement upon lawful request.</li>
                <li>The user is permanently banned from the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Law Enforcement Cooperation</h2>
              <p>
                OpenFans cooperates fully with law enforcement authorities in the investigation of
                criminal activity conducted through or facilitated by the Platform. We will
                respond to valid legal process including subpoenas, court orders, and search
                warrants, and will provide information and evidence as required by applicable law.
              </p>
              <p className="mt-3">
                In emergency situations where there is an imminent threat to life or safety,
                OpenFans may voluntarily disclose information to law enforcement without a court
                order in accordance with applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact</h2>
              <p>
                To file a complaint, contact us at{" "}
                <a href="mailto:complaints@openfans.online" className="text-[#00AFF0] hover:underline">
                  complaints@openfans.online
                </a>. For urgent safety concerns, include &quot;URGENT&quot; in the subject line.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
