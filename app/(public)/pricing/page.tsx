"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Info, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Faq } from "@/components/public/faq"
import { PricingCards } from "@/components/public/pricing-cards"
import { Reveal } from "@/components/public/reveal"
import { SectionHeading } from "@/components/public/section-heading"
import {
  ADD_ONS,
  BENEFITS,
  BILLING_OPTIONS,
  COMPARISON_GROUPS,
  PLAN_FILTERS,
  PLANS,
  PRICING_FAQS,
  formatInr,
  type CellValue,
  type PlanFilter,
  type PlanId,
} from "@/components/public/pricing-data"
import { cn } from "@/lib/utils"

const PRICING_NOTES = [
  "Basic, Advance and Premium do not include the same limits or features.",
  "Items marked Coming Soon are not available yet.",
  "Extra users, extra godowns and on-site training are optional add-ons. Availability depends on the selected plan and product limits.",
]

export default function PricingPage() {
  const [filter, setFilter] = useState<PlanFilter>("all")
  const visiblePlans = filter === "all" ? PLANS : PLANS.filter((plan) => plan.id === filter)

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
            eyebrow="Smart Business Management for Poultry Traders"
            title="Simple, Transparent Pricing for Your Growing Business"
            subtitle="Choose the right Poultry Sathi plan for your business. Manage purchases, sales, stock, payments and reports from one platform."
          />
          <p className="mt-4 text-sm text-muted-foreground">All prices exclude 18% GST.</p>
        </Reveal>

        <Reveal delay={0.15} className="mt-12">
          <div
            className="mb-8 flex flex-wrap items-center justify-center gap-2"
            role="group"
            aria-label="Filter pricing plans"
          >
            {PLAN_FILTERS.map((item) => {
              const selected = filter === item.id
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant={selected ? "default" : "secondary"}
                  aria-pressed={selected}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </Button>
              )
            })}
          </div>
          <PricingCards plans={visiblePlans} />
        </Reveal>

        <Reveal delay={0.2} className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">All prices exclude 18% GST.</p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl">
          <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-start sm:gap-5 sm:p-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Pricing Information</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {PRICING_NOTES.map((point) => (
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

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionHeading
              eyebrow="Billing"
              title="Billing Options"
              subtitle="All prices exclude 18% GST."
            />
          </Reveal>

          <Reveal delay={0.1} className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse rounded-2xl bg-card text-sm shadow-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left font-semibold text-foreground">Billing Cycle</th>
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
                {BILLING_OPTIONS.map((option) => (
                  <tr key={option.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-foreground">{option.label}</td>
                    {PLANS.map((plan) => (
                      <td
                        key={plan.id}
                        className={cn(
                          "p-4 text-center text-sm font-medium text-foreground",
                          plan.highlighted && "bg-primary/5",
                        )}
                      >
                        {formatInr(option.amounts[plan.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <section className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionHeading
              eyebrow="Compare Plans"
              title="Compare Basic, Advance and Premium"
              subtitle="Limits and features differ by plan. Items marked Coming Soon are not available yet."
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
                {COMPARISON_GROUPS.map((group) => (
                  <Fragment key={group.category}>
                    <tr className="border-b border-border bg-muted/40">
                      <td
                        colSpan={4}
                        className="p-4 text-xs font-semibold uppercase tracking-wider text-primary"
                      >
                        {group.category}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.feature} className="border-b border-border last:border-0">
                        <td className="p-4 font-medium text-foreground">{row.feature}</td>
                        {PLANS.map((plan) => (
                          <CompareCell
                            key={plan.id}
                            value={row[plan.id as PlanId]}
                            highlighted={plan.highlighted}
                          />
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionHeading eyebrow="Benefits" title="Business benefits" />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {BENEFITS.map((benefit, index) => (
              <Reveal key={benefit.title} delay={index * 0.08}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionHeading
              eyebrow="Add-ons"
              title="Optional add-ons"
              subtitle="Add-on availability depends on the selected plan and product limits. All prices exclude 18% GST."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ADD_ONS.map((addOn, index) => (
              <Reveal key={addOn.name} delay={index * 0.08}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground">{addOn.name}</h3>
                  <p className="mt-2 text-sm font-medium text-foreground">{addOn.price}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="FAQ"
              title="Frequently asked questions"
              subtitle="Answers below use the published plan details. Renewal, cancellation and plan-change rules are confirmed with the team."
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <Faq items={PRICING_FAQS} />
          </Reveal>
        </div>
      </section>

      <div className="pt-20">
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
                See Poultry Sathi in Action
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-emerald-50/90 sm:text-lg">
                Book a free demo and explore how Poultry Sathi fits your business workflow.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-white text-emerald-700 shadow-md hover:bg-emerald-50 sm:w-auto"
                >
                  <Link href="/contact">
                    Book Your Free Demo <ArrowRight className="ml-1 h-4 w-4" />
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
    </div>
  )
}

function CompareCell({ value, highlighted }: { value: CellValue; highlighted?: boolean }) {
  const comingSoon = typeof value === "string" && value.toLowerCase().includes("coming soon")

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
      ) : comingSoon && value === "Coming Soon" ? (
        <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Coming Soon
        </span>
      ) : (
        <span className="text-sm font-medium text-foreground">{value}</span>
      )}
    </td>
  )
}
