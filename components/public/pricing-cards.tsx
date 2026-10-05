"use client"

import Link from "next/link"
import { Check, Loader2, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  formatPlanPrice,
  planPriceNote,
  type BillingPeriod,
  type PricingPlan,
} from "@/components/public/pricing-data"

interface PricingCardsProps {
  plans: PricingPlan[]
  billing: BillingPeriod
  currentPlanId?: string | null
  paying?: boolean
  payingPlanId?: string | null
  onSelectPlan?: (planId: string) => void
}

export function PricingCards({
  plans,
  billing,
  currentPlanId,
  paying,
  payingPlanId,
  onSelectPlan,
}: PricingCardsProps) {
  return (
    <div className="mx-auto grid max-w-5xl items-stretch gap-5 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = !!currentPlanId && currentPlanId === plan.id
        const isEnterprise = plan.id === "enterprise"
        const isBusy = paying && payingPlanId === plan.id

        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm",
              plan.highlighted
                ? "border-primary/50 ring-1 ring-primary/15"
                : "border-border",
              isCurrent && "border-primary",
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold tracking-tight text-foreground">{plan.name}</h3>
              <div className="flex gap-1.5">
                {plan.highlighted && (
                  <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                )}
                {isCurrent && (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Current
                  </Badge>
                )}
              </div>
            </div>

            <p className="min-h-10 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

            <div className="mt-5 border-t border-border pt-5">
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {formatPlanPrice(plan, billing)}
                </span>
                {plan.monthlyPrice > 0 && (
                  <span className="mb-1 text-sm text-muted-foreground">
                    {billing === "yearly" ? "/ year" : "/ month"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{planPriceNote(plan, billing)}</p>
            </div>

            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            {isEnterprise || !onSelectPlan ? (
              <Button
                asChild
                className="mt-6 w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                <Link
                  href={
                    isEnterprise
                      ? "/contact"
                      : `/signup?plan=${plan.id}&billing=${billing}`
                  }
                >
                  {plan.ctaLabel}
                </Link>
              </Button>
            ) : (
              <Button
                className="mt-6 w-full"
                variant={plan.highlighted || isCurrent ? "default" : "outline"}
                disabled={paying}
                onClick={() => onSelectPlan(plan.id)}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : isCurrent ? (
                  `Renew ${plan.name}`
                ) : (
                  `Continue with ${plan.name}`
                )}
              </Button>
            )}

            {!isEnterprise && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Secure payment via Razorpay
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
