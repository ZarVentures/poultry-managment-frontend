"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, ShieldCheck, ShieldOff } from "lucide-react"
import { authApi } from "@/lib/api"
import { toast } from "sonner"
import Image from "next/image"

export default function SecurityPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)

  // Setup flow
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [setupCode, setSetupCode] = useState("")

  // Disable flow
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disableCode, setDisableCode] = useState("")

  useEffect(() => {
    setMounted(true)
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const data = await authApi.get2FAStatus()
      setIs2FAEnabled(data.isTwoFactorEnabled)
    } catch {
      // ignore
    }
  }

  const handleEnable = async () => {
    try {
      setLoading(true)
      const data = await authApi.generate2FA()
      setQrCodeDataUrl(data.qrCodeDataUrl)
      setSecret(data.secret)
      setSetupCode("")
      setShowSetupModal(true)
    } catch (e: any) {
      toast.error(e.message || "Failed to generate 2FA secret")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSetup = async () => {
    if (setupCode.length !== 6) { toast.error("Enter a 6-digit code"); return }
    try {
      setLoading(true)
      await authApi.turnOn2FA(setupCode)
      setIs2FAEnabled(true)
      setShowSetupModal(false)
      toast.success("2FA enabled successfully!")
    } catch (e: any) {
      toast.error(e.message || "Invalid code. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (disableCode.length !== 6) { toast.error("Enter a 6-digit code"); return }
    try {
      setLoading(true)
      await authApi.turnOff2FA(disableCode)
      setIs2FAEnabled(false)
      setShowDisableModal(false)
      setDisableCode("")
      toast.success("2FA disabled")
    } catch (e: any) {
      toast.error(e.message || "Invalid code")
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground">Manage your account security settings</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {is2FAEnabled ? <ShieldCheck className="text-green-600" size={24} /> : <Shield className="text-muted-foreground" size={24} />}
              <div>
                <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                <CardDescription>
                  {is2FAEnabled
                    ? "2FA is active. Your account is protected with an authenticator app."
                    : "Add an extra layer of security using Google Authenticator or Microsoft Authenticator."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${is2FAEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {is2FAEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              {is2FAEnabled ? (
                <Button variant="destructive" size="sm" onClick={() => { setDisableCode(""); setShowDisableModal(true) }} disabled={loading}>
                  <ShieldOff size={14} className="mr-1" /> Disable 2FA
                </Button>
              ) : (
                <Button size="sm" onClick={handleEnable} disabled={loading}>
                  <ShieldCheck size={14} className="mr-1" /> Enable 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Modal */}
        <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong>.
              </p>
              {qrCodeDataUrl && (
                <div className="flex justify-center">
                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48 border rounded" />
                </div>
              )}
              <div className="bg-gray-50 rounded p-3 text-xs font-mono text-center break-all text-muted-foreground">
                Manual key: {secret}
              </div>
              <div className="space-y-2">
                <Label>Enter the 6-digit code from your app to confirm</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={setupCode}
                  onChange={e => setSetupCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-xl tracking-widest"
                  autoFocus
                />
              </div>
              <Button className="w-full" onClick={handleConfirmSetup} disabled={loading || setupCode.length !== 6}>
                {loading ? "Verifying..." : "Confirm & Enable 2FA"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disable Modal */}
        <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your current 6-digit authenticator code to disable 2FA.</p>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={disableCode}
                onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl tracking-widest"
                autoFocus
              />
              <Button variant="destructive" className="w-full" onClick={handleDisable} disabled={loading || disableCode.length !== 6}>
                {loading ? "Disabling..." : "Disable 2FA"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
