"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { Download, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Calendar, X } from "lucide-react"
import { format, startOfMonth, eachMonthOfInterval, parseISO, isWithinInterval, subMonths, startOfDay, endOfDay } from "date-fns"
import { salesApi, expensesApi, purchasesApi } from "@/lib/api"
import { DateRangeFilter } from "@/components/date-range-filter"

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
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
    
    const fetchData = async () => {
      try {
        const [salesResult, expensesResult, purchasesResult] = await Promise.allSettled([
          salesApi.getAll(),
          expensesApi.getAll(),
          purchasesApi.getAll(),
        ])

        if (salesResult.status === 'fulfilled') {
          const raw = salesResult.value as any[]
          setSales(raw.map(s => {
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

  // Calculate overall financial metrics
  const financialMetrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (Number(p.totalValue) || Number(p.totalAmount) || 0), 0)
    const totalCost = totalExpenses + totalPurchases
    const netProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0
    const roi = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0

    return { totalRevenue, totalExpenses, totalPurchases, totalCost, netProfit, profitMargin, roi }
  }, [filteredSales, filteredExpenses, filteredPurchases])

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

      const revenue = monthSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
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
  }, [filteredSales, filteredExpenses, filteredPurchases])

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
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Financial Analytics</h1>
            <p className="text-muted-foreground">Comprehensive financial insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateRangeFilter
              startDate={dateRangeStart}
              endDate={dateRangeEnd}
              onDateRangeChange={(s, e) => { setDateRangeStart(s); setDateRangeEnd(e) }}
            />
            {(dateRangeStart || dateRangeEnd) && (
              <Button variant="outline" size="sm" onClick={() => { setDateRangeStart(undefined); setDateRangeEnd(undefined) }}>
                <X size={14} className="mr-1" /> Clear Filter
              </Button>
            )}
            <Button>
              <Download className="mr-2" size={20} />
              Export Report
            </Button>
          </div>
        </div>
        {(dateRangeStart && dateRangeEnd) && (
          <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded px-3 py-2">
            Showing data from <strong>{format(dateRangeStart, 'dd MMM yyyy')}</strong> to <strong>{format(dateRangeEnd, 'dd MMM yyyy')}</strong>
            {' '}— {filteredSales.length} sales, {filteredExpenses.length} expenses, {filteredPurchases.length} purchases
          </div>
        )}

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{financialMetrics.totalRevenue.toLocaleString()}</div>
              <div className="flex items-center mt-2 text-xs">
                {growthRates.revenueGrowth >= 0 ? (
                  <TrendingUp className="text-green-600 mr-1" size={16} />
                ) : (
                  <TrendingDown className="text-red-600 mr-1" size={16} />
                )}
                <span className={growthRates.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(growthRates.revenueGrowth).toFixed(1)}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{financialMetrics.totalCost.toLocaleString()}</div>
              <div className="flex items-center mt-2 text-xs">
                <span className="text-muted-foreground">
                  Expenses: ₹{financialMetrics.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center mt-1 text-xs">
                <span className="text-muted-foreground">
                  Purchases: ₹{financialMetrics.totalPurchases.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${financialMetrics.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{financialMetrics.netProfit.toLocaleString()}
              </div>
              <div className="flex items-center mt-2 text-xs">
                {growthRates.profitGrowth >= 0 ? (
                  <ArrowUpRight className="text-green-600 mr-1" size={16} />
                ) : (
                  <ArrowDownRight className="text-red-600 mr-1" size={16} />
                )}
                <span className={growthRates.profitGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(growthRates.profitGrowth).toFixed(1)}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${financialMetrics.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {financialMetrics.profitMargin.toFixed(1)}%
              </div>
              <div className="flex items-center mt-2 text-xs">
                <DollarSign className="text-muted-foreground mr-1" size={16} />
                <span className="text-muted-foreground">ROI: {financialMetrics.roi.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue vs Costs Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Costs Trend</CardTitle>
              <CardDescription>12-month financial performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: { label: "Revenue", color: "#10b981" },
                  totalCost: { label: "Total Costs", color: "#ef4444" },
                  profit: { label: "Profit", color: "#3b82f6" },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthShort" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="totalCost" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profit Margin Trend</CardTitle>
              <CardDescription>Monthly profitability percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  profitMargin: { label: "Profit Margin %", color: "#10b981" },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthShort" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Legend />
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
            </CardContent>
          </Card>
        </div>

        {/* Expense Breakdown and Payment Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseBreakdown.length > 0 ? (
                <ChartContainer
                  config={expenseBreakdown.reduce((acc, item) => {
                    acc[item.name.toLowerCase()] = { label: item.name, color: item.fill }
                    return acc
                  }, {} as any)}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
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
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Status Analysis</CardTitle>
              <CardDescription>Sales by payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentStatusAnalysis.length > 0 ? (
                <ChartContainer
                  config={{
                    paid: { label: "Paid", color: "#10b981" },
                    pending: { label: "Pending", color: "#f59e0b" },
                    partial: { label: "Partial", color: "#3b82f6" },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentStatusAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="amount" fill="#10b981" name="Amount" />
                      <Bar dataKey="count" fill="#3b82f6" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No payment data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Customers and Suppliers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Customers</CardTitle>
              <CardDescription>By total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.customer} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{customer.customer}</span>
                      </div>
                      <span className="font-bold text-green-600">₹{customer.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  No customer data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Suppliers</CardTitle>
              <CardDescription>By total purchase amount</CardDescription>
            </CardHeader>
            <CardContent>
              {topSuppliers.length > 0 ? (
                <div className="space-y-3">
                  {topSuppliers.map((supplier, index) => (
                    <div key={supplier.supplier} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{supplier.supplier}</span>
                      </div>
                      <span className="font-bold text-red-600">₹{supplier.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
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

