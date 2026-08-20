"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`
  return raw
}

const COOLDOWN_SECS = 60

type Step = "details" | "otp" | "done"

export default function SignupPage() {
  const [step, setStep] = useState<Step>("details")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [phoneRaw, setPhoneRaw] = useState("")
  const [otp, setOtp] = useState("")
  const [devOtp, setDevOtp] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECS)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!name.trim() || name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).")
      setIsLoading(false)
      return
    }

    const phoneNumber = normalizePhone(phoneRaw)
    if (!/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
      setError("Please enter a valid Indian mobile number (e.g. 98765 43210).")
      setIsLoading(false)
      return
    }

    try {
      const response = await authApi.registerSendOtp(name.trim(), phoneNumber)
      setDevOtp(response.devOtp || "")
      setStep("otp")
      startCooldown()
      toast.success("OTP sent to your phone!")
    } catch (err: any) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (cooldown > 0) return
    setIsLoading(true)
    setError("")
    const phoneNumber = normalizePhone(phoneRaw)
    try {
      const response = await authApi.registerSendOtp(name.trim(), phoneNumber)
      setDevOtp(response.devOtp || "")
      startCooldown()
      toast.success("OTP resent!")
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const phoneNumber = normalizePhone(phoneRaw)

    try {
      const response = await authApi.registerVerifyOtp(name.trim(), phoneNumber, otp)
      const res = response as any
      localStorage.setItem("token", res.accessToken)
      localStorage.setItem("user", JSON.stringify(res.user))
      setStep("done")
      toast.success("Account created! Welcome to Aziz Poultry!")
      setTimeout(() => { window.location.href = "/business-setup" }, 1500)
    } catch (err: any) {
      setError(err.message || "Invalid OTP")
    } finally {
      setIsLoading(false)
    }
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
              <div className="text-4xl font-bold mb-2">🐔</div>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                {step === "details" && "Enter your name and phone number to get started."}
                {step === "otp" && `OTP sent to +91 ****${phoneRaw.replace(/\D/g, "").slice(-4)}`}
                {step === "done" && "Account created successfully!"}
              </CardDescription>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {["details", "otp"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${step === s ? "bg-primary text-primary-foreground"
                    : (step === "otp" && i === 0) || step === "done" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {(step === "otp" && i === 0) || step === "done" ? "✓" : i + 1}
                  </div>
                  {i === 0 && <div className="h-px w-8 bg-border" />}
                </div>
              ))}
            </div>

            {/* DEV OTP Banner */}
            {devOtp && step === "otp" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-md text-center">
                <p className="text-xs font-medium uppercase tracking-wide mb-0.5">Dev Mode — OTP</p>
                <p className="text-2xl font-mono font-bold tracking-[0.4em]">{devOtp}</p>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {step === "details" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">{error}</div>}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+91</span>
                    <Input id="phone" type="tel" inputMode="numeric" placeholder="98765 43210"
                      value={phoneRaw} onChange={e => setPhoneRaw(e.target.value)} className="rounded-l-none" maxLength={14} required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending OTP…</> : <>Send OTP <ArrowRight className="h-4 w-4 ml-2" /></>}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
                </p>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">{error}</div>}
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
                  <Input
                    id="otp" type="text" inputMode="numeric" placeholder="● ● ● ● ● ●"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-2xl tracking-[0.5em]" maxLength={6} autoFocus required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account…</> : "Verify & Create Account"}
                </Button>

                <div className="text-center text-sm">
                  {cooldown > 0 ? (
                    <p className="text-muted-foreground">Resend OTP in <span className="font-semibold text-foreground">{cooldown}s</span></p>
                  ) : (
                    <button type="button" onClick={handleResendOtp} disabled={isLoading}
                      className="text-primary hover:underline font-semibold disabled:opacity-50">
                      Resend OTP
                    </button>
                  )}
                </div>

                <Button type="button" variant="ghost" className="w-full text-sm"
                  onClick={() => { setStep("details"); setOtp(""); setError(""); setDevOtp("") }}>
                  ← Change details
                </Button>
              </form>
            )}

            {step === "done" && (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                <p className="text-lg font-semibold">Welcome aboard!</p>
                <p className="text-muted-foreground text-sm">Setting up your business…</p>
              </div>
            )}

            {step === "details" && (
              <div className="mt-6 space-y-2">
                {["No password required — OTP only", "Secure 6-digit verification", "Free to get started"].map(text => (
                  <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />{text}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
