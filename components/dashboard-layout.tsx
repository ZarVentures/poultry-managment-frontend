"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { useDevMode } from "@/lib/dev-mode"
import { setDevLogger } from "@/lib/api"
import { PermissionsProvider, usePermissions } from "@/lib/permissions"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  BarChart3, Users, Package, ShoppingCart, TrendingUp,
  LogOut, Menu, X, Home, Settings, ChevronDown, Users2,
  Truck, AlertCircle, Terminal, Copy, Trash2,
  ChartNoAxesCombined, Tractor, User, PackageOpen, PackagePlus,
  PackageCheck, CreditCard, BookOpen, Scale,
  TrendingDown, Building2, MessageSquare, Palette, Bell, Lock, ShieldCheck, Tag,
} from "lucide-react"

const IS_STAGING = process.env.NEXT_PUBLIC_IS_STAGING === 'true'

interface User {
  email: string
  role: string
  name?: string
}

function firstAllowedPath(canRead: (resource: string) => boolean): string {
  const routes: Array<[string, string]> = [
    ["dashboard", "/dashboard"],
    ["godown", "/inventory"],
    ["purchases", "/purchases"],
    ["sales", "/sales"],
    ["mortality", "/mortality"],
    ["expenses", "/expenses"],
    ["farmers", "/farmers"],
    ["retailers", "/retailers"],
    ["vehicles", "/vehicles"],
    ["reports", "/reports"],
    ["billing", "/billing/balance-sheet"],
    ["users", "/users"],
    ["settings", "/settings/general"],
  ]
  for (const [resource, href] of routes) {
    if (canRead(resource)) return href
  }
  return "/dashboard"
}

/** Map current path → Settings permission resource key */
function resourceForPath(pathname: string): string | null {
  if (pathname.startsWith("/dashboard")) return "dashboard"
  if (pathname.startsWith("/inventory") || pathname.startsWith("/godown") || pathname.startsWith("/bird-returns")) return "godown"
  if (pathname.startsWith("/purchases")) return "purchases"
  if (pathname.startsWith("/sales")) return "sales"
  if (pathname.startsWith("/mortality")) return "mortality"
  if (pathname.startsWith("/expenses")) return "expenses"
  if (pathname.startsWith("/reports") || pathname.startsWith("/financial-analytics")) return "reports"
  if (pathname.startsWith("/billing")) return "billing"
  if (pathname.startsWith("/farmers")) return "farmers"
  if (pathname.startsWith("/retailers")) return "retailers"
  if (pathname.startsWith("/vehicles")) return "vehicles"
  if (pathname.startsWith("/users")) return "users"
  if (pathname.startsWith("/settings")) return "settings"
  return null
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) { router.push("/"); return }
    try {
      setUser(JSON.parse(userData))
    } catch {
      localStorage.removeItem("user")
      router.push("/")
    }
  }, [router])

  if (!user) return null

  return (
    <PermissionsProvider role={user.role}>
      <DashboardLayoutInner user={user}>{children}</DashboardLayoutInner>
    </PermissionsProvider>
  )
}

function DashboardLayoutInner({ children, user }: { children: React.ReactNode; user: User }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [godownOpen, setGodownOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)
  const [masterEntriesOpen, setMasterEntriesOpen] = useState(false)
  const [purchasesOpen, setPurchasesOpen] = useState(false)
  const [salesOpen, setSalesOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { isDevMode, logs, clearLogs, addLog } = useDevMode()
  const [showDevPanel, setShowDevPanel] = useState(false)
  const { canRead, loading: permissionsLoading, isAdmin } = usePermissions()

  useEffect(() => {
    setDevLogger(addLog)
    return () => setDevLogger(null)
  }, [addLog])

  // Keep the sidebar fully expanded on mobile and reset the drawer when switching breakpoints
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(true)
      setMobileSidebarOpen(false)
    }
  }, [isMobile])

  // Close the mobile drawer on navigation
  useEffect(() => {
    if (isMobile) setMobileSidebarOpen(false)
  }, [pathname, isMobile])

  useEffect(() => {
    if (pathname.startsWith("/billing")) setBillingOpen(true)
  }, [pathname])

  const toggleSidebar = () => {
    if (isMobile) setMobileSidebarOpen((open) => !open)
    else setSidebarOpen((open) => !open)
  }

  // Wait until the permission matrix has loaded. Each page remounts this
  // layout, so denying before /permissions/my-permissions returned used to
  // bounce staff to /settings/general.
  useEffect(() => {
    if (permissionsLoading) return
    const resource = resourceForPath(pathname)
    if (!resource) return
    if (canRead(resource)) return
    router.replace(firstAllowedPath(canRead))
  }, [pathname, permissionsLoading, canRead, router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/")
  }

  const showGodown = canRead("godown")
  const showPurchases = canRead("purchases")
  const showSales = canRead("sales")
  const showMortality = canRead("mortality")
  const showExpenses = canRead("expenses")
  const showFarmers = canRead("farmers")
  const showRetailers = canRead("retailers")
  const showVehicles = canRead("vehicles")
  const showMaster = showFarmers || showRetailers || showVehicles
  const showReports = canRead("reports")
  const showBilling = canRead("billing")
  const showUsers = canRead("users")
  const showSettings = canRead("settings") || isAdmin

  const isGodownActive = pathname.startsWith("/godown") || pathname.startsWith("/inventory") || pathname.startsWith("/bird-returns");
  const isPurchasesActive = pathname.startsWith("/purchases");
  const isSalesActive = pathname.startsWith("/sales");
  const isMasterActive = pathname.startsWith("/farmers") || pathname.startsWith("/retailers") || pathname.startsWith("/vehicles");
  const isBillingActive = pathname.startsWith("/billing");
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <div className="flex h-screen bg-background">
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <aside
        className={[
          "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
          "fixed inset-y-0 left-0 z-40 w-64",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:inset-auto md:translate-x-0",
          sidebarOpen ? "md:w-64" : "md:w-20",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {sidebarOpen && <h1 className="truncate text-xl font-bold text-sidebar-foreground">🐔 Poultry Sathi</h1>}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0 text-sidebar-foreground">
            {isMobile ? (mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />) : <Menu size={20} />}
          </Button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {canRead("dashboard") && (
            <SidebarLink href="/dashboard" icon={Home} label="Dashboard" open={sidebarOpen} />
          )}

          {showGodown && (
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={`w-full justify-start ${isGodownActive ? "bg-[#6EE7B7] text-[#1F2937] hover:bg-[#5BC9A0]" : "text-sidebar-foreground hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground"}`} onClick={() => setGodownOpen(!godownOpen)}>
                    <Package size={20} />
                    {sidebarOpen && (<><span className="ml-2 flex-1 text-left">Godown</span><ChevronDown size={16} className={`transition-transform ${godownOpen ? "rotate-180" : ""}`} /></>)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-foreground text-background">Godown</TooltipContent>
              </Tooltip>
              {godownOpen && sidebarOpen && (
                <div className="ml-4 space-y-1 border-l border-sidebar-border">
                  <SidebarLink href="/inventory" icon={PackageOpen} label="Godown Overview" open={true} isSubItem={true} />
                  <SidebarLink href="/godown/stock-ledger" icon={BookOpen} label="Stock Ledger" open={true} isSubItem={true} />
                  <SidebarLink href="/godown/inward-entry" icon={PackagePlus} label="Godown Inward Entry" open={true} isSubItem={true} />
                  <SidebarLink href="/godown/sale" icon={PackageCheck} label="Godown Sale" open={true} isSubItem={true} />
                  <SidebarLink href="/bird-returns" icon={TrendingDown} label="Godown Bird Returns" open={true} isSubItem={true} />
                </div>
              )}
            </div>
          )}

          {showPurchases && (
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={`w-full justify-start ${isPurchasesActive ? "bg-[#6EE7B7] text-[#1F2937] hover:bg-[#5BC9A0]" : "text-sidebar-foreground hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground"}`} onClick={() => setPurchasesOpen(!purchasesOpen)}>
                    <ShoppingCart size={20} />
                    {sidebarOpen && (<><span className="ml-2 flex-1 text-left">Purchases</span><ChevronDown size={16} className={`transition-transform ${purchasesOpen ? "rotate-180" : ""}`} /></>)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-foreground text-background">Purchases</TooltipContent>
              </Tooltip>
              {purchasesOpen && sidebarOpen && (
                <div className="ml-4 space-y-1 border-l border-sidebar-border">
                  <SidebarLink href="/purchases" icon={ShoppingCart} label="Purchases Overview" open={true} isSubItem={true} />
                  <SidebarLink href="/purchases/payment-out/voucher" icon={TrendingDown} label="Payment Out Voucher" open={true} isSubItem={true} />
                </div>
              )}
            </div>
          )}

          {showSales && (
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={`w-full justify-start ${isSalesActive ? "bg-[#6EE7B7] text-[#1F2937] hover:bg-[#5BC9A0]" : "text-sidebar-foreground hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground"}`} onClick={() => setSalesOpen(!salesOpen)}>
                    <TrendingUp size={20} />
                    {sidebarOpen && (<><span className="ml-2 flex-1 text-left">Sales</span><ChevronDown size={16} className={`transition-transform ${salesOpen ? "rotate-180" : ""}`} /></>)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-foreground text-background">Sales</TooltipContent>
              </Tooltip>
              {salesOpen && sidebarOpen && (
                <div className="ml-4 space-y-1 border-l border-sidebar-border">
                  <SidebarLink href="/sales" icon={TrendingUp} label="Sales Overview" open={true} isSubItem={true} />
                  <SidebarLink href="/sales/payment-in/voucher" icon={CreditCard} label="Payment In Voucher" open={true} isSubItem={true} />
                  <SidebarLink href="/sales/bird-returns" icon={TrendingDown} label="Vehicle Bird Returns" open={true} isSubItem={true} />
                </div>
              )}
            </div>
          )}

          {showMortality && (
            <SidebarLink href="/mortality" icon={AlertCircle} label="Mortality" open={sidebarOpen} />
          )}

          {showExpenses && (
            <SidebarLink href="/expenses" icon={BarChart3} label="Expenses" open={sidebarOpen} />
          )}

          {showMaster && (
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={`w-full justify-start ${isMasterActive ? "bg-[#6EE7B7] text-[#1F2937] hover:bg-[#5BC9A0]" : "text-sidebar-foreground hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground"}`} onClick={() => setMasterEntriesOpen(!masterEntriesOpen)}>
                    <Users2 size={20} />
                    {sidebarOpen && (<><span className="ml-2 flex-1 text-left">Master Entries</span><ChevronDown size={16} className={`transition-transform ${masterEntriesOpen ? "rotate-180" : ""}`} /></>)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-foreground text-background">Master Entries</TooltipContent>
              </Tooltip>
              {masterEntriesOpen && sidebarOpen && (
                <div className="ml-4 space-y-1 border-l border-sidebar-border">
                  {showFarmers && <SidebarLink href="/farmers" icon={Tractor} label="Farmers" open={true} isSubItem={true} />}
                  {showRetailers && <SidebarLink href="/retailers" icon={Users} label="Retailers" open={true} isSubItem={true} />}
                  {showVehicles && <SidebarLink href="/vehicles" icon={Truck} label="Vehicles" open={true} isSubItem={true} />}
                </div>
              )}
            </div>
          )}

          {showReports && (
            <>
              <SidebarLink href="/reports" icon={ChartNoAxesCombined} label="Reports" open={sidebarOpen} />
            </>
          )}

          {showBilling && (
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={`w-full justify-start ${isBillingActive ? "bg-[#6EE7B7] text-[#1F2937] hover:bg-[#5BC9A0]" : "text-sidebar-foreground hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground"}`} onClick={() => setBillingOpen(!billingOpen)}>
                    <Scale size={20} />
                    {sidebarOpen && (<><span className="ml-2 flex-1 text-left">Accounting</span><ChevronDown size={16} className={`transition-transform ${billingOpen ? "rotate-180" : ""}`} /></>)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-foreground text-background">Accounting</TooltipContent>
              </Tooltip>
              {billingOpen && sidebarOpen && (
                <div className="ml-4 space-y-1 border-l border-sidebar-border">
                  <SidebarLink href="/billing/balance-sheet" icon={Scale} label="Balance Sheet" open={true} isSubItem={true} />
                  <SidebarLink href="/billing/ledger/farms" icon={Tractor} label="Ledger Farms" open={true} isSubItem={true} />
                  <SidebarLink href="/billing/ledger/retailers" icon={Users} label="Ledger Retailers" open={true} isSubItem={true} />
                  <SidebarLink href="/billing/ledger/company-report" icon={BookOpen} label="Company Report" open={true} isSubItem={true} />
                  <SidebarLink href="/billing/reports/outstanding" icon={TrendingDown} label="Receivable" open={true} isSubItem={true} />
                  <SidebarLink href="/billing/reports/collection" icon={CreditCard} label="Collection Report" open={true} isSubItem={true} />
                  <SidebarLink href="/billing/reports/pending-purchases" icon={ShoppingCart} label="Payable" open={true} isSubItem={true} />
                </div>
              )}
            </div>
          )}

          {showUsers && (
            <SidebarLink href="/users" icon={User} label="Users" open={sidebarOpen} />
          )}

          {showSettings && (
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className={`w-full justify-start ${isSettingsActive ? "bg-[#6EE7B7] text-[#1F2937] hover:bg-[#5BC9A0]" : "text-sidebar-foreground hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground"}`} onClick={() => setSettingsOpen(!settingsOpen)}>
                    <Settings size={20} />
                    {sidebarOpen && (<><span className="ml-2 flex-1 text-left">Settings</span><ChevronDown size={16} className={`transition-transform ${settingsOpen ? "rotate-180" : ""}`} /></>)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-foreground text-background">Settings</TooltipContent>
              </Tooltip>
              {settingsOpen && sidebarOpen && (
                <div className="ml-4 space-y-1 border-l border-sidebar-border">
                  <SidebarLink href="/settings/general" icon={Building2} label="General" open={true} isSubItem={true} />
                  <SidebarLink href="/settings/communication" icon={MessageSquare} label="Communication Hub" open={true} isSubItem={true} />
                  <SidebarLink href="/settings/display" icon={Palette} label="Appearance" open={true} isSubItem={true} />
                  <SidebarLink href="/settings/notifications" icon={Bell} label="Notifications" open={true} isSubItem={true} />
                  <SidebarLink href="/settings/security" icon={Lock} label="Security" open={true} isSubItem={true} />
                  <SidebarLink href="/settings/permissions" icon={ShieldCheck} label="Permissions" open={true} isSubItem={true} />
                  <SidebarLink href="/settings/categories" icon={Tag} label="Expense Categories" open={true} isSubItem={true} />
                  <SidebarLink href="/settings/developer" icon={Terminal} label="Developer" open={true} isSubItem={true} />
                </div>
              )}
            </div>
          )}

          {IS_STAGING && (
            <SidebarLink href="/api-docs" icon={Terminal} label="API Docs" open={sidebarOpen} />
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground" onClick={handleLogout}>
                <LogOut size={20} />
                {sidebarOpen && <span className="ml-2">Logout</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-background">Logout</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <div
        className="flex-1 flex flex-col overflow-hidden"
        onClick={() => {
          if (isMobile && mobileSidebarOpen) setMobileSidebarOpen(false)
        }}
      >
        <header className="relative flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">Welcome, {user.name}</h2>
          </div>

          {IS_STAGING && (
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
              <div className="flex items-center gap-2 bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md tracking-wide">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
                STAGING ENVIRONMENT
              </div>
              {isDevMode && (
                <div className="flex items-center gap-1 bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                  <Terminal size={10} />
                  DEV MODE
                </div>
              )}
            </div>
          )}

          <div className="flex min-w-0 items-center gap-4">
            <div className="max-w-28 truncate text-xs text-muted-foreground sm:max-w-none sm:text-sm">Role: {user.role}</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="container mx-auto p-4 sm:p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {IS_STAGING && isDevMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full px-4" onClick={() => setShowDevPanel(v => !v)}>
            <Terminal size={14} className="mr-1" />
            {showDevPanel ? "Hide" : "API Logs"} {logs.length > 0 && `(${logs.length})`}
          </Button>
          {showDevPanel && (
            <div className="absolute bottom-10 right-0 w-[calc(100vw-2rem)] sm:w-[600px] max-h-[70vh] bg-gray-950 text-green-400 rounded-xl shadow-2xl border border-purple-700 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-purple-700">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                  <Terminal size={12} /> DEV MODE — API Request Log
                </span>
                <div className="flex gap-2">
                  <button onClick={clearLogs} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1">
                    <Trash2 size={10} /> Clear
                  </button>
                  <button onClick={() => setShowDevPanel(false)} className="text-gray-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {logs.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">No requests yet.</p>
                ) : logs.map(log => (
                  <div key={log.id} className="bg-gray-900 rounded-lg p-3 text-xs border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${log.method === 'GET' ? 'bg-blue-900 text-blue-300' :
                          log.method === 'POST' ? 'bg-green-900 text-green-300' :
                            log.method === 'PATCH' ? 'bg-yellow-900 text-yellow-300' :
                              'bg-red-900 text-red-300'
                          }`}>{log.method}</span>
                        <span className="text-gray-300 truncate max-w-[300px]">{log.url.replace(/.*\/api\/v1/, '/api/v1')}</span>
                        <span className={`text-xs ${log.status && log.status < 400 ? 'text-green-400' : 'text-red-400'}`}>
                          {log.status} {log.duration}ms
                        </span>
                      </div>
                      <span className="text-gray-600">{log.timestamp}</span>
                    </div>
                    <div className="relative">
                      <pre className="text-green-300 text-xs overflow-x-auto bg-black rounded p-2 font-mono">{log.curl}</pre>
                      <button onClick={() => navigator.clipboard.writeText(log.curl)} className="absolute top-1 right-1 text-gray-500 hover:text-white p-1 rounded">
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SidebarLink({ href, icon: Icon, label, open, isSubItem = false, target }: {
  href: string; icon: React.ComponentType<{ size: number }>; label: string; open: boolean; isSubItem?: boolean; target?: string
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname === href + "/";
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const buttonContent = (
    <Button variant="ghost" className={`w-full justify-start ${isActive ? "bg-[#6EE7B7] text-[#1F2937] hover:bg-[#5BC9A0]" : "text-sidebar-foreground hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground"} ${isSubItem ? "pl-8 text-sm" : ""}`}>
      <Icon size={20} />
      {open && <span className="ml-2">{label}</span>}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {isExternal || target ? (
          <a href={href} target={target || "_blank"} rel="noopener noreferrer" className="block">
            {buttonContent}
          </a>
        ) : (
          <Link href={href} className="block">
            {buttonContent}
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-foreground text-background">{label}</TooltipContent>
    </Tooltip>
  )
}