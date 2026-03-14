import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Content Moderation Policy — OpenFans",
  description:
    "OpenFans content moderation policy. Learn about our standards for allowed and prohibited content, age verification, reporting mechanisms, and enforcement actions.",
};

export default function ContentPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Content Moderation Policy
          </h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: March 13, 2026</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-600">
            {/* Introduction */}
            <section>
              <p>
                OpenFans is committed to maintaining a safe, lawful, and respectful environment
                for all users. This Content Moderation Policy outlines the types of content
                permitted and prohibited on the Platform, our review and enforcement processes,
                and the responsibilities of Creators and Subscribers. All users must comply with
                this policy in addition to our{" "}
                <a href="/terms" className="text-[#00AFF0] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-[#00AFF0] hover:underline">
                  Privacy Policy
                </a>.
              </p>
            </section>

            {/* 1. Allowed Content */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Allowed Content</h2>
              <p>
                OpenFans supports a broad range of creative expression. Creators may publish
                content across many categories, including but not limited to:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Adult content</strong> &mdash; legally produced adult content featuring
                  consenting adults (18+) with proper documentation
                </li>
                <li>
                  <strong>Fitness &amp; wellness</strong> &mdash; workout routines, nutrition
                  guidance, yoga, and health-related content
                </li>
                <li>
                  <strong>Lifestyle &amp; fashion</strong> &mdash; personal style, travel,
                  day-in-the-life, and lifestyle content
                </li>
                <li>
                  <strong>Music &amp; performing arts</strong> &mdash; original music,
                  performances, tutorials, and behind-the-scenes content
                </li>
                <li>
                  <strong>Visual arts &amp; photography</strong> &mdash; original artwork,
                  photography, digital art, and creative projects
                </li>
                <li>
                  <strong>Education &amp; tutorials</strong> &mdash; courses, how-to guides,
                  skill development, and educational series
                </li>
                <li>
                  <strong>Cooking &amp; food</strong> &mdash; recipes, cooking demonstrations,
                  food reviews, and culinary content
                </li>
                <li>
                  <strong>Comedy &amp; entertainment</strong> &mdash; sketches, commentary,
                  podcasts, and other entertainment content
                </li>
                <li>
                  <strong>Gaming &amp; technology</strong> &mdash; gameplay, reviews, tutorials,
                  and tech-related content
                </li>
              </ul>
              <p className="mt-3">
                All content must comply with applicable laws in the Creator&apos;s jurisdiction
                and must not violate any of the prohibitions outlined in Section 2 below.
              </p>
            </section>

            {/* 2. Prohibited Content */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Prohibited Content</h2>
              <p>
                The following content is strictly prohibited on OpenFans. Violations may result
                in immediate account termination, content removal, and referral to law
                enforcement where applicable.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.1 Child Sexual Abuse Material (CSAM) &mdash; Zero Tolerance
              </h3>
              <p>
                OpenFans maintains an absolute zero-tolerance policy for child sexual abuse
                material. Any content that depicts, promotes, or facilitates the sexual
                exploitation or abuse of minors will result in immediate and permanent account
                termination. All identified CSAM is reported to the{" "}
                <strong>National Center for Missing &amp; Exploited Children (NCMEC)</strong>{" "}
                via CyberTipline and to relevant law enforcement agencies. This includes
                real imagery, computer-generated imagery, AI-generated content, illustrations,
                and any other visual or written depiction.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.2 Content Involving Minors
              </h3>
              <p>
                No content depicting minors (individuals under 18 years of age) in any sexual,
                suggestive, or exploitative context is permitted. This prohibition extends to
                content that sexualizes minors through text, imagery, audio, or any other
                medium, regardless of whether the minor is real or fictional.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.3 Non-Consensual Intimate Imagery
              </h3>
              <p>
                The distribution of intimate, sexual, or nude imagery of any person without
                their explicit consent is strictly prohibited. This includes so-called
                &quot;revenge porn,&quot; hidden camera recordings, content shared in breach
                of confidence, and any intimate imagery distributed without the depicted
                individual&apos;s written authorization.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.4 Deepfakes &amp; Non-Consensual AI-Generated Content
              </h3>
              <p>
                The creation, upload, or distribution of AI-generated, deepfake, or
                digitally manipulated content that depicts a real, identifiable person in
                sexual or intimate scenarios without their verified, written consent is
                prohibited. This includes face-swapped videos, AI-generated likenesses,
                and any synthetic media created without authorization from the depicted
                individual.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.5 Bestiality &amp; Animal Abuse
              </h3>
              <p>
                Content depicting sexual acts involving animals or any form of animal cruelty,
                abuse, or torture is strictly prohibited.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.6 Incest Content
              </h3>
              <p>
                Content depicting, promoting, or glorifying sexual activity between family
                members or individuals in familial relationships is prohibited. This includes
                both real and fictional or role-played scenarios that depict incestuous
                relationships.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.7 Human Trafficking &amp; Exploitation
              </h3>
              <p>
                Any content that facilitates, promotes, or depicts human trafficking, forced
                labor, sexual exploitation, or coerced participation in content creation is
                strictly prohibited. OpenFans cooperates fully with law enforcement agencies
                investigating trafficking and exploitation cases.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.8 Self-Harm &amp; Suicide
              </h3>
              <p>
                Content that promotes, encourages, instructs, or glorifies self-harm, suicide,
                eating disorders, or other forms of self-injury is prohibited. Content that
                depicts self-harm for shock value or entertainment is not permitted. Educational
                or awareness content about mental health is allowed when presented responsibly
                and includes appropriate resources.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.9 Terrorist Content &amp; Extreme Violence
              </h3>
              <p>
                Content that promotes, supports, or glorifies terrorism, terrorist organizations,
                or violent extremism is strictly prohibited. This includes recruitment materials,
                propaganda, and instructional content related to acts of terrorism. Content
                depicting gratuitous or extreme real-world violence intended to shock, intimidate,
                or incite harm is also prohibited.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.10 Doxxing &amp; Personal Information Exposure
              </h3>
              <p>
                The publication, sharing, or threatening to share private personal information
                of any individual without their consent is prohibited. This includes but is
                not limited to home addresses, phone numbers, email addresses, financial
                information, government identification numbers, employment details, and any
                other information that could be used to identify, locate, or harass an
                individual.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.11 Illegal Drug Sales &amp; Weapons Trafficking
              </h3>
              <p>
                Content that facilitates, promotes, or advertises the sale of illegal drugs,
                controlled substances, firearms, explosives, or other weapons is prohibited.
                This includes instructional content on manufacturing illegal substances or
                weapons, and the use of the Platform to coordinate or facilitate illegal
                transactions.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">
                2.12 Intellectual Property Violations
              </h3>
              <p>
                Content that infringes upon the copyrights, trademarks, trade secrets, or
                other intellectual property rights of any third party is prohibited. Creators
                must own or have proper licensing for all content they upload. Repeat
                infringers will have their accounts permanently terminated in accordance with
                our{" "}
                <a href="/terms" className="text-[#00AFF0] hover:underline">
                  Terms of Service
                </a>{" "}
                and DMCA policy.
              </p>
            </section>

            {/* 3. Age Verification */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                3. Age Verification Requirements
              </h2>
              <p>
                All Creators must verify their identity and age before they can publish any
                content on the Platform. The verification process includes:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Government-issued photo ID</strong> &mdash; a valid passport,
                  driver&apos;s license, or national identity card confirming the Creator is
                  at least 18 years of age
                </li>
                <li>
                  <strong>Liveness verification</strong> &mdash; a real-time selfie or video
                  check to confirm the person submitting the ID is the same individual depicted
                  on the document
                </li>
                <li>
                  <strong>Ongoing verification</strong> &mdash; OpenFans reserves the right to
                  request re-verification at any time if there is reason to believe a
                  Creator&apos;s identity or age may have been misrepresented
                </li>
              </ul>
              <p className="mt-3">
                All Subscribers must confirm they are at least 18 years of age upon account
                creation. OpenFans may implement additional age-gating measures for content
                categorized as adult or explicit.
              </p>
              <p className="mt-3">
                Identity documents are processed through secure, third-party verification
                providers and are not stored on OpenFans servers beyond the minimum period
                required for verification and compliance.
              </p>
            </section>

            {/* 4. Reporting Mechanism */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                4. Reporting Violations
              </h2>
              <p>
                OpenFans provides multiple channels for users to report content that violates
                this policy:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>In-platform reporting</strong> &mdash; every piece of content on the
                  Platform includes a report button that allows users to flag violations
                  directly. Reports can be submitted with a description of the violation and
                  the relevant policy section.
                </li>
                <li>
                  <strong>Email reports</strong> &mdash; users, non-users, and law enforcement
                  agencies may submit reports via email to{" "}
                  <a href="mailto:abuse@openfans.online" className="text-[#00AFF0] hover:underline">
                    abuse@openfans.online
                  </a>. Please include the URL of the content in question, a description of
                  the violation, and any supporting evidence.
                </li>
                <li>
                  <strong>NCMEC CyberTipline</strong> &mdash; suspected CSAM can also be
                  reported directly to NCMEC at{" "}
                  <a
                    href="https://www.missingkids.org/gethelpnow/cybertipline"
                    className="text-[#00AFF0] hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    missingkids.org/gethelpnow/cybertipline
                  </a>.
                </li>
              </ul>
              <p className="mt-3">
                All reports are treated confidentially. The identity of the reporting party
                is not disclosed to the subject of the report except where required by law.
                We do not tolerate retaliation against users who submit reports in good faith.
              </p>
            </section>

            {/* 5. Review Process */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                5. Content Review Process
              </h2>
              <p>
                OpenFans employs a multi-layered content review process to detect and address
                policy violations:
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                5.1 Automated Screening
              </h3>
              <p>
                All uploaded content is subject to AI-assisted screening that includes hash
                matching against known CSAM databases (such as PhotoDNA), automated detection
                of potentially prohibited visual content, and metadata analysis. Content
                flagged by automated systems is immediately queued for human review and may
                be temporarily restricted from public access pending review.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                5.2 Human Review
              </h3>
              <p>
                A dedicated Trust &amp; Safety team conducts manual review of flagged content,
                user reports, and randomly sampled content. Human reviewers are trained
                professionals who evaluate content against this policy and applicable laws.
                Reviewers operate under strict confidentiality and wellness protocols.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                5.3 Priority Handling
              </h3>
              <p>
                Reports involving potential CSAM, non-consensual intimate imagery, and
                imminent threats of violence are treated as highest priority and are
                reviewed within 24 hours. All other reports are reviewed within 72 hours
                of submission.
              </p>
            </section>

            {/* 6. Enforcement Actions */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                6. Enforcement Actions
              </h2>
              <p>
                When a policy violation is confirmed, OpenFans may take one or more of the
                following actions, depending on the severity and nature of the violation:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Warning</strong> &mdash; a formal notice to the user identifying the
                  violation and requiring corrective action. Applicable to minor or first-time
                  violations.
                </li>
                <li>
                  <strong>Content removal</strong> &mdash; immediate removal of the violating
                  content from the Platform. The Creator is notified of the removal and the
                  policy section violated.
                </li>
                <li>
                  <strong>Temporary suspension</strong> &mdash; suspension of the
                  user&apos;s account for a defined period. During suspension, the user cannot
                  publish content, receive payments, or interact with other users.
                </li>
                <li>
                  <strong>Permanent ban</strong> &mdash; permanent termination of the
                  user&apos;s account and prohibition from creating new accounts. Applied to
                  severe violations, repeat offenders, or violations involving CSAM,
                  non-consensual content, or trafficking.
                </li>
                <li>
                  <strong>Law enforcement referral</strong> &mdash; for violations involving
                  criminal activity, OpenFans will refer the matter to the appropriate law
                  enforcement agencies and cooperate fully with any resulting investigation.
                  This includes preserving relevant account data and content as required by
                  law.
                </li>
              </ul>
              <p className="mt-3">
                OpenFans maintains a strike system for non-severe violations. Accumulating
                three strikes within a 12-month period will result in account suspension.
                Severe violations (CSAM, trafficking, non-consensual content) bypass the
                strike system and result in immediate permanent ban and law enforcement
                referral.
              </p>
            </section>

            {/* 7. Appeal Process */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                7. Appeal Process
              </h2>
              <p>
                Users who believe a moderation decision was made in error may appeal through
                the following process:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Submit an appeal</strong> &mdash; appeals may be submitted via email
                  to{" "}
                  <a href="mailto:appeals@openfans.online" className="text-[#00AFF0] hover:underline">
                    appeals@openfans.online
                  </a>{" "}
                  within 30 days of the enforcement action. The appeal must include the
                  user&apos;s account information, the specific action being appealed, and a
                  detailed explanation of why the decision is believed to be incorrect.
                </li>
                <li>
                  <strong>Review by independent reviewer</strong> &mdash; appeals are reviewed
                  by a member of the Trust &amp; Safety team who was not involved in the
                  original decision.
                </li>
                <li>
                  <strong>Response timeline</strong> &mdash; users will receive a written
                  response to their appeal within 14 business days.
                </li>
                <li>
                  <strong>Final decision</strong> &mdash; the appeal decision is final. If the
                  appeal is upheld, the enforcement action will be reversed and the
                  user&apos;s record will be updated accordingly.
                </li>
              </ul>
              <p className="mt-3">
                Appeals are not available for violations involving CSAM, as these are subject
                to mandatory legal reporting and permanent account termination without
                exception.
              </p>
            </section>

            {/* 8. Creator Responsibilities */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                8. Creator Responsibilities
              </h2>
              <p>
                Creators on OpenFans bear specific responsibilities related to the content
                they produce and publish:
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                8.1 Consent Documentation
              </h3>
              <p>
                Creators must obtain and maintain verifiable, written consent from all
                individuals depicted in their content. For adult content, this includes
                documented proof that all participants are at least 18 years of age and have
                consented to the specific use and distribution of the content on the Platform.
                Consent must be freely given, specific, informed, and revocable.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                8.2 Record-Keeping (18 U.S.C. &sect; 2257 Compliance)
              </h3>
              <p>
                Creators who produce sexually explicit content are required to comply with the
                record-keeping requirements of 18 U.S.C. &sect; 2257 and related regulations.
                This includes maintaining records that verify the age and identity of every
                performer depicted in sexually explicit content. These records must be kept for
                the duration of the content&apos;s availability on the Platform and for a
                minimum of seven years after the content is removed. OpenFans may request
                access to these records at any time and failure to produce them may result in
                content removal and account suspension.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                8.3 Content Accuracy
              </h3>
              <p>
                Creators must accurately represent and categorize their content. Misleading
                titles, descriptions, tags, or thumbnails that misrepresent the nature of the
                content are prohibited. Adult content must be properly tagged and categorized
                to ensure appropriate age-gating.
              </p>

              <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                8.4 Compliance with Law
              </h3>
              <p>
                Creators are solely responsible for ensuring that their content complies with
                all applicable laws in their jurisdiction, including obscenity laws, age
                verification requirements, and tax obligations. OpenFans does not provide
                legal advice and Creators are encouraged to consult with qualified legal
                counsel regarding their obligations.
              </p>
            </section>

            {/* 9. Transparency */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                9. Transparency Reporting
              </h2>
              <p>
                OpenFans is committed to transparency regarding its content moderation
                practices. We publish quarterly transparency reports that include:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  The total number of content moderation actions taken, broken down by
                  violation type
                </li>
                <li>
                  The number of user reports received and the percentage resolved within
                  target timelines
                </li>
                <li>
                  The number of NCMEC reports and law enforcement referrals submitted
                </li>
                <li>
                  The number of appeals received and the outcomes of those appeals
                </li>
                <li>
                  The number of accounts permanently banned, suspended, or warned
                </li>
                <li>
                  Changes to moderation policies or enforcement procedures during the
                  reporting period
                </li>
              </ul>
              <p className="mt-3">
                Transparency reports are published on the OpenFans website and are accessible
                to the public. We believe accountability and openness are essential to
                maintaining trust with our users, partners, and stakeholders.
              </p>
            </section>

            {/* 10. Contact */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                10. Contact Information
              </h2>
              <p>
                For questions about this Content Moderation Policy, to report violations, or
                to submit appeals, please use the following contact channels:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Content violations &amp; abuse reports:</strong>{" "}
                  <a href="mailto:abuse@openfans.online" className="text-[#00AFF0] hover:underline">
                    abuse@openfans.online
                  </a>
                </li>
                <li>
                  <strong>Moderation appeals:</strong>{" "}
                  <a href="mailto:appeals@openfans.online" className="text-[#00AFF0] hover:underline">
                    appeals@openfans.online
                  </a>
                </li>
                <li>
                  <strong>DMCA &amp; copyright claims:</strong>{" "}
                  <a href="mailto:legal@openfans.online" className="text-[#00AFF0] hover:underline">
                    legal@openfans.online
                  </a>
                </li>
                <li>
                  <strong>General inquiries:</strong>{" "}
                  <a href="mailto:support@openfans.online" className="text-[#00AFF0] hover:underline">
                    support@openfans.online
                  </a>
                </li>
              </ul>
              <p className="mt-3">
                We aim to acknowledge all reports within 24 hours and resolve them within the
                timelines specified in Section 5.3. For urgent matters involving the safety of
                minors or imminent threats of violence, please also contact your local law
                enforcement authorities.
              </p>
            </section>

            {/* Policy Updates */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Policy Updates
              </h2>
              <p>
                OpenFans reserves the right to update this Content Moderation Policy at any
                time. Material changes will be communicated to users via email and in-platform
                notification at least 14 days before they take effect. The &quot;Last
                updated&quot; date at the top of this page reflects the most recent revision.
                Continued use of the Platform following changes constitutes acceptance of the
                updated policy.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
