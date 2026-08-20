"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar, X, Wallet, Receipt, BadgeDollarSign, CircleDollarSign, Users, Truck } from "lucide-react"
import { format, startOfMonth, eachMonthOfInterval, parseISO, isWithinInterval, subMonths, startOfDay, endOfDay } from "date-fns"
import { salesApi, expensesApi, purchasesApi, godownApi } from "@/lib/api"

interface Sale {
  id: string
  invoiceNumber: string
  customer: string
  date: string
  productType: string
  quantity: number
  unitPrice: number
  totalAmount: number
  paymentStatus: string
  notes: string
}

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  notes: string
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplier: string
  date: string
  description: string
  birdQuantity: number
  cageQuantity: number
  unitCost: number
  totalValue: number
  status: string
  notes: string
  totalAmount?: number
}

export default function FinancialAnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([])
  const [godownSales, setGodownSales] = useState<Sale[]>([])
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
    
    const fetchData = async () => {
      try {
        const [salesResult, expensesResult, purchasesResult, godownResult] = await Promise.allSettled([
          salesApi.getAll(),
          expensesApi.getAll(),
          purchasesApi.getAll(),
          godownApi.sales.getAll(),
        ])

        if (salesResult.status === 'fulfilled') {
          const raw = salesResult.value as any
          const list = Array.isArray(raw) ? raw : (raw?.data || [])
          setSales(list.map((s: any) => {
            const qty = parseFloat(s.quantity || 0)
            const price = parseFloat(s.unitPrice || 0)
            const computed = qty * price
            const amount = parseFloat(s.netAmount || 0) || parseFloat(s.totalAmount || 0) || computed
            return {
              id: s.id,
              invoiceNumber: s.invoiceNumber || s.saleNo || '',
              customer: s.customerName || '',
              date: s.saleDate || s.createdAt || '',
              productType: s.productType || 'meat',
              quantity: qty,
              unitPrice: price,
              totalAmount: amount,
              paymentStatus: s.paymentStatus || 'pending',
              notes: s.notes || '',
            }
          }))
        }

        if (expensesResult.status === 'fulfilled') {
          const raw = expensesResult.value as any[]
          setExpenses(raw.map(e => ({
            id: e.id,
            date: e.expenseDate || e.date || e.createdAt || '',
            category: e.category || 'other',
            description: e.description || '',
            amount: parseFloat(e.amount || 0),
            paymentMethod: e.paymentMethod || '',
            notes: e.notes || '',
          })))
        }

        if (purchasesResult.status === 'fulfilled') {
          const raw = purchasesResult.value as any[]
          setPurchases(raw.map(p => ({
            id: p.id,
            orderNumber: p.orderNumber || '',
            supplier: p.supplierName || '',
            date: p.orderDate || p.createdAt || '',
            description: '',
            birdQuantity: 0,
            cageQuantity: 0,
            unitCost: parseFloat(p.ratePerKg || 0),
            totalValue: parseFloat(p.netAmount || p.totalAmount || 0),
            status: p.status || 'pending',
            notes: p.notes || '',
            totalAmount: parseFloat(p.netAmount || p.totalAmount || 0),
          })))
        }

        if (godownResult.status === 'fulfilled') {
          const raw = godownResult.value as any
          const list = Array.isArray(raw) ? raw : (raw?.data || [])
          setGodownSales(list.map((s: any) => ({
            id: s.id,
            invoiceNumber: s.saleNo || s.invoiceNumber || '',
            customer: (s as any).retailerName || s.customerName || '',
            date: s.saleDate || s.createdAt || '',
            productType: 'godown',
            quantity: parseFloat(s.numberOfBirds || 0),
            unitPrice: parseFloat(s.ratePerKg || 0),
            totalAmount: parseFloat(s.totalAmount || 0),
            paymentStatus: s.paymentStatus || 'pending',
            notes: s.notes || '',
          })))
        }
      } catch (error) {
        console.error("Error fetching financial data:", error)
      }
    }

    fetchData()
  }, [])

  // Apply date range filter to all data
  const filteredSales = useMemo(() => {
    if (!dateRangeStart || !dateRangeEnd) return sales
    const start = startOfDay(dateRangeStart)
    const end = endOfDay(dateRangeEnd)
    return sales.filter(s => {
      if (!s.date) return false
      try { const d = parseISO(s.date); return d >= start && d <= end } catch { return false }
    })
  }, [sales, dateRangeStart, dateRangeEnd])

  const filteredGodownSales = useMemo(() => {
    if (!dateRangeStart || !dateRangeEnd) return godownSales
    const start = startOfDay(dateRangeStart)
    const end = endOfDay(dateRangeEnd)
    return godownSales.filter(s => {
      if (!s.date) return false
      try { const d = parseISO(s.date); return d >= start && d <= end } catch { return false }
    })
  }, [godownSales, dateRangeStart, dateRangeEnd])

  const filteredExpenses = useMemo(() => {
    if (!dateRangeStart || !dateRangeEnd) return expenses
    const start = startOfDay(dateRangeStart)
    const end = endOfDay(dateRangeEnd)
    return expenses.filter(e => {
      if (!e.date) return false
      try { const d = parseISO(e.date); return d >= start && d <= end } catch { return false }
    })
  }, [expenses, dateRangeStart, dateRangeEnd])

  const filteredPurchases = useMemo(() => {
    if (!dateRangeStart || !dateRangeEnd) return purchases
    const start = startOfDay(dateRangeStart)
    const end = endOfDay(dateRangeEnd)
    return purchases.filter(p => {
      if (!p.date) return false
      try { const d = parseISO(p.date); return d >= start && d <= end } catch { return false }
    })
  }, [purchases, dateRangeStart, dateRangeEnd])

  // Calculate overall financial metrics (poultry sales + godown sales)
  const financialMetrics = useMemo(() => {
    const poultryRevenue = filteredSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
    const godownRevenue = filteredGodownSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
    const totalRevenue = poultryRevenue + godownRevenue
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (Number(p.totalValue) || Number(p.totalAmount) || 0), 0)
    const totalCost = totalExpenses + totalPurchases
    const netProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0
    const roi = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0

    return { totalRevenue, poultryRevenue, godownRevenue, totalExpenses, totalPurchases, totalCost, netProfit, profitMargin, roi }
  }, [filteredSales, filteredGodownSales, filteredExpenses, filteredPurchases])

  // Calculate monthly trends for the last 12 months
  const monthlyTrends = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date(),
    })

    return months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

      // Filter sales for this month
      const monthSales = (filteredSales || []).filter((s) => {
        if (!s || !s.date) return false
        try {
          const saleDate = parseISO(s.date)
          return isWithinInterval(saleDate, { start: monthStart, end: monthEnd })
        } catch (e) {
          return false
        }
      })

      const monthGodownSales = (filteredGodownSales || []).filter((s) => {
        if (!s || !s.date) return false
        try {
          const saleDate = parseISO(s.date)
          return isWithinInterval(saleDate, { start: monthStart, end: monthEnd })
        } catch (e) {
          return false
        }
      })

      // Filter expenses for this month
      const monthExpenses = (filteredExpenses || []).filter((e) => {
        if (!e || !e.date) return false
        try {
          const expenseDate = parseISO(e.date)
          return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd })
        } catch (e) {
          return false
        }
      })

      // Filter purchases for this month
      const monthPurchases = (filteredPurchases || []).filter((p) => {
        if (!p || !p.date) return false
        try {
          const purchaseDate = parseISO(p.date)
          return isWithinInterval(purchaseDate, { start: monthStart, end: monthEnd })
        } catch (e) {
          return false
        }
      })

      const revenue =
        monthSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0) +
        monthGodownSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
      const expensesTotal = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      const purchasesTotal = monthPurchases.reduce((sum, p) => sum + (Number(p.totalValue) || Number(p.totalAmount) || 0), 0)
      const profit = revenue - expensesTotal - purchasesTotal

      return {
        month: format(month, "MMM yyyy"),
        monthShort: format(month, "MMM"),
        revenue,
        expenses: expensesTotal,
        purchases: purchasesTotal,
        totalCost: expensesTotal + purchasesTotal,
        profit,
        profitMargin: revenue > 0 ? ((profit / revenue) * 100) : 0,
      }
    })
  }, [filteredSales, filteredGodownSales, filteredExpenses, filteredPurchases])

  // Calculate growth rates
  const growthRates = useMemo(() => {
    if (monthlyTrends.length < 2) {
      return {
        revenueGrowth: 0,
        profitGrowth: 0,
        expenseGrowth: 0,
      }
    }

    const currentMonth = monthlyTrends[monthlyTrends.length - 1]
    const previousMonth = monthlyTrends[monthlyTrends.length - 2]

    const revenueGrowth = previousMonth.revenue > 0
      ? (((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100)
      : 0

    const profitGrowth = previousMonth.profit !== 0
      ? (((currentMonth.profit - previousMonth.profit) / Math.abs(previousMonth.profit)) * 100)
      : currentMonth.profit > 0 ? 100 : 0

    const expenseGrowth = previousMonth.totalCost > 0
      ? (((currentMonth.totalCost - previousMonth.totalCost) / previousMonth.totalCost) * 100)
      : 0

    return {
      revenueGrowth,
      profitGrowth,
      expenseGrowth,
    }
  }, [monthlyTrends])

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {}
    let totalExpensesAmount = 0

    filteredExpenses.forEach((expense) => {
      const category = expense.category || "other"
      const amount = expense.amount || 0
      categoryTotals[category] = (categoryTotals[category] || 0) + amount
      totalExpensesAmount += amount
    })

    const colors: { [key: string]: string } = {
      feed: "#10b981",
      labor: "#3b82f6",
      medicine: "#f59e0b",
      equipment: "#8b5cf6",
      maintenance: "#ef4444",
      transportation: "#06b6d4",
      other: "#64748b",
    }

    const categoryNames: { [key: string]: string } = {
      feed: "Feed",
      labor: "Labor",
      medicine: "Medicine",
      equipment: "Equipment",
      maintenance: "Maintenance",
      transportation: "Transportation",
      other: "Other",
    }

    if (totalExpensesAmount === 0) return []

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: categoryNames[category] || category,
        value: amount,
        percentage: Math.round((amount / totalExpensesAmount) * 100),
        fill: colors[category] || "#64748b",
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses])

  // Payment status analysis
  const paymentStatusAnalysis = useMemo(() => {
    const statusCounts: { [key: string]: { count: number; amount: number } } = {}

    filteredSales.forEach((sale) => {
      const status = sale.paymentStatus || "pending"
      if (!statusCounts[status]) {
        statusCounts[status] = { count: 0, amount: 0 }
      }
      statusCounts[status].count += 1
      statusCounts[status].amount += sale.totalAmount || 0
    })

    return Object.entries(statusCounts).map(([status, data]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: data.count,
      amount: data.amount,
    }))
  }, [filteredSales])

  // Top customers by revenue
  const topCustomers = useMemo(() => {
    const customerTotals: { [key: string]: number } = {}

    filteredSales.forEach((sale) => {
      const customer = sale.customer || "Unknown"
      customerTotals[customer] = (customerTotals[customer] || 0) + (sale.totalAmount || 0)
    })

    return Object.entries(customerTotals)
      .map(([customer, amount]) => ({ customer, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [filteredSales])

  // Top suppliers by purchase amount
  const topSuppliers = useMemo(() => {
    const supplierTotals: { [key: string]: number } = {}

    filteredPurchases.forEach((purchase) => {
      const supplier = purchase.supplier || "Unknown"
      supplierTotals[supplier] = (supplierTotals[supplier] || 0) + (purchase.totalValue || purchase.totalAmount || 0)
    })

    return Object.entries(supplierTotals)
      .map(([supplier, amount]) => ({ supplier, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [filteredPurchases])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="min-w-0 shrink-0">
            <h1 className="text-xl sm:text-3xl font-bold">Financial Analytics</h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Comprehensive financial insights and performance metrics</p>
          </div>
          <Button size="sm" className="h-10 shrink-0 self-end sm:self-auto rounded-md">
            <Download className="mr-1.5" size={16} />
            Export Report
          </Button>
        </div>

        <div className="print:hidden">
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
            setDateRangeStart(new Date(y, m - 1, d))
          } else {
            setDateRangeStart(undefined)
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
            setDateRangeEnd(new Date(y, m - 1, d))
          } else {
            setDateRangeEnd(undefined)
          }
        }}
      />
    </div>

    {(dateRangeStart && dateRangeEnd) && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setDateRangeStart(undefined)
          setDateRangeEnd(undefined)
        }}
        className="h-10 rounded-full"
      >
        <X size={14} className="mr-1" /> Clear
      </Button>
    )}

    {!dateRangeStart && !dateRangeEnd && (
      <span className="h-10 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground flex items-center justify-center">
        Showing: All Time
      </span>
    )}
  </div>
</div>

        {(dateRangeStart && dateRangeEnd) && (
          <div className="text-xs sm:text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            Showing data from <strong>{format(dateRangeStart, 'dd MMM yyyy')}</strong> to <strong>{format(dateRangeEnd, 'dd MMM yyyy')}</strong>
            {' '}— {filteredSales.length} sales, {filteredExpenses.length} expenses, {filteredPurchases.length} purchases
          </div>
        )}

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Revenue */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground leading-tight">Total Revenue</span>
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <TrendingUp size={16} className="text-emerald-600" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold truncate">₹{financialMetrics.totalRevenue.toLocaleString()}</div>
              <div className="flex items-center mt-1.5 text-[10px] sm:text-xs">
                {growthRates.revenueGrowth >= 0 ? (
                  <TrendingUp className="text-green-600 mr-0.5 shrink-0" size={12} />
                ) : (
                  <TrendingDown className="text-red-600 mr-0.5 shrink-0" size={12} />
                )}
                <span className={`truncate ${growthRates.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(growthRates.revenueGrowth).toFixed(1)}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Costs */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground leading-tight">Total Costs</span>
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <Receipt size={16} className="text-red-600" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold truncate">₹{financialMetrics.totalCost.toLocaleString()}</div>
              <div className="mt-1.5 space-y-0.5">
                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Expenses: ₹{financialMetrics.totalExpenses.toLocaleString()}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Purchases: ₹{financialMetrics.totalPurchases.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground leading-tight">Net Profit</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${financialMetrics.netProfit >= 0 ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                  <BadgeDollarSign size={16} className={financialMetrics.netProfit >= 0 ? "text-blue-600" : "text-red-600"} />
                </div>
              </div>
              <div className={`text-lg sm:text-xl font-bold truncate ${financialMetrics.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{financialMetrics.netProfit.toLocaleString()}
              </div>
              <div className="flex items-center mt-1.5 text-[10px] sm:text-xs">
                {growthRates.profitGrowth >= 0 ? (
                  <ArrowUpRight className="text-green-600 mr-0.5 shrink-0" size={12} />
                ) : (
                  <ArrowDownRight className="text-red-600 mr-0.5 shrink-0" size={12} />
                )}
                <span className={`truncate ${growthRates.profitGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(growthRates.profitGrowth).toFixed(1)}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Profit Margin */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground leading-tight">Profit Margin</span>
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                  <CircleDollarSign size={16} className="text-violet-600" />
                </div>
              </div>
              <div className={`text-lg sm:text-xl font-bold ${financialMetrics.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {financialMetrics.profitMargin.toFixed(1)}%
              </div>
              <div className="flex items-center mt-1.5 text-[10px] sm:text-xs">
                <Wallet className="text-muted-foreground mr-0.5 shrink-0" size={12} />
                <span className="text-muted-foreground">ROI: {financialMetrics.roi.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue vs Costs Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="overflow-hidden min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Revenue vs Costs Trend</CardTitle>
              <CardDescription className="text-xs">12-month financial performance overview</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 lg:p-6 min-w-0">
              <div className="w-full min-w-0 h-[220px] sm:h-[260px] lg:h-[280px]">
                <ChartContainer
                  config={{
                    revenue: { label: "Revenue", color: "#10b981" },
                    totalCost: { label: "Total Costs", color: "#ef4444" },
                    profit: { label: "Profit", color: "#3b82f6" },
                  }}
                  className="h-full w-full aspect-auto"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrends} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthShort" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} width={45} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="totalCost" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                      <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Profit Margin Trend</CardTitle>
              <CardDescription className="text-xs">Monthly profitability percentage</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 lg:p-6 min-w-0">
              <div className="w-full min-w-0 h-[220px] sm:h-[260px] lg:h-[280px]">
                <ChartContainer
                  config={{
                    profitMargin: { label: "Profit Margin %", color: "#10b981" },
                  }}
                  className="h-full w-full aspect-auto"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthShort" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} width={35} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="profitMargin"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Profit Margin %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense Breakdown and Payment Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="overflow-hidden min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Expense Breakdown</CardTitle>
              <CardDescription className="text-xs">Distribution by category</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 min-w-0">
              {expenseBreakdown.length > 0 ? (
                <div className="w-full min-w-0">
                  <div className="w-full h-[200px] sm:h-[240px] lg:h-[280px]">
                    <ChartContainer
                      config={expenseBreakdown.reduce((acc, item) => {
                        acc[item.name.toLowerCase()] = { label: item.name, color: item.fill }
                        return acc
                      }, {} as any)}
                      className="h-full w-full aspect-auto"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius="35%"
                            outerRadius="65%"
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {expenseBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                    {expenseBreakdown.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                        <span className="text-muted-foreground truncate">{entry.name}</span>
                        <span className="font-medium">{entry.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] sm:h-[240px] lg:h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Payment Status Analysis</CardTitle>
              <CardDescription className="text-xs">Sales by payment status</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 min-w-0">
              {paymentStatusAnalysis.length > 0 ? (
                <div className="w-full min-w-0 h-[220px] sm:h-[260px] lg:h-[300px]">
                  <ChartContainer
                    config={{
                      paid: { label: "Paid", color: "#10b981" },
                      pending: { label: "Pending", color: "#f59e0b" },
                      partial: { label: "Partial", color: "#3b82f6" },
                    }}
                    className="h-full w-full aspect-auto"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentStatusAnalysis} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} />
                        <YAxis tick={{ fontSize: 10 }} width={45} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                        <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }} />
                        <Bar dataKey="amount" fill="#10b981" name="Amount" />
                        <Bar dataKey="count" fill="#3b82f6" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-[220px] sm:h-[260px] lg:h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  No payment data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Customers and Suppliers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="overflow-hidden min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Users size={16} className="text-muted-foreground shrink-0" />
                Top 10 Customers
              </CardTitle>
              <CardDescription className="text-xs">By total revenue</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 lg:p-6 pt-0 sm:pt-4 min-w-0">
              {topCustomers.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.customer} className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-muted/50 gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 shrink">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] sm:text-[10px] font-semibold shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-[11px] sm:text-xs lg:text-sm font-medium truncate">{customer.customer}</span>
                      </div>
                      <span className="text-[11px] sm:text-xs lg:text-sm font-bold text-green-600 whitespace-nowrap shrink-0">₹{customer.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  No customer data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Truck size={16} className="text-muted-foreground shrink-0" />
                Top 10 Suppliers
              </CardTitle>
              <CardDescription className="text-xs">By total purchase amount</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 lg:p-6 pt-0 sm:pt-4 min-w-0">
              {topSuppliers.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2">
                  {topSuppliers.map((supplier, index) => (
                    <div key={supplier.supplier} className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-muted/50 gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 shrink">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] sm:text-[10px] font-semibold shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-[11px] sm:text-xs lg:text-sm font-medium truncate">{supplier.supplier}</span>
                      </div>
                      <span className="text-[11px] sm:text-xs lg:text-sm font-bold text-red-600 whitespace-nowrap shrink-0">₹{supplier.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  No supplier data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

