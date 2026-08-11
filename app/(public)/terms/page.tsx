import type { Metadata } from "next"
import { CtaSection } from "@/components/public/cta-section"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms and conditions that govern your use of the Poultry Sathi platform.",
}

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using the Poultry Sathi platform, you agree to be bound by these Terms & Conditions and our Privacy Policy.",
      "If you do not agree to these terms, please do not use the platform.",
    ],
  },
  {
    title: "2. Your Account",
    content: [
      "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.",
      "You must provide accurate and complete information when creating an account and keep it up to date.",
      "You must notify us immediately of any unauthorised use of your account.",
    ],
  },
  {
    title: "3. Use of the Service",
    content: [
      "You may use Poultry Sathi only for lawful business purposes related to managing your poultry operations.",
      "You agree not to misuse the service, attempt to access areas you are not authorised to access, or interfere with the platform's operation.",
      "You are responsible for the accuracy and legality of the data you enter into the platform.",
    ],
  },
  {
    title: "4. Subscriptions & Billing",
    content: [
      "Subscription plans are billed monthly or annually depending on the plan you choose.",
      "Plans may be upgraded, downgraded or cancelled at any time. Changes take effect from your next billing cycle.",
      "Refunds are provided at our discretion and in accordance with applicable law.",
      "Prices may change with advance notice; existing subscriptions will be honoured at the current rate until renewal.",
    ],
  },
  {
    title: "5. Free Trial",
    content: [
      "New accounts may be eligible for a free trial period as advertised.",
      "At the end of the trial, you may choose to subscribe to a paid plan or your access may be restricted.",
    ],
  },
  {
    title: "6. Intellectual Property",
    content: [
      "The Poultry Sathi platform, including its software, design, logos and content, is the property of Poultry Sathi and is protected by intellectual property laws.",
      "You may not copy, modify, distribute or create derivative works from any part of the platform without our written consent.",
      "You retain all rights to the business data you enter into the platform.",
    ],
  },
  {
    title: "7. Data & Privacy",
    content: [
      "Your data is your property. We process it only to provide the service, as described in our Privacy Policy.",
      "We implement reasonable security measures to protect your data, but no method of transmission or storage is 100% secure.",
    ],
  },
  {
    title: "8. Limitation of Liability",
    content: [
      "The platform is provided 'as is' without warranties of any kind, either express or implied.",
      "To the maximum extent permitted by law, Poultry Sathi shall not be liable for any indirect, incidental or consequential damages arising from your use of the platform.",
      "Nothing in these terms limits liability that cannot be limited under applicable law.",
    ],
  },
  {
    title: "9. Termination",
    content: [
      "We may suspend or terminate your access to the platform if you violate these terms or misuse the service.",
      "You may delete your account at any time. Upon termination, we will delete your data as described in our Privacy Policy.",
    ],
  },
  {
    title: "10. Changes to These Terms",
    content: [
      "We may update these Terms & Conditions from time to time. We will notify you of material changes through the platform or by email.",
      "Continued use of the platform after changes take effect constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "11. Contact Us",
    content: [
      "For questions, requests, or complaints regarding these Terms & Conditions, please contact:",
      "Poultry Sathi / Zar Solutions",
      "Email: contact@zarsolutions.co.in",
      "Phone: +91 72472 48886",
      "Website: poultrysathi.com",
    ],
  },
]

export default function TermsPage() {
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
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-muted-foreground">Last updated: 1 January 2026</p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="rounded-2xl border border-border bg-card p-6 leading-relaxed text-muted-foreground">
            <p>
              These Terms &amp; Conditions govern your use of the Poultry Sathi platform. Please
              read them carefully before using our services.
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
