"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
  ChevronDown,
  Users2,
  Calculator,
  Truck,
  AlertCircle,
} from "lucide-react"

interface User {
  email: string
  role: string
  name?: string
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [masterEntriesOpen, setMasterEntriesOpen] = useState(false)
  const [godownOpen, setGodownOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    
    // Check if user is locked
    const usersData = localStorage.getItem("users")
    if (usersData) {
      const users = JSON.parse(usersData)
      const currentUserData = JSON.parse(userData)
      const user = users.find((u: any) => u.email.toLowerCase() === currentUserData.email.toLowerCase())
      
      if (user && user.locked) {
        localStorage.removeItem("user")
        alert("Your account has been locked. You have been logged out.")
        router.push("/")
        return
      }
    }
    
    setUser(JSON.parse(userData))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold text-sidebar-foreground">🐔 Aziz Poultry</h1>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-sidebar-foreground"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <SidebarLink href="/dashboard" icon={Home} label="Dashboard" open={sidebarOpen} />
          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => setGodownOpen(!godownOpen)}
                >
                  <Package size={20} />
                  {sidebarOpen && (
                    <>
                      <span className="ml-2 flex-1 text-left">Godown</span>
                      <ChevronDown size={16} className={`transition-transform ${godownOpen ? "rotate-180" : ""}`} />
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-foreground text-background">
                Godown
              </TooltipContent>
            </Tooltip>
            {godownOpen && sidebarOpen && (
              <div className="ml-4 space-y-1 border-l border-sidebar-border">
                <SidebarLink href="/inventory" icon={Package} label="Godown Overview" open={true} isSubItem={true} />
                <SidebarLink href="/godown/inward-entry" icon={Package} label="Godown Inward Entry" open={true} isSubItem={true} />
                <SidebarLink href="/godown/sale" icon={Package} label="Godown Sale" open={true} isSubItem={true} />
                <SidebarLink href="/godown/mortality" icon={Package} label="Godown Mortality" open={true} isSubItem={true} />
                <SidebarLink href="/godown/expense" icon={Package} label="Godown Expense" open={true} isSubItem={true} />
              </div>
            )}
          </div>
          <SidebarLink href="/purchases" icon={ShoppingCart} label="Purchases" open={sidebarOpen} />
          <SidebarLink href="/sales" icon={TrendingUp} label="Sales" open={sidebarOpen} />
          <SidebarLink href="/mortality" icon={AlertCircle} label="Mortality" open={sidebarOpen} />
          <SidebarLink href="/expenses" icon={BarChart3} label="Expenses" open={sidebarOpen} />
          <SidebarLink href="/reports" icon={BarChart3} label="Reports" open={sidebarOpen} />
          <SidebarLink href="/financial-analytics" icon={Calculator} label="Financial Analytics" open={sidebarOpen} />

          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => setMasterEntriesOpen(!masterEntriesOpen)}
                >
                  <Users2 size={20} />
                  {sidebarOpen && (
                    <>
                      <span className="ml-2 flex-1 text-left">Master Entries</span>
                      <ChevronDown size={16} className={`transition-transform ${masterEntriesOpen ? "rotate-180" : ""}`} />
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-foreground text-background">
                Master Entries
              </TooltipContent>
            </Tooltip>

            {masterEntriesOpen && sidebarOpen && (
              <div className="ml-4 space-y-1 border-l border-sidebar-border">
                <SidebarLink href="/farmers" icon={Users} label="Farmers" open={true} isSubItem={true} />
                <SidebarLink href="/retailers" icon={Users} label="Retailers" open={true} isSubItem={true} />
                <SidebarLink href="/vehicles" icon={Truck} label="Vehicles" open={true} isSubItem={true} />
              </div>
            )}
          </div>

          <SidebarLink href="/users" icon={Users} label="Users" open={sidebarOpen} />
          <SidebarLink href="/settings" icon={Settings} label="Settings" open={sidebarOpen} />
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={handleLogout}
              >
                <LogOut size={20} />
                {sidebarOpen && <span className="ml-2">Logout</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-background">
              Logout
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center relative">
          <h2 className="text-sm text-muted-foreground">Welcome, {user.email}</h2>
          {/* Staging banner - always visible on staging branch */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md tracking-wide">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
            STAGING ENVIRONMENT
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Role: {user.role}</div>
          </div>
        </header>

        {/* Page content */}
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
    </div>
  )
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  open,
  isSubItem = false,
}: {
  href: string
  icon: React.ComponentType<{ size: number }>
  label: string
  open: boolean
  isSubItem?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={href} className="block">
          <Button
            variant="ghost"
            className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent ${isSubItem ? "pl-8 text-sm" : ""}`}
          >
            <Icon size={20} />
            {open && <span className="ml-2">{label}</span>}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-foreground text-background">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

