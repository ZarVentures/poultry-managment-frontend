export type PlanId = "basic" | "advance" | "premium"
export type PlanFilter = "all" | PlanId
export type CellValue = boolean | string

export interface PlanFeature {
  text: string
  comingSoon?: boolean
}

export interface PricingPlan {
  id: PlanId
  name: string
  tagline: string
  idealFor: string
  monthlyPrice: number
  ctaLabel: string
  ctaHref: string
  highlighted?: boolean
  features: PlanFeature[]
}

export interface BillingOption {
  id: string
  label: string
  amounts: Record<PlanId, number>
}

export interface ComparisonRow {
  feature: string
  basic: CellValue
  advance: CellValue
  premium: CellValue
}

export interface ComparisonGroup {
  category: string
  rows: ComparisonRow[]
}

export interface PricingFaq {
  question: string
  answer: string
}

export const PLAN_FILTERS: { id: PlanFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "basic", label: "Basic" },
  { id: "advance", label: "Advance" },
  { id: "premium", label: "Premium" },
]

export const PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Start smart. Go digital.",
    idealFor:
      "Small traders and single-godown dealers moving from paper registers to digital business management.",
    monthlyPrice: 4000,
    ctaLabel: "Get Started",
    ctaHref: "/signup",
    features: [
      { text: "Business dashboard with daily sales, purchases, stock and dues" },
      { text: "Purchase management" },
      { text: "Sales and dispatch management" },
      { text: "Billing and PDF invoices" },
      { text: "Inventory management for 1 godown" },
      { text: "Up to 150 customers, farmers and suppliers combined" },
      { text: "Payment tracking, advances and outstanding dues" },
      { text: "Expense management with standard categories" },
      { text: "Automatic customer and supplier ledgers" },
      { text: "Essential daily sales, purchase and outstanding reports" },
      { text: "2 users" },
      { text: "Mobile and cloud access" },
      { text: "Automatic backup" },
      { text: "Email and phone support during business hours" },
      { text: "Video onboarding and free updates" },
    ],
  },
  {
    id: "advance",
    name: "Advance",
    tagline: "Grow faster. Lose nothing.",
    idealFor:
      "Growing wholesalers and distributors managing multiple godowns, staff and daily dispatches.",
    monthlyPrice: 5000,
    ctaLabel: "Choose Advance",
    ctaHref: "/signup",
    highlighted: true,
    features: [
      { text: "Everything included in Basic" },
      { text: "Up to 3 godowns with stock visibility across locations" },
      { text: "Godown and bird returns tracking" },
      { text: "Low-stock alerts and stock movement history" },
      { text: "Unlimited customers, farmers and suppliers" },
      { text: "Opening balances, journals and payment vouchers" },
      { text: "Custom expense categories" },
      { text: "Advanced profit, dispatch, stock movement and outstanding reports" },
      { text: "CSV and PDF report export" },
      { text: "Invoices with your business name and details" },
      { text: "WhatsApp invoice sharing", comingSoon: true },
      { text: "5 users with role-based permissions" },
      { text: "Guided onboarding and data migration from Excel or registers" },
      { text: "Priority WhatsApp support" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Run your poultry empire.",
    idealFor:
      "Large distributors and multi-branch businesses requiring consolidated visibility and advanced controls.",
    monthlyPrice: 8000,
    ctaLabel: "Contact Sales",
    ctaHref: "/contact",
    features: [
      { text: "Everything included in Advance" },
      { text: "WhatsApp invoice sharing", comingSoon: true },
      { text: "Unlimited users" },
      { text: "Unlimited godowns, subject to product availability" },
      { text: "Multi-branch management", comingSoon: true },
      { text: "Consolidated owner dashboard across branches", comingSoon: true },
      { text: "Custom roles and permissions" },
      { text: "Automatic Profit & Loss statement" },
      { text: "UPI payment links on invoices", comingSoon: true },
      { text: "AI-powered demand forecasting", comingSoon: true },
      { text: "Custom reports", comingSoon: true },
      { text: "Branch-to-branch comparison", comingSoon: true },
      { text: "Branch-wise expense tracking", comingSoon: true },
      { text: "On-demand data export" },
      { text: "Dedicated account manager and team training" },
      {
        text: "24/7 priority support with a 2-hour response target, subject to service availability",
      },
      { text: "Early access to new features, where applicable" },
    ],
  },
]

export const BILLING_OPTIONS: BillingOption[] = [
  {
    id: "monthly",
    label: "Monthly",
    amounts: { basic: 4000, advance: 5000, premium: 8000 },
  },
  {
    id: "quarterly",
    label: "Quarterly — Save 5%",
    amounts: { basic: 11400, advance: 14250, premium: 22800 },
  },
  {
    id: "half-yearly",
    label: "Half-yearly — Save 10%",
    amounts: { basic: 21600, advance: 27000, premium: 43200 },
  },
  {
    id: "annual",
    label: "Annual — 2 Months Free",
    amounts: { basic: 40000, advance: 50000, premium: 80000 },
  },
]

export const COMPARISON_GROUPS: ComparisonGroup[] = [
  {
    category: "Core Operations",
    rows: [
      { feature: "Dashboard", basic: true, advance: true, premium: true },
      { feature: "Purchase management", basic: true, advance: true, premium: true },
      { feature: "Sales and dispatch management", basic: true, advance: true, premium: true },
      { feature: "Billing and PDF invoices", basic: true, advance: true, premium: true },
      {
        feature: "Branded invoices",
        basic: false,
        advance: "Business name and details",
        premium: "Business name and details",
      },
      {
        feature: "Godown limits",
        basic: "1",
        advance: "1",
        premium: "Unlimited, subject to availability",
      },
      {
        feature: "Branch management",
        basic: false,
        advance: false,
        premium: "Coming Soon",
      },
      { feature: "Low-stock alerts", basic: false, advance: true, premium: true },
      {
        feature: "Godown and bird returns tracking",
        basic: false,
        advance: true,
        premium: true,
      },
    ],
  },
  {
    category: "Parties & Money",
    rows: [
      {
        feature: "Customers, farmers and suppliers limits",
        basic: "Up to 150 combined",
        advance: "Unlimited",
        premium: "Unlimited",
      },
      { feature: "Payment tracking and advances", basic: true, advance: true, premium: true },
      {
        feature: "Expense management",
        basic: "Standard categories",
        advance: "Custom categories",
        premium: "Custom categories; branch-wise tracking coming soon",
      },
      {
        feature: "Customer and supplier ledgers",
        basic: true,
        advance: true,
        premium: true,
      },
      {
        feature: "Opening balances, journals and vouchers",
        basic: true,
        advance: true,
        premium: true,
      },
      {
        feature: "Automatic P&L statement",
        basic: false,
        advance: false,
        premium: true,
      },
      {
        feature: "WhatsApp invoice sharing",
        basic: false,
        advance: "Coming Soon",
        premium: "Coming Soon",
      },
    ],
  },
  {
    category: "Reports & Insights",
    rows: [
      {
        feature: "Essential, advanced and custom reports",
        basic: "Essential",
        advance: "Advanced",
        premium: "Advanced; custom reports coming soon",
      },
      {
        feature: "Excel/PDF export",
        basic: true,
        advance: true,
        premium: true,
      },
      {
        feature: "Branch comparison reports",
        basic: false,
        advance: false,
        premium: "Coming Soon",
      },
    ],
  },
  {
    category: "Team, Access & Support",
    rows: [
      { feature: "User limits", basic: "2", advance: "5", premium: "Unlimited" },
      {
        feature: "Role-based permissions",
        basic: false,
        advance: true,
        premium: "Custom roles",
      },
      { feature: "Mobile and cloud access", basic: true, advance: true, premium: true },
      /*{
        feature: "Backup retention",
        basic: "Automatic backup",
        advance: "Automatic backup",
        premium: "Automatic backup",
      },*/
      {
        feature: "Onboarding",
        basic: "Online guides ",
        advance: "Online guides ",
        premium: "Online + Video guides",
      },
      {
        feature: "Support level",
        basic: "Email and phone during business hours",
        advance: "Email and phone during business hours",
        premium: "24/7 priority, 2-hour response target, subject to availability",
      },
    ],
  },
]

export const BENEFITS = [
  {
    title: "Know Your Stock",
    description: "Get visibility into godowns, birds and stock movement.",
  },
  {
    title: "Control Outstanding",
    description: "Track customer and supplier dues, advances and payments.",
  },
  {
    title: "Protect Your Margins",
    description: "Monitor purchases, expenses and reports in one place.",
  },
  {
    title: "Manage Your Team",
    description: "Organize staff access and business permissions.",
  },
]

export const ADD_ONS = [
  { name: "Extra user", price: "₹299 / user / month" },
  { name: "Extra godown", price: "₹499 / godown / month" },
  { name: "On-site training visit", price: "₹4,999 / visit" },
]

export const PRICING_FAQS: PricingFaq[] = [
  {
    question: "What is the difference between Basic, Advance and Premium?",
    answer:
      "Basic is for small traders and single-godown dealers. It includes 2 users, 1 godown and up to 150 customers, farmers and suppliers combined. Advance is for growing wholesalers and distributors and adds up to 3 godowns, more reports, 5 users with role-based permissions and priority WhatsApp support. Premium is for larger distributors and adds unlimited users, custom roles and further controls. Unlimited godowns are subject to product availability. Multi-branch tools, WhatsApp invoice sharing, UPI payment links on invoices, AI demand forecasting and custom or branch comparison reports are marked Coming Soon where they are not available yet.",
  },
  {
    question: "Can I choose an annual subscription instead of monthly billing?",
    answer:
      "Yes. Monthly, quarterly, half-yearly and annual amounts are listed in the billing options. Quarterly billing is 5% less than three monthly payments, half-yearly billing is 10% less than six monthly payments, and annual billing equals ten months of the monthly price. All of these prices exclude 18% GST.",
  },
  {
    question: "Are the prices inclusive of GST?",
    answer: "No. Plan prices and add-on prices exclude 18% GST.",
  },
  {
    question: "Can I upgrade my plan later?",
    answer:
      "Contact the Poultry Sathi team if you want to move to a different plan. This page does not publish the timing, billing adjustments or other terms that apply to a plan change.",
  },
  {
    question: "Is a free demo available?",
    answer:
      "Yes. Use Book Your Free Demo on this page to open the contact form and request a walkthrough of Poultry Sathi.",
  },
  {
    question: "Do all plans have the same user and godown limits?",
    answer:
      "No. Basic includes 2 users and 1 godown. Advance includes 5 users and up to 3 godowns. Premium includes unlimited users. Unlimited godowns and multi-branch management on Premium are subject to product availability. Extra users and extra godowns are optional add-ons where the selected plan and product limits allow them.",
  },
  {
    question: "Are all features available in every plan?",
    answer:
      "No. Each plan has its own limits and feature list. A check means the item is included. Coming Soon means it is not available yet.",
  },
  {
    question: "Is onboarding and data migration included?",
    answer:
      "Basic includes video onboarding. Advance includes guided onboarding and data migration from Excel or registers. Premium includes a dedicated account manager and team training. An on-site training visit is a separate add-on. This page does not publish further conditions for onboarding or migration.",
  },
  {
    question: "How do subscription renewal and cancellation work?",
    answer:
      "Renewal and cancellation terms are not published on this page. Contact the Poultry Sathi team for the current subscription policy.",
  },
]

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`
}
