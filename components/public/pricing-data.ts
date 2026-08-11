export type BillingPeriod = "monthly" | "yearly"

export interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  ctaLabel: string
  highlighted?: boolean
  features: string[]
}

export const PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For small single-farm operations getting started.",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    ctaLabel: "Start with Starter",
    features: [
      "Live farm dashboard",
      "Basic inventory tracking",
      "Sales & purchase entries",
      "Mortality & expenses records",
      "1 user account",
      "Email support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing businesses that need the full picture.",
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    ctaLabel: "Choose Professional",
    highlighted: true,
    features: [
      "Everything in Starter",
      "Customer & supplier management",
      "Godown inward, sale & stock tracking",
      "Bird returns & cage tracking",
      "Reports & notifications (SMS + email)",
      "Up to 5 user accounts",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large operations with multiple farms and teams.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    ctaLabel: "Contact Sales",
    features: [
      "Everything in Professional",
      "Advanced analytics & financial reports",
      "Multi-branch & multi-godown support",
      "Custom roles & permissions",
      "API access & integrations",
      "Unlimited users",
      "Dedicated onboarding & account manager",
    ],
  },
]

export function formatPlanPrice(plan: PricingPlan, billing: BillingPeriod): string {
  if (plan.monthlyPrice === 0) return "Custom"
  const amount = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
  return `₹${amount.toLocaleString("en-IN")}`
}

export function planPriceNote(plan: PricingPlan, billing: BillingPeriod): string {
  if (plan.monthlyPrice === 0) return "Tailored to your needs"
  return billing === "yearly" ? "per year, billed annually" : "per month, billed monthly"
}
