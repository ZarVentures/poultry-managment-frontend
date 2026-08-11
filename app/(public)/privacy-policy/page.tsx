import type { Metadata } from "next"
import { CtaSection } from "@/components/public/cta-section"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Poultry Sathi collects, uses and protects your personal and business data.",
}

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: [
      "Account information: your name, email address, phone number and business details when you create an account.",
      "Business data: the poultry trading and business data you enter — including inventory, sales, purchases, customers, suppliers, payments, expenses, godown records and reports.",
      "Usage data: how you use the platform, including pages visited, features used and device information.",
      "Payment information: processed securely by our payment partners. We never store full card numbers.",
    ],
  },
  {
    title: "3. Business Data Ownership",
    content: [
      "You retain ownership of the business data you enter into Poultry Sathi — including records of purchases, sales, customers, suppliers, payments, expenses, godown inventory and reports.",
      "Poultry Sathi processes your business data only as necessary to provide, maintain, secure and improve the platform.",
    ],
  },
  {
    title: "4. Third-Party Service Providers",
    content: [
      "Poultry Sathi may use trusted third-party providers for services such as cloud hosting, payment processing, email, SMS, WhatsApp, analytics and customer support.",
      "These providers may process information only as necessary to provide their services, and they are required to keep your data confidential and secure.",
    ],
  },
  {
    title: "5. Data Security",
    content: [
      "All data is encrypted in transit using TLS and at rest using industry-standard encryption.",
      "Access to your account is protected with role-based permissions and optional two-factor authentication.",
      "We perform regular backups to prevent data loss and maintain high availability.",
      "However, no internet-based service can guarantee absolute security. You are responsible for keeping your login credentials confidential and for notifying us if you suspect unauthorized access to your account.",
    ],
  },
  {
    title: "6. Data Sharing",
    content: [
      "We do not sell your personal or business data to third parties.",
      "We share data only with trusted service providers who help us run the platform (hosting, email and SMS delivery) under strict confidentiality agreements.",
      "We may disclose data where required by law or to protect the rights and safety of Poultry Sathi, our users or the public.",
    ],
  },
  {
    title: "7. Data Retention",
    content: [
      "We retain your data for as long as your account is active or as needed to provide the service.",
      "When you request deletion, we permanently remove your personal data within 30 days, subject to legal obligations.",
    ],
  },
  {
    title: "8. Account Deletion and Data Export",
    content: [
      "You may request deletion of your Poultry Sathi account or export of your business data at any time.",
      "We will process such requests subject to applicable legal, tax, accounting and operational retention requirements.",
    ],
  },
  {
    title: "9. Your Rights",
    content: [
      "You can access, update or correct your account information at any time from Settings.",
      "You may request a copy or export of your data, or request deletion of your account, by contacting us.",
      "You can opt out of non-essential communications at any time.",
    ],
  },
  {
    title: "10. Cookies",
    content: [
      "We use essential cookies to keep you signed in and to make the platform work correctly.",
      "Analytics cookies help us understand how the product is used so we can improve it. You can disable cookies in your browser settings, though some features may not work correctly.",
    ],
  },
  {
    title: "11. Children's Privacy",
    content: [
      "Poultry Sathi is a business platform intended for poultry traders, wholesalers, distributors and dealers.",
      "It is not designed for individuals under 18 years of age, and we do not knowingly collect information from anyone under 18.",
    ],
  },
  {
    title: "12. Changes to This Privacy Policy",
    content: [
      "We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.",
      "Material changes may be communicated through the platform, website or email, and the updated policy will take effect on the date noted at the top of this page.",
    ],
  },
  {
    title: "13. Contact Us",
    content: [
      "For privacy-related questions, requests, or complaints, please contact:",
      "Poultry Sathi / Zar Solutions",
      "Email: contact@zarsolutions.co.in",
      "Phone: +91 72472 48886",
      "Website: poultrysathi.com",
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="overflow-hidden">
      <section className="px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10 h-[380px]"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, hsla(142, 76%, 36%, 0.12), transparent 55%)",
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Legal
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-muted-foreground">Last updated: 10 August 2026</p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="rounded-2xl border border-border bg-card p-6 leading-relaxed text-muted-foreground">
            <p>
              At Poultry Sathi, we take your privacy seriously. This Privacy Policy explains what
              information we collect, how we use it, and the choices you have. By using the Poultry
              Sathi platform, you agree to the practices described in this policy.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.content.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="pt-20">
        <CtaSection />
      </div>
    </div>
  )
}
