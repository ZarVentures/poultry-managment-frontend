"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Save, Lock, Bell, Palette, Terminal, Eye, EyeOff, Shield, ShieldCheck, ShieldOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { settingsApi, authApi, type Setting } from "@/lib/api"
import { useDevMode } from "@/lib/dev-mode"
import { toast } from "sonner"
import { useDispatch } from "react-redux";
import { setTheme } from "@/app/redux/slices/themeSlice";

interface Settings {
  farmName: string
  farmLocation: string
  farmEmail: string
  farmPhone: string
  currency: string
  theme: "light" | "dark"
  notifications: boolean
  emailAlerts: boolean
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true);
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const data = await authApi.get2FAStatus()
      setIs2FAEnabled(data.isTwoFactorEnabled)
    } catch { /* ignore */ }
  }

  const handle2FAEnable = async () => {
    try {
      setTwoFALoading(true)
      const data = await authApi.generate2FA()
      setQrCodeDataUrl(data.qrCodeDataUrl)
      setTwoFASecret(data.secret)
      setSetupCode("")
      setShowSetupModal(true)
    } catch (e: any) { toast.error(e.message || "Failed to generate 2FA") }
    finally { setTwoFALoading(false) }
  }

  const handle2FAConfirm = async () => {
    if (setupCode.length !== 6) { toast.error("Enter a 6-digit code"); return }
    try {
      setTwoFALoading(true)
      const result = await authApi.turnOn2FA(setupCode)
      setIs2FAEnabled(true)
      setShowSetupModal(false)
      setBackupCodes((result as any).backupCodes || [])
      setShowBackupCodesModal(true)
    } catch (e: any) { toast.error(e.message || "Invalid code") }
    finally { setTwoFALoading(false) }
  }

  const handle2FADisable = async () => {
    if (disableCode.length !== 6) { toast.error("Enter a 6-digit code"); return }
    try {
      setTwoFALoading(true)
      await authApi.turnOff2FA(disableCode)
      setIs2FAEnabled(false)
      setShowDisableModal(false)
      setDisableCode("")
      toast.success("2FA disabled")
    } catch (e: any) { toast.error(e.message || "Invalid code") }
    finally { setTwoFALoading(false) }
  }
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch(); 
  const [settings, setSettings] = useState<Settings>({
    farmName: "Aziz Poultry Farm",
    farmLocation: "Country, Region",
    farmEmail: "info@azizpoultry.com",
    farmPhone: "+1-234-567-8900",
    currency: "USD",
    theme: "light",
    notifications: true,
    emailAlerts: true,
  })

  const [formData, setFormData] = useState(settings)
  const [saved, setSaved] = useState(false)
  const { isDevMode, enableDevMode, disableDevMode } = useDevMode()
  const [devPassword, setDevPassword] = useState("")
  const [showDevPassword, setShowDevPassword] = useState(false)
  const [devError, setDevError] = useState("")

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [twoFASecret, setTwoFASecret] = useState("")
  const [setupCode, setSetupCode] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [twoFALoading, setTwoFALoading] = useState(false)



  const fetchSettings = async () => {
    console.log("test")
    try {
      setLoading(true)
      const data = await settingsApi.getAll()
      
      // Convert array of settings to object
      const settingsObj: any = {}
      data.forEach((setting: Setting) => {
        if (setting.key === 'notifications' || setting.key === 'emailAlerts') {
          settingsObj[setting.key] = setting.value === 'true'
        } else {
          settingsObj[setting.key] = setting.value
        }
      })
      
      // Merge with defaults
      const merged = { ...settings, ...settingsObj }
      setSettings(merged)
      setFormData(merged)
      if (merged.theme) {
  //dispatch(setTheme(merged.theme));
}
    } catch (error: any) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Save each setting
      const promises = Object.entries(formData).map(([key, value]) =>
        settingsApi.createOrUpdate({
          key,
          value: String(value),
          category: 'general',
        })
      )
      
      await Promise.all(promises)
      
      setSettings(formData)
      // Theme yahin par apply karo
      if (formData.theme) {
        dispatch(setTheme(formData.theme));
      }
      setSaved(true)
      toast.success('Settings saved successfully!')
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your farm and application settings</p>
        </div>

        {saved && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <p className="text-green-800 dark:text-green-200 flex items-center gap-2">
                <span className="text-lg">✓</span>
                Settings saved successfully!
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Farm Information</CardTitle>
                <CardDescription>Update your farm details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Farm Name</Label>
                  <Input
                    value={formData.farmName}
                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                    placeholder="Farm name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.farmLocation}
                    onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                    placeholder="City, Country"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.farmEmail}
                    onChange={(e) => setFormData({ ...formData, farmEmail: e.target.value })}
                    placeholder="email@farm.com"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.farmPhone}
                    onChange={(e) => setFormData({ ...formData, farmPhone: e.target.value })}
                    placeholder="+1-234-567-8900"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={loading}>
                  <Save className="mr-2" size={20} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette size={20} />
                  Display Settings
                </CardTitle>
                <CardDescription>Customize your interface appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={formData.theme}
                    onValueChange={(value: "light" | "dark") => {
                      setFormData({ ...formData, theme: value });
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Theme changes will be applied to your next session
                  </p>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={loading}>
                  <Save className="mr-2" size={20} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell size={20} />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Manage how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={formData.notifications}
                      onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                      className="w-4 h-4"
                      disabled={loading}
                    />
                    <div>
                      <p className="font-medium">In-App Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive notifications within the application</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={formData.emailAlerts}
                      onChange={(e) => setFormData({ ...formData, emailAlerts: e.target.checked })}
                      className="w-4 h-4"
                      disabled={loading}
                    />
                    <div>
                      <p className="font-medium">Email Alerts</p>
                      <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
                    </div>
                  </label>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Low stock alerts and urgent notifications will always be sent regardless of settings
                  </p>
                </div>

                <Button onClick={handleSave} className="w-full" disabled={loading}>
                  <Save className="mr-2" size={20} />
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock size={20} />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 2FA Section */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {is2FAEnabled
                        ? <ShieldCheck size={22} className="text-green-600" />
                        : <Shield size={22} className="text-muted-foreground" />}
                      <div>
                        <p className="font-medium">Two-Factor Authentication (2FA)</p>
                        <p className="text-sm text-muted-foreground">
                          {is2FAEnabled
                            ? "Your account is protected with an authenticator app."
                            : "Add extra security using Google or Microsoft Authenticator."}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${is2FAEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {is2FAEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  {is2FAEnabled ? (
                    <Button variant="destructive" size="sm" onClick={() => { setDisableCode(""); setShowDisableModal(true) }} disabled={twoFALoading}>
                      <ShieldOff size={14} className="mr-1" /> Disable 2FA
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handle2FAEnable} disabled={twoFALoading}>
                      <ShieldCheck size={14} className="mr-1" /> Enable 2FA
                    </Button>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Data Management</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      Export Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent text-red-600 hover:text-red-700">
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2FA Setup Modal */}
            <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Set Up Two-Factor Authentication</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong>.</p>
                  {qrCodeDataUrl && <div className="flex justify-center"><img src={qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48 border rounded" /></div>}
                  <div className="bg-gray-50 rounded p-3 text-xs font-mono text-center break-all text-muted-foreground">Manual key: {twoFASecret}</div>
                  <div className="space-y-2">
                    <Label>Enter the 6-digit code from your app to confirm</Label>
                    <Input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={setupCode} onChange={e => setSetupCode(e.target.value.replace(/\D/g, ''))} className="text-center text-xl tracking-widest" autoFocus />
                  </div>
                  <Button className="w-full" onClick={handle2FAConfirm} disabled={twoFALoading || setupCode.length !== 6}>
                    {twoFALoading ? "Verifying..." : "Confirm & Enable 2FA"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* 2FA Disable Modal */}
            <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Disable Two-Factor Authentication</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Enter your current 6-digit authenticator code to disable 2FA.</p>
                  <Input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))} className="text-center text-xl tracking-widest" autoFocus />
                  <Button variant="destructive" className="w-full" onClick={handle2FADisable} disabled={twoFALoading || disableCode.length !== 6}>
                    {twoFALoading ? "Disabling..." : "Disable 2FA"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Backup Codes Modal — shown ONCE after enabling */}
            <Dialog open={showBackupCodesModal} onOpenChange={() => {}}>
              <DialogContent className="max-w-md" onInteractOutside={e => e.preventDefault()}>
                <DialogHeader><DialogTitle>🔐 Save Your Recovery Codes</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                    <strong>Save these codes now.</strong> They will never be shown again. Each code can only be used once.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="font-mono text-sm bg-gray-100 rounded px-3 py-2 text-center tracking-wider">{code}</div>
                    ))}
                  </div>
                  <Button className="w-full" onClick={() => {
                    navigator.clipboard?.writeText(backupCodes.join('\n'))
                    toast.success("Codes copied to clipboard")
                  }} variant="outline">Copy All Codes</Button>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => { setShowBackupCodesModal(false); toast.success("2FA enabled successfully!") }}>
                    I've saved my codes — Done
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* Developer Mode — Staging only */}
        <Card className="border-purple-200 mt-6">
          <CardHeader className="bg-purple-50 border-b border-purple-100">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Terminal size={20} />
              Developer Mode
              {isDevMode && (
                <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">ACTIVE</span>
              )}
            </CardTitle>
            <CardDescription>Enable API request logging with curl commands. Staging only.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {!isDevMode ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Enter the developer password to enable dev mode.</p>
                <div className="flex gap-2 max-w-sm">
                  <div className="relative flex-1">
                    <Input
                      type={showDevPassword ? "text" : "password"}
                      value={devPassword}
                      onChange={e => { setDevPassword(e.target.value); setDevError("") }}
                      placeholder="Enter password"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const ok = enableDevMode(devPassword)
                          if (!ok) setDevError("Wrong password")
                          else { setDevPassword(""); toast.success("Dev mode enabled") }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDevPassword(v => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showDevPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <Button
                    onClick={() => {
                      const ok = enableDevMode(devPassword)
                      if (!ok) setDevError("Wrong password")
                      else { setDevPassword(""); toast.success("Dev mode enabled") }
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Enable
                  </Button>
                </div>
                {devError && <p className="text-xs text-red-500">{devError}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Terminal size={16} className="text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">Dev Mode is Active</p>
                    <p className="text-xs text-purple-600">All API requests are being logged. Click the purple button (bottom right) to view logs with curl commands.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => { disableDevMode(); toast.success("Dev mode disabled") }}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Disable Dev Mode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
