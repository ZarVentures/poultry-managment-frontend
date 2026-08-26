"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Save, Lock, Bell, Palette, Terminal, Eye, EyeOff,
  Shield, ShieldCheck, ShieldOff, Building2, User, ChevronRight,
  Tag, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, MessageSquare, Mail, Phone
} from "lucide-react"
import { settingsApi, authApi, permissionsApi, expenseCategoriesApi, notificationsApi, type Setting, type ExpenseCategory, type CommunicationLog } from "@/lib/api"
import { PERMISSION_RESOURCES } from "@/lib/permissions"
import { useDevMode } from "@/lib/dev-mode"
import { toast } from "sonner"
import { useDispatch } from "react-redux"
import { setTheme } from "@/app/redux/slices/themeSlice"

type Section = "general" | "display" | "notifications" | "security" | "permissions" | "categories" | "developer" | "communication"

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; description: string }[] = [
  { id: "general", label: "General", icon: Building2, description: "Farm info & currency" },
  { id: "communication", label: "Communication Hub", icon: MessageSquare, description: "AWS SES/SNS & alerts" },
  { id: "display", label: "Appearance", icon: Palette, description: "Theme & display" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts & preferences" },
  { id: "security", label: "Security", icon: Lock, description: "2FA & account security" },
  { id: "permissions", label: "Permissions", icon: ShieldCheck, description: "Manage role access levels" },
  { id: "categories", label: "Expense Categories", icon: Tag, description: "Manage expense category list" },
  { id: "developer", label: "Developer", icon: Terminal, description: "Dev mode & API logs" },
]

export default function SettingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()

  const VALID_SECTIONS: Section[] = ["general", "communication", "display", "notifications", "security", "permissions", "categories", "developer"]
  const pathSegment = pathname.split("/").filter(Boolean).pop() || ""
  const activeSection: Section = (VALID_SECTIONS.includes(pathSegment as Section) ? pathSegment : "general") as Section

  const [formData, setFormData] = useState({
    farmName: "Poultry Sathi",
    farmLocation: "Country, Region",
    farmEmail: "info@poultrysathi.com",
    farmPhone: "+1-234-567-8900",
    currency: "INR",
    countryCode: "+91",
    theme: "light" as "light" | "dark",
    notifications: true,
    emailAlerts: true,
    bearableLossType: "percentage" as "percentage" | "weight",
    bearableLossValue: "2.0",

    // Routing destinations and channels per workflow
    invoiceEmail: "",
    invoicePhone: "",
    invoiceChannel: "both" as "both" | "email" | "sms" | "none",

    inventoryEmail: "",
    inventoryPhone: "",
    inventoryChannel: "both" as "both" | "email" | "sms" | "none",

    lossEmail: "",
    lossPhone: "",
    lossChannel: "both" as "both" | "email" | "sms" | "none",

    mortalityEmail: "",
    mortalityPhone: "",
    mortalityChannel: "both" as "both" | "email" | "sms" | "none",
  })

  const { isDevMode, enableDevMode, disableDevMode } = useDevMode()
  const [devPassword, setDevPassword] = useState("")
  const [showDevPassword, setShowDevPassword] = useState(false)
  const [devError, setDevError] = useState("")

  // 2FA
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

  const [testEmailTarget, setTestEmailTarget] = useState("")
  const [testPhoneTarget, setTestPhoneTarget] = useState("")
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingSMS, setTestingSMS] = useState(false)
  const [commLogs, setCommLogs] = useState<CommunicationLog[]>([])
  const [commCounts, setCommCounts] = useState({ emailCount: 0, smsCount: 0 })
  const [logsLoading, setLogsLoading] = useState(false)
  const [allRolePermissions, setAllRolePermissions] = useState<any[]>([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    icon: "tag",
    appliesTo: "both" as 'both' | 'main' | 'godown',
    isActive: true
  })

  const ALL_RESOURCES = [...PERMISSION_RESOURCES]


  useEffect(() => {
    setMounted(true)

    // Redirect bare /settings to /settings/general
    if (pathname === "/settings" || pathname === "/settings/") {
      router.replace("/settings/general")
      return
    }

    const userData = localStorage.getItem("user")
    let role = ""
    if (userData) {
      try {
        const user = JSON.parse(userData)
        role = (user.role || "").toString().trim().toLowerCase()
        setUserRole(role)
      } catch { }
    }
    authApi.get2FAStatus().then(d => setIs2FAEnabled(d.isTwoFactorEnabled)).catch(() => { })
    
    // Load general settings from DB
    settingsApi.getAll().then(list => {
      if (Array.isArray(list)) {
        const map: any = {}
        list.forEach(s => {
          map[s.key] = s.value
        })
        setFormData(f => ({
          ...f,
          farmName: map['farmName'] || map['company_name'] || f.farmName,
          farmLocation: map['farmLocation'] || map['company_address'] || f.farmLocation,
          farmEmail: map['farmEmail'] || map['company_email'] || f.farmEmail,
          farmPhone: map['farmPhone'] || map['company_phone'] || f.farmPhone,
          currency: map['currency'] || f.currency,
          countryCode: map['countryCode'] || f.countryCode,
          theme: (map['theme'] as any) || f.theme,
          bearableLossType: (map['bearableLossType'] || map['bearable_loss_type'] || f.bearableLossType) as any,
          bearableLossValue: map['bearableLossValue'] || map['bearable_loss_value'] || f.bearableLossValue,
          invoiceEmail: map['invoiceEmail'] || f.invoiceEmail,
          invoicePhone: map['invoicePhone'] || f.invoicePhone,
          invoiceChannel: (map['invoiceChannel'] || f.invoiceChannel) as any,

          inventoryEmail: map['inventoryEmail'] || f.inventoryEmail,
          inventoryPhone: map['inventoryPhone'] || f.inventoryPhone,
          inventoryChannel: (map['inventoryChannel'] || f.inventoryChannel) as any,

          lossEmail: map['lossEmail'] || f.lossEmail,
          lossPhone: map['lossPhone'] || f.lossPhone,
          lossChannel: (map['lossChannel'] || f.lossChannel) as any,

          mortalityEmail: map['mortalityEmail'] || f.mortalityEmail,
          mortalityPhone: map['mortalityPhone'] || f.mortalityPhone,
          mortalityChannel: (map['mortalityChannel'] || f.mortalityChannel) as any,
        }))
      }
    }).catch(() => { })

    if (role === "admin") {
      fetchPermissions()
    }
    fetchCategories()
    fetchCommLogs()
  }, [])

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const data = await expenseCategoriesApi.getAll()
      setCategories(data)
    } catch { toast.error("Failed to fetch categories") }
    finally { setCategoriesLoading(false) }
  }

  const fetchCommLogs = async () => {
    try {
      setLogsLoading(true)
      const logs = await notificationsApi.getLogs(15)
      setCommLogs(logs)
      const counts = await notificationsApi.getCounts()
      setCommCounts(counts)
    } catch { 
      // Silently catch so it doesn't break the page if backend is offline
    } finally {
      setLogsLoading(false)
    }
  }

  const handleSaveCategory = async () => {
    if (!categoryFormData.name) { toast.error("Name is required"); return }
    try {
      setLoading(true)
      if (editingCategory) {
        await expenseCategoriesApi.update(editingCategory.id, categoryFormData)
        toast.success("Category updated")
      } else {
        await expenseCategoriesApi.create(categoryFormData)
        toast.success("Category created")
      }
      fetchCategories()
      setShowCategoryModal(false)
    } catch (e: any) { toast.error(e.message || "Failed to save category") }
    finally { setLoading(false) }
  }

  const handleDeleteCategory = async (id: number, isDefault: boolean) => {
    if (isDefault) { toast.error("Default categories cannot be deleted"); return }
    if (!window.confirm("Are you sure?")) return
    try {
      await expenseCategoriesApi.delete(id)
      toast.success("Category deleted")
      fetchCategories()
    } catch { toast.error("Failed to delete") }
  }

  const handleToggleCategory = async (id: number) => {
    try {
      const category = categories.find(c => c.id === id)
      if (!category) return
      await expenseCategoriesApi.update(id, { isActive: !category.isActive })
      fetchCategories()
      toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'}`)
    } catch { toast.error("Failed to toggle status") }
  }

  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true)
      const perms = await permissionsApi.getAllRolePermissions()
      if (Array.isArray(perms)) {
        setAllRolePermissions(perms)
      } else {
        setAllRolePermissions([])
        toast.error((perms as any)?.error || "Failed to fetch permissions")
      }
    } catch (e: any) {
      setAllRolePermissions([])
      toast.error(e?.message || "Failed to fetch permissions")
    }
    finally { setPermissionsLoading(false) }
  }

  const handleUpdatePermission = async (role: string, resource: string, field: string, value: boolean) => {
    const previousState = [...allRolePermissions]
    const existing = allRolePermissions.find(p => p.role === role && p.resource === resource)
    const updatedPerms = {
      canCreate: field === 'canCreate' ? value : (existing?.canCreate ?? false),
      canRead: field === 'canRead' ? value : (existing?.canRead ?? false),
      canUpdate: field === 'canUpdate' ? value : (existing?.canUpdate ?? false),
      canDelete: field === 'canDelete' ? value : (existing?.canDelete ?? false),
    }

    // Optimistically update the UI
    setAllRolePermissions(prev => {
      const idx = prev.findIndex(p => p.role === role && p.resource === resource)
      if (idx > -1) {
        const fresh = [...prev]
        fresh[idx] = { ...fresh[idx], ...updatedPerms }
        return fresh
      }
      return [...prev, { role, resource, ...updatedPerms }]
    })

    try {
      await permissionsApi.updateRolePermission(role, resource, updatedPerms)
    } catch {
      setAllRolePermissions(previousState)
      toast.error("Failed to update permission")
    }
  }

  const handleDeleteRole = async (role: string) => {
    if (!window.confirm(`Are you sure you want to delete the role: ${role}?`)) return
    try {
      await permissionsApi.deleteRole(role)
      setAllRolePermissions(prev => prev.filter(p => p.role !== role))
      toast.success("Role deleted successfully")
    } catch { toast.error("Failed to delete role") }
  }

  const handleAddRole = async () => {
    if (!newRoleName) return
    try {
      const defaultResource = 'dashboard'
      await permissionsApi.updateRolePermission(newRoleName.toLowerCase(), defaultResource, { canRead: true })
      await fetchPermissions()
      setShowAddRoleModal(false); setNewRoleName(""); toast.success("New role added!")
    } catch { toast.error("Failed to add role") }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const results = await Promise.allSettled(Object.entries(formData).map(([key, value]) =>
        settingsApi.createOrUpdate({ key, value: String(value), category: "general" })
      ))
      const allFailed = results.every(r => r.status === 'rejected')
      if (formData.theme) dispatch(setTheme(formData.theme))
      if (allFailed) {
        toast.error("Failed to save settings")
      } else {
        toast.success("Settings saved!")
      }
    } catch { toast.error("Failed to save settings") }
    finally { setLoading(false) }
  }

  const handleTestEmail = async () => {
    if (!testEmailTarget) { toast.error("Please enter a valid target email"); return }
    try {
      setTestingEmail(true)
      const res = await notificationsApi.testEmail(testEmailTarget)
      if (res && res.success) {
        toast.success(res.message || "Test email dispatched successfully!")
      } else {
        toast.error("Failed to dispatch test email")
      }
    } catch (e: any) {
      toast.error(e.message || "Email dispatch failed. Verify your AWS credentials are saved.")
    } finally {
      setTestingEmail(false)
    }
  }

  const handleTestSMS = async () => {
    if (!testPhoneTarget) { toast.error("Please enter a valid phone number (with country code)"); return }
    try {
      setTestingSMS(true)
      const res = await notificationsApi.testSMS(testPhoneTarget)
      if (res && res.success) {
        toast.success(res.message || "Test SMS dispatched successfully!")
      } else {
        toast.error("Failed to dispatch test SMS")
      }
    } catch (e: any) {
      toast.error(e.message || "SMS dispatch failed. Verify your AWS credentials are saved.")
    } finally {
      setTestingSMS(false)
    }
  }

  const handle2FAEnable = async () => {
    try {
      setTwoFALoading(true)
      const data = await authApi.generate2FA()
      setQrCodeDataUrl(data.qrCodeDataUrl); setTwoFASecret(data.secret); setSetupCode("")
      setShowSetupModal(true)
    } catch (e: any) { toast.error(e.message || "Failed") }
    finally { setTwoFALoading(false) }
  }

  const handle2FAConfirm = async () => {
    if (setupCode.length !== 6) { toast.error("Enter 6-digit code"); return }
    try {
      setTwoFALoading(true)
      const result = await authApi.turnOn2FA(setupCode)
      setIs2FAEnabled(true); setShowSetupModal(false)
      setBackupCodes((result as any).backupCodes || []); setShowBackupCodesModal(true)
    } catch (e: any) { toast.error(e.message || "Invalid code") }
    finally { setTwoFALoading(false) }
  }

  const handle2FADisable = async () => {
    if (disableCode.length !== 6) { toast.error("Enter 6-digit code"); return }
    try {
      setTwoFALoading(true)
      await authApi.turnOff2FA(disableCode)
      setIs2FAEnabled(false); setShowDisableModal(false); setDisableCode("")
      toast.success("2FA disabled")
    } catch (e: any) { toast.error(e.message || "Invalid code") }
    finally { setTwoFALoading(false) }
  }

  if (!mounted) return null

  const activeItem = NAV_ITEMS.find(n => n.id === activeSection)!

  return (
    <DashboardLayout>
      <div className="space-y-6">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{activeItem.label}</h2>
                  <p className="text-muted-foreground text-sm sm:text-base mt-1">{activeItem.description}</p>
                </div>
              </div>
            </div>

            {/* General */}
            {activeSection === "general" && (
              <div className="space-y-6">
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Farm Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Farm Name</Label>
                      <Input value={formData.farmName} onChange={e => setFormData(f => ({ ...f, farmName: e.target.value }))} disabled={loading} className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Location</Label>
                      <Input value={formData.farmLocation} onChange={e => setFormData(f => ({ ...f, farmLocation: e.target.value }))} disabled={loading} className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Email</Label>
                      <Input type="email" value={formData.farmEmail} onChange={e => setFormData(f => ({ ...f, farmEmail: e.target.value }))} disabled={loading} className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Phone</Label>
                      <Input value={formData.farmPhone} onChange={e => setFormData(f => ({ ...f, farmPhone: e.target.value }))} disabled={loading} className="h-10" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Regional</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Currency</Label>
                      <Select value={formData.currency} onValueChange={v => setFormData(f => ({ ...f, currency: v }))} disabled={loading}>
                        <SelectTrigger className="!h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Country Code (Phone)</Label>
                      <Select value={formData.countryCode} onValueChange={v => setFormData(f => ({ ...f, countryCode: v }))} disabled={loading}>
                        <SelectTrigger className="!h-10"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="+91">🇮🇳 +91 India</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1 USA / Canada</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44 UK</SelectItem>
                          <SelectItem value="+971">🇦🇪 +971 UAE</SelectItem>
                          <SelectItem value="+966">🇸🇦 +966 Saudi Arabia</SelectItem>
                          <SelectItem value="+92">🇵🇰 +92 Pakistan</SelectItem>
                          <SelectItem value="+880">🇧🇩 +880 Bangladesh</SelectItem>
                          <SelectItem value="+94">🇱🇰 +94 Sri Lanka</SelectItem>
                          <SelectItem value="+977">🇳🇵 +977 Nepal</SelectItem>
                          <SelectItem value="+60">🇲🇾 +60 Malaysia</SelectItem>
                          <SelectItem value="+65">🇸🇬 +65 Singapore</SelectItem>
                          <SelectItem value="+61">🇦🇺 +61 Australia</SelectItem>
                          <SelectItem value="+49">🇩🇪 +49 Germany</SelectItem>
                          <SelectItem value="+33">🇫🇷 +33 France</SelectItem>
                          <SelectItem value="+86">🇨🇳 +86 China</SelectItem>
                          <SelectItem value="+81">🇯🇵 +81 Japan</SelectItem>
                          <SelectItem value="+234">🇳🇬 +234 Nigeria</SelectItem>
                          <SelectItem value="+27">🇿🇦 +27 South Africa</SelectItem>
                          <SelectItem value="+55">🇧🇷 +55 Brazil</SelectItem>
                          <SelectItem value="+7">🇷🇺 +7 Russia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Cage Weight Loss Controls</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Configure limits for acceptable weight loss per cage.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Max Bearable Loss Type</Label>
                      <Select value={formData.bearableLossType} onValueChange={v => setFormData(f => ({ ...f, bearableLossType: v as any }))} disabled={loading}>
                        <SelectTrigger className="!h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%) of expected weight</SelectItem>
                          <SelectItem value="weight">Fixed Weight (kg) per cage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Max Bearable Loss Value</Label>
                      <Input type="number" step="0.01" value={formData.bearableLossValue} onChange={e => setFormData(f => ({ ...f, bearableLossValue: e.target.value }))} placeholder={formData.bearableLossType === 'percentage' ? "e.g. 2.0%" : "e.g. 1.0 kg"} disabled={loading} onWheel={(e) => e.currentTarget.blur()} className="h-10" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If an operator enters a weight loss exceeding this limit, the system highlights the row in soft warning red and alerts them.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading} className="rounded-full h-10 px-6">
                    <Save size={16} className="mr-2" />{loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === "display" && (
              <div className="space-y-6">
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Theme</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Choose your preferred color scheme.</p>
                  </div>
                  <Select value={formData.theme} onValueChange={(v: "light" | "dark") => setFormData(f => ({ ...f, theme: v }))} disabled={loading}>
                    <SelectTrigger className="!h-10 max-w-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">☀️ Light</SelectItem>
                      <SelectItem value="dark">🌙 Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Applied on next session.</p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading} className="rounded-full h-10 px-6">
                    <Save size={16} className="mr-2" />{loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div className="rounded-2xl border bg-card divide-y dark:divide-slate-700">
                  {[
                    { key: "notifications" as const, label: "In-App Notifications", desc: "Receive notifications within the application", icon: Bell },
                    { key: "emailAlerts" as const, label: "Email Alerts", desc: "Receive email notifications for important events", icon: Mail },
                  ].map(item => (
                    <label key={item.key} className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <item.icon size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-sm sm:text-base">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <div
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${formData[item.key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        onClick={() => setFormData(f => ({ ...f, [item.key]: !f[item.key] }))}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading} className="rounded-full h-10 px-6">
                    <Save size={16} className="mr-2" />{loading ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div className="rounded-2xl border bg-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${is2FAEnabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {is2FAEnabled ? <ShieldCheck size={20} /> : <Shield size={20} />}
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          {is2FAEnabled ? "Protected with authenticator app" : "Use Google or Microsoft Authenticator"}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${is2FAEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
                      {is2FAEnabled ? "On" : "Off"}
                    </span>
                  </div>
                  <div className="mt-4">
                    {is2FAEnabled ? (
                      <Button variant="destructive" size="sm" className="rounded-full" onClick={() => { setDisableCode(""); setShowDisableModal(true) }} disabled={twoFALoading}>
                        <ShieldOff size={14} className="mr-1" /> Disable 2FA
                      </Button>
                    ) : (
                      <Button size="sm" className="rounded-full" onClick={handle2FAEnable} disabled={twoFALoading}>
                        <ShieldCheck size={14} className="mr-1" /> Enable 2FA
                      </Button>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-5 space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" size="sm" className="rounded-full flex-1 justify-start">Export All Data</Button>
                    <Button variant="outline" size="sm" className="rounded-full flex-1 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 dark:border-red-800/50">Clear All Data</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Developer */}
            {activeSection === "developer" && (
              <div className="space-y-6">
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                      <Terminal size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm sm:text-base">Developer Mode</p>
                        {isDevMode && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">Enable API request logging with curl commands.</p>
                    </div>
                  </div>
                  {!isDevMode ? (
                    <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                      <div className="relative flex-1">
                        <Input
                          type={showDevPassword ? "text" : "password"}
                          value={devPassword}
                          onChange={e => { setDevPassword(e.target.value); setDevError("") }}
                          placeholder="Developer password"
                          className="h-10"
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              const ok = enableDevMode(devPassword)
                              if (!ok) setDevError("Wrong password")
                              else { setDevPassword(""); toast.success("Dev mode enabled") }
                            }
                          }}
                        />
                        <button type="button" onClick={() => setShowDevPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                          {showDevPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <Button onClick={() => {
                        const ok = enableDevMode(devPassword)
                        if (!ok) setDevError("Wrong password")
                        else { setDevPassword(""); toast.success("Dev mode enabled") }
                      }} className="rounded-full bg-purple-600 hover:bg-purple-700">Enable</Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="rounded-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-950/30" onClick={() => { disableDevMode(); toast.success("Dev mode disabled") }}>
                      Disable Dev Mode
                    </Button>
                  )}
                  {devError && <p className="text-sm text-red-500">{devError}</p>}
                </div>
              </div>
            )}

            {/* Communication Hub */}
            {activeSection === "communication" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-800/50 p-5 rounded-2xl flex items-start gap-3">
                  <MessageSquare className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-purple-900 dark:text-purple-200">Communication & Alert Orchestration Hub</p>
                    <p className="text-sm sm:text-base text-purple-700 dark:text-purple-300/80 mt-0.5">
                      Configure alert targets and distribution channels. AWS integration is securely handled on the backend for maximum safety.
                    </p>
                  </div>
                </div>

                {/* Sent Communication Analytics Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-blue-100 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/20 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Emails Transmitted</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{commCounts.emailCount}</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-800/40 p-2.5 rounded-lg text-blue-600 dark:text-blue-400">
                      <Mail size={22} />
                    </div>
                  </div>

                  <div className="border border-green-100 dark:border-green-800/50 bg-green-50/30 dark:bg-green-900/20 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">SMS Messages Dispatched</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-200">{commCounts.smsCount}</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-800/40 p-2.5 rounded-lg text-green-600 dark:text-green-400">
                      <Phone size={22} />
                    </div>
                  </div>
                </div>

                {/* Routing & Alert Pathways Form */}
                <div className="border dark:border-slate-700 rounded-2xl p-6 space-y-5 bg-background shadow-sm">
                  <h3 className="font-semibold text-base text-gray-800 dark:text-slate-200 border-b dark:border-slate-700 pb-3 flex items-center gap-2">
                    <Bell size={16} className="text-purple-500 dark:text-purple-400" /> Alert Pathways & Channels
                  </h3>
                  
                  <div className="space-y-6">
                    {[
                      {
                        title: "Sales Invoices & Receipts",
                        desc: "Send instant transactional receipts to customers upon billing a sale",
                        emailKey: "invoiceEmail" as const,
                        phoneKey: "invoicePhone" as const,
                        channelKey: "invoiceChannel" as const,
                      },
                      {
                        title: "Low Inventory Alerts",
                        desc: "Warn management when feed or medicine stocks drop below critical minimums",
                        emailKey: "inventoryEmail" as const,
                        phoneKey: "inventoryPhone" as const,
                        channelKey: "inventoryChannel" as const,
                      },
                      {
                        title: "Critical Cage Weight Loss Alerts",
                        desc: "Instantly alert farm owners if cage weight loss exceeds bearable loss margins",
                        emailKey: "lossEmail" as const,
                        phoneKey: "lossPhone" as const,
                        channelKey: "lossChannel" as const,
                      },
                      {
                        title: "Daily Mortality Alerts",
                        desc: "Send daily mortality counts and percentage summaries to stakeholders",
                        emailKey: "mortalityEmail" as const,
                        phoneKey: "mortalityPhone" as const,
                        channelKey: "mortalityChannel" as const,
                      }
                    ].map(workflow => (
                      <div key={workflow.title} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200">{workflow.title}</h4>
                            <p className="text-xs text-muted-foreground">{workflow.desc}</p>
                          </div>
                          
                          {/* Channel Select Pills */}
                          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-700/60 p-0.5 rounded-lg text-xs">
                            {([
                              { value: "both", label: "Both" },
                              { value: "email", label: "Email" },
                              { value: "sms", label: "SMS" },
                              { value: "none", label: "Off" }
                            ] as const).map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData(f => ({ ...f, [workflow.channelKey]: opt.value }))}
                                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                  formData[workflow.channelKey] === opt.value
                                    ? "bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm"
                                    : "text-muted-foreground hover:text-gray-700 dark:hover:text-slate-300"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {formData[workflow.channelKey] !== "none" && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2">
                            {(formData[workflow.channelKey] === "email" || formData[workflow.channelKey] === "both") && (
                              <div className="space-y-1">
                                <Label className="text-xs">Target Email Address</Label>
                                <Input
                                  type="email"
                                  placeholder="recipient@example.com"
                                  value={formData[workflow.emailKey]}
                                  onChange={e => setFormData(f => ({ ...f, [workflow.emailKey]: e.target.value }))}
                                  className="text-sm h-10"
                                />
                              </div>
                            )}
                            {(formData[workflow.channelKey] === "sms" || formData[workflow.channelKey] === "both") && (
                              <div className="space-y-1">
                                <Label className="text-xs">Target Phone Number</Label>
                                <Input
                                  type="text"
                                  placeholder="+919876543210"
                                  value={formData[workflow.phoneKey]}
                                  onChange={e => setFormData(f => ({ ...f, [workflow.phoneKey]: e.target.value }))}
                                  className="text-sm h-10"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connection Test Controls */}
                <div className="border border-purple-100 dark:border-purple-800/50 rounded-2xl p-6 space-y-4 bg-purple-50/10 dark:bg-purple-950/20 shadow-sm">
                  <h3 className="font-semibold text-lg text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-purple-600 dark:text-purple-400" /> Pipeline Verification Tests
                  </h3>
                  <p className="text-sm sm:text-base text-purple-800 dark:text-purple-300/80">
                    Verify connection pathways instantly by triggering secure dispatches directly from the backend services.
                  </p>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2">
                    {/* Test Email */}
                    <div className="border dark:border-slate-700 rounded-lg p-3 space-y-3 bg-background shadow-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="text-blue-600 dark:text-blue-400" size={15} />
                        <span className="text-sm font-semibold dark:text-slate-200">Test SES Email Gateway</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                          type="email"
                          placeholder="test@example.com"
                          value={testEmailTarget}
                          onChange={e => setTestEmailTarget(e.target.value)}
                          className="text-sm h-10"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleTestEmail}
                          disabled={testingEmail || !testEmailTarget}
                          className="text-sm h-10 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {testingEmail ? "Sending..." : "Test Email"}
                        </Button>
                      </div>
                    </div>

                    {/* Test SMS */}
                    <div className="border dark:border-slate-700 rounded-lg p-3 space-y-3 bg-background shadow-xs">
                      <div className="flex items-center gap-2">
                        <Phone className="text-green-600 dark:text-green-400" size={15} />
                        <span className="text-sm font-semibold dark:text-slate-200">Test SNS SMS Gateway</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                          type="text"
                          placeholder="+919876543210"
                          value={testPhoneTarget}
                          onChange={e => setTestPhoneTarget(e.target.value)}
                          className="text-sm h-10"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleTestSMS}
                          disabled={testingSMS || !testPhoneTarget}
                          className="text-sm h-10 whitespace-nowrap bg-green-600 hover:bg-green-700 text-white"
                        >
                          {testingSMS ? "Sending..." : "Test SMS"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sent Communication Logs Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 bg-background shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b dark:border-slate-700 pb-3">
                    <h3 className="font-semibold text-base text-gray-800 dark:text-slate-200 flex items-center gap-2">
                      <Terminal size={16} className="text-slate-500 dark:text-slate-400" /> Recent Dispatch Audit Logs
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchCommLogs}
                      disabled={logsLoading}
                      className="text-sm h-9 px-3"
                    >
                      {logsLoading ? "Refreshing..." : "Refresh Logs"}
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Recipient</th>
                          <th className="py-2.5 px-3 text-center">Channel</th>
                          <th className="py-2.5 px-3">Message Type</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                              No recent dispatches registered in database audits.
                            </td>
                          </tr>
                        ) : (
                          commLogs.map(log => (
                            <tr key={log.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-3 px-3 font-medium text-gray-800 dark:text-slate-200 max-w-[180px] truncate" title={log.recipient}>
                                {log.recipient}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex justify-center">
                                  {log.channel === "email" ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                                      <Mail size={10} /> Email
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800/50">
                                      <Phone size={10} /> SMS
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 font-medium capitalize text-gray-700 dark:text-slate-300">
                                {log.messageType.replace("_", " ")}
                              </td>
                              <td className="py-3 px-3 text-muted-foreground text-xs">
                                {new Date(log.sentAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {log.status === "sent" ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                    Dispatched
                                  </span>
                                ) : (
                                  <span 
                                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 cursor-help"
                                    title={log.errorMessage || "Unknown transmission failure"}
                                  >
                                    Failed ⚠️
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={loading} className="rounded-full h-10 px-6">
                    <Save size={16} className="mr-2" />{loading ? "Saving..." : "Save Communication Settings"}
                  </Button>
                </div>
              </div>
            )}

            {/* Permissions */}
            {activeSection === "permissions" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex items-start gap-3 flex-1 dark:bg-blue-950/20 dark:border-blue-800/50">
                    <ShieldCheck className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100">Access Control Management</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">Control module visibility and action permissions for each user role. Admin roles always have full access.</p>
                    </div>
                  </div>
                  <Button size="default" className="rounded-full shrink-0" onClick={() => setShowAddRoleModal(true)}>+ Add Role</Button>
                </div>

                {permissionsLoading ? (
                  <div className="flex justify-center p-12 text-muted-foreground animate-pulse text-sm">Loading permissions matrix...</div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {Array.from(new Set(['admin', 'manager', 'staff', ...allRolePermissions.map(p => p.role)])).sort((a, b) => a === 'admin' ? -1 : 1).map(role => {
                      const rolePermissions = allRolePermissions.filter(p => p.role === role)
                      const resources = ALL_RESOURCES

                      return (
                        <div key={role} className="rounded-2xl border overflow-hidden bg-card shadow-sm">
                          <div className={`p-4 border-b flex items-center justify-between ${role === 'admin' ? 'bg-indigo-900 text-white' :
                            role === 'manager' ? 'bg-blue-800 text-white' :
                              'bg-slate-700 text-white'
                            }`}>
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold uppercase tracking-wider text-sm">{role.replace('-', ' ')}</h3>
                              {role !== 'admin' && role !== 'manager' && role !== 'staff' && (
                                <button
                                  onClick={() => handleDeleteRole(role)}
                                  className="text-white/50 hover:text-red-400 transition-colors"
                                  title="Delete Role"
                                >
                                  <ShieldOff size={14} />
                                </button>
                              )}
                            </div>
                            <span className="text-xs font-medium opacity-70">ROLE ACCESS LEVELS</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[500px]">
                              <thead className="bg-muted/50 dark:bg-slate-800 border-b dark:border-slate-700">
                                <tr className="text-xs uppercase text-muted-foreground">
                                  <th className="text-left p-3 font-semibold w-1/3">Resource / Module</th>
                                  <th className="p-3 font-semibold text-center">
                                    <div className="flex flex-col items-center">
                                      <span>View</span>
                                      <span className="text-xs opacity-50 font-normal mt-0.5">(Read)</span>
                                    </div>
                                  </th>
                                  <th className="p-3 font-semibold text-center">
                                    <div className="flex flex-col items-center">
                                      <span>Create</span>
                                      <span className="text-xs opacity-50 font-normal mt-0.5">(Add New)</span>
                                    </div>
                                  </th>
                                  <th className="p-3 font-semibold text-center">
                                    <div className="flex flex-col items-center">
                                      <span>Edit</span>
                                      <span className="text-xs opacity-50 font-normal mt-0.5">(Update)</span>
                                    </div>
                                  </th>
                                  <th className="p-3 font-semibold text-center">
                                    <div className="flex flex-col items-center">
                                      <span>Delete</span>
                                      <span className="text-xs opacity-50 font-normal mt-0.5">(Remove)</span>
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {resources.map(resource => {
                                  const perm = rolePermissions.find(p => p.resource === resource)
                                  const isFull = role === 'admin'
                                  return (
                                    <tr key={`${role}-${resource}`} className="hover:bg-muted/30 transition-colors group">
                                      <td className="p-3 font-medium capitalize flex items-center gap-2">
                                        <ChevronRight size={12} className="text-muted-foreground group-hover:text-primary" />
                                        {resource.replace('-', ' ')}
                                      </td>
                                      {['canRead', 'canCreate', 'canUpdate', 'canDelete'].map(field => {
                                        const checked = isFull || (perm ? perm[field] : false)
                                        return (
                                          <td key={field} className={`p-3 text-center transition-colors ${checked ? 'bg-green-50/30 dark:bg-green-900/20' : 'bg-red-50/30 dark:bg-red-900/20'
                                            }`}>
                                            <div className="flex justify-center items-center">
                                              {isFull ? (
                                                <div title="Admin always has access">
                                                  <ShieldCheck size={16} className="text-green-600 dark:text-green-400 opacity-50" />
                                                </div>
                                              ) : (
                                                <input
                                                  type="checkbox"
                                                  className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary focus:ring-primary cursor-pointer hover:scale-110 transition-transform"
                                                  checked={checked}
                                                  onChange={(e) => handleUpdatePermission(role, resource, field, e.target.checked)}
                                                />
                                              )}
                                            </div>
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Categories */}
            {activeSection === "categories" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-start gap-3 flex-1 dark:bg-emerald-950/20 dark:border-emerald-800/50">
                    <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm sm:text-base font-medium text-emerald-900 dark:text-emerald-100">Expense Category Management</p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">Manage categories and icons for expense tracking. System categories are pre-defined.</p>
                    </div>
                  </div>
                  <Button size="default" className="rounded-full shrink-0" onClick={() => {
                    setEditingCategory(null)
                    setCategoryFormData({ name: "", description: "", icon: "tag", appliesTo: "both", isActive: true })
                    setShowCategoryModal(true)
                  }}>+ New Category</Button>
                </div>

                {categoriesLoading ? (
                  <div className="flex justify-center p-12 text-muted-foreground animate-pulse text-sm">Loading categories...</div>
                ) : (
                  <div className="rounded-2xl border overflow-hidden bg-card shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead className="bg-muted/50 dark:bg-slate-800 border-b dark:border-slate-700">
                          <tr className="text-xs uppercase text-muted-foreground">
                            <th className="text-left p-4 font-semibold">Category</th>
                            <th className="text-left p-4 font-semibold">Description</th>
                            <th className="text-center p-4 font-semibold">Applies To</th>
                            <th className="text-center p-4 font-semibold">Status</th>
                            <th className="text-right p-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {categories.map(cat => (
                            <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                                    <Tag size={16} />
                                  </div>
                                  <div>
                                    <p className="font-medium">{cat.name}</p>
                                    {cat.isDefault &&                     <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase">Default</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-muted-foreground text-sm leading-relaxed max-w-xs">{cat.description || "-"}</td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                  (cat.appliesTo || 'both') === 'main' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' :
                                  (cat.appliesTo || 'both') === 'godown' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' :
                                  'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300'
                                }`}>
                                  {(cat.appliesTo || 'both') === 'both' ? 'Both' : (cat.appliesTo || 'both') === 'main' ? 'Main' : 'Godown'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleToggleCategory(cat.id)}
                                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${cat.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'}`}
                                >
                                  {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </button>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCategory(cat)
                                      setCategoryFormData({ name: cat.name, description: cat.description || "", icon: "tag", appliesTo: cat.appliesTo || "both", isActive: cat.isActive })
                                      setShowCategoryModal(true)
                                    }}
                                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                                    title="Edit"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  {!cat.isDefault && (
                                    <button
                                      onClick={() => handleDeleteCategory(cat.id, cat.isDefault)}
                                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

      {/* Role & Resource Modals */}
      <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
        <DialogContent className="max-w-sm mx-4 sm:mx-0">
          <DialogHeader><DialogTitle>Add New User Role</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                placeholder="e.g. Data Entry Operator"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                autoFocus
                className="h-10"
              />
              <p className="text-xs text-muted-foreground italic">* Role names are case-insensitive</p>
            </div>
            <Button className="w-full rounded-full" onClick={handleAddRole} disabled={!newRoleName}>Create Role</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Modals */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader><DialogTitle>Set Up Two-Factor Authentication</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Scan with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong>.</p>
            {qrCodeDataUrl && <div className="flex justify-center"><img src={qrCodeDataUrl} alt="QR" className="w-48 h-48 border rounded-xl" /></div>}
            <div className="bg-muted rounded-xl p-3 text-xs font-mono text-center break-all text-muted-foreground">Manual key: {twoFASecret}</div>
            <div className="space-y-2">
              <Label>Enter the 6-digit code to confirm</Label>
              <Input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={setupCode} onChange={e => setSetupCode(e.target.value.replace(/\D/g, ''))} className="text-center text-xl tracking-widest h-12" autoFocus />
            </div>
            <Button className="w-full rounded-full" onClick={handle2FAConfirm} disabled={twoFALoading || setupCode.length !== 6}>
              {twoFALoading ? "Verifying..." : "Confirm & Enable 2FA"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent className="max-w-sm mx-4 sm:mx-0">
          <DialogHeader><DialogTitle>Disable 2FA</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your 6-digit authenticator code.</p>
            <Input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))} className="text-center text-xl tracking-widest h-12" autoFocus />
            <Button variant="destructive" className="w-full rounded-full" onClick={handle2FADisable} disabled={twoFALoading || disableCode.length !== 6}>
              {twoFALoading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBackupCodesModal} onOpenChange={() => { }}>
        <DialogContent className="max-w-md mx-4 sm:mx-0" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader><DialogTitle>Save Your Recovery Codes</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-800/50 dark:text-yellow-300">
              <strong>Save these now.</strong> They will never be shown again. Each code can only be used once.
            </div>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div key={i} className="font-mono text-sm bg-muted rounded-lg px-3 py-2 text-center tracking-wider">{code}</div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full rounded-full" onClick={() => { navigator.clipboard?.writeText(backupCodes.join('\n')); toast.success("Copied!") }}>Copy All Codes</Button>
              <Button className="w-full rounded-full bg-green-600 hover:bg-green-700" onClick={() => { setShowBackupCodesModal(false); toast.success("2FA enabled!") }}>
                I've saved my codes — Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="!w-[min(28rem,calc(100vw-2rem))] sm:!w-full">
          <DialogHeader><DialogTitle>{editingCategory ? "Edit Expense Category" : "Add New Expense Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                placeholder="e.g. Electricity Bill"
                value={categoryFormData.name}
                onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                disabled={editingCategory?.isDefault}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="What is this for?"
                value={categoryFormData.description}
                onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Applies To *</Label>
              <Select
                value={categoryFormData.appliesTo}
                onValueChange={v => setCategoryFormData({ ...categoryFormData, appliesTo: v as any })}
              >
                <SelectTrigger className="!h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both (Main & Godown)</SelectItem>
                  <SelectItem value="main">Main Expenses Only</SelectItem>
                  <SelectItem value="godown">Godown Expenses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="cat-active"
                className="h-4 w-4 rounded"
                checked={categoryFormData.isActive}
                onChange={e => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })}
              />
              <Label htmlFor="cat-active">Mark as Active</Label>
            </div>
            <Button className="w-full rounded-full" onClick={handleSaveCategory} disabled={loading || !categoryFormData.name}>
              {loading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  )
}
