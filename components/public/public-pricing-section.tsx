"use client"

import { useState } from "react"
import { PLANS, type BillingPeriod } from "@/components/public/pricing-data"
import { PricingCards } from "@/components/public/pricing-cards"
import { cn } from "@/lib/utils"

export function BillingPeriodToggle({
  billing,
  onChange,
}: {
  billing: BillingPeriod
  onChange: (billing: BillingPeriod) => void
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
        {(["monthly", "yearly"] as BillingPeriod[]).map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              billing === period
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {period === "monthly" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {billing === "yearly" ? "Billed once a year — two months equivalent saved." : "Billed every month. Switch to yearly to save."}
      </p>
    </div>
  )
}

export function PublicPricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly")

  return (
    <div className="space-y-8">
      <BillingPeriodToggle billing={billing} onChange={setBilling} />
      <PricingCards plans={PLANS} billing={billing} />
    </div>
  )
}
