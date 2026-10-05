import { Info } from "lucide-react"
import { CtaSection } from "@/components/public/cta-section"
import { Reveal } from "@/components/public/reveal"
import { SectionHeading } from "@/components/public/section-heading"
import { PublicPricingSection } from "@/components/public/public-pricing-section"
import { PLANS } from "@/components/public/pricing-data"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const FEATURE_ROWS = [
  "Live farm dashboard",
  "Inventory tracking",
  "Sales & purchase entries",
  "Mortality & expenses records",
  "Customer & supplier management",
  "Godown inward, sale & stock tracking",
  "Reports & notifications",
  "Multi-user accounts",
  "Priority / dedicated support",
]

function planHasFeature(planId: string, feature: string): boolean {
  const starter = new Set([
    "Live farm dashboard",
    "Inventory tracking",
    "Sales & purchase entries",
    "Mortality & expenses records",
  ])
  const professional = new Set([
    ...starter,
    "Customer & supplier management",
    "Godown inward, sale & stock tracking",
    "Reports & notifications",
    "Multi-user accounts",
    "Priority / dedicated support",
  ])
  if (planId === "enterprise") return true
  if (planId === "professional") return professional.has(feature)
  return starter.has(feature)
}

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
            subtitle="Choose Starter or Professional. Enterprise is custom — talk to sales."
          />
        </Reveal>

        <Reveal delay={0.15} className="mt-12">
          <PublicPricingSection />
        </Reveal>
      </section>

      <section className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionHeading
              eyebrow="Compare Plans"
              title="What each plan includes"
              subtitle="Starter covers the basics. Professional and Enterprise add operations, reports, and team features."
            />
          </Reveal>

          <Reveal delay={0.1} className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse rounded-2xl bg-card text-sm shadow-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left font-semibold text-foreground">Feature</th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      className={cn(
                        "p-4 text-center font-semibold",
                        plan.highlighted ? "bg-primary/5 text-primary" : "text-foreground",
                      )}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((feature) => (
                  <tr key={feature} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-foreground">{feature}</td>
                    {PLANS.map((plan) => (
                      <td
                        key={plan.id}
                        className={cn("p-4 text-center", plan.highlighted && "bg-primary/5")}
                      >
                        {planHasFeature(plan.id, feature) ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-start sm:gap-5 sm:p-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Billing notes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Checkout is one payment per monthly or yearly cycle. Auto-renew comes later.
                Enterprise pricing is custom.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="pt-12">
        <CtaSection />
      </div>
    </div>
  )
}
