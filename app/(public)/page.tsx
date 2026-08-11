import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock,
  IndianRupee,
  LayoutDashboard,
  LineChart,
  ReceiptIndianRupee,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CtaSection } from "@/components/public/cta-section"
import { DashboardPreview } from "@/components/public/dashboard-preview"
import { Faq } from "@/components/public/faq"
import { MobilePreview } from "@/components/public/mobile-preview"
import { ModulesSection } from "@/components/public/modules-section"
import { Reveal } from "@/components/public/reveal"
import { SectionHeading } from "@/components/public/section-heading"
import { SubscriptionPricingCards } from "@/components/public/subscription-pricing-cards"

export const metadata: Metadata = {
  title: "Poultry Trading Management Software",
  description:
    "Poultry Sathi helps poultry farms track inventory, sales, purchases, godown stock, bird returns and profits in real time. Start free today.",
}

const WHY_ITEMS = [
  {
    icon: Clock,
    title: "Save hours every day",
    description:
      "Replace paper registers and spreadsheets with one click entries. Record sales, purchases and expenses in seconds.",
  },
  {
    icon: TrendingUp,
    title: "Cut losses, boost profit",
    description:
      "Live visibility into purchases, sales, godown stock, expenses, outstanding payments and margins helps you identify problems before they affect your profitability.",
  },
  {
    icon: ShieldCheck,
    title: "Full control in real time",
    description:
      "Know exactly what's sold, what's owed and what's in stock — from the office, godown or on the road.",
  },
  {
    icon: IndianRupee,
    title: "Made for Indian poultry",
    description:
      "Designed around how poultry trading businesses actually work in India — with suppliers, retailers, customers, godowns, vehicles and daily cash flow.",
  },
]

const KEY_FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Monitor your business performance with real-time insights, sales, purchases, inventory, and financial metrics from a single dashboard.",
  },
  {
    icon: ShoppingCart,
    title: "Purchase Management",
    description:
      "Manage purchases, suppliers, bird quantities, rates, and payment status with complete accuracy.",
  },
  {
    icon: Store,
    title: "Sales Management",
    description:
      "Create sales, manage customers, dispatch stock, and track outstanding payments effortlessly.",
  },
  {
    icon: ReceiptIndianRupee,
    title: "Billing & Invoicing",
    description:
      "Generate professional invoices instantly with automatic calculations and printable billing.",
  },
  {
    icon: Boxes,
    title: "Inventory Management",
    description:
      "Track stock movement, inventory levels, godowns, and product availability in real time.",
  },
  {
    icon: Wallet,
    title: "Payment Management",
    description:
      "Track payments received and payments made while maintaining complete financial transparency.",
  },
]

const HOW_IT_WORKS = [
  {
    icon: Store,
    step: "01",
    title: "Set up your business",
    description:
      "Create your company profile, add your godowns, vehicles and team, and onboard the suppliers you buy from and the customers you sell to - all in minutes.",
  },
  {
    icon: ClipboardList,
    step: "02",
    title: "Run your daily trade",
    description:
      "Record purchases from suppliers, log godown inwards, dispatch stock on your vehicles and invoice your customers - with payments and outstanding dues tracked automatically.",
  },
  {
    icon: LineChart,
    step: "03",
    title: "Grow with confidence",
    description:
      "Watch live dashboards, outstanding and profit reports, and dispatch analytics to make smarter decisions and scale your poultry trade.",
  },
]

const TESTIMONIALS = [
  {
    quote:
      "Poultry Sathi completely changed how we manage our daily trade. We used to spend hours maintaining records and closing accounts — now everything updates in real time.",
    name: "Rajesh Kumar",
    role: "Owner, Rajesh Poultry Traders",
    initials: "RK",
  },
  {
    quote:
      "The godown tracking and bird returns feature saved us lakhs in losses. We finally know exactly where every cage is and what's owed to us.",
    name: "Priya Sharma",
    role: "Director, Sharma Poultry & Godown",
    initials: "PS",
  },
  {
    quote:
      "Sales and payment tracking for our retailers used to be a mess. Now the ledgers are always accurate and our team works 3x faster.",
    name: "Amit Verma",
    role: "Manager, Green Valley Poultry",
    initials: "AV",
  },
]

const FAQ_ITEMS = [
  {
    question: "What is Poultry Sathi?",
    answer:
      "Poultry Sathi is a complete business management platform built for poultry traders, wholesalers, distributors, and dealers. It helps you manage purchases, sales, inventory, billing, payments, ledgers, reports, and daily business operations from one secure cloud platform.",
  },
  {
    question: "Who can use Poultry Sathi?",
    answer:
      "Poultry Sathi is designed for poultry traders, wholesalers, distributors, dealers, and businesses involved in poultry trading. It is suitable for businesses of all sizes looking to digitize their daily operations.",
  },
  {
    question: "Do I need technical knowledge to use Poultry Sathi?",
    answer:
      "No. Poultry Sathi is designed to be simple and user-friendly. If you can use a smartphone or basic business applications, you can easily use Poultry Sathi. Our team also provides onboarding and training to help you get started.",
  },
  {
    question: "Can I manage multiple godowns and branches?",
    answer:
      "Yes. Poultry Sathi allows you to manage multiple godowns, inventory locations, stock movement, dispatches, and branches from one centralized platform.",
  },
  {
    question: "Is my business data secure?",
    answer:
      "Yes. Your business data is securely stored using industry-standard security practices. Access is restricted to authorized users through role-based permissions to help keep your information protected.",
  },
  {
    question: "Do all subscription plans include the same features?",
    answer:
      "All current Poultry Sathi features are included in every subscription plan. However, selected upcoming premium features may be introduced exclusively for 6 Months and Annual subscription plans. Any such additions will be communicated in advance.",
  },
  {
    question: "Can I access Poultry Sathi from anywhere?",
    answer:
      "Yes. Poultry Sathi is a cloud-based platform, allowing you to securely access your business anytime and from anywhere using an internet connection.",
  },
  {
    question: "Do you provide onboarding, training, and customer support?",
    answer:
      "Yes. We provide product onboarding, user training, and dedicated customer support to ensure you can use Poultry Sathi efficiently from day one.",
  },
  {
    question: "Can I request a demo before subscribing?",
    answer:
      "Absolutely. You can book a free product demo to explore Poultry Sathi. Our team will walk you through the platform, answer your questions, and help you understand how it can simplify your poultry trading business.",
  },
  {
    question: "How do I get started with Poultry Sathi?",
    answer:
      "Getting started is easy. Simply book a demo or contact our team. We'll help you set up your business, onboard your users, and get your operations running smoothly on Poultry Sathi.",
  },
];

const STATS = [
  { value: "50+", label: "Poultry businesses" },
  { value: "200K+", label: "Birds tracked" },
  { value: "₹5Cr+", label: "Transactions managed" },
  { value: "99.9%", label: "Uptime" },
]

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* 1. Hero */}
      <section className="relative px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(600px circle at 15% 10%, hsla(142, 76%, 36%, 0.12), transparent 45%), radial-gradient(600px circle at 85% 5%, hsla(190, 100%, 42%, 0.1), transparent 45%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)",
          }}
        />

        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <Badge className="mb-5 max-w-full gap-1.5 bg-primary/10 px-3 py-1 text-center text-xs font-semibold text-primary hover:bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              New — Godown & Bird Returns tracking
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Smart Poultry Trading Management Software for{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Growing Poultry Businesses
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Manage your poultry business with confidence. Poultry Sathi is an all-in-one cloud-based 
              software that simplifies purchasing, sales, inventory, billing, accounting, 
              and reporting—helping poultry traders, wholesalers, and distributors save time, reduce errors, and increase 
              profitability.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="group w-full sm:w-auto">
                <Link href="/contact">
                  Book a Demo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/features">Explore Features</Link>
              </Button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Free 1-on-1 demo · No commitment required
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mt-16">
            <DashboardPreview />
          </Reveal>

          <Reveal delay={0.2} className="mt-14">
            <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-3xl font-extrabold tracking-tight text-foreground">
                    {stat.value}
                  </dd>
                  <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* 2. Why Poultry Sathi */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Why Poultry Sathi"
              title="Built for the way poultry business really works"
              subtitle="We built Poultry Sathi around the real-world workflow of poultry traders, wholesalers, distributors, and godowns — not a generic ERP forced to fit."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_ITEMS.map((item, index) => {
              const Icon = item.icon
              return (
                <Reveal key={item.title} delay={index * 0.08}>
                  <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3. Key Features */}
      <section className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
          <SectionHeading
            eyebrow="Key Features"
            title="Everything your trade needs, in one platform"
            subtitle="From daily entries to deep analytics, every feature is designed to save you time and money."
          />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {KEY_FEATURES.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Reveal key={feature.title} delay={(index % 3) * 0.08}>
                  <div className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                    <Link
                      href="/features"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-emerald-700"
                    >
                      Learn more <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
          <SectionHeading
            eyebrow="How It Works"
            title="Your entire trade in three simple steps"
            subtitle="No complicated setup, no IT team required. Get your poultry trading business up on Poultry Sathi in under an hour."
          />
          </Reveal>
          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
            {HOW_IT_WORKS.map((step, index) => {
              const Icon = step.icon
              return (
                <Reveal key={step.title} delay={index * 0.1}>
                  <div className="relative text-center md:px-6">
                    <div className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                      <Icon className="h-8 w-8" />
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold text-foreground ring-1 ring-border">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
          <Reveal
            delay={0.25}
            className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" asChild className="group w-full sm:w-auto">
              <Link href="/contact">
                Book a Demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/features">Explore Features</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 5. Our Modules */}
      <ModulesSection />

      {/* 6. Mobile App Preview */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal direction="right" className="order-2 lg:order-1">
              <MobilePreview />
            </Reveal>
            <Reveal direction="left" className="order-1 lg:order-2">
              <SectionHeading
                align="left"
                eyebrow="On-the-go Access"
                title="Manage Your Business from Anywhere"
                subtitle="Monitor your sales, purchases, inventory, payments, and dispatches in real time from your smartphone. Stay connected to your business wherever you are."
              />
              <ul className="mt-8 space-y-4">
                {[
                  "Real-time updates for sales, purchases, inventory, and payments",
                  "Quickly record purchases, sales, and customer transactions",
                  "Track godown inventory and dispatch status from anywhere",
                  "Fully responsive across smartphones, tablets, and desktops",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. Pricing Preview */}
      <section id="pricing" className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Pricing"
              title="Simple & Transparent Pricing"
              subtitle="Choose the subscription duration that best fits your poultry business. Every plan includes the complete Poultry Sathi platform with no feature limitations."
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-14">
            <SubscriptionPricingCards />
          </Reveal>
          <Reveal delay={0.15} className="mt-10 text-center">
            <Button variant="link" asChild>
              <Link href="/pricing">
                View full pricing details <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 8. Testimonials */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Testimonials"
              title="Trusted by Poultry Traders Across India"
              subtitle="Hear from poultry traders, wholesalers, distributors, and dealers who use Poultry Sathi to simplify their daily operations."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <Reveal key={testimonial.name} delay={index * 0.1}>
                <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                      {testimonial.initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="FAQ"
              title="Frequently asked questions"
              subtitle="Everything you need to know about Poultry Sathi."
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <Faq items={FAQ_ITEMS} />
          </Reveal>
        </div>
      </section>

      {/* 10. Final CTA */}
      <div className="pt-20">
        <CtaSection />
      </div>
    </div>
  )
}

function Star() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 0 0-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.367-2.447a1 1 0 0 0-1.176 0l-3.367 2.447c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 0 0-.364-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.958Z" />
    </svg>
  )
}
