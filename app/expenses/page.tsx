"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X, Download, Printer, Wallet, TrendingUp, IndianRupee, Calendar, Search } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { expensesApi, expenseCategoriesApi, type Expense as ApiExpense, type ExpenseCategory } from "@/lib/api"
import { usePermissions } from "@/lib/permissions"
import { toast } from "sonner"

export default function ExpensesPage() {
  const router = useRouter()
  const { canUpdate, canDelete } = usePermissions()
  const [expenses, setExpenses] = useState<ApiExpense[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    expenseOwner: "",
    categoryId: undefined as number | undefined,
    description: "",
    amount: "",
    paymentMethod: "cash" as "cash" | "bank_transfer" | "check" | "credit_card",
    notes: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchExpenses()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await expenseCategoriesApi.getActive('main') // Only fetch active categories for main
      setCategories(data)
      if (data.length > 0 && !editingId) {
        setFormData(prev => ({ ...prev, categoryId: data[0].id }))
      }
    } catch (e) {
      console.error("Failed to fetch categories:", e)
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const data = await expensesApi.getAll()
      setExpenses(data)
    } catch (error: any) {
      console.error("Failed to fetch expenses:", error)
      toast.error("Failed to load expenses")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      expenseDate: new Date().toISOString().split("T")[0],
      expenseOwner: "",
      categoryId: categories.length > 0 ? categories[0].id : undefined,
      description: "",
      amount: "",
      paymentMethod: "cash",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (expense: ApiExpense) => {
    setFormData({
      expenseDate: expense.expenseDate,
      expenseOwner: expense.expenseOwner || "",
      categoryId: expense.categoryId || categories.find(c => c.name.toLowerCase() === expense.category?.toLowerCase())?.id,
      description: expense.description,
      amount: String(expense.amount),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || "",
    })
    setEditingId(expense.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.description || !formData.amount || !formData.categoryId) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const expenseData = {
        expenseDate: formData.expenseDate,
        expenseOwner: formData.expenseOwner || undefined,
        categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
        description: formData.description,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      }

      if (editingId) {
        await expensesApi.update(editingId, expenseData)
        toast.success("Expense updated successfully")
      } else {
        await expensesApi.create(expenseData)
        toast.success("Expense created successfully")
      }

      await fetchExpenses()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save expense:", error)
      toast.error(error.message || "Failed to save expense")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      setLoading(true)
      await expensesApi.delete(id)
      toast.success("Expense deleted successfully")
      await fetchExpenses()
    } catch (error: any) {
      console.error("Failed to delete expense:", error)
      toast.error("Failed to delete expense")
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const stats = useMemo(() => {
    const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    // Group by category Id for more accurate stats with dynamic categories
    const byCategory: Record<string, number> = {}
    categories.forEach(cat => {
      byCategory[cat.id] = expenses
        .filter(e => e.categoryId === cat.id || (e.category && e.category.toLowerCase() === cat.name.toLowerCase()))
        .reduce((sum, e) => sum + Number(e.amount), 0)
    })

    return {
      total: totalExpense,
      byCategory
    }
  }, [expenses, categories])

  const CHART_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

  const chartData = useMemo(() => {
    const all = categories
      .filter(cat => (stats.byCategory[cat.id] || 0) > 0)
      .map(cat => ({
        name: cat.name,
        amount: Math.round(stats.byCategory[cat.id] || 0),
      }))
      .sort((a, b) => b.amount - a.amount)
    if (stats.total <= 0) return all
    return all.filter(item => (item.amount / stats.total) * 100 >= 1)
  }, [categories, stats.byCategory, stats.total])

  const donutData = useMemo(() => {
    const all = chartData.map(item => ({
      name: item.name,
      value: item.amount,
      percentage: stats.total > 0 ? Math.round((item.amount / stats.total) * 1000) / 10 : 0,
    })).filter(item => item.value > 0)
    const negligibleTotal = all.reduce((sum, d) => d.percentage < 1 ? sum + d.value : sum, 0)
    return all
      .filter(d => d.percentage >= 1 || all.length <= 3)
      .map(d => {
        if (d.percentage < 1 && negligibleTotal > 0) {
          return { ...d, name: "Other", value: d.value, percentage: stats.total > 0 ? Math.round((negligibleTotal / stats.total) * 1000) / 10 : 0 }
        }
        return d
      })
      .reduce<{ name: string; value: number; percentage: number }[]>((acc, item) => {
        const existing = acc.find(a => a.name === item.name)
        if (existing) { existing.value += item.value; existing.percentage = stats.total > 0 ? Math.round((existing.value / stats.total) * 1000) / 10 : 0 }
        else acc.push({ ...item })
        return acc
      }, [])
      .sort((a, b) => b.value - a.value)
  }, [chartData, stats.total])

  const topCategoryName = donutData.length > 0 ? donutData.reduce((a, b) => a.value > b.value ? a : b).name : ""
  const topCategoryPct = donutData.length > 0 ? donutData.reduce((a, b) => a.value > b.value ? a : b).percentage : 0

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (expense) =>
          (expense.expenseOwner && expense.expenseOwner.toLowerCase().includes(query)) ||
          expense.description.toLowerCase().includes(query) ||
          expense.expenseCategory?.name.toLowerCase().includes(query)
      )
    }

    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.expenseDate)
        expenseDate.setHours(0, 0, 0, 0)
        return expenseDate >= start && expenseDate <= end
      })
    }

    return filtered
  }, [expenses, searchQuery, dateRangeStart, dateRangeEnd])

  const handleDownloadPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expenses Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Expenses Report</h1>
            <div><strong>Total Expenses:</strong> ₹${stats.total.toFixed(2)}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Expense Owner</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map(expense => `
                <tr>
                  <td>${expense.expenseOwner || "N/A"}</td>
                  <td>${new Date(expense.expenseDate).toLocaleDateString('en-GB')}</td>
                  <td>${expense.expenseCategory?.name || expense.category}</td>
                  <td>${expense.description}</td>
                  <td>₹${Number(expense.amount).toFixed(2)}</td>
                  <td>${expense.paymentMethod.replace('_', ' ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handlePrintReport = () => {
    handleDownloadPDF()
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      feed: '🌾',
      labor: '👷',
      medicine: '💊',
      utilities: '💡',
      equipment: '🔧',
      maintenance: '🔨',
      transportation: '🚚',
      other: '📝',
    }
    return icons[category] || '📝'
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Expenses & Financial Tracking</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Track all farm expenses and costs</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-fit h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm md:h-10 md:px-4 md:text-sm">
                <Plus className="mr-1 sm:mr-0" size={16} />
                <span className="hidden sm:inline">Add New Expense</span>
                <span className="sm:hidden">Add Expense</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-sm:max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Expense" : "New Expense"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit expense details" : "Create a new expense record"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Expense Owner</Label>
                  <Input
                    value={formData.expenseOwner}
                    onChange={(e) => setFormData({ ...formData, expenseOwner: e.target.value })}
                    placeholder="Person or department responsible"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <DatePicker
                      value={formData.expenseDate}
                      onChange={(date) => setFormData({ ...formData, expenseDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={formData.categoryId ? String(formData.categoryId) : undefined}
                      onValueChange={(value: string) => setFormData({ ...formData, categoryId: Number(value) })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.isActive).map(cat => (
                          <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Expense description"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="credit_card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1" disabled={loading}>
                    {loading ? "Saving..." : editingId ? "Update" : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                    <X size={20} />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 — Total Expense Metric */}
          <Card className="min-w-0 rounded-xl shadow-sm">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">All tracked expenses</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100">
                  <Wallet size={20} className="text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 space-y-4">
              <div>
                <p className="text-2xl sm:text-3xl font-bold whitespace-nowrap">₹{stats.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                  <TrendingUp size={12} />
                  Total tracked
                </span>
              </div>
              <div className="border-t pt-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Categories</p>
                {categories.slice(0, 5).map(cat => {
                  const amt = stats.byCategory[cat.id] || 0
                  const pct = stats.total > 0 ? ((amt / stats.total) * 100).toFixed(1) : "0"
                  return (
                    <div key={cat.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{getCategoryIcon(cat.name.toLowerCase())}</span>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <span className="font-medium whitespace-nowrap ml-2">₹{amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                    </div>
                  )
                })}
                {categories.length === 0 && <p className="text-xs text-muted-foreground animate-pulse">Loading…</p>}
              </div>
            </CardContent>
          </Card>

          {/* Card 2 — Expense By Category (Bar Chart) */}
          <Card className="min-w-0 rounded-xl shadow-sm">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expense By Category</CardTitle>
              <p className="text-xs text-muted-foreground">Vertical breakdown</p>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 pb-4">
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No category data</p>
              ) : (
                <div className="space-y-3">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} margin={{ top: 20, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={0}
                        textAnchor="middle"
                        height={36}
                        tickFormatter={(v: string) => v.length > 8 ? v.slice(0, 7) + "…" : v}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                        width={35}
                      />
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Amount"]}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                        cursor={{ fill: "rgba(16,185,129,0.06)" }}
                      />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={48} label={{ position: "top", fontSize: 9, fill: "#64748b", formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) }}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {topCategoryName && (
                    <p className="text-xs text-muted-foreground text-center px-2">
                      Breakdown: <span className="font-medium text-foreground">{topCategoryName}</span> is{" "}
                      <span className="font-semibold text-emerald-600">{topCategoryPct}%</span> of total
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3 — Expense Distribution (% Donut) */}
          <Card className="min-w-0 rounded-xl shadow-sm">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expense Distribution</CardTitle>
              <p className="text-xs text-muted-foreground">Percentage share by category</p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {donutData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No distribution data</p>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="45%"
                        outerRadius="78%"
                        paddingAngle={3}
                        labelLine={false}
                        stroke="none"
                      >
                        {donutData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Amount"]}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3 w-full">
                    {donutData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="truncate text-muted-foreground">{item.name}</span>
                        <span className="font-semibold shrink-0">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold">All Expenses</h2>

        <Card className="rounded-2xl p-4 print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div className="relative md:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search by owner, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar size={12} /> From
              </label>
              <Input type="date" className="w-full sm:w-[160px] h-10 rounded-full" value={dateRangeStart ? `${dateRangeStart.getFullYear()}-${String(dateRangeStart.getMonth() + 1).padStart(2, "0")}-${String(dateRangeStart.getDate()).padStart(2, "0")}` : ""} onChange={(e) => { const v = e.target.value; if (v) { const [y, m, d] = v.split("-").map(Number); handleDateRangeChange(new Date(y, m - 1, d), dateRangeEnd) } else { handleDateRangeChange(undefined, dateRangeEnd) } }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar size={12} /> To
              </label>
              <Input type="date" className="w-full sm:w-[160px] h-10 rounded-full" value={dateRangeEnd ? `${dateRangeEnd.getFullYear()}-${String(dateRangeEnd.getMonth() + 1).padStart(2, "0")}-${String(dateRangeEnd.getDate()).padStart(2, "0")}` : ""} onChange={(e) => { const v = e.target.value; if (v) { const [y, m, d] = v.split("-").map(Number); handleDateRangeChange(dateRangeStart, new Date(y, m - 1, d)) } else { handleDateRangeChange(dateRangeStart, undefined) } }} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReport}
              className="rounded-full h-10"
            >
              <Printer className="mr-1" size={16} />
              Print Report
            </Button>
          </div>
        </Card>
        <Card>
          <CardContent>
            {loading && expenses.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredExpenses.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || (dateRangeStart && dateRangeEnd)
                  ? "No expenses match your filters"
                  : 'No expenses found. Click "Add New Expense" to get started.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense Owner</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="hidden sm:table-cell">Attachment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-sm text-muted-foreground">{expense.expenseOwner || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{expense.expenseCategory?.name || expense.category || "-"}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{expense.description}</TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">₹{Number(expense.amount).toFixed(2)}</TableCell>
                        <TableCell className="capitalize whitespace-nowrap">{expense.paymentMethod.replace('_', ' ')}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">-</TableCell>
                        <TableCell>
                          {(canUpdate('expenses') || canDelete('expenses')) && (
                            <div className="flex gap-1 sm:gap-2">
                              {canUpdate('expenses') && (
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                                  <Edit2 size={16} />
                                </Button>
                              )}
                              {canDelete('expenses') && (
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
