"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X, Printer } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { godownApi, type GodownExpense } from "@/lib/api"
import { toast } from "sonner"

export default function GodownExpensePage() {
  const [expenses, setExpenses] = useState<GodownExpense[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    amount: "",
    notes: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const data = await godownApi.expenses.getAll()
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
      category: "",
      description: "",
      amount: "",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (expense: GodownExpense) => {
    setFormData({
      expenseDate: expense.expenseDate,
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      notes: expense.notes || "",
    })
    setEditingId(expense.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.description || !formData.amount) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const expenseData = {
        expenseDate: formData.expenseDate,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        notes: formData.notes,
      }

      if (editingId) {
        await godownApi.expenses.update(editingId, expenseData)
        toast.success("Expense updated successfully")
      } else {
        await godownApi.expenses.create(expenseData)
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
      await godownApi.expenses.delete(id)
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
    return { totalExpense }
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(query) ||
          (expense.category && expense.category.toLowerCase().includes(query))
      )
    }

    // Apply date range filter
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

  const handlePrintReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Godown Expenses Report</title>
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
            <h1>Godown Expenses Report</h1>
            <div><strong>Total Expense:</strong> ₹${stats.totalExpense.toFixed(2)}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map(expense => `
                <tr>
                  <td>${new Date(expense.expenseDate).toLocaleDateString()}</td>
                  <td>${expense.category || "-"}</td>
                  <td>${expense.description}</td>
                  <td>₹${Number(expense.amount).toFixed(2)}</td>
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

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Godown Expenses</h1>
            <p className="text-muted-foreground">Track godown-related expenses</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Expense" : "New Expense"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit godown expense details" : "Create a new godown expense"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
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
                    <Label>Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Feed, Labor, Utilities, etc."
                      disabled={loading}
                    />
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

                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    disabled={loading}
                  />
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Godown Expense (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{stats.totalExpense.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Expenses List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage godown expenses</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onDateRangeChange={handleDateRangeChange}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Filter:</Label>
                  <Input
                    placeholder="Search by description, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[250px]"
                  />
                </div>
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
                  : "No expenses found"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                        <TableCell>{expense.category || "-"}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>₹{Number(expense.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
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
