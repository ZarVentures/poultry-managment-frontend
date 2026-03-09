"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { format, startOfMonth, isWithinInterval, parseISO, eachMonthOfInterval, startOfYear } from "date-fns"

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
  status: "pending" | "picked up" | "cancel"
  notes: string
  // Legacy fields for backward compatibility
  items?: { description: string; quantity: number; unitCost: number }[]
  totalAmount?: number
  dueDate?: string
}

interface Sale {
  id: string
  invoiceNumber: string
  customer: string
  date: string
  productType: string
  quantity: number
  unitPrice: number
  totalAmount: number
  paymentStatus: "paid" | "pending" | "partial"
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

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    setMounted(true)
    
    // Fetch purchases from API
    const fetchPurchases = async () => {
      try {
        const response = await fetch("/api/purchases")
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // Convert database IDs to strings for compatibility
            const formattedPurchases = result.data.map((p: any) => ({
              ...p,
              id: p.id.toString(),
            }))
            setPurchases(formattedPurchases)
          } else if (Array.isArray(result)) {
            setPurchases(result)
          }
        }
      } catch (error) {
        console.error("Error fetching purchases:", error)
      }
    }

    const fetchSales = async () => {
      try {
        const response = await fetch("/api/sales")
        if (response.ok) {
          const result = await response.json()
          const salesData = (result as any).data || result
          setSales(salesData)
        }
      } catch (error) {
        console.error("Error fetching sales:", error)
      }
    }

    const fetchExpenses = async () => {
      try {
        const response = await fetch("/api/expenses")
        if (response.ok) {
          const result = await response.json()
          const expensesData = (result as any).data || result
          setExpenses(expensesData)
        }
      } catch (error) {
        console.error("Error fetching expenses:", error)
      }
    }

    fetchPurchases()
    fetchSales()
    fetchExpenses()
  }, [])

  // Calculate date range: 1st of current month to today
  const currentMonthStart = useMemo(() => startOfMonth(new Date()), [])
  const today = useMemo(() => new Date(), [])

  // Filter data for current month
  const currentMonthPurchases = useMemo(() => {
    if (!purchases || purchases.length === 0) return []
    return purchases.filter((purchase) => {
      if (!purchase || !purchase.date) return false
      try {
        const purchaseDate = parseISO(purchase.date)
        return isWithinInterval(purchaseDate, { start: currentMonthStart, end: today })
      } catch (e) {
        console.error("Error parsing purchase date:", e)
        return false
      }
    })
  }, [purchases, currentMonthStart, today])

  const currentMonthSales = useMemo(() => {
    if (!sales || sales.length === 0) return []
    return sales.filter((sale) => {
      if (!sale || !sale.date) return false
      try {
        const saleDate = parseISO(sale.date)
        return isWithinInterval(saleDate, { start: currentMonthStart, end: today })
      } catch (e) {
        console.error("Error parsing sale date:", e)
        return false
      }
    })
  }, [sales, currentMonthStart, today])

  const currentMonthExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return []
    return expenses.filter((expense) => {
      if (!expense || !expense.date) return false
      try {
        const expenseDate = parseISO(expense.date)
        return isWithinInterval(expenseDate, { start: currentMonthStart, end: today })
      } catch (e) {
        console.error("Error parsing expense date:", e)
        return false
      }
    })
  }, [expenses, currentMonthStart, today])

  // Calculate KPIs
  const totalBirdsPurchases = useMemo(() => {
    if (!currentMonthPurchases || currentMonthPurchases.length === 0) return 0
    
    return currentMonthPurchases.reduce((total, purchase) => {
      // New structure: use birdQuantity directly
      if (purchase.birdQuantity !== undefined) {
        return total + (purchase.birdQuantity || 0)
      }
      // Legacy structure: sum quantities from items array
      if (purchase.items && Array.isArray(purchase.items)) {
        const birdsInPurchase = purchase.items.reduce((sum, item) => {
          const desc = (item.description || "").toLowerCase()
          // Check if item is a bird (chick, chicken, broiler, layer, bird, etc.)
          if (
            desc.includes("bird") ||
            desc.includes("chick") ||
            desc.includes("chicken") ||
            desc.includes("broiler") ||
            desc.includes("layer") ||
            desc.includes("poultry")
          ) {
            return sum + (item.quantity || 0)
          }
          return sum
        }, 0)
        return total + birdsInPurchase
      }
      return total
    }, 0)
  }, [currentMonthPurchases])

  const totalBirdsSale = useMemo(() => {
    if (!currentMonthSales || currentMonthSales.length === 0) return 0
    return currentMonthSales.reduce((total, sale) => {
      return total + (sale.quantity || 0)
    }, 0)
  }, [currentMonthSales])

  const totalExpenses = useMemo(() => {
    if (!currentMonthExpenses || currentMonthExpenses.length === 0) return 0
    return currentMonthExpenses.reduce((total, expense) => {
      return total + (expense.amount || 0)
    }, 0)
  }, [currentMonthExpenses])

  const totalPurchasesAmount = useMemo(() => {
    if (!currentMonthPurchases || currentMonthPurchases.length === 0) return 0
    return currentMonthPurchases.reduce((total, purchase) => {
      // New structure: use totalValue
      if (purchase.totalValue !== undefined) {
        return total + (purchase.totalValue || 0)
      }
      // Legacy structure: use totalAmount
      return total + (purchase.totalAmount || 0)
    }, 0)
  }, [currentMonthPurchases])

  const totalSalesAmount = useMemo(() => {
    if (!currentMonthSales || currentMonthSales.length === 0) return 0
    return currentMonthSales.reduce((total, sale) => {
      return total + (sale.totalAmount || 0)
    }, 0)
  }, [currentMonthSales])

  const currentStatus = useMemo(() => {
    const profit = totalSalesAmount - totalPurchasesAmount - totalExpenses
    return {
      amount: Math.abs(profit),
      isProfit: profit >= 0,
    }
  }, [totalSalesAmount, totalPurchasesAmount, totalExpenses])

  // Generate monthly trend data for the last 6 months
  const monthlyTrendData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfYear(new Date()),
      end: new Date(),
    }).slice(-6) // Last 6 months

    return months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

      // Filter purchases for this month
      const monthPurchases = (purchases || []).filter((p) => {
        if (!p || !p.date) return false
        try {
          const purchaseDate = parseISO(p.date)
          return isWithinInterval(purchaseDate, { start: monthStart, end: monthEnd })
        } catch (e) {
          return false
        }
      })

      // Filter sales for this month
      const monthSales = (sales || []).filter((s) => {
        if (!s || !s.date) return false
        try {
          const saleDate = parseISO(s.date)
          return isWithinInterval(saleDate, { start: monthStart, end: monthEnd })
        } catch (e) {
          return false
        }
      })

      // Filter expenses for this month
      const monthExpenses = (expenses || []).filter((e) => {
        if (!e || !e.date) return false
        try {
          const expenseDate = parseISO(e.date)
          return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd })
        } catch (e) {
          return false
        }
      })

      const purchaseTotal = monthPurchases.reduce((sum, p) => {
        // New structure: use totalValue
        if (p.totalValue !== undefined) {
          return sum + (p.totalValue || 0)
        }
        // Legacy structure: use totalAmount
        return sum + (p.totalAmount || 0)
      }, 0)
      const saleTotal = monthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      const expenseTotal = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

      return {
        month: format(month, "MMM"),
        Purchase: purchaseTotal,
        Sale: saleTotal,
        Expense: expenseTotal,
      }
    })
  }, [purchases, sales, expenses])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your poultry farm management system</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Birds Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalBirdsPurchases.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {format(currentMonthStart, "MMM 1")} to {format(today, "MMM d")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Birds Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalBirdsSale.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {format(currentMonthStart, "MMM 1")} to {format(today, "MMM d")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {format(currentMonthStart, "MMM 1")} to {format(today, "MMM d")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${currentStatus.isProfit ? "text-green-600" : "text-red-600"}`}>
                {currentStatus.isProfit ? "Profit" : "Loss"}
              </div>
              <div className={`text-2xl font-semibold mt-1 ${currentStatus.isProfit ? "text-green-600" : "text-red-600"}`}>
                ₹{currentStatus.amount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sales: ₹{totalSalesAmount.toLocaleString()} - Purchases: ₹{totalPurchasesAmount.toLocaleString()} - Expenses: ₹{totalExpenses.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly trends for Purchase, Sale, and Expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  Purchase: { label: "Purchase", color: "#ef4444" },
                  Sale: { label: "Sale", color: "#10b981" },
                  Expense: { label: "Expense", color: "#f59e0b" },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(0, 0, 0, 0.8)", border: "none", borderRadius: "8px" }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Purchase"
                      stroke="#ef4444"
                      name="Purchase"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="Sale"
                      stroke="#10b981"
                      name="Sale"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="Expense"
                      stroke="#f59e0b"
                      name="Expense"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Current month financial overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="text-sm font-medium">Total Purchases</span>
                  <span className="text-lg font-bold text-red-600">₹{totalPurchasesAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-sm font-medium">Total Sales</span>
                  <span className="text-lg font-bold text-green-600">₹{totalSalesAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <span className="text-sm font-medium">Total Expenses</span>
                  <span className="text-lg font-bold text-yellow-600">₹{totalExpenses.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center p-4 rounded-lg border-2 ${
                  currentStatus.isProfit
                    ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                    : "bg-red-50 dark:bg-red-900/20 border-red-500"
                }`}>
                  <span className="text-base font-semibold">Net {currentStatus.isProfit ? "Profit" : "Loss"}</span>
                  <span className={`text-2xl font-bold ${currentStatus.isProfit ? "text-green-600" : "text-red-600"}`}>
                    ₹{currentStatus.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
