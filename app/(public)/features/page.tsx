import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Cloud,
  LayoutDashboard,
  ReceiptIndianRupee,
  ScrollText,
  ShoppingCart,
  Store,
  TrendingDown,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/public/reveal"
import { SectionHeading } from "@/components/public/section-heading"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore every module of Poultry Sathi — dashboard, purchases, sales, billing, inventory, payments, expenses, ledger, reports and more, built for poultry traders.",
}

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
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
    title: "Billing & Invoice Generation",
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
    icon: Users,
    title: "Customer & Farmer Management",
    description:
      "Maintain complete records of customers, farmers, suppliers, contact details, and transaction history.",
  },
  {
    icon: Wallet,
    title: "Payment Management",
    description:
      "Track payments received and payments made while maintaining complete financial transparency.",
  },
  {
    icon: TrendingDown,
    title: "Expense Management",
    description:
      "Record business expenses and monitor operational spending with categorized expense tracking.",
  },
  {
    icon: ScrollText,
    title: "Ledger & Accounting",
    description:
      "Maintain customer and supplier ledgers, opening balances, journals, and complete financial records.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Generate detailed reports for purchases, sales, inventory, profits, outstanding balances, and overall business performance.",
  },
  {
    icon: UsersRound,
    title: "Multi-User Access",
    description:
      "Provide secure role-based access to staff members with controlled permissions and account management.",
  },
  {
    icon: Cloud,
    title: "Cloud-Based Platform",
    description:
      "Access your business securely anytime, anywhere with reliable cloud technology and automatic data synchronization.",
  },
]

export default function FeaturesPage() {
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
            eyebrow="Features"
            title="Powerful Features for Modern Poultry Businesses"
            subtitle="Everything poultry traders need to manage purchases, sales, inventory, billing, payments, accounting, and business operations from one modern cloud platform."
          />
        </Reveal>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Reveal key={feature.title} delay={(index % 3) * 0.08}>
                  <div className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 px-6 py-16 text-center shadow-xl shadow-emerald-900/20 sm:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.4) 0, transparent 40%)",
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Digitize Your Poultry Business?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-emerald-50/90 sm:text-lg">
              Join poultry traders across India who use Poultry Sathi to manage purchases, sales,
              inventory, payments, and business operations — all from one powerful platform.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full bg-white text-emerald-700 shadow-md hover:bg-emerald-50 sm:w-auto"
              >
                <Link href="/contact">
                  Book a Demo <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/features">Explore Features</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
