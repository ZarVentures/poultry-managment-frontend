import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SubscriptionPlan {
  id: string
  name: string
  price: string
  validity: string
  description: string
  ctaLabel: string
  tone?: "accent" | "strong"
  discount?: string
  highlighted?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "1-month",
    name: "1 Month",
    price: "₹4,249",
    validity: "1 Month Access",
    description: "Perfect for businesses getting started.",
    ctaLabel: "Start Now",
  },
  {
    id: "3-months",
    name: "3 Months",
    price: "₹11,499",
    validity: "3 Months Access",
    description: "Ideal for growing poultry businesses.",
    ctaLabel: "Choose Plan",
    tone: "accent",
    discount: "🟢 Save 10%",
  },
  {
    id: "6-months",
    name: "6 Months",
    price: "₹21,669",
    validity: "6 Months Access",
    description: "Best for businesses looking for long-term management.",
    ctaLabel: "Choose Plan",
    tone: "strong",
    discount: "🟢 Save 15%",
  },
  {
    id: "annual",
    name: "Annual Plan",
    price: "₹41,799",
    validity: "12 Months Access",
    description: "Best value for businesses planning long-term growth.",
    ctaLabel: "Get Annual Plan",
    highlighted: true,
    discount: "⭐ Save 18%",
  },
]

export function SubscriptionPricingCards() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {SUBSCRIPTION_PLANS.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
            plan.highlighted
              ? "border-primary bg-primary/[0.04] shadow-lg ring-2 ring-primary/20"
              : plan.tone === "strong"
                ? "border-primary/60 hover:border-primary/80"
                : plan.tone === "accent"
                  ? "border-primary/30 hover:border-primary/50"
                  : "border-border hover:border-primary/40",
          )}
        >
          {plan.highlighted && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
              ⭐ Most Popular
            </span>
          )}

          <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-foreground">{plan.price}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{plan.validity}</p>

          {plan.discount && (
            <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {plan.discount}
            </span>
          )}

          <div className="flex-1" />

          <Button
            asChild
            className={cn(
              "mt-6 w-full",
              plan.highlighted ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
            variant={plan.highlighted ? "default" : "secondary"}
          >
            <Link href="/signup">
              {plan.ctaLabel}
              {plan.highlighted && <ArrowRight className="ml-1 h-4 w-4" />}
            </Link>
          </Button>
        </div>
      ))}
    </div>
  )
}
