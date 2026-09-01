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
import { getOrganizationId, persistSession } from "@/lib/auth-session"
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

    if (getOrganizationId()) {
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
      persistSession(accessToken, user)
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
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(700px circle at 50% 30%, hsla(142, 76%, 36%, 0.08), transparent 60%)" }}
      />

      <div className="w-full max-w-xl">
        <div className="mb-8 flex justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <Card className="w-full border-border/60 shadow-lg shadow-black/[0.03]">
          <CardHeader className="space-y-1 pb-2">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">Create your business</CardTitle>
              <CardDescription className="mt-1.5 text-sm leading-relaxed">
                {submitted
                  ? "Business created successfully!"
                  : "Set up your business profile to get started."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            {submitted ? (
              <div className="space-y-4 py-4 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
                <p className="text-lg font-semibold">Your business is ready!</p>
                <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="e.g. Sharma Poultry Traders"
                    value={formData.businessName}
                    onChange={(e) => setFormData((f) => ({ ...f, businessName: e.target.value }))}
                    disabled={isLoading}
                    className="h-11 rounded-xl"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType" className="text-sm font-medium">
                    Business Type *
                  </Label>
                  <Select value={formData.businessType} onValueChange={(v) => setFormData((f) => ({ ...f, businessType: v }))} disabled={isLoading}>
                    <SelectTrigger id="businessType" className="!h-11 !rounded-xl">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessLocation" className="text-sm font-medium">
                    Location
                  </Label>
                  <Input
                    id="businessLocation"
                    placeholder="City, State"
                    value={formData.businessLocation}
                    onChange={(e) => setFormData((f) => ({ ...f, businessLocation: e.target.value }))}
                    disabled={isLoading}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="business@email.com"
                      value={formData.businessEmail}
                      onChange={(e) => setFormData((f) => ({ ...f, businessEmail: e.target.value }))}
                      disabled={isLoading}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone" className="text-sm font-medium">
                      Phone
                    </Label>
                    <Input
                      id="businessPhone"
                      type="tel"
                      placeholder="98765 43210"
                      value={formData.businessPhone}
                      onChange={(e) => setFormData((f) => ({ ...f, businessPhone: e.target.value }))}
                      disabled={isLoading}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium">
                      Currency
                    </Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData((f) => ({ ...f, currency: v }))} disabled={isLoading}>
                      <SelectTrigger id="currency" className="!h-11 !rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countryCode" className="text-sm font-medium">
                      Country Code
                    </Label>
                    <Select value={formData.countryCode} onValueChange={(v) => setFormData((f) => ({ ...f, countryCode: v }))} disabled={isLoading}>
                      <SelectTrigger id="countryCode" className="!h-11 !rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating business…</>
                  ) : (
                    <>Create Business <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>

                <div className="space-y-2 pt-2">
                  {[].map((text) => (
                    <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
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