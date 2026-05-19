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
import { Plus, Edit2, Trash2, X, Printer, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { godownApi, expenseCategoriesApi, type GodownExpense, type ExpenseCategory } from "@/lib/api"
import { toast } from "sonner"

export default function GodownExpensePage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [expenses, setExpenses] = useState<GodownExpense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [allExpensesForStats, setAllExpensesForStats] = useState<GodownExpense[]>([])
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)

  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    category: "other" as string,
    description: "", amount: "", paymentMethod: "cash" as GodownExpense['paymentMethod'], notes: "",
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
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await expenseCategoriesApi.getActive()
      setCategories(data)
      if (data.length > 0 && !editingId) {
        setFormData(prev => ({ ...prev, category: data[0].name.toLowerCase() }))
      }
    } catch (e) {
      console.error("Failed to fetch categories:", e)
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const startDateStr = dateRangeStart ? dateRangeStart.toISOString() : undefined;
      const endDateStr = dateRangeEnd ? dateRangeEnd.toISOString() : undefined;
      
      const res = await godownApi.expenses.getAll(currentPage, pageSize, searchQuery, startDateStr, endDateStr)
      if (res && res.data) {
        setExpenses(res.data)
        setTotalItems(res.total)
      } else {
        setExpenses(Array.isArray(res) ? res : [])
        setTotalItems(Array.isArray(res) ? res.length : 0)
      }
      
      // Fetch all for stats and reports
      const allRes = await godownApi.expenses.getAll(undefined, undefined, searchQuery, startDateStr, endDateStr)
      setAllExpensesForStats(allRes?.data || (Array.isArray(allRes) ? allRes : []))
    } catch { toast.error("Failed to load expenses") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (mounted) fetchExpenses()
  }, [mounted, currentPage, searchQuery, dateRangeStart, dateRangeEnd])

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
    setCurrentPage(1)
  }

  const stats = useMemo(() => {
    const total = allExpensesForStats.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const byCategory: Record<string, number> = {}
    categories.forEach(cat => {
      const catKey = cat.name.toLowerCase()
      byCategory[catKey] = allExpensesForStats
        .filter(e => (e.category || '').toLowerCase() === catKey)
        .reduce((sum, e) => sum + Number(e.amount), 0)
    })
    return { total, byCategory }
  }, [allExpensesForStats, categories])

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = { feed: '🌾', labor: '👷', medicine: '💊', utilities: '💡', equipment: '🔧', maintenance: '🔨', transportation: '🚚' }
    return icons[category] || '📝'
  }

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
            <div><strong>Total Expense:</strong> ₹${stats.total.toFixed(2)}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              ${allExpensesForStats.map(expense => `
                <tr>
                  <td>${new Date(expense.expenseDate).toLocaleDateString()}</td>
                  <td style="text-transform: capitalize;">${expense.category || "-"}</td>
                  <td>${expense.description}</td>
                  <td>₹${Number(expense.amount).toFixed(2)}</td>
                  <td style="text-transform: capitalize;">${(expense.paymentMethod || '').replace('_', ' ')}</td>
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
      printWindow.onload = () => printWindow.print()
    }
  }

  const resetForm = () => {
    setFormData({ expenseDate: new Date().toISOString().split("T")[0], category: categories.length > 0 ? categories[0].name.toLowerCase() : "other", description: "", amount: "", paymentMethod: "cash", notes: "" })
    setEditingId(null)
  }

  const handleEdit = (exp: GodownExpense) => {
    setFormData({ expenseDate: exp.expenseDate, category: exp.category, description: exp.description, amount: String(exp.amount), paymentMethod: exp.paymentMethod, notes: exp.notes || "" })
    setEditingId(exp.id); setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.description || !formData.amount) { toast.error("Required fields missing"); return }
    try {
      setLoading(true)
      const data = { ...formData, amount: parseFloat(formData.amount) }
      if (editingId) await godownApi.expenses.update(editingId, data)
      else await godownApi.expenses.create(data)
      toast.success("Saved")
      await fetchExpenses()
      resetForm(); setShowDialog(false)
    } catch { toast.error("Failed to save") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try { setLoading(true); await godownApi.expenses.delete(id); toast.success("Deleted"); await fetchExpenses() }
    catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Godown Expenses</h1><p className="text-muted-foreground">Track godown-related expenses</p></div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2" size={20} />New Expense</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingId ? "Edit Expense" : "New Expense"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Date *</Label><DatePicker value={formData.expenseDate} onChange={d => setFormData({ ...formData, expenseDate: d })} /></div>
                  <div className="space-y-2"><Label>Category *</Label>
                    <select className="w-full border rounded p-2 capitalize" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Description *</Label><Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label>Amount *</Label><Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label>Payment Method *</Label>
                  <select className="w-full border rounded p-2" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}>
                    <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="check">Check</option><option value="credit_card">Credit Card</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} disabled={loading} /></div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}><X size={20} /></Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Godown Expense (₹)</CardTitle>
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
                {categories.map(cat => {
                  const catKey = cat.name.toLowerCase()
                  return (
                    <div key={cat.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(catKey)}</span>
                        <span className="text-sm capitalize">{cat.name}</span>
                      </div>
                      <span className="text-sm font-medium">₹{(stats.byCategory[catKey] || 0).toFixed(0)}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

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
                    placeholder="Search expenses..." 
                    value={searchQuery} 
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                    className="w-[250px]" 
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handlePrintReport}>
                  <Printer className="mr-2" size={16} />
                  Print Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {expenses.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.expenseDate).toLocaleDateString()}</TableCell><TableCell>{e.category}</TableCell><TableCell>{e.description}</TableCell>
                    <TableCell className="font-semibold">₹{e.amount}</TableCell>
                    <TableCell>
                      {userRole !== 'staff' && userRole !== 'Staff' && (
                        <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => handleEdit(e)}><Edit2 size={16} /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)}><Trash2 size={16} /></Button></div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {totalItems > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
              <div className="text-sm text-gray-500">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * pageSize >= totalItems || loading}><ChevronRight size={16} /></Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
