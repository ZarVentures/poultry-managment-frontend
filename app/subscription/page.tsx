"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, CreditCard, Loader2, ShieldCheck } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PricingCards } from "@/components/public/pricing-cards"
import { BillingPeriodToggle } from "@/components/public/public-pricing-section"
import { PLANS, type BillingPeriod as PublicBillingPeriod } from "@/components/public/pricing-data"
import { subscriptionsApi, type BillingPeriod, type PaidPlanId, type SubscriptionMe } from "@/lib/api"
import { getStoredUser } from "@/lib/auth-session"
import { toast } from "sonner"

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

async function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return
  if (window.Razorpay) return
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout"))
    document.body.appendChild(script)
  })
}

function planDisplayName(plan?: string | null): string {
  if (!plan) return "None"
  return PLANS.find((p) => p.id === plan)?.name || plan
}

function formatDate(value?: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function statusMeta(status?: string | null) {
  switch (status) {
    case "trial":
      return { label: "Trial", className: "border-amber-200 bg-amber-50 text-amber-800" }
    case "active":
      return { label: "Active", className: "border-emerald-200 bg-emerald-50 text-emerald-800" }
    case "past_due":
      return { label: "Past due", className: "border-orange-200 bg-orange-50 text-orange-800" }
    case "expired":
    case "cancelled":
      return { label: status === "expired" ? "Expired" : "Cancelled", className: "border-red-200 bg-red-50 text-red-800" }
    default:
      return { label: status ? status.replace("_", " ") : "Unknown", className: "border-border bg-muted text-muted-foreground" }
  }
}

export default function SubscriptionPage() {
  const [me, setMe] = useState<SubscriptionMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null)
  const [billing, setBilling] = useState<BillingPeriod>("monthly")
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await subscriptionsApi.getMe()
        if (!cancelled) setMe(data)
        try {
          const pending = sessionStorage.getItem("pendingPlan")
          if (pending) {
            const parsed = JSON.parse(pending) as { plan?: string; billing?: BillingPeriod }
            if (parsed.billing === "yearly" || parsed.billing === "monthly") {
              if (!cancelled) setBilling(parsed.billing)
            }
          }
        } catch { /* ignore */ }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load subscription")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const status = statusMeta(me?.subscriptionStatus)
  const renewalLabel = useMemo(() => {
    if (!me) return "—"
    if (me.subscriptionStatus === "trial") return formatDate(me.trialEndsAt)
    return formatDate(me.currentPeriodEndsAt)
  }, [me])

  const pay = async (planId: string) => {
    if (planId !== "starter" && planId !== "professional") return
    const plan = planId as PaidPlanId
    setPayingPlanId(plan)
    setError("")
    try {
      await loadRazorpayScript()
      if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable")

      const order = await subscriptionsApi.createOrder(plan, billing)
      const user = getStoredUser()
      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || order.keyId

      const rzp = new window.Razorpay({
        key: publicKey,
        amount: order.amount,
        currency: order.currency,
        name: "Poultry Sathi",
        description: `${order.planName} · ${billing === "yearly" ? "Yearly" : "Monthly"}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#059669" },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const updated = await subscriptionsApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setMe(updated)
            sessionStorage.removeItem("pendingPlan")
            toast.success("Payment received. Your plan is now active.")
          } catch (err: any) {
            setError(err.message || "Payment verification failed")
            toast.error(err.message || "Payment verification failed")
          } finally {
            setPayingPlanId(null)
          }
        },
        modal: {
          ondismiss: () => setPayingPlanId(null),
        },
      })
      rzp.open()
    } catch (err: any) {
      setError(err.message || "Could not start payment")
      toast.error(err.message || "Could not start payment")
      setPayingPlanId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Billing & plans</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your Poultry Sathi subscription. Farm accounting stays on the Accounting pages.
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Payments processed by Razorpay
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading subscription details…
              </div>
            ) : (
              <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current plan</p>
                  <p className="mt-2 text-lg font-semibold">{planDisplayName(me?.plan)}</p>
                  {me?.billingPeriod && (
                    <p className="mt-1 text-xs capitalize text-muted-foreground">{me.billingPeriod} billing</p>
                  )}
                </div>
                <div className="px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                  <div className="mt-2">
                    <Badge variant="outline" className={status.className}>{status.label}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {me?.canAccessApp ? "Workspace access is active." : "Access is paused until you subscribe."}
                  </p>
                </div>
                <div className="px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {me?.subscriptionStatus === "trial" ? "Trial ends" : "Current period ends"}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    {renewalLabel}
                  </p>
                  {me?.daysLeft != null && me.daysLeft >= 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">{me.daysLeft} day{me.daysLeft === 1 ? "" : "s"} remaining</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold">Choose a plan</h2>
              <p className="text-sm text-muted-foreground">One payment per cycle. Auto-renew will be added later.</p>
            </div>
            <BillingPeriodToggle
              billing={billing as PublicBillingPeriod}
              onChange={(period) => setBilling(period)}
            />
          </div>

          <PricingCards
            plans={PLANS}
            billing={billing as PublicBillingPeriod}
            currentPlanId={me?.plan}
            paying={!!payingPlanId}
            payingPlanId={payingPlanId}
            onSelectPlan={pay}
          />
        </div>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5" />
          UPI, cards, and netbanking are supported. Invoices for GST will be added in a later release.
        </p>
      </div>
    </DashboardLayout>
  )
}
