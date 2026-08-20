"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { tenantsApi } from "@/lib/api"
import { toast } from "sonner"

const BUSINESS_TYPES = [
  { value: "poultry_trader", label: "Poultry Trader" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "distributor", label: "Distributor" },
  { value: "dealer", label: "Dealer" },
  { value: "farm", label: "Poultry Farm" },
  { value: "godown", label: "Godown / Cold Storage" },
  { value: "other", label: "Other" },
]

const CURRENCIES = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
]

const COUNTRY_CODES = [
  { value: "+91", label: "🇮🇳 +91 India" },
  { value: "+1", label: "🇺🇸 +1 USA / Canada" },
  { value: "+44", label: "🇬🇧 +44 UK" },
  { value: "+971", label: "🇦🇪 +971 UAE" },
  { value: "+966", label: "🇸🇦 +966 Saudi Arabia" },
  { value: "+92", label: "🇵🇰 +92 Pakistan" },
  { value: "+880", label: "🇧🇩 +880 Bangladesh" },
  { value: "+94", label: "🇱🇰 +94 Sri Lanka" },
  { value: "+977", label: "🇳🇵 +977 Nepal" },
  { value: "+60", label: "🇲🇾 +60 Malaysia" },
  { value: "+65", label: "🇸🇬 +65 Singapore" },
  { value: "+61", label: "🇦🇺 +61 Australia" },
  { value: "+49", label: "🇩🇪 +49 Germany" },
  { value: "+33", label: "🇫🇷 +33 France" },
  { value: "+86", label: "🇨🇳 +86 China" },
  { value: "+81", label: "🇯🇵 +81 Japan" },
  { value: "+234", label: "🇳🇬 +234 Nigeria" },
  { value: "+27", label: "🇿🇦 +27 South Africa" },
  { value: "+55", label: "🇧🇷 +55 Brazil" },
  { value: "+7", label: "🇷🇺 +7 Russia" },
]

export default function BusinessSetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    businessLocation: "",
    businessEmail: "",
    businessPhone: "",
    currency: "INR",
    countryCode: "+91",
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/login")
      return
    }

    // Already has a shop (tenant attached) → straight to dashboard
    const stored = localStorage.getItem("user")
    let tenantId: string | null = null
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        tenantId = parsed?.tenantId ?? null
      } catch {
        tenantId = null
      }
    }
    if (tenantId) {
      router.replace("/dashboard")
      return
    }

    setChecking(false)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.businessName.trim()) {
      setError("Please enter your business name.")
      return
    }
    if (!formData.businessType) {
      setError("Please select your business type.")
      return
    }

    setIsLoading(true)
    try {
      const { accessToken, user } = await tenantsApi.create({
        name: formData.businessName.trim(),
        type: formData.businessType,
        address: formData.businessLocation.trim() || undefined,
        email: formData.businessEmail.trim() || undefined,
        phone: formData.businessPhone.trim() || undefined,
        currency: formData.currency,
        countryCode: formData.countryCode,
      })
      localStorage.setItem("token", accessToken)
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("business_created", "true")
      setSubmitted(true)
      toast.success("Business created! Welcome to Poultry Sathi!")
      setTimeout(() => { window.location.href = "/dashboard" }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to create your business")
    } finally {
      setIsLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden px-4 pb-16 pt-10 sm:pt-14">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(600px circle at 50% 0%, hsla(142, 76%, 36%, 0.12), transparent 55%)" }}
      />
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-end">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-2">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">Create your business</CardTitle>
              <CardDescription>
                {submitted
                  ? "Business created successfully!"
                  : "Set up your business profile to get started."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                <p className="text-lg font-semibold">Your business is ready!</p>
                <p className="text-muted-foreground text-sm">Redirecting to your dashboard…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="e.g. Sharma Poultry Traders"
                    value={formData.businessName}
                    onChange={(e) => setFormData((f) => ({ ...f, businessName: e.target.value }))}
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select value={formData.businessType} onValueChange={(v) => setFormData((f) => ({ ...f, businessType: v }))} disabled={isLoading}>
                    <SelectTrigger id="businessType"><SelectValue placeholder="Select business type" /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessLocation">Location</Label>
                  <Input
                    id="businessLocation"
                    placeholder="City, State"
                    value={formData.businessLocation}
                    onChange={(e) => setFormData((f) => ({ ...f, businessLocation: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="business@email.com"
                      value={formData.businessEmail}
                      onChange={(e) => setFormData((f) => ({ ...f, businessEmail: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Phone</Label>
                    <Input
                      id="businessPhone"
                      type="tel"
                      placeholder="98765 43210"
                      value={formData.businessPhone}
                      onChange={(e) => setFormData((f) => ({ ...f, businessPhone: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData((f) => ({ ...f, currency: v }))} disabled={isLoading}>
                      <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Country Code</Label>
                    <Select value={formData.countryCode} onValueChange={(v) => setFormData((f) => ({ ...f, countryCode: v }))} disabled={isLoading}>
                      <SelectTrigger id="countryCode"><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating business…</>
                  ) : (
                    <>Create Business <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>

                <div className="space-y-2 pt-2">
                  {["Business name & profile", "Currency & country settings", "Ready in under a minute"].map((text) => (
                    <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />{text}
                    </div>
                  ))}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}