"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api"
import { finishAuth } from "@/lib/auth-session"
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
      const result = finishAuth(response.accessToken, response.user)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setStep("done")
      toast.success("Account created!")
      setTimeout(() => { window.location.href = result.href }, 1500)
    } catch (err: any) {
      setError(err.message || "Invalid OTP")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(700px circle at 50% 30%, hsla(142, 76%, 36%, 0.08), transparent 60%)" }}
      />

      <div className="w-full max-w-md">
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
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                🐔
              </div>
              <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">Create your account</CardTitle>
              <CardDescription className="mt-1.5 text-sm leading-relaxed">
                {step === "details" && "Owner signup with mobile OTP. Staff and managers should sign in with email."}
                {step === "otp" && `OTP sent to +91 ****${phoneRaw.replace(/\D/g, "").slice(-4)}`}
                {step === "done" && "Account created successfully!"}
              </CardDescription>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {["details", "otp"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors
                      ${step === s
                        ? "bg-primary text-primary-foreground"
                        : (step === "otp" && i === 0) || step === "done"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {(step === "otp" && i === 0) || step === "done" ? "✓" : i + 1}
                  </div>
                  {i === 0 && <div className="h-px w-8 bg-border" />}
                </div>
              ))}
            </div>

            {/* DEV OTP Banner */}
            {devOtp && step === "otp" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-950/40">
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Dev Mode — OTP
                </p>
                <p className="font-mono text-2xl font-bold tracking-[0.4em] text-amber-700 dark:text-amber-300">
                  {devOtp}
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-2">
            {step === "details" && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name" placeholder="Your full name"
                    value={name} onChange={e => setName(e.target.value)}
                    className="h-11 rounded-xl" required autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="phone" type="tel" inputMode="numeric" placeholder="98765 43210"
                      value={phoneRaw} onChange={e => setPhoneRaw(e.target.value)}
                      className="h-11 rounded-xl pl-14" maxLength={14} required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP…</>
                  ) : (
                    <>Send OTP <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                  {" · "}
                  <Link href="/login?channel=email" className="font-semibold text-primary hover:underline">
                    Staff email login
                  </Link>
                </p>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium">
                    Enter 6-digit OTP
                  </Label>
                  <Input
                    id="otp" type="text" inputMode="numeric" placeholder="● ● ● ● ● ●"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-12 text-center text-2xl tracking-[0.5em]" maxLength={6} autoFocus required
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</>
                  ) : (
                    "Verify & Create Account"
                  )}
                </Button>

                <div className="text-center text-sm">
                  {cooldown > 0 ? (
                    <p className="text-muted-foreground">
                      Resend OTP in{" "}
                      <span className="font-semibold text-foreground">{cooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button" onClick={handleResendOtp} disabled={isLoading}
                      className="font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <Button
                  type="button" variant="ghost" className="w-full text-sm text-muted-foreground"
                  onClick={() => { setStep("details"); setOtp(""); setError(""); setDevOtp("") }}
                >
                  ← Change details
                </Button>
              </form>
            )}

            {step === "done" && (
              <div className="space-y-4 py-4 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
                <p className="text-lg font-semibold">Welcome aboard!</p>
                <p className="text-sm text-muted-foreground">Setting up your business…</p>
              </div>
            )}

            {step === "details" && (
              <div className="mt-6 space-y-2.5">
                {[].map(text => (
                  <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
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
