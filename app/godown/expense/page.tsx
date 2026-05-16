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
import { Plus, Edit2, Trash2, X, Printer, ChevronLeft, ChevronRight } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { godownApi, type GodownExpense } from "@/lib/api"
import { toast } from "sonner"

export default function GodownExpensePage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [expenses, setExpenses] = useState<GodownExpense[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    category: "other" as GodownExpense['category'],
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
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const res = await godownApi.expenses.getAll(currentPage, pageSize, searchQuery)
      if (res && res.data) {
        setExpenses(res.data)
        setTotalItems(res.total)
      } else {
        setExpenses(Array.isArray(res) ? res : [])
        setTotalItems(Array.isArray(res) ? res.length : 0)
      }
    } catch { toast.error("Failed to load expenses") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (mounted) fetchExpenses()
  }, [mounted, currentPage, searchQuery])

  const resetForm = () => {
    setFormData({ expenseDate: new Date().toISOString().split("T")[0], category: "other", description: "", amount: "", paymentMethod: "cash", notes: "" })
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
                    <select className="w-full border rounded p-2" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                      <option value="feed">Feed</option><option value="labor">Labor</option><option value="medicine">Medicine</option><option value="utilities">Utilities</option>
                      <option value="equipment">Equipment</option><option value="maintenance">Maintenance</option><option value="transportation">Transportation</option><option value="other">Other</option>
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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <CardTitle>Expenses List</CardTitle>
              <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[250px]" />
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
