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
import {
  BarChart3, Users, Package, ShoppingCart, TrendingUp,
  LogOut, Menu, X, Home, Settings, ChevronDown, Users2,
  Calculator, Truck, AlertCircle, Terminal, Copy, Trash2,
  ChartNoAxesCombined, Tractor, User, PackageOpen, PackagePlus,
  PackageSearch, PackageX, PackageCheck, GitBranch,
} from "lucide-react"

// Staging-only features are controlled by this env var.
// Set NEXT_PUBLIC_IS_STAGING=true in Amplify staging environment.
// Prod environment does NOT set this — so banner/dev mode/API docs are hidden.
const IS_STAGING = process.env.NEXT_PUBLIC_IS_STAGING === 'true'

interface User {
  email: string
  role: string
  name?: string
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutInner>{children}</DashboardLayoutInner>
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [masterEntriesOpen, setMasterEntriesOpen] = useState(false)
  const [godownOpen, setGodownOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { isDevMode, logs, clearLogs, addLog } = useDevMode()
  const [showDevPanel, setShowDevPanel] = useState(false)

  useEffect(() => {
    setDevLogger(addLog)
    return () => setDevLogger(null)
  }, [addLog])

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

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-background">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold text-sidebar-foreground">🐔 Aziz Poultry</h1>}
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-sidebar-foreground">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <SidebarLink href="/dashboard" icon={Home} label="Dashboard" open={sidebarOpen} />

          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setGodownOpen(!godownOpen)}>
                  <Package size={20} />
                  {sidebarOpen && (<><span className="ml-2 flex-1 text-left">Godown</span><ChevronDown size={16} className={`transition-transform ${godownOpen ? "rotate-180" : ""}`} /></>)}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-foreground text-background">Godown</TooltipContent>
            </Tooltip>
            {godownOpen && sidebarOpen && (
              <div className="ml-4 space-y-1 border-l border-sidebar-border">
                <SidebarLink href="/inventory" icon={PackageOpen} label="Godown Overview" open={true} isSubItem={true} />
                <SidebarLink href="/godown/inward-entry" icon={PackagePlus} label="Godown Inward Entry" open={true} isSubItem={true} />
                <SidebarLink href="/godown/sale" icon={PackageCheck} label="Godown Sale" open={true} isSubItem={true} />
                <SidebarLink href="/godown/mortality" icon={PackageX} label="Godown Mortality" open={true} isSubItem={true} />
                <SidebarLink href="/godown/expense" icon={PackageSearch} label="Godown Expense" open={true} isSubItem={true} />
              </div>
            )}
          </div>

          <SidebarLink href="/purchases" icon={ShoppingCart} label="Purchases" open={sidebarOpen} />
          <SidebarLink href="/cage-tracking" icon={GitBranch} label="Cage Tracking" open={sidebarOpen} />
          <SidebarLink href="/sales" icon={TrendingUp} label="Sales" open={sidebarOpen} />
          <SidebarLink href="/mortality" icon={AlertCircle} label="Mortality" open={sidebarOpen} />
          <SidebarLink href="/expenses" icon={BarChart3} label="Expenses" open={sidebarOpen} />
          <SidebarLink href="/reports" icon={ChartNoAxesCombined} label="Reports" open={sidebarOpen} />
          <SidebarLink href="/financial-analytics" icon={Calculator} label="Financial Analytics" open={sidebarOpen} />

          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setMasterEntriesOpen(!masterEntriesOpen)}>
                  <Users2 size={20} />
                  {sidebarOpen && (<><span className="ml-2 flex-1 text-left">Master Entries</span><ChevronDown size={16} className={`transition-transform ${masterEntriesOpen ? "rotate-180" : ""}`} /></>)}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-foreground text-background">Master Entries</TooltipContent>
            </Tooltip>
            {masterEntriesOpen && sidebarOpen && (
              <div className="ml-4 space-y-1 border-l border-sidebar-border">
                <SidebarLink href="/farmers" icon={Tractor} label="Farmers" open={true} isSubItem={true} />
                <SidebarLink href="/retailers" icon={Users} label="Retailers" open={true} isSubItem={true} />
                <SidebarLink href="/vehicles" icon={Truck} label="Vehicles" open={true} isSubItem={true} />
              </div>
            )}
          </div>

          <SidebarLink href="/users" icon={User} label="Users" open={sidebarOpen} />
          <SidebarLink href="/settings" icon={Settings} label="Settings" open={sidebarOpen} />

          {/* API Docs — staging only */}
          {IS_STAGING && (
            <SidebarLink href="/api-docs" icon={Terminal} label="API Docs" open={sidebarOpen} />
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={handleLogout}>
                <LogOut size={20} />
                {sidebarOpen && <span className="ml-2">Logout</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-background">Logout</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center relative">
          <h2 className="text-sm text-muted-foreground">Welcome, {user.email}</h2>

          {/* Staging banner — only shown when NEXT_PUBLIC_IS_STAGING=true */}
          {IS_STAGING && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
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

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Role: {user.role}</div>
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
              className="container mx-auto p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Dev mode panel — staging only */}
      {IS_STAGING && isDevMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full px-4" onClick={() => setShowDevPanel(v => !v)}>
            <Terminal size={14} className="mr-1" />
            {showDevPanel ? "Hide" : "API Logs"} {logs.length > 0 && `(${logs.length})`}
          </Button>
          {showDevPanel && (
            <div className="absolute bottom-10 right-0 w-[600px] max-h-[70vh] bg-gray-950 text-green-400 rounded-xl shadow-2xl border border-purple-700 flex flex-col overflow-hidden">
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
                        <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                          log.method === 'GET' ? 'bg-blue-900 text-blue-300' :
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

function SidebarLink({ href, icon: Icon, label, open, isSubItem = false }: {
  href: string; icon: React.ComponentType<{ size: number }>; label: string; open: boolean; isSubItem?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={href} className="block">
          <Button variant="ghost" className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent ${isSubItem ? "pl-8 text-sm" : ""}`}>
            <Icon size={20} />
            {open && <span className="ml-2">{label}</span>}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-foreground text-background">{label}</TooltipContent>
    </Tooltip>
  )
}
