"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Users, Truck, Package, AlertCircle, ArrowUpRight, ArrowDownRight,
  Bird, BarChart3, Tractor, Wallet, IndianRupee, Calendar,
} from "lucide-react"
import { farmersApi, retailersApi, vehiclesApi, purchasesApi, salesApi, mortalityApi } from "@/lib/api"
import { getApiBaseUrl } from "@/lib/api-base-url"

const EXPENSE_COLORS: Record<string, string> = {
  feed: "#10b981", labor: "#6366f1", medicine: "#f59e0b",
  utilities: "#3b82f6", equipment: "#8b5cf6", maintenance: "#ec4899",
  transportation: "#14b8a6", other: "#94a3b8",
}
const CHART_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"]

function StatCard({
  title, value, sub, icon: Icon, color = "text-foreground", trend, chipClass = "bg-primary/10 text-primary",
}: {
  title: string; value: string | number; sub?: string
  icon: React.ElementType; color?: string; trend?: "up" | "down" | null; chipClass?: string
}) {
  return (
    <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5">
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${chipClass}`}>
          <Icon size={18} />
        </span>
      </CardHeader>
      <CardContent>
        <div className={`text-xl sm:text-2xl font-bold tracking-tight ${color}`}>{value}</div>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
            {trend === "up" && <ArrowUpRight size={12} className="text-green-500" />}
            {trend === "down" && <ArrowDownRight size={12} className="text-red-500" />}
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Date range filter
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)

  // Live counts
  const [farmerCount, setFarmerCount] = useState(0)
  const [retailerCount, setRetailerCount] = useState(0)
  const [vehicleCount, setVehicleCount] = useState(0)

  // Dashboard API data
  const [kpis, setKpis] = useState<any>(null)
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [recentPurchases, setRecentPurchases] = useState<any[]>([])
  const [purchasesSummary, setPurchasesSummary] = useState<any>(null)
  const [mortalityStats, setMortalityStats] = useState<any>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const authFetch = (url: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())

  const loadDashboard = async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true)

      const API_BASE = getApiBaseUrl()

      // Build date query params (fix timezone issue)
      const dateParams = new URLSearchParams()
      if (startDate) {
        // Format date in local timezone to avoid UTC conversion issues
        const year = startDate.getFullYear()
        const month = String(startDate.getMonth() + 1).padStart(2, '0')
        const day = String(startDate.getDate()).padStart(2, '0')
        dateParams.set("startDate", `${year}-${month}-${day}`)
      }
      if (endDate) {
        const year = endDate.getFullYear()
        const month = String(endDate.getMonth() + 1).padStart(2, '0')
        const day = String(endDate.getDate()).padStart(2, '0')
        dateParams.set("endDate", `${year}-${month}-${day}`)
      }
      const dateQuery = dateParams.toString() ? `?${dateParams.toString()}` : ""

      const [
        dashboardResult,
        farmersResult,
        retailersResult,
        vehiclesResult,
        salesResult,
        purchasesResult,
        mortalityResult,
      ] = await Promise.allSettled([
        authFetch(`${API_BASE}/dashboard/comprehensive${dateQuery}`),
        farmersApi.getAll(),
        retailersApi.getAll(),
        vehiclesApi.getActive(),
        salesApi.getAll(),
        purchasesApi.getAll(),
        mortalityApi.getStats(
          startDate
            ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`
            : undefined,
          endDate
            ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`
            : undefined,
        ),
      ])

      const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null
      const farmers = farmersResult.status === 'fulfilled' ? farmersResult.value : []
      const retailers = retailersResult.status === 'fulfilled' ? retailersResult.value : []
      const vehicles = vehiclesResult.status === 'fulfilled' ? vehiclesResult.value : []
      const sales = salesResult.status === 'fulfilled' ? salesResult.value : []
      const purchases = purchasesResult.status === 'fulfilled' ? purchasesResult.value : []
      const mortality = mortalityResult.status === 'fulfilled' ? mortalityResult.value : null

      if (dashboard) {
        setKpis(dashboard.kpis)
        setMonthlyTrends(dashboard.monthlyTrends || [])
        setExpensesByCategory(dashboard.expensesByCategory || [])
        setPurchasesSummary(dashboard.purchasesSummary)
      }

      // Recent 5 sales
      const salesArr = (sales as any).data || sales
      const sortedSales = [...(Array.isArray(salesArr) ? salesArr : [])].sort(
        (a, b) => new Date(b.saleDate || b.createdAt).getTime() - new Date(a.saleDate || a.createdAt).getTime()
      )
      setRecentSales(sortedSales.slice(0, 5))

      // Recent 5 purchases
      const purchasesArr = (purchases as any).data || purchases
      const sortedPurchases = [...(Array.isArray(purchasesArr) ? purchasesArr : [])].sort(
        (a, b) => new Date(b.orderDate || b.createdAt).getTime() - new Date(a.orderDate || a.createdAt).getTime()
      )
      setRecentPurchases(sortedPurchases.slice(0, 5))

      const farmersArr = (farmers as any).data || farmers
      const retailersArr = (retailers as any).data || retailers
      const vehiclesArr = (vehicles as any).data || vehicles

      setFarmerCount(Array.isArray(farmersArr) ? farmersArr.length : 0)
      setRetailerCount(Array.isArray(retailersArr) ? retailersArr.length : 0)
      // Prefer backend KPI count (full active fleet); fall back to active list length
      const kpiVehicles = dashboard?.kpis?.totalVehicles
      setVehicleCount(
        typeof kpiVehicles === "number"
          ? kpiVehicles
          : Array.isArray(vehiclesArr)
            ? vehiclesArr.length
            : 0,
      )
      setMortalityStats(mortality)
    } catch (e) {
      console.error("Dashboard load error:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadDashboard()

    // Check if welcome changelog was dismissed
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("aziz_changelog_v1_dismissed")
      if (!dismissed) {
        setShowWelcomeModal(true)
      }
    }
  }, [])

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
    loadDashboard(start, end)
  }

  const netPL = kpis ? kpis.totalRevenue - kpis.totalExpenses : 0
  const isProfit = netPL >= 0

  const chartTrends = useMemo(() =>
    monthlyTrends.map((m: any) => ({
      month: m.month?.split(" ")[0] ?? m.month,
      Sale: Math.round(m.revenue || 0),
      Expense: Math.round(m.expenses || 0),
      Profit: Math.round(m.profit || 0),
    })), [monthlyTrends])

  const expensePieData = useMemo(() =>
    expensesByCategory.map((e: any) => ({
      name: e.category,
      value: Math.round(parseFloat(e.amount) || 0),
    })).filter((e) => e.value > 0),
    [expensesByCategory])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Live overview of your poultry farm</p>
          </div>
        </div>

        {/* Date Range Filter */}
        {/* Date Range Filter */}
<div className="print:hidden w-full">
  <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
    <div>
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
        <Calendar size={12} /> From
      </label>

      <Input
        type="date"
        className="rounded-full w-full sm:w-[160px] h-10"
        value={
          dateRangeStart
            ? `${dateRangeStart.getFullYear()}-${String(dateRangeStart.getMonth() + 1).padStart(2, "0")}-${String(dateRangeStart.getDate()).padStart(2, "0")}`
            : ""
        }
        onChange={(e) => {
          const v = e.target.value

          if (v) {
            const [y, m, d] = v.split("-").map(Number)
            const d2 = new Date(y, m - 1, d)

            setDateRangeStart(d2)
            handleDateRangeChange(d2, dateRangeEnd)
          } else {
            setDateRangeStart(undefined)
            handleDateRangeChange(undefined, dateRangeEnd)
          }
        }}
      />
    </div>

    <div>
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
        <Calendar size={12} /> To
      </label>

      <Input
        type="date"
        className="rounded-full w-full sm:w-[160px] h-10"
        value={
          dateRangeEnd
            ? `${dateRangeEnd.getFullYear()}-${String(dateRangeEnd.getMonth() + 1).padStart(2, "0")}-${String(dateRangeEnd.getDate()).padStart(2, "0")}`
            : ""
        }
        onChange={(e) => {
          const v = e.target.value

          if (v) {
            const [y, m, d] = v.split("-").map(Number)
            const d2 = new Date(y, m - 1, d)

            setDateRangeEnd(d2)
            handleDateRangeChange(dateRangeStart, d2)
          } else {
            setDateRangeEnd(undefined)
            handleDateRangeChange(dateRangeStart, undefined)
          }
        }}
      />
    </div>

    {dateRangeStart && dateRangeEnd && (
      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        {dateRangeStart.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        })}{" "}
        –{" "}
        {dateRangeEnd.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    )}

    {!dateRangeStart && (
      <span className="h-10 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground flex items-center justify-center">
        Showing: This Month
      </span>
    )}
  </div>
</div>

        {/* Row 1 - Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sales (This Month)"
            value={loading ? "..." : `₹${Number(kpis?.totalRevenue || 0).toLocaleString()}`}
            sub={`${kpis?.totalSales || 0} transactions`}
            icon={Wallet}
            color="text-green-600"
            trend="up"
            chipClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          />
          <StatCard
            title="Total Purchases (This Month)"
            value={loading ? "..." : `₹${Number(purchasesSummary?.totalValue || 0).toLocaleString()}`}
            sub={`${purchasesSummary?.totalOrders || 0} orders`}
            icon={ShoppingCart}
            color="text-red-600"
            chipClass="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
          />
          <StatCard
            title="Total Expenses (This Month)"
            value={loading ? "..." : `₹${Number(kpis?.totalExpenses || 0).toLocaleString()}`}
            sub="All categories"
            icon={IndianRupee}
            color="text-yellow-600"
            chipClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          />
          <StatCard
            title="Net Profit / Loss"
            value={loading ? "..." : `₹${Math.abs(netPL).toLocaleString()}`}
            sub={isProfit ? "Profit this month" : "Loss this month"}
            icon={isProfit ? TrendingUp : TrendingDown}
            color={isProfit ? "text-green-600" : "text-red-600"}
            trend={isProfit ? "up" : "down"}
            chipClass={isProfit
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"}
          />
        </div>

        {/* Row 2 - Master Data Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Farmers"
            value={loading ? "..." : farmerCount}
            sub="Registered"
            icon={Tractor}
            chipClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          />
          <StatCard
            title="Retailers"
            value={loading ? "..." : retailerCount}
            sub="Registered"
            icon={Users}
            chipClass="bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
          />
          <StatCard
            title="Active Vehicles"
            value={loading ? "..." : vehicleCount}
            sub="Active"
            icon={Truck}
            chipClass="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
          />
          <StatCard
            title="Birds Sold"
            value={loading ? "..." : (kpis?.totalBirdsSold || 0).toLocaleString()}
            sub="Total birds this month"
            icon={Bird}
            color="text-blue-600"
            chipClass="bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400"
          />
          <StatCard
            title="Birds Mortality"
            value={loading ? "..." : (Number(mortalityStats?.totalBirdsDeath) || 0).toLocaleString()}
            sub={
              mortalityStats?.farmDeaths != null || mortalityStats?.godownDeaths != null
                ? `Farm ${Number(mortalityStats?.farmDeaths) || 0} · Godown ${Number(mortalityStats?.godownDeaths) || 0}`
                : "Total recorded deaths"
            }
            icon={AlertCircle}
            color="text-red-500"
            chipClass="bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400"
          />
        </div>

        {/* Row 3 - Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card className="min-w-0 rounded-2xl">
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Sales, Expenses & Profit over last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  Sale: { label: "Sales", color: "#10b981" },
                  Expense: { label: "Expenses", color: "#f59e0b" },
                  Profit: { label: "Profit", color: "#6366f1" },
                }}
                className="h-64 w-full min-w-0 overflow-hidden sm:h-72"
              >
                <LineChart
                  data={chartTrends}
                  margin={{ top: 10, right: 12, bottom: 4, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={12}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    width={44}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₹${(Number(v) / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Sale" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Expense" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Profit" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>By category this month</CardDescription>
            </CardHeader>
            <CardContent>
              {expensePieData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                  No expense data for this month
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-full sm:w-[55%] h-48 sm:h-72 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                          {expensePieData.map((entry, i) => (
                            <Cell key={entry.name} fill={EXPENSE_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 w-full sm:w-auto min-w-0">
                    {expensePieData.map((e, i) => (
                      <div key={e.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: EXPENSE_COLORS[e.name] || CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="capitalize">{e.name}</span>
                        </div>
                        <span className="font-medium">₹{e.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 4 - Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 pl-1">
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
    <TrendingUp size={18} />
  </span>

  <div>
    <CardTitle className="text-base font-semibold">Recent Sales</CardTitle>
    <CardDescription>Last 5 transactions</CardDescription>
  </div>
</div>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No sales yet</p>
              ) : (
                <div className="space-y-1.5">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="group flex items-center gap-3 rounded-xl border-b border-border/60 px-2 py-2.5 transition-colors last:border-0 last:pb-1 hover:bg-emerald-50/60 dark:hover:bg-emerald-500/5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <TrendingUp size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{sale.customerName || sale.invoiceNumber}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sale.saleDate?.split("T")[0]} · {sale.productType}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">₹{Number(sale.totalAmount || 0).toLocaleString()}</p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          sale.paymentStatus === "paid" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
                          sale.paymentStatus === "partial" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400" :
                          "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                        }`}>{sale.paymentStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Purchases */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <span className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
  <Package size={18} />
</span>
                <div>
                  <CardTitle className="text-base font-semibold">Recent Purchases</CardTitle>
                  <CardDescription>Last 5 purchase orders</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recentPurchases.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No purchases yet</p>
              ) : (
                <div className="space-y-1.5">
                  {recentPurchases.map((po) => (
                    <div
                      key={po.id}
                      className="group flex items-center gap-3 rounded-xl border-b border-border/60 px-2 py-2.5 transition-colors last:border-0 last:pb-1 hover:bg-red-50/60 dark:hover:bg-red-500/5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                        <Package size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{po.supplierName || po.orderNumber}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{po.orderDate?.split("T")[0]} · {po.orderNumber}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">₹{Number(po.totalAmount || 0).toLocaleString()}</p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          po.status === "received" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
                          po.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" :
                          "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400"
                        }`}>{po.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 5 - Monthly Summary */}

      </div>

      {/* Poultry Sathi v2.0 Changelog & Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto flex flex-col p-6 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-200/50 dark:border-slate-800/50">
          <DialogHeader className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center p-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                🚀
              </span>
              <DialogTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 via-emerald-600 to-indigo-600 bg-clip-text text-transparent">
                Poultry Sathi v2.0 Released!
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 pt-1">
              Welcome to the new poultry management dashboard. We have rolled out premium updates to streamline your farm operations and quarantine safety:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 flex-1">
            {/* Feature 1 */}
            <div className="flex gap-4 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="flex items-center justify-center p-2.5 h-11 w-11 rounded-lg bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 shrink-0">
                <Truck size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Vehicle Bird Returns & Tracking
                </h4>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Manage returns arising from vehicle sales, auto-credit retailer ledger balances directly on returns, and route healthy stock back to Godown inventory.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="flex items-center justify-center p-2.5 h-11 w-11 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Users size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Dynamic Custom Roles
                </h4>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Create fully customized roles in Settings permissions and assign them to your staff inside User Management. User creation forms now support dynamic roles.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="flex items-center justify-center p-2.5 h-11 w-11 rounded-lg bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Quarantine Warning Badges
                </h4>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Sick bird returns and Isolation Pen restocks are automatically highlighted in amber warnings. Quarantine badges are tagged in Godown Inward entries instantly.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => {
                localStorage.setItem("aziz_changelog_v1_dismissed", "true")
                setShowWelcomeModal(false)
              }}
              className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              Awesome, let's go!
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
