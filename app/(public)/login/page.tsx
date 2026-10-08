"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, authApi } from "@/lib/api"
import { applyAuthResponse, type AuthResponse } from "@/lib/auth-session"
import { toast } from "sonner"

/** Normalise to +91XXXXXXXXXX — accepts 10-digit, 91-prefix or +91-prefix */
function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "")
  if (digits.startsWith("91") && digits.length >= 12) digits = digits.slice(-10)
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1)
  else if (digits.length > 10) digits = digits.slice(-10)
  if (digits.length === 10) return `+91${digits}`
  return raw
}

const COOLDOWN_SECS = 60

type Channel = "mobile" | "email"
type EmailStep = "credentials" | "otp"

function formatRecoveryDate(iso?: string) {
  if (!iso) return "30 days"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "30 days"
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
}

function AuthError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
      {message}
    </div>
  )
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [channel, setChannel] = useState<Channel>("mobile")
  const [phoneRaw, setPhoneRaw] = useState("")
  const [otp, setOtp] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailStep, setEmailStep] = useState<EmailStep>("credentials")
  const [error, setError] = useState("")
  const [authStep, setAuthStep] = useState<"phone" | "otp">("phone")
  const [devOtp, setDevOtp] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [twoFactorPending, setTwoFactorPending] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [pendingDeletion, setPendingDeletion] = useState<{ recoveryExpiresAt?: string } | null>(null)
  const [recoveryStep, setRecoveryStep] = useState<"prompt" | "otp" | "totp">("prompt")
  const [recoveryToken, setRecoveryToken] = useState("")
  const [recoveryTotp, setRecoveryTotp] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const q = new URLSearchParams(window.location.search)
    if (q.get("channel") === "email") setChannel("email")
  }, [])

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

  const notePendingDeletion = (err: unknown) => {
    const error = err as ApiError
    if (error?.code !== "ACCOUNT_PENDING_DELETION") return false
    setPendingDeletion({ recoveryExpiresAt: error.recoveryExpiresAt })
    setRecoveryStep("prompt")
    setError(error.message || "Your account is currently scheduled for deletion.")
    return true
  }

  const clearRecovery = () => {
    setPendingDeletion(null)
    setRecoveryStep("prompt")
    setRecoveryToken("")
    setRecoveryTotp("")
    setOtp("")
    setDevOtp("")
    setError("")
  }

  const completeAuth = (response: AuthResponse) => {
    applyAuthResponse(response, {
      onTwoFactor: (token) => {
        setTempToken(token)
        setTwoFactorPending(true)
      },
      onSuccess: (href) => {
        toast.success("Login successful!")
        setTimeout(() => { window.location.href = href }, 400)
      },
      onBlocked: (message) => {
        setError(message)
        toast.error(message)
      },
    })
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
      if (!notePendingDeletion(err)) setError(err.message || "Failed to send OTP")
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
      if (!notePendingDeletion(err)) setError(err.message || "Failed to resend OTP")
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
      completeAuth(response)
    } catch (err: any) {
      if (!notePendingDeletion(err)) setError(err.message || "Invalid OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const trimmed = email.trim()
    if (!trimmed.includes("@")) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }
    try {
      const response = await authApi.login(trimmed, password)
      completeAuth(response)
    } catch (err: any) {
      if (!notePendingDeletion(err)) setError(err.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmailOtp = async () => {
    setIsLoading(true)
    setError("")
    const trimmed = email.trim()
    if (!trimmed.includes("@")) {
      setError("Please enter a valid email address")
      setIsLoading(false)
      return
    }
    try {
      const response = await authApi.loginSendEmailOtp(trimmed)
      setDevOtp(response.devOtp || "")
      setEmailStep("otp")
      startCooldown()
      toast.success("OTP sent to your email")
    } catch (err: any) {
      if (!notePendingDeletion(err)) setError(err.message || "Failed to send email OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmailOtp = async () => {
    if (cooldown > 0) return
    setIsLoading(true)
    setError("")
    try {
      const response = await authApi.loginSendEmailOtp(email.trim())
      setDevOtp(response.devOtp || "")
      startCooldown()
      toast.success("OTP resent!")
    } catch (err: any) {
      if (!notePendingDeletion(err)) setError(err.message || "Failed to resend OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const response = await authApi.loginVerifyEmailOtp(email.trim(), otp)
      completeAuth(response)
    } catch (err: any) {
      if (!notePendingDeletion(err)) setError(err.message || "Invalid OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const recoveryIdentifier = () =>
    channel === "mobile"
      ? { phoneNumber: normalizePhone(phoneRaw) }
      : { email: email.trim() }

  const handleStartRecovery = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await authApi.recoverSendOtp(recoveryIdentifier())
      setDevOtp(response.devOtp || "")
      setOtp("")
      setRecoveryStep("otp")
      startCooldown()
      toast.success("If this account can be recovered, a code has been sent.")
    } catch (err: any) {
      setError(err.message || "Could not send recovery code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const response = await authApi.recoverVerifyOtp({ ...recoveryIdentifier(), otp })
      setRecoveryToken(response.recoveryToken)
      if (response.twoFactorRequired) {
        setRecoveryStep("totp")
        setRecoveryTotp("")
      } else {
        const session = await authApi.restoreAccount({ recoveryToken: response.recoveryToken })
        completeAuth(session)
      }
    } catch (err: any) {
      setError(err.message || "Could not verify the recovery code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const session = await authApi.restoreAccount({ recoveryToken, totpCode: recoveryTotp })
      completeAuth(session)
    } catch (err: any) {
      setError(err.message || "Could not restore the account")
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
      completeAuth(response)
    } catch (err: any) {
      setError(err.message || "Invalid 2FA code")
    } finally {
      setIsLoading(false)
    }
  }

  const showDevOtp =
    !!devOtp &&
    !twoFactorPending &&
    ((pendingDeletion && recoveryStep === "otp") ||
      (channel === "mobile" && authStep === "otp") ||
      (channel === "email" && emailStep === "otp"))

  const description = twoFactorPending
    ? "Enter the 6-digit code from your authenticator app"
    : pendingDeletion
      ? recoveryStep === "totp"
        ? "Enter the 6-digit code from your authenticator app to finish restoring this account."
        : recoveryStep === "otp"
          ? "Enter the recovery code sent to your registered contact."
          : `Your account is scheduled for deletion until ${formatRecoveryDate(pendingDeletion.recoveryExpiresAt)}.`
    : channel === "mobile"
      ? authStep === "phone"
        ? "Owners sign in with mobile OTP, then work inside their organization."
        : `OTP sent to +91 ****${phoneRaw.replace(/\D/g, "").slice(-4)}`
      : emailStep === "otp"
        ? `OTP sent to ${email.trim()}`
        : "Staff and managers sign in with email + password, or email OTP. Same organization as the admin who invited you."

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(700px circle at 50% 30%, hsla(142, 76%, 36%, 0.08), transparent 60%)" }}
      />

      <div className="w-full max-w-sm">
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
              <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                {twoFactorPending ? "Two-Factor Authentication" : pendingDeletion ? "Recover account" : "Sign in"}
              </CardTitle>
              <CardDescription className="mt-1.5 text-sm leading-relaxed">
                {description}
              </CardDescription>
            </div>

            {showDevOtp && (
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
            {pendingDeletion && !twoFactorPending ? (
              recoveryStep === "prompt" ? (
                <div className="space-y-5">
                  {error && <AuthError message={error} />}
                  <p className="text-sm text-muted-foreground">
                    Your account is scheduled for deletion until {formatRecoveryDate(pendingDeletion.recoveryExpiresAt)}. Recover before then to restore the login. If you are the only admin, the organization and its records come back with the account. After that date they are permanently deleted.
                  </p>
                  <Button type="button" className="h-11 w-full rounded-xl text-sm font-semibold" onClick={handleStartRecovery} disabled={isLoading}>
                    {isLoading ? "Sending code…" : "Recover account"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full text-sm text-muted-foreground" onClick={clearRecovery}>
                    Back to login
                  </Button>
                </div>
              ) : recoveryStep === "otp" ? (
                <form onSubmit={handleVerifyRecovery} className="space-y-5">
                  {error && <AuthError message={error} />}
                  <div className="space-y-2">
                    <Label htmlFor="recovery-otp" className="text-sm font-medium">Recovery code</Label>
                    <Input
                      id="recovery-otp" inputMode="numeric" maxLength={6} placeholder="000000"
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="h-12 text-center text-2xl tracking-[0.5em]" required
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={isLoading || otp.length !== 6}>
                    {isLoading ? "Verifying…" : "Verify and restore"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full text-sm text-muted-foreground" onClick={() => { setRecoveryStep("prompt"); setOtp(""); setError(""); setDevOtp("") }}>
                    Back
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRestoreRecovery} className="space-y-5">
                  {error && <AuthError message={error} />}
                  <div className="space-y-2">
                    <Label htmlFor="recovery-totp" className="text-sm font-medium">Authenticator code</Label>
                    <Input
                      id="recovery-totp" inputMode="numeric" maxLength={6} placeholder="000000"
                      value={recoveryTotp} onChange={(e) => setRecoveryTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="h-12 text-center text-2xl tracking-widest" required
                    />
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={isLoading || recoveryTotp.length !== 6}>
                    {isLoading ? "Restoring…" : "Restore account"}
                  </Button>
                </form>
              )
            ) : twoFactorPending ? (
              <form onSubmit={handle2FAVerify} className="space-y-5">
                {error && <AuthError message={error} />}
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Authenticator Code
                  </Label>
                  <Input
                    id="code" type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                    value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                    className="h-12 text-center text-2xl tracking-widest" autoFocus required
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                  disabled={isLoading || twoFactorCode.length !== 6}
                >
                  {isLoading ? "Verifying…" : "Verify"}
                </Button>
                <Button
                  type="button" variant="ghost" className="w-full text-sm text-muted-foreground"
                  onClick={() => { setTwoFactorPending(false); setTwoFactorCode(""); setError("") }}
                >
                  ← Back
                </Button>
              </form>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    className={`rounded-md px-1 py-1.5 text-center text-sm font-medium leading-tight transition-colors ${
                      channel === "mobile" ? "bg-background text-foreground" : "text-muted-foreground"
                    }`}
                    onClick={() => { setChannel("mobile"); setError(""); setOtp("") }}
                  >
                    Admin
                    <span className="mt-0.5 block text-[11px] font-normal opacity-70">Mobile OTP</span>
                  </button>
                  <button
                    type="button"
                    className={`rounded-md px-1 py-1.5 text-center text-sm font-medium leading-tight transition-colors ${
                      channel === "email" ? "bg-background text-foreground" : "text-muted-foreground"
                    }`}
                    onClick={() => { setChannel("email"); setError(""); setOtp("") }}
                  >
                    Staff / Manager
                    <span className="mt-0.5 block text-[11px] font-normal opacity-70">Email + password / OTP</span>
                  </button>
                </div>

                {channel === "mobile" ? (
                  authStep === "phone" ? (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                      {error && <AuthError message={error} />}
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
                            value={phoneRaw} onChange={(e) => setPhoneRaw(e.target.value)}
                            className="h-11 rounded-xl pl-14" maxLength={14} required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl text-sm font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending OTP…" : "Send OTP"}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="font-semibold text-primary hover:underline">
                          Sign up
                        </Link>
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      {error && <AuthError message={error} />}
                      <div className="space-y-2">
                        <Label htmlFor="otp" className="text-sm font-medium">
                          Enter 6-digit OTP
                        </Label>
                        <Input
                          id="otp" type="text" inputMode="numeric" placeholder="● ● ● ● ● ●"
                          value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="h-12 text-center text-2xl tracking-[0.5em]" maxLength={6} required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl text-sm font-semibold"
                        disabled={isLoading || otp.length !== 6}
                      >
                        {isLoading ? "Verifying…" : "Verify & Sign In"}
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
                        onClick={() => { setAuthStep("phone"); setOtp(""); setError(""); setDevOtp("") }}
                      >
                        ← Change phone number
                      </Button>
                    </form>
                  )
                ) : emailStep === "credentials" ? (
                    <form onSubmit={handleEmailPassword} className="space-y-5">
                      {error && <AuthError message={error} />}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email
                        </Label>
                        <Input
                          id="email" type="email" autoComplete="email" placeholder="you@company.com"
                          value={email} onChange={(e) => setEmail(e.target.value)}
                          className="h-11 rounded-xl" required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password
                        </Label>
                        <Input
                          id="password" type="password" autoComplete="current-password" placeholder="••••••••"
                          value={password} onChange={(e) => setPassword(e.target.value)}
                          className="h-11 rounded-xl" required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl text-sm font-semibold"
                        disabled={isLoading || !password}
                      >
                        {isLoading ? "Signing in…" : "Sign in"}
                      </Button>
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={isLoading}
                        className="w-full text-center text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        Sign in with OTP instead
                      </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyEmailOtp} className="space-y-5">
                      {error && <AuthError message={error} />}
                      <div className="space-y-2">
                        <Label htmlFor="email-otp" className="text-sm font-medium">
                          Enter 6-digit OTP
                        </Label>
                        <Input
                          id="email-otp" type="text" inputMode="numeric" placeholder="● ● ● ● ● ●"
                          value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="h-12 text-center text-2xl tracking-[0.5em]" maxLength={6} required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl text-sm font-semibold"
                        disabled={isLoading || otp.length !== 6}
                      >
                        {isLoading ? "Verifying…" : "Verify & Sign In"}
                      </Button>
                      <div className="text-center text-sm">
                        {cooldown > 0 ? (
                          <p className="text-muted-foreground">
                            Resend OTP in{" "}
                            <span className="font-semibold text-foreground">{cooldown}s</span>
                          </p>
                        ) : (
                          <button
                            type="button" onClick={handleResendEmailOtp} disabled={isLoading}
                            className="font-semibold text-primary hover:underline disabled:opacity-50"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                      <Button
                        type="button" variant="ghost" className="w-full text-sm text-muted-foreground"
                        onClick={() => { setEmailStep("credentials"); setOtp(""); setError(""); setDevOtp("") }}
                      >
                        ← Back to password
                      </Button>
                    </form>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
