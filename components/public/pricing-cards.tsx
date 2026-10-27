import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatInr, type PricingPlan } from "@/components/public/pricing-data"

interface PricingCardsProps {
  plans: PricingPlan[]
}

export function PricingCards({ plans }: PricingCardsProps) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full gap-6",
        plans.length === 1
          ? "max-w-md grid-cols-1"
          : "max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {plans.map((plan) => (
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

          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Ideal for: </span>
            {plan.idealFor}
          </p>

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

          <ul className="mt-6 space-y-3 text-sm">
            {plan.features.map((feature) => (
              <li key={feature.text} className="flex items-start gap-2.5">
                {feature.comingSoon ? (
                  <span className="mt-0.5 shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Coming Soon
                  </span>
                ) : (
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <span className="text-muted-foreground">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
