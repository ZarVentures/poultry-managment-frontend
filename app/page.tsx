"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("admin@azizpoultry.com")
  const [password, setPassword] = useState("admin123")
  const [error, setError] = useState("")

  // 2FA state
  const [twoFactorPending, setTwoFactorPending] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await authApi.login(email, password) as any

      if (response.status === '2FA_REQUIRED') {
        setTempToken(response.tempToken)
        setTwoFactorPending(true)
        setIsLoading(false)
        return
      }

      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('user', JSON.stringify({
        ...response.user,
        role: (response.user?.role || '').toString().trim().toLowerCase(),
      }))
      toast.success('Login successful!')
      setTimeout(() => { window.location.href = "/dashboard" }, 500)
    } catch (error: any) {
      console.error('Login failed:', error)
      setError(error.message || "Invalid credentials")
      toast.error("Login failed: " + (error.message || "Invalid credentials"))
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
      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('user', JSON.stringify({
        ...response.user,
        role: (response.user?.role || '').toString().trim().toLowerCase(),
      }))
      toast.success('Login successful!')
      setTimeout(() => { window.location.href = "/dashboard" }, 500)
    } catch (error: any) {
      setError(error.message || "Invalid 2FA code")
      toast.error("Invalid 2FA code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">🐔</div>
            <CardTitle className="text-2xl">{twoFactorPending ? "Two-Factor Authentication" : "Sign in"}</CardTitle>
            <CardDescription>
              {twoFactorPending
                ? "Enter the 6-digit code from your authenticator app"
                : "Enter your credentials to access the Poultry Management System"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {twoFactorPending ? (
            <form onSubmit={handle2FAVerify} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Authenticator Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || twoFactorCode.length !== 6}>
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => { setTwoFactorPending(false); setTwoFactorCode(""); setError("") }}>
                ← Back to login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="admin@azizpoultry.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          )}

          {!twoFactorPending && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg text-sm text-muted-foreground">
              <p className="font-semibold mb-2">Default credentials:</p>
              <p className="mb-1">Email: admin@azizpoultry.com</p>
              <p>Password: admin123</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
