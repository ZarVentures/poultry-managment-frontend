import { Check, Info, Minus } from "lucide-react"
import { CtaSection } from "@/components/public/cta-section"
import { Reveal } from "@/components/public/reveal"
import { SectionHeading } from "@/components/public/section-heading"
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPricingCards,
} from "@/components/public/subscription-pricing-cards"
import { cn } from "@/lib/utils"

type CellValue = boolean | string

type PlanId = "1-month" | "3-months" | "6-months" | "annual"

interface ComparisonRow {
  feature: string
  "1-month": CellValue
  "3-months": CellValue
  "6-months": CellValue
  annual: CellValue
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Dashboard", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Purchase Management", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Sales Management", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Billing & Invoice Generation", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Inventory Management", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Customer & Farmer Management", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Payment Management", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Expense Management", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Ledger & Accounting", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Reports & Analytics", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Multi-User Access", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Cloud-Based Platform", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Free Updates", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Technical Support", "1-month": true, "3-months": true, "6-months": true, annual: true },
  { feature: "Subscription Validity", "1-month": "1 Month", "3-months": "3 Months", "6-months": "6 Months", annual: "12 Months" },
  { feature: "GST", "1-month": "+18%", "3-months": "+18%", "6-months": "+18%", annual: "+18%" },
]

const GST_POINTS = [
  "All plans include every feature available in Poultry Sathi.",
  "There are no feature restrictions between plans.",
  "The only difference is the subscription duration.",
  "Prices shown above are exclusive of GST.",
]

export default function PricingPage() {
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
            eyebrow="Pricing"
            title="Simple & Transparent Pricing"
            subtitle="Choose the subscription duration that best fits your poultry business. Every plan includes the complete Poultry Sathi platform with no feature limitations."
          />
        </Reveal>

        <Reveal delay={0.15} className="mt-12">
          <SubscriptionPricingCards />
        </Reveal>

        <Reveal delay={0.2} className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            All prices are exclusive of GST. An additional{" "}
            <strong className="font-semibold text-foreground">18% GST</strong> will be charged as
            applicable.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl">
          <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-start sm:gap-5 sm:p-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Pricing Information</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {GST_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{point}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>
                    An additional <strong className="font-semibold text-foreground">18% GST</strong>{" "}
                    will be charged as applicable.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionHeading
              eyebrow="Compare Plans"
              title="Every Plan Includes"
              subtitle="All subscription plans provide access to the complete Poultry Sathi platform."
            />
          </Reveal>

          <Reveal delay={0.1} className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse rounded-2xl bg-card text-sm shadow-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left font-semibold text-foreground">Feature</th>
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      className={cn(
                        "p-4 text-center font-semibold",
                        plan.highlighted ? "bg-primary/5 text-primary" : "text-foreground",
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {plan.name}
                        {plan.highlighted && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                            Most Popular
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-foreground">{row.feature}</td>
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <CompareCell
                        key={plan.id}
                        value={row[plan.id as PlanId]}
                        highlighted={plan.highlighted}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <div className="pt-20">
        <CtaSection />
      </div>
    </div>
  )
}

function CompareCell({ value, highlighted }: { value: CellValue; highlighted?: boolean }) {
  return (
    <td className={cn("p-4 text-center", highlighted && "bg-primary/5")}>
      {typeof value === "boolean" ? (
        value ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-4 w-4" />
          </span>
        ) : (
          <span className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground/40">
            <Minus className="h-4 w-4" />
          </span>
        )
      ) : (
        <span className="text-sm font-medium text-foreground">{value}</span>
      )}
    </td>
  )
}
