import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review the Terms of Service governing access to and use of beATS, the AI resume builder for developers.",
  alternates: {
    canonical: "/terms-of-service",
  },
};

const lastUpdated = "August 8, 2026";

const sections = [
  {
    id: "description-service",
    title: "Description of Service",
    content: (
      <p>
        The Platform allows users to connect their GitHub account, provide basic profile
        details, and generate AI-written, tailored resumes based on job descriptions they
        provide. The Platform analyzes the user&apos;s public GitHub repositories to select
        relevant projects and generate resume content matched to a specific job description.
      </p>
    ),
  },
  {
    id: "eligibility-account",
    title: "Eligibility and Account Registration",
    content: (
      <>
        <h3>2. Eligibility</h3>
        <p>
          You must be at least 18 years old, or the age of majority in your jurisdiction, to
          use this Service. By using the Service, you represent that you meet this
          requirement.
        </p>

        <h3>3. Account Registration</h3>
        <ul>
          <li>You must sign in using GitHub OAuth to use the Service.</li>
          <li>
            You are responsible for maintaining the security of your GitHub account and for
            all activity that occurs through your account on the Platform.
          </li>
          <li>
            You agree to provide accurate information in the Basic Details Form and to keep it
            up to date.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "github-ai-content",
    title: "Use of GitHub Data and AI-Generated Content",
    content: (
      <>
        <h3>4. Use of GitHub Data</h3>
        <p>
          By connecting your GitHub account, you authorize the Platform to access your public
          profile information and public repository data solely for the purpose of generating
          resumes. You retain full ownership of your GitHub content. We do not claim
          ownership of your code, repositories, or any content hosted on GitHub.
        </p>

        <h3>5. AI-Generated Content</h3>
        <ul>
          <li>
            Resumes are generated using artificial intelligence based on your GitHub data and
            the job description you provide.
          </li>
          <li>
            <strong>
              You are solely responsible for reviewing, verifying, and editing any
              AI-generated resume before using it for job applications.
            </strong>{" "}
            We do not guarantee that AI-generated content is accurate, complete, error-free,
            or will result in any particular outcome such as interview calls or job offers.
          </li>
          <li>
            You agree not to submit false, misleading, or plagiarized information through the
            Service, and not to misrepresent your skills, experience, or qualifications in
            any resume generated or edited using the Platform.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of any applicable law.</li>
          <li>Attempt to access another user&apos;s account, data, or resumes.</li>
          <li>Reverse-engineer, scrape, or interfere with the Platform&apos;s functioning or security.</li>
          <li>Use automated means to access the Service beyond normal use.</li>
          <li>
            Upload job descriptions or content containing malicious code, hate speech, or
            unlawful material.
          </li>
          <li>Misuse the Service to generate resumes for identities that are not your own.</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
      </>
    ),
  },
  {
    id: "plans-payments",
    title: "Plans and Payments",
    content: (
      <>
        <h3>7.1 Free Plan</h3>
        <p>
          The Free Plan includes a limited number of resume generations per month, one resume
          template, and limited resume history, as described on the Platform.
        </p>

        <h3>7.2 Pro Plan</h3>
        <p>
          The Pro Plan is a paid subscription, monthly or annual as priced on the Platform at
          the time of purchase, offering unlimited resume generations, additional templates,
          and full ATS score breakdowns.
        </p>

        <h3>7.3 Billing</h3>
        <ul>
          <li>Payments are processed securely through Razorpay.</li>
          <li>We do not store your payment card or banking details.</li>
          <li>
            Subscriptions do not auto-renew unless explicitly stated on the Platform at
            checkout.
          </li>
          <li>
            If auto-renewal is enabled, you may cancel at any time before the renewal date to
            avoid being charged.
          </li>
          <li>
            Upon expiry of a Pro subscription without renewal, your account will automatically
            revert to the Free Plan.
          </li>
        </ul>

        <h3>7.4 Refunds</h3>
        <p>
          Except where required by applicable law, payments made for the Pro Plan are
          non-refundable once the billing period has started. If you believe you were charged
          in error, contact us using the support details made available on the Platform.
        </p>
      </>
    ),
  },
  {
    id: "ip-disclaimers-liability",
    title: "Intellectual Property, Disclaimers, and Liability",
    content: (
      <>
        <h3>8. Intellectual Property</h3>
        <ul>
          <li>
            The Platform, including its design, software, and underlying technology, is owned
            by us and protected by applicable intellectual property laws.
          </li>
          <li>
            You retain ownership of the resumes generated for you and may use them freely for
            personal job-application purposes.
          </li>
          <li>
            You may not copy, resell, or redistribute the Platform&apos;s underlying technology
            or templates for commercial purposes without our written consent.
          </li>
        </ul>

        <h3>9. Disclaimer of Warranties</h3>
        <p>
          The Service is provided as is and as available, without warranties of any kind,
          whether express or implied. We do not warrant that the Service will be uninterrupted,
          timely, secure, or error-free, that AI-generated resumes will be accurate or lead to
          any employment outcome, or that any errors in the Service will be corrected.
        </p>

        <h3>10. Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by applicable law, beATS and its
          founders or operators shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, including loss of employment opportunities,
          arising from your use of the Service.
        </p>
      </>
    ),
  },
  {
    id: "termination-third-parties",
    title: "Termination and Third-Party Services",
    content: (
      <>
        <h3>11. Termination</h3>
        <ul>
          <li>You may delete your account at any time via Settings and Danger Zone.</li>
          <li>
            We may suspend or terminate your access to the Service, with or without notice,
            if you violate these Terms or misuse the Service.
          </li>
        </ul>

        <h3>12. Third-Party Services</h3>
        <p>
          The Service integrates with third-party providers, including GitHub for
          authentication and repository data, Razorpay for payments, and may use third-party
          AI providers to generate content. Your use of these third-party services is also
          subject to their respective terms and privacy policies.
        </p>
      </>
    ),
  },
  {
    id: "changes-law-contact",
    title: "Changes, Governing Law, and Contact",
    content: (
      <>
        <h3>13. Changes to the Service or Terms</h3>
        <p>
          We may modify or discontinue the Service, in whole or in part, at any time. We may
          also update these Terms from time to time. Continued use of the Service after
          changes take effect constitutes acceptance of the revised Terms.
        </p>

        <h3>14. Governing Law</h3>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India,
          without regard to conflict-of-law principles. Any disputes shall be subject to the
          exclusive jurisdiction of the competent courts in India.
        </p>

        <h3>15. Contact Us</h3>
        <p>
          If you have any questions about these Terms, please contact us using the support
          channel or contact details listed inside the Platform.
        </p>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Terms of Service"
      title="The rules are here so the trust can stay easy."
      intro="These Terms of Service explain how beATS can be used, what you can expect from the platform, and what responsibilities stay with you."
      lastUpdated={lastUpdated}
      sections={sections}
    />
  );
}
