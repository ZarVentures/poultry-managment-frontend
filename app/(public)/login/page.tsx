"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

/** Normalise to +91XXXXXXXXXX — accepts 10-digit, 91-prefix or +91-prefix */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`
  if (raw.startsWith("+91") && digits.length === 12) return `+${digits}`
  return raw // return as-is for validation to catch
}

const COOLDOWN_SECS = 60

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [phoneRaw, setPhoneRaw] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [authStep, setAuthStep] = useState<"phone" | "otp">("phone")
  const [devOtp, setDevOtp] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 2FA state
  const [twoFactorPending, setTwoFactorPending] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")

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

  const redirectAfterLogin = () => {
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
    window.location.href = tenantId ? "/dashboard" : "/business-setup"
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const phoneNumber = normalizePhone(phoneRaw)
    if (!/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
      setError("Please enter a valid Indian phone number (e.g. 98765 43210)")
      setIsLoading(false)
      return
    }

    try {
      const response = await authApi.loginSendOtp(phoneNumber)
      setDevOtp(response.devOtp || "")
      setAuthStep("otp")
      startCooldown()
      toast.success("OTP sent successfully!")
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
      const response = await authApi.loginSendOtp(phoneNumber)
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
      const response = await authApi.loginVerifyOtp(phoneNumber, otp)

      if ("status" in response && response.status === "2FA_REQUIRED") {
        setTempToken(response.tempToken)
        setTwoFactorPending(true)
        setIsLoading(false)
        return
      }

      const res = response as any
      localStorage.setItem("token", res.accessToken)
      localStorage.setItem("user", JSON.stringify(res.user))
      toast.success("Login successful!")
      setTimeout(redirectAfterLogin, 400)
    } catch (err: any) {
      setError(err.message || "Invalid OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const response = await authApi.authenticate2FA(tempToken, twoFactorCode)
      localStorage.setItem("token", response.accessToken)
      localStorage.setItem("user", JSON.stringify(response.user))
      toast.success("Login successful!")
      setTimeout(redirectAfterLogin, 400)
    } catch (err: any) {
      setError(err.message || "Invalid 2FA code")
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
              <CardTitle className="text-2xl">
                {twoFactorPending ? "Two-Factor Authentication" : "Sign in"}
              </CardTitle>
              <CardDescription>
                {twoFactorPending
                  ? "Enter the 6-digit code from your authenticator app"
                  : authStep === "phone"
                  ? "Enter your phone number to receive a one-time password"
                  : `OTP sent to +91 ****${phoneRaw.replace(/\D/g, "").slice(-4)}`}
              </CardDescription>
            </div>

            {/* DEV OTP Banner */}
            {devOtp && !twoFactorPending && authStep === "otp" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-md text-center">
                <p className="text-xs font-medium uppercase tracking-wide mb-0.5">Dev Mode — OTP</p>
                <p className="text-2xl font-mono font-bold tracking-[0.4em]">{devOtp}</p>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {twoFactorPending ? (
              <form onSubmit={handle2FAVerify} className="space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}
                <div className="space-y-2">
                  <Label htmlFor="code">Authenticator Code</Label>
                  <Input
                    id="code" type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                    value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-widest" autoFocus required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || twoFactorCode.length !== 6}>
                  {isLoading ? "Verifying…" : "Verify"}
                </Button>
                <Button type="button" variant="ghost" className="w-full text-sm"
                  onClick={() => { setTwoFactorPending(false); setTwoFactorCode(""); setError("") }}>
                  ← Back
                </Button>
              </form>
            ) : authStep === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">{error}</div>}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+91</span>
                    <Input
                      id="phone" type="tel" inputMode="numeric" placeholder="98765 43210"
                      value={phoneRaw} onChange={(e) => setPhoneRaw(e.target.value)}
                      className="rounded-l-none" maxLength={14} required autoFocus
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending OTP…" : "Send OTP"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="font-semibold text-primary hover:underline">Sign up</Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">{error}</div>}
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
                  <Input
                    id="otp" type="text" inputMode="numeric" placeholder="● ● ● ● ● ●"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-2xl tracking-[0.5em]" maxLength={6} autoFocus required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? "Verifying…" : "Verify & Sign In"}
                </Button>

                {/* Resend OTP */}
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
                  onClick={() => { setAuthStep("phone"); setOtp(""); setError(""); setDevOtp("") }}>
                  ← Change phone number
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
