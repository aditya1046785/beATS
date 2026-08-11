import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | beATS",
  description:
    "Learn how beATS collects, uses, stores, and protects your information.",
};

const lastUpdated = "August 8, 2026";

const sections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: (
      <>
        <h3>1.1 Information from GitHub</h3>
        <ul>
          <li>
            Your GitHub user ID, username, name, email address if public, and avatar.
          </li>
          <li>
            A GitHub access token, used solely to read your public repository data on your
            behalf.
          </li>
          <li>
            Data from your public repositories, including repository names, descriptions,
            primary and secondary programming languages, topics or tags, README content,
            dependency files such as <code>package.json</code> or <code>requirements.txt</code>,
            star counts, and last-updated timestamps.
          </li>
        </ul>
        <p>
          We do not access private repositories, and we do not request write access to your
          GitHub account.
        </p>

        <h3>1.2 Information You Provide Directly</h3>
        <ul>
          <li>Full name, phone number, and city or location.</li>
          <li>College or university name, degree or branch, graduation year, and CGPA.</li>
          <li>LinkedIn URL and portfolio URL if provided.</li>
          <li>Target job roles.</li>
          <li>Any job description text you paste into the Service.</li>
        </ul>

        <h3>1.3 Payment Information</h3>
        <p>
          If you subscribe to a paid plan, payments are processed by Razorpay. We do not
          store your card, UPI, or bank details on our servers. We retain only the
          transaction ID, amount, plan type, and payment status necessary to manage your
          subscription.
        </p>

        <h3>1.4 Automatically Collected Information</h3>
        <p>
          We may collect standard technical information such as IP address, browser type,
          device information, and usage logs, including pages visited and features used, for
          security and analytics purposes.
        </p>

        <h3>1.5 AI-Generated Content</h3>
        <ul>
          <li>AI-written summaries of your GitHub repositories.</li>
          <li>
            Vector embeddings of your repository summaries and job descriptions used for
            similarity matching.
          </li>
          <li>
            The resumes generated on your behalf, including the job description text you
            submitted and the resulting resume content in JSON, HTML, and PDF formats.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How We Use Your Information",
    content: (
      <>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Create and manage your account.</li>
          <li>
            Analyze your GitHub repositories and generate tailored, AI-written resumes based
            on the job descriptions you provide.
          </li>
          <li>Calculate ATS match scores.</li>
          <li>Process payments and manage your subscription plan.</li>
          <li>Maintain your resume generation history.</li>
          <li>Improve, secure, and troubleshoot the Service.</li>
          <li>
            Send you in-app notifications relevant to your account, such as processing status
            and plan limits.
          </li>
        </ul>
        <p>
          We do not sell your personal information to third parties. We do not use your data
          to train third-party AI models beyond what is necessary to generate your resume in
          real time.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "How We Share Your Information",
    content: (
      <>
        <p>We may share information with:</p>
        <ul>
          <li>
            <strong>AI service providers</strong>, to generate repository summaries,
            embeddings, and resume content. Job description text and repository data are sent
            to these providers solely to generate your resume.
          </li>
          <li>
            <strong>Razorpay</strong>, to process payments.
          </li>
          <li>
            <strong>Hosting and infrastructure providers</strong>, to store and serve your
            data securely.
          </li>
          <li>
            <strong>Law enforcement or regulators</strong>, only if required by applicable
            law.
          </li>
        </ul>
        <p>
          We do not share your data with other users. Your GitHub access token, repository
          data, and generated resumes are never visible to other users of the Platform.
        </p>
      </>
    ),
  },
  {
    id: "storage-security",
    title: "Data Storage and Security",
    content: (
      <>
        <ul>
          <li>
            Your GitHub access token is stored in encrypted form and is never exposed to the
            frontend or included in any API response visible to you or others.
          </li>
          <li>
            We apply reasonable technical and organizational measures to protect your data
            against unauthorized access, alteration, or disclosure.
          </li>
          <li>
            No method of transmission or storage is 100% secure, and we cannot guarantee
            absolute security.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "retention-rights",
    title: "Data Retention and Your Rights",
    content: (
      <>
        <h3>5. Data Retention</h3>
        <ul>
          <li>We retain your account data for as long as your account is active.</li>
          <li>
            Free plan users&apos; resume history is limited to the most recent 5 resumes;
            older resumes may be deleted automatically.
          </li>
          <li>
            If you delete your account via Settings and Danger Zone, we will permanently
            delete your profile data, GitHub tokens, repository data, and generated resumes
            within 30 days, except where retention is required by law such as payment records
            for tax or accounting purposes.
          </li>
        </ul>

        <h3>6. Your Rights</h3>
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate data via your Settings page.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>
            Withdraw GitHub access at any time by revoking the app&apos;s permissions from
            your GitHub account settings, and or disconnecting it from within the Platform.
          </li>
        </ul>
        <p>
          To exercise these rights, contact us using the support details made available on the
          Platform.
        </p>
      </>
    ),
  },
  {
    id: "children-cookies",
    title: "Children's Privacy and Cookies",
    content: (
      <>
        <h3>7. Children&apos;s Privacy</h3>
        <p>
          The Service is not intended for individuals under the age of 18, or the age of
          majority in your jurisdiction. We do not knowingly collect data from minors.
        </p>

        <h3>8. Cookies</h3>
        <p>
          We may use cookies or similar technologies to keep you logged in, remember
          preferences, and understand usage patterns. You can control cookies through your
          browser settings.
        </p>
      </>
    ),
  },
  {
    id: "policy-changes-contact",
    title: "Changes, Grievance, and Contact",
    content: (
      <>
        <h3>9. Changes to This Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by posting the updated policy on this page with a new last updated date.
        </p>

        <h3>10. Grievance Officer (India)</h3>
        <p>
          In accordance with the Information Technology Act, 2000 and rules made thereunder,
          grievance support details will be made available on the Platform before paid access
          or formal public launch.
        </p>

        <h3>11. Contact Us</h3>
        <p>
          If you have questions about this Privacy Policy, please contact us using the support
          channel or contact details listed inside the Platform.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="Your data deserves clarity, not fine-print fatigue."
      intro="This Privacy Policy explains how beATS collects, uses, stores, and protects your information when you use the website and services."
      lastUpdated={lastUpdated}
      sections={sections}
    />
  );
}
