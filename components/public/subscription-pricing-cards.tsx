import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatInr, PLANS } from "@/components/public/pricing-data"
import { cn } from "@/lib/utils"

export function SubscriptionPricingCards() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
            plan.highlighted
              ? "border-primary bg-primary/[0.04] shadow-lg ring-2 ring-primary/20"
              : "border-border hover:border-primary/40",
          )}
        >
          {plan.highlighted && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
              ⭐ Most Popular
            </span>
          )}

          <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {formatInr(plan.monthlyPrice)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">/ month + GST</p>

          <div className="flex-1" />

          <Button
            asChild
            className={cn(
              "mt-6 w-full",
              plan.highlighted ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
            variant={plan.highlighted ? "default" : "secondary"}
          >
            <Link href={plan.ctaHref}>
              {plan.ctaLabel}
              {plan.highlighted && <ArrowRight className="ml-1 h-4 w-4" />}
            </Link>
          </Button>
        </div>
      ))}
    </div>
  )
}
