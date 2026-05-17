"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Save, Lock, Bell, Palette, Terminal, Eye, EyeOff,
  Shield, ShieldCheck, ShieldOff, Building2, User, ChevronRight,
  Tag, Plus, Edit2, Trash2, CheckCircle2, AlertCircle
} from "lucide-react"
import { settingsApi, authApi, permissionsApi, expenseCategoriesApi, type Setting, type ExpenseCategory } from "@/lib/api"
import { useDevMode } from "@/lib/dev-mode"
import { toast } from "sonner"
import { useDispatch } from "react-redux"
import { setTheme } from "@/app/redux/slices/themeSlice"

type Section = "general" | "display" | "notifications" | "security" | "permissions" | "categories" | "developer"

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; description: string }[] = [
  { id: "general", label: "General", icon: Building2, description: "Farm info & currency" },
  { id: "display", label: "Appearance", icon: Palette, description: "Theme & display" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts & preferences" },
  { id: "security", label: "Security", icon: Lock, description: "2FA & account security" },
  { id: "permissions", label: "Permissions", icon: ShieldCheck, description: "Manage role access levels" },
  { id: "categories", label: "Expense Categories", icon: Tag, description: "Manage expense category list" },
  { id: "developer", label: "Developer", icon: Terminal, description: "Dev mode & API logs" },
]

export default function SettingsPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>("general")
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()

  const [formData, setFormData] = useState({
    farmName: "Aziz Poultry Farm",
    farmLocation: "Country, Region",
    farmEmail: "info@azizpoultry.com",
    farmPhone: "+1-234-567-8900",
    currency: "INR",
    countryCode: "+91",
    theme: "light" as "light" | "dark",
    notifications: true,
    emailAlerts: true,
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
    isActive: true
  })

  const ALL_RESOURCES = [
    'dashboard', 'purchases', 'sales', 'godown', 'mortality',
    'expenses', 'reports', 'billing', 'users', 'settings'
  ]


  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role || "")
      } catch { }
    }
    authApi.get2FAStatus().then(d => setIs2FAEnabled(d.isTwoFactorEnabled)).catch(() => { })
    fetchPermissions()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const data = await expenseCategoriesApi.getAll()
      setCategories(data)
    } catch { toast.error("Failed to fetch categories") }
    finally { setCategoriesLoading(false) }
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
      setAllRolePermissions(perms)
    } catch { toast.error("Failed to fetch permissions") }
    finally { setPermissionsLoading(false) }
  }

  const handleUpdatePermission = async (role: string, resource: string, field: string, value: boolean) => {
    const previousState = [...allRolePermissions]

    // Optimistically update the UI
    setAllRolePermissions(prev => {
      const idx = prev.findIndex(p => p.role === role && p.resource === resource)
      if (idx > -1) {
        const fresh = [...prev]
        fresh[idx] = { ...fresh[idx], [field]: value }
        return fresh
      }
      return [...prev, { role, resource, canCreate: false, canRead: true, canUpdate: false, canDelete: false, [field]: value }]
    })

    try {
      const existing = allRolePermissions.find(p => p.role === role && p.resource === resource)
      const updatedPerms = {
        canCreate: field === 'canCreate' ? value : (existing?.canCreate ?? false),
        canRead: field === 'canRead' ? value : (existing?.canRead ?? true),
        canUpdate: field === 'canUpdate' ? value : (existing?.canUpdate ?? false),
        canDelete: field === 'canDelete' ? value : (existing?.canDelete ?? false),
      }
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
      await Promise.all(Object.entries(formData).map(([key, value]) =>
        settingsApi.createOrUpdate({ key, value: String(value), category: "general" })
      ))
      if (formData.theme) dispatch(setTheme(formData.theme))
      toast.success("Settings saved!")
    } catch { toast.error("Failed to save settings") }
    finally { setLoading(false) }
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
      <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-xl border bg-background shadow-sm">

        {/* Left Sidebar */}
        <div className="w-64 border-r bg-muted/30 flex flex-col">
          <div className="p-5 border-b">
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.filter(item => {
              if (userRole === 'staff' || userRole === 'Staff') {
                return item.id !== 'notifications' && item.id !== 'security'
              }
              if (userRole === 'manager' || userRole === 'Manager') {
                return item.id !== 'notifications' && item.id !== 'security' && item.id !== 'developer'
              }
              return true
            }).map(item => {
              const Icon = item.icon
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                    }`}
                >
                  <Icon size={18} className={active ? "text-primary-foreground" : "text-muted-foreground"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{item.label}</p>
                    <p className={`text-xs mt-0.5 truncate ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {item.description}
                    </p>
                  </div>
                  {active && <ChevronRight size={14} className="text-primary-foreground/70" />}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">{activeItem.label}</h2>
              <p className="text-muted-foreground text-sm mt-1">{activeItem.description}</p>
            </div>

            {/* General */}
            {activeSection === "general" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Farm Name</Label>
                    <Input value={formData.farmName} onChange={e => setFormData(f => ({ ...f, farmName: e.target.value }))} disabled={loading} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input value={formData.farmLocation} onChange={e => setFormData(f => ({ ...f, farmLocation: e.target.value }))} disabled={loading} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={formData.farmEmail} onChange={e => setFormData(f => ({ ...f, farmEmail: e.target.value }))} disabled={loading} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={formData.farmPhone} onChange={e => setFormData(f => ({ ...f, farmPhone: e.target.value }))} disabled={loading} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 max-w-xs">
                    <Label>Currency</Label>
                    <Select value={formData.currency} onValueChange={v => setFormData(f => ({ ...f, currency: v }))} disabled={loading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <Label>Country Code (Phone)</Label>
                    <Select value={formData.countryCode} onValueChange={v => setFormData(f => ({ ...f, countryCode: v }))} disabled={loading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Button onClick={handleSave} disabled={loading} className="mt-2">
                  <Save size={16} className="mr-2" />{loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}

            {/* Appearance */}
            {activeSection === "display" && (
              <div className="space-y-5">
                <div className="space-y-1.5 max-w-xs">
                  <Label>Theme</Label>
                  <Select value={formData.theme} onValueChange={(v: "light" | "dark") => setFormData(f => ({ ...f, theme: v }))} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">☀️ Light</SelectItem>
                      <SelectItem value="dark">🌙 Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Applied on next session</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                  <Save size={16} className="mr-2" />{loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div className="space-y-4">
                {[
                  { key: "notifications" as const, label: "In-App Notifications", desc: "Receive notifications within the application" },
                  { key: "emailAlerts" as const, label: "Email Alerts", desc: "Receive email notifications for important events" },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${formData[item.key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      onClick={() => setFormData(f => ({ ...f, [item.key]: !f[item.key] }))}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                ))}
                <Button onClick={handleSave} disabled={loading} className="mt-2">
                  <Save size={16} className="mr-2" />{loading ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <div className="space-y-4">
                <div className="border rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {is2FAEnabled ? <ShieldCheck size={24} className="text-green-600" /> : <Shield size={24} className="text-muted-foreground" />}
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          {is2FAEnabled ? "Protected with authenticator app" : "Use Google or Microsoft Authenticator"}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${is2FAEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {is2FAEnabled ? "On" : "Off"}
                    </span>
                  </div>
                  <div className="mt-4">
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
                </div>

                <div className="border rounded-xl p-5 space-y-3">
                  <p className="font-medium text-sm">Data Management</p>
                  <Button variant="outline" size="sm" className="w-full justify-start">Export All Data</Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">Clear All Data</Button>
                </div>
              </div>
            )}

            {/* Developer */}
            {activeSection === "developer" && (
              <div className="space-y-4">
                <div className="border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal size={18} className="text-purple-600" />
                    <p className="font-medium">Developer Mode</p>
                    {isDevMode && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">ACTIVE</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Enable API request logging with curl commands.</p>
                  {!isDevMode ? (
                    <div className="flex gap-2 max-w-sm">
                      <div className="relative flex-1">
                        <Input
                          type={showDevPassword ? "text" : "password"}
                          value={devPassword}
                          onChange={e => { setDevPassword(e.target.value); setDevError("") }}
                          placeholder="Developer password"
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              const ok = enableDevMode(devPassword)
                              if (!ok) setDevError("Wrong password")
                              else { setDevPassword(""); toast.success("Dev mode enabled") }
                            }
                          }}
                        />
                        <button type="button" onClick={() => setShowDevPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                          {showDevPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <Button onClick={() => {
                        const ok = enableDevMode(devPassword)
                        if (!ok) setDevError("Wrong password")
                        else { setDevPassword(""); toast.success("Dev mode enabled") }
                      }} className="bg-purple-600 hover:bg-purple-700">Enable</Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => { disableDevMode(); toast.success("Dev mode disabled") }} className="border-red-300 text-red-600 hover:bg-red-50">
                      Disable Dev Mode
                    </Button>
                  )}
                  {devError && <p className="text-xs text-red-500 mt-2">{devError}</p>}
                </div>
              </div>
            )}

            {/* Permissions */}
            {activeSection === "permissions" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3 flex-1 mr-4">
                    <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Access Control Management</p>
                      <p className="text-xs text-blue-700 mt-0.5">Control module visibility and action permissions for each user role. Admin roles always have full access.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setShowAddRoleModal(true)}>+ Add Role</Button>
                  </div>
                </div>

                {permissionsLoading ? (
                  <div className="flex justify-center p-8 text-muted-foreground animate-pulse text-sm">Loading permissions matrix...</div>
                ) : (
                  <div className="space-y-8 pb-10">
                    {Array.from(new Set(['admin', 'manager', 'staff', ...allRolePermissions.map(p => p.role)])).sort((a, b) => a === 'admin' ? -1 : 1).map(role => {
                      const rolePermissions = allRolePermissions.filter(p => p.role === role)
                      const resources = ALL_RESOURCES

                      return (
                        <div key={role} className="border rounded-xl overflow-hidden bg-background shadow-sm">
                          <div className={`p-4 border-b flex items-center justify-between ${role === 'admin' ? 'bg-indigo-900 text-white' :
                            role === 'manager' ? 'bg-blue-800 text-white' :
                              'bg-slate-700 text-white'
                            }`}>
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold uppercase tracking-wider">{role.replace('-', ' ')}</h3>
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
                            <span className="text-[10px] font-medium opacity-70">ROLE ACCESS LEVELS</span>
                          </div>
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                              <tr className="text-xs uppercase text-muted-foreground">
                                <th className="text-left p-3 font-semibold w-1/3">Resource / Module</th>
                                <th className="p-3 font-semibold text-center group">
                                  <div className="flex flex-col items-center">
                                    <span>View</span>
                                    <span className="text-[9px] opacity-50 font-normal mt-0.5">(Read)</span>
                                  </div>
                                </th>
                                <th className="p-3 font-semibold text-center">
                                  <div className="flex flex-col items-center">
                                    <span>Create</span>
                                    <span className="text-[9px] opacity-50 font-normal mt-0.5">(Add New)</span>
                                  </div>
                                </th>
                                <th className="p-3 font-semibold text-center">
                                  <div className="flex flex-col items-center">
                                    <span>Edit</span>
                                    <span className="text-[9px] opacity-50 font-normal mt-0.5">(Update)</span>
                                  </div>
                                </th>
                                <th className="p-3 font-semibold text-center">
                                  <div className="flex flex-col items-center">
                                    <span>Delete</span>
                                    <span className="text-[9px] opacity-50 font-normal mt-0.5">(Remove)</span>
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
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
                                        <td key={field} className={`p-3 text-center transition-colors ${checked ? 'bg-green-50/30' : 'bg-red-50/30'
                                          }`}>
                                          <div className="flex justify-center items-center">
                                            {isFull ? (
                                              <div title="Admin always has access">
                                                <ShieldCheck size={16} className="text-green-600 opacity-50" />
                                              </div>
                                            ) : (
                                              <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer hover:scale-110 transition-transform"
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
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Categories */}
            {activeSection === "categories" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3 flex-1 mr-4">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">Expense Category Management</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Manage categories and icons for expense tracking. System categories are pre-defined.</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => {
                    setEditingCategory(null)
                    setCategoryFormData({ name: "", description: "", icon: "tag", isActive: true })
                    setShowCategoryModal(true)
                  }}>+ New Category</Button>
                </div>

                {categoriesLoading ? (
                  <div className="flex justify-center p-8 text-muted-foreground animate-pulse text-sm">Loading categories...</div>
                ) : (
                  <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr className="text-xs uppercase text-muted-foreground">
                          <th className="text-left p-4 font-semibold">Category</th>
                          <th className="text-left p-4 font-semibold">Description</th>
                          <th className="text-center p-4 font-semibold">Status</th>
                          <th className="text-right p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {categories.map(cat => (
                          <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                                  <Tag size={16} />
                                </div>
                                <div>
                                  <p className="font-medium">{cat.name}</p>
                                  {cat.isDefault && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Default</span>}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground text-xs leading-relaxed max-w-xs">{cat.description || "-"}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleCategory(cat.id)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                              >
                                {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingCategory(cat)
                                    setCategoryFormData({ name: cat.name, description: cat.description || "", icon: "tag", isActive: cat.isActive })
                                    setShowCategoryModal(true)
                                  }}
                                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                {!cat.isDefault && (
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id, cat.isDefault)}
                                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role & Resource Modals */}
      <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add New User Role</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                placeholder="e.g. Data Entry Operator"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground italic">* Role names are case-insensitive</p>
            </div>
            <Button className="w-full" onClick={handleAddRole} disabled={!newRoleName}>Create Role</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Modals */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Set Up Two-Factor Authentication</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Scan with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong>.</p>
            {qrCodeDataUrl && <div className="flex justify-center"><img src={qrCodeDataUrl} alt="QR" className="w-48 h-48 border rounded" /></div>}
            <div className="bg-gray-50 rounded p-3 text-xs font-mono text-center break-all text-muted-foreground">Manual key: {twoFASecret}</div>
            <div className="space-y-2">
              <Label>Enter the 6-digit code to confirm</Label>
              <Input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={setupCode} onChange={e => setSetupCode(e.target.value.replace(/\D/g, ''))} className="text-center text-xl tracking-widest" autoFocus />
            </div>
            <Button className="w-full" onClick={handle2FAConfirm} disabled={twoFALoading || setupCode.length !== 6}>
              {twoFALoading ? "Verifying..." : "Confirm & Enable 2FA"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Disable 2FA</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your 6-digit authenticator code.</p>
            <Input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))} className="text-center text-xl tracking-widest" autoFocus />
            <Button variant="destructive" className="w-full" onClick={handle2FADisable} disabled={twoFALoading || disableCode.length !== 6}>
              {twoFALoading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBackupCodesModal} onOpenChange={() => { }}>
        <DialogContent className="max-w-md" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader><DialogTitle>🔐 Save Your Recovery Codes</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              <strong>Save these now.</strong> They will never be shown again. Each code can only be used once.
            </div>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div key={i} className="font-mono text-sm bg-gray-100 rounded px-3 py-2 text-center tracking-wider">{code}</div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard?.writeText(backupCodes.join('\n')); toast.success("Copied!") }}>Copy All Codes</Button>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => { setShowBackupCodesModal(false); toast.success("2FA enabled!") }}>
              I've saved my codes — Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
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
            {/* <div className="space-y-2">
              <Label>Icon Name (Lucide)</Label>
              <Input
                placeholder="e.g. zap, fuel, dollar-sign"
                value={categoryFormData.icon}
                onChange={e => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
              />
            </div> */}
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
            <Button className="w-full" onClick={handleSaveCategory} disabled={loading || !categoryFormData.name}>
              {loading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  )
}
