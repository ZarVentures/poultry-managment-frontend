import type { Metadata } from "next"
import { Compass, Eye, HeartHandshake, Rocket, Target } from "lucide-react"
import { CtaSection } from "@/components/public/cta-section"
import { Reveal } from "@/components/public/reveal"
import { SectionHeading } from "@/components/public/section-heading"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Poultry Sathi is the all-in-one management platform built for poultry traders, wholesalers, distributors and dealers in India — from purchases and sales to inventory, payments and profit.",
}

const VALUES = [
  {
    icon: HeartHandshake,
    title: "Trader-first",
    description:
      "We build for the businesses that move India's poultry. Every feature starts with a real problem from a real poultry trading business.",
  },
  {
    icon: Target,
    title: "Simplicity",
    description:
      "Powerful software shouldn't be complicated. We obsess over making every screen fast, clear and easy to use.",
  },
  {
    icon: Compass,
    title: "Reliability",
    description:
      "Your business runs on our software. We invest heavily in security, uptime and data integrity.",
  },
  {
    icon: Rocket,
    title: "Continuous improvement",
    description:
      "We ship updates every month based on real feedback from traders, wholesalers, godowns and distributors across India.",
  },
]

const ROADMAP = [
  {
    phase: "Phase 1 — Now",
    title: "Core operations",
    description:
      "Live dashboard, inventory, purchases, sales, godown tracking, billing, payment tracking, reports and notifications.",
  },
  {
    phase: "Phase 2 — Next",
    title: "Automation & payments",
    description:
      "Auto-generated P&L, WhatsApp invoices, UPI payment links, bank reconciliation and SMS tools.",
  },
  {
    phase: "Phase 3 — Future",
    title: "Intelligence & scale",
    description:
      "AI-powered demand forecasting, market price intelligence, multi-branch support and an open API ecosystem.",
  },
]

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      <section className="px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10 h-[420px]"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, hsla(142, 76%, 36%, 0.12), transparent 55%)",
          }}
        />
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="About Us"
            title="Simplifying Poultry Trading with Smart Technology"
            subtitle="Poultry Sathi is a modern poultry trading business management platform designed to help poultry traders, wholesalers, distributors, and dealers manage their daily operations through one secure, cloud-based platform."
          />
        </Reveal>
      </section>

      {/* Company Introduction */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal direction="right">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Built for Modern Poultry Traders
              </h2>
              <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  Poultry Sathi is a modern business management platform built specifically for poultry traders, 
                  wholesalers, distributors, and dealers. It helps manage purchases, sales, inventory, billing, 
                  payments, and business operations from one centralized platform.
                </p>
                <p>
                  Our mission is to replace manual registers and scattered spreadsheets with a simple, 
                  secure, and intelligent solution that saves time, improves accuracy, and helps poultry 
                  businesses make better decisions every day.
                </p>
                
              </div>
            </Reveal>
            <Reveal direction="left" delay={0.1}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { value: "50+", label: "Businesses onboarded" },
                  { value: "2+", label: "States served" },
                  { value: "200K+", label: "Birds traded" },
                  { value: "24/7", label: "Support available" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
                  >
                    <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-border bg-card p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-6 w-6" />
                </span>
                <h2 className="mt-6 text-2xl font-bold text-foreground">Our Mission</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  To simplify and digitize poultry trading in India with a secure, cloud-based
                  platform that streamlines purchases and sales, improves inventory accuracy and
                  gives every trader real-time financial visibility — so they can make smarter
                  decisions and grow with confidence.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="h-full rounded-2xl border border-border bg-card p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Eye className="h-6 w-6" />
                </span>
                <h2 className="mt-6 text-2xl font-bold text-foreground">Our Vision</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  A future where every poultry trader runs their business on real-time, data-driven
                  decisions — where automation handles the daily grind and technology becomes as
                  trusted and essential to a poultry trading business as the ledger itself.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Why Poultry Sathi */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Why Poultry Sathi"
              title="What we stand for"
              subtitle="The values that shape every product decision we make."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, index) => {
              const Icon = value.icon
              return (
                <Reveal key={value.title} delay={index * 0.08}>
                  <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{value.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Future Roadmap */}
      <section className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Roadmap"
              title="Where we're headed"
              subtitle="We ship relentlessly. Here's a glimpse of the journey ahead."
            />
          </Reveal>
          <div className="relative mx-auto mt-14 max-w-3xl">
            <div className="absolute left-4 top-0 h-full w-px bg-border md:left-1/2" />
            <div className="space-y-10">
              {ROADMAP.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.1}>
                  <div
                    className={`relative flex flex-col gap-4 pl-12 md:w-1/2 md:pl-0 ${
                      index % 2 === 0
                        ? "md:pr-10 md:text-right"
                        : "md:ml-auto md:pl-10"
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-background bg-primary ${
                        index % 2 === 0
                          ? "md:left-auto md:-right-3"
                          : "md:-left-3"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {item.phase}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="pt-20">
        <CtaSection />
      </div>
    </div>
  )
}
