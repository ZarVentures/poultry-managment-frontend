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
import { Plus, Edit2, Trash2, X, Download, Printer } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { expensesApi, expenseCategoriesApi, type Expense as ApiExpense, type ExpenseCategory } from "@/lib/api"
import { toast } from "sonner"

export default function ExpensesPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
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
    categoryId: "",
    description: "",
    amount: "",
    paymentMethod: "cash" as "cash" | "bank_transfer" | "check" | "credit_card",
    notes: "",
  })

  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role || "")
      } catch { }
    }
    fetchExpenses()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await expenseCategoriesApi.getAll()
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
      categoryId: categories.length > 0 ? categories[0].id : "",
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
      categoryId: expense.categoryId || (categories.find(c => c.name.toLowerCase() === expense.category?.toLowerCase())?.id) || "",
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
        categoryId: formData.categoryId,
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
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
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
                  <td>${new Date(expense.expenseDate).toLocaleDateString()}</td>
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
      equipment: '🔧',
      maintenance: '🔨',
      transportation: '🚚',
    }
    return icons[category] || '📝'
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Expenses & Financial Tracking</h1>
            <p className="text-muted-foreground">Track all farm expenses and costs</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="dialog-description">
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

                <div className="grid grid-cols-2 gap-4">
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
                      value={formData.categoryId}
                      onValueChange={(value: any) => setFormData({ ...formData, categoryId: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
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

                <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense (₹)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{stats.total.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense By Category</CardTitle>
              <p className="text-xs text-muted-foreground">Expenses breakdown by category</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.slice(0, 6).map(cat => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getCategoryIcon(cat.name.toLowerCase())}</span>
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <span className="text-sm font-medium">₹{(stats.byCategory[cat.id] || 0).toFixed(0)}</span>
                  </div>
                ))}
                {categories.length === 0 && <p className="text-sm text-muted-foreground animate-pulse">Loading categories...</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold">All Expenses</h2>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onDateRangeChange={handleDateRangeChange}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Filter:</Label>
                  <Input
                    placeholder="Search by owner, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[250px]"
                  />
                </div>
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-2" size={16} />
                  Download PDF
                </Button> */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintReport}
                >
                  <Printer className="mr-2" size={16} />
                  Print Report
                </Button>
              </div>
            </div>
          </CardHeader>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense Owner</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Attachment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-sm text-muted-foreground">{expense.expenseOwner || "-"}</TableCell>
                        <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{expense.expenseCategory?.name || expense.category || "-"}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell className="font-semibold">₹{Number(expense.amount).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{expense.paymentMethod.replace('_', ' ')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">-</TableCell>
                        <TableCell>
                          {userRole !== 'staff' && userRole !== 'Staff' && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                                <Trash2 size={16} />
                              </Button>
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
