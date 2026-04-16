"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Users, Truck, Package, AlertCircle, ArrowUpRight, ArrowDownRight,
  Bird, BarChart3, Tractor, Wallet, IndianRupee,
} from "lucide-react"
import { farmersApi, retailersApi, vehiclesApi, purchasesApi, salesApi, mortalityApi } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://chickenbackend.onrender.com/api/v1"

const EXPENSE_COLORS: Record<string, string> = {
  feed: "#10b981", labor: "#6366f1", medicine: "#f59e0b",
  utilities: "#3b82f6", equipment: "#8b5cf6", maintenance: "#ec4899",
  transportation: "#14b8a6", other: "#94a3b8",
}
const CHART_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"]

function StatCard({
  title, value, sub, icon: Icon, color = "text-foreground", trend,
}: {
  title: string; value: string | number; sub?: string
  icon: React.ElementType; color?: string; trend?: "up" | "down" | null
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon size={18} className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      try {
        setLoading(true)
        const [
          dashboard,
          farmers,
          retailers,
          vehicles,
          sales,
          purchases,
          mortality,
        ] = await Promise.all([
          authFetch(`${API_BASE}/dashboard/comprehensive`),
          farmersApi.getAll(),
          retailersApi.getAll(),
          vehiclesApi.getAll(),
          salesApi.getAll(),
          purchasesApi.getAll(),
          mortalityApi.getStats(),
        ])

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
        setVehicleCount(Array.isArray(vehiclesArr) ? vehiclesArr.filter((v: any) => v.status === "active").length : 0)
        setMortalityStats(mortality)
      } catch (e) {
        console.error("Dashboard load error:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Live overview of your poultry farm</p>
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
          />
          <StatCard
            title="Total Purchases (This Month)"
            value={loading ? "..." : `₹${Number(purchasesSummary?.totalValue || 0).toLocaleString()}`}
            sub={`${purchasesSummary?.totalOrders || 0} orders`}
            icon={ShoppingCart}
            color="text-red-600"
          />
          <StatCard
            title="Total Expenses (This Month)"
            value={loading ? "..." : `₹${Number(kpis?.totalExpenses || 0).toLocaleString()}`}
            sub="All categories"
            icon={IndianRupee}
            color="text-yellow-600"
          />
          <StatCard
            title="Net Profit / Loss"
            value={loading ? "..." : `₹${Math.abs(netPL).toLocaleString()}`}
            sub={isProfit ? "Profit this month" : "Loss this month"}
            icon={isProfit ? TrendingUp : TrendingDown}
            color={isProfit ? "text-green-600" : "text-red-600"}
            trend={isProfit ? "up" : "down"}
          />
        </div>

        {/* Row 2 - Master Data Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Farmers" value={loading ? "..." : farmerCount} sub="Registered" icon={Tractor} />
          <StatCard title="Retailers" value={loading ? "..." : retailerCount} sub="Registered" icon={Users} />
          <StatCard title="Active Vehicles" value={loading ? "..." : vehicleCount} sub="On fleet" icon={Truck} />
          <StatCard
            title="Birds Mortality"
            value={loading ? "..." : (mortalityStats?.totalBirdsDeath || 0).toLocaleString()}
            sub="Total recorded deaths"
            icon={AlertCircle}
            color="text-red-500"
          />
        </div>

        {/* Row 3 - Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card>
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
                className="h-72"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `₹${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="Sale" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Expense" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Profit" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card>
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
                <div className="flex gap-4 items-center h-72">
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false}>
                        {expensePieData.map((entry, i) => (
                          <Cell key={entry.name} fill={EXPENSE_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Last 5 transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No sales yet</p>
              ) : (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{sale.customerName || sale.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{sale.saleDate?.split("T")[0]} · {sale.productType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">₹{Number(sale.totalAmount || 0).toLocaleString()}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          sale.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                          sale.paymentStatus === "partial" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>{sale.paymentStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Purchases */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
              <CardDescription>Last 5 purchase orders</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPurchases.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No purchases yet</p>
              ) : (
                <div className="space-y-3">
                  {recentPurchases.map((po) => (
                    <div key={po.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{po.supplierName || po.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{po.orderDate?.split("T")[0]} · {po.orderNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">₹{Number(po.totalAmount || 0).toLocaleString()}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          po.status === "received" ? "bg-green-100 text-green-700" :
                          po.status === "cancelled" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
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
    </DashboardLayout>
  )
}
