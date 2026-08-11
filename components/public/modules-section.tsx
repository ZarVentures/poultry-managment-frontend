import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  Handshake,
  IndianRupee,
  LayoutDashboard,
  ReceiptIndianRupee,
  ShoppingCart,
  Store,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/public/reveal"
import { SectionHeading } from "@/components/public/section-heading"

interface Module {
  icon: LucideIcon
  title: string
  description: string
}

const MODULES: Module[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Your entire trade on one screen — sales, purchases, stock and dues at a glance.",
  },
  {
    icon: ShoppingCart,
    title: "Purchase Management",
    description:
      "Create purchase orders from suppliers and track every batch into your godown.",
  },
  {
    icon: Store,
    title: "Sales Management",
    description:
      "Invoice retailers in seconds and keep a real-time record of every sale and dispatch.",
  },
  {
    icon: ReceiptIndianRupee,
    title: "Billing & Invoicing",
    description:
      "Professional invoices with auto numbering, print-ready and PDF exports.",
  },
  {
    icon: Boxes,
    title: "Inventory Management",
    description:
      "Track birds, feed and stock with low-stock alerts and full movement history.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Keep every retailer organised with their complete ledger, dues and contacts.",
  },
  {
    icon: Handshake,
    title: "Supplier Management",
    description:
      "Manage your suppliers with purchase history, balances and payment vouchers.",
  },
  {
    icon: Wallet,
    title: "Payment Tracking",
    description:
      "Record payments in and out, track advances and chase outstanding dues.",
  },
  {
    icon: IndianRupee,
    title: "Expense Management",
    description:
      "Log every cost — transport, labour, godown and more — to protect your margins.",
  },
  {
    icon: BookOpen,
    title: "Ledger",
    description:
      "Automatic customer and supplier ledgers that stay accurate with every entry.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Outstanding, profit and dispatch reports for confident trading decisions.",
  },
  {
    icon: UserCog,
    title: "Staff Management",
    description:
      "Assign roles and permissions so your team works within their scope.",
  },
]

export function ModulesSection() {
  return (
    <section id="modules" className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading
            eyebrow="Our Modules"
            title="Everything you need to run your poultry trade"
            subtitle="Twelve integrated modules that manage purchases, sales, stock, payments and profit — all in one platform."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.map((module, index) => {
            const Icon = module.icon
            return (
              <Reveal key={module.title} delay={(index % 4) * 0.06}>
                <div className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{module.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {module.description}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={0.15} className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/features">
              Explore all features <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
