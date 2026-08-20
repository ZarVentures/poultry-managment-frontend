"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, ShieldCheck, ShieldOff } from "lucide-react"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

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
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Security</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your account security settings</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${is2FAEnabled ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                {is2FAEnabled ? <ShieldCheck size={20} /> : <Shield size={20} />}
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base">Two-Factor Authentication (2FA)</p>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled
                    ? "2FA is active. Your account is protected."
                    : "Add an extra layer of security using Google or Microsoft Authenticator."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${is2FAEnabled ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                {is2FAEnabled ? "Enabled" : "Disabled"}
              </span>
              {is2FAEnabled ? (
                <Button variant="destructive" size="sm" className="rounded-full" onClick={() => { setDisableCode(""); setShowDisableModal(true) }} disabled={loading}>
                  <ShieldOff size={14} className="mr-1" /> Disable
                </Button>
              ) : (
                <Button size="sm" className="rounded-full" onClick={handleEnable} disabled={loading}>
                  <ShieldCheck size={14} className="mr-1" /> Enable
                </Button>
              )}
            </div>
          </div>
        </div>

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
                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48 border rounded-xl" />
                </div>
              )}
              <div className="bg-muted rounded-xl p-3 text-xs font-mono text-center break-all text-muted-foreground">
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
                  className="text-center text-xl tracking-widest h-12"
                  autoFocus
                />
              </div>
              <Button className="w-full rounded-full" onClick={handleConfirmSetup} disabled={loading || setupCode.length !== 6}>
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
                className="text-center text-xl tracking-widest h-12"
                autoFocus
              />
              <Button variant="destructive" className="w-full rounded-full" onClick={handleDisable} disabled={loading || disableCode.length !== 6}>
                {loading ? "Disabling..." : "Disable 2FA"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
