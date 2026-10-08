"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, ShieldCheck, ShieldOff } from "lucide-react"
import { authApi, ApiError } from "@/lib/api"
import { toast } from "sonner"

export default function SecurityPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<"warn" | "verify" | "blocked">("warn")
  const [deleteChannel, setDeleteChannel] = useState<"sms" | "email">("sms")
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteOtp, setDeleteOtp] = useState("")
  const [deleteTotp, setDeleteTotp] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [deleteDevOtp, setDeleteDevOtp] = useState("")
  const [deleteBlocked, setDeleteBlocked] = useState("")
  const [deletesOrganization, setDeletesOrganization] = useState(false)

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

  const resetDelete = () => {
    setDeleteStep("warn")
    setDeleteChannel("sms")
    setDeleteConfirm("")
    setDeleteOtp("")
    setDeleteTotp("")
    setDeleteReason("")
    setDeleteDevOtp("")
    setDeleteBlocked("")
    setDeletesOrganization(false)
  }

  const openDelete = () => {
    resetDelete()
    setDeleteOpen(true)
  }

  const continueDelete = async () => {
    try {
      setLoading(true)
      const data = await authApi.sendDeleteOtp()
      setDeleteDevOtp(data.devOtp || "")
      setDeleteChannel(data.channel === "email" ? "email" : "sms")
      setDeletesOrganization(Boolean(data.deletesOrganization))
      setDeleteStep("verify")
    } catch (e: unknown) {
      const err = e as ApiError
      if (err.code === "OWNERSHIP_TRANSFER_REQUIRED") {
        setDeleteBlocked(err.message)
        setDeleteStep("blocked")
        return
      }
      toast.error(err.message || "Could not start account deletion")
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error("Type DELETE to confirm")
      return
    }
    try {
      setLoading(true)
      await authApi.deleteAccount({
        confirmation: "DELETE",
        otp: deleteOtp,
        totpCode: is2FAEnabled ? deleteTotp : undefined,
        reason: deleteReason.trim() || undefined,
      })
      authApi.logout()
      toast.success(
        deletesOrganization
          ? "Your account and organization are scheduled for deletion. Recover within 30 days to restore the business."
          : "Your account is scheduled for deletion. You can recover it for 30 days.",
      )
      router.push("/login")
    } catch (e: unknown) {
      const err = e as ApiError
      if (err.code === "OWNERSHIP_TRANSFER_REQUIRED") {
        setDeleteBlocked(err.message)
        setDeleteStep("blocked")
        return
      }
      toast.error(err.message || "Could not delete account")
    } finally {
      setLoading(false)
    }
  }

  const verifyReady =
    deleteConfirm === "DELETE" &&
    deleteOtp.length === 6 &&
    (!is2FAEnabled || deleteTotp.length === 6)

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Security</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your account security settings</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
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

        <div className="rounded-2xl border border-red-200 bg-card p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm sm:text-base">Delete account</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                If you are the only admin, the organization closes immediately. Sales, purchases, stock, customers, and every other business record are permanently removed after 30 days. Recover before then to bring the shop back. A staff or manager delete only removes that login.
              </p>
            </div>
            <Button variant="destructive" size="sm" className="rounded-full" onClick={openDelete}>
              Delete account
            </Button>
          </div>
        </div>

        <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) resetDelete() }}>
          <DialogContent className="max-w-md mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>
                {deleteStep === "blocked" ? "Transfer ownership first" : "Delete account"}
              </DialogTitle>
            </DialogHeader>
            {deleteStep === "warn" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your login stops on every device. If you are the only admin, staff and managers are signed out too, and the organization cannot be used.
                </p>
                <p className="text-sm text-muted-foreground">
                  You can restore the account for 30 days from the login screen. After that, a sole admin deletion permanently removes the organization and its sales, purchases, stock, customers, and other records. A staff or manager deletion only removes that login.
                </p>
                <Button className="w-full rounded-full" variant="destructive" onClick={continueDelete} disabled={loading}>
                  {loading ? "Checking…" : "Continue"}
                </Button>
              </div>
            )}
            {deleteStep === "blocked" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{deleteBlocked}</p>
                <Button asChild className="w-full rounded-full">
                  <Link href="/users">Go to Users</Link>
                </Button>
              </div>
            )}
            {deleteStep === "verify" && (
              <div className="space-y-4">
                {deletesOrganization && (
                  <p className="text-sm text-red-600">
                    This will close the organization. After 30 days its sales, purchases, and other records are permanently deleted. Recover before then to restore them.
                  </p>
                )}
                {deleteDevOtp && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Dev OTP</p>
                    <p className="font-mono text-xl font-bold tracking-[0.3em] text-amber-700">{deleteDevOtp}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Type DELETE to confirm</Label>
                  <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label>{deleteChannel === "email" ? "Email OTP" : "SMS OTP"}</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-xl tracking-widest"
                    placeholder="000000"
                  />
                </div>
                {is2FAEnabled && (
                  <div className="space-y-2">
                    <Label>Authenticator code</Label>
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      value={deleteTotp}
                      onChange={(e) => setDeleteTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-center text-xl tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <Input value={deleteReason} onChange={(e) => setDeleteReason(e.target.value.slice(0, 500))} />
                </div>
                <Button variant="destructive" className="w-full rounded-full" onClick={confirmDelete} disabled={loading || !verifyReady}>
                  {loading ? "Deleting…" : "Delete my account"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Setup Modal */}
        <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
          <DialogContent className="max-w-md mx-4 sm:mx-0">
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
          <DialogContent className="max-w-sm mx-4 sm:mx-0">
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
