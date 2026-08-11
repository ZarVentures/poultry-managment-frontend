import Link from "next/link"
import { Check } from "lucide-react"
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
}

export function PricingCards({ plans, billing }: PricingCardsProps) {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
            plan.highlighted
              ? "border-primary/40 shadow-lg ring-2 ring-primary/20"
              : "border-border",
          )}
        >
          {plan.highlighted && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
              Recommended
            </Badge>
          )}
          <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {formatPlanPrice(plan, billing)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{planPriceNote(plan, billing)}</p>

          <Button
            asChild
            className={cn(
              "mt-6 w-full",
              plan.highlighted ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
            variant={plan.highlighted ? "default" : "secondary"}
          >
            <Link href={plan.id === "enterprise" ? "/contact" : "/signup"}>{plan.ctaLabel}</Link>
          </Button>

          <ul className="mt-6 space-y-3 text-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
