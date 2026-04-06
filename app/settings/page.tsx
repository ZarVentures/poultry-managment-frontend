"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Save, Lock, Bell, Palette, Terminal, Eye, EyeOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { settingsApi, type Setting } from "@/lib/api"
import { useDevMode } from "@/lib/dev-mode"
import { toast } from "sonner"
import { useTheme } from "next-themes"
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
  const [loading, setLoading] = useState(false)
  const { setTheme } = useTheme()
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

  useEffect(() => {
    setMounted(true)
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
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
      if (formData.theme === "dark") {
  setTheme("dark")
} else {
  setTheme("light")
}
      
      setSettings(formData)
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
                    onValueChange={(value: any) => setFormData({ ...formData, theme: value })}
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
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex gap-2">
                  <AlertCircle size={20} className="text-green-700 dark:text-green-200 flex-shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    This application now uses a secure PostgreSQL database for data persistence.
                  </p>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  Change Password
                </Button>

                <Button variant="outline" className="w-full bg-transparent">
                  Two-Factor Authentication
                </Button>

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
