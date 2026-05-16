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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { godownApi, retailersApi, purchasesApi, type GodownSale, type GodownCage, type Retailer } from "@/lib/api"
import { toast } from "sonner"

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer", "advance"] as const
type PaymentMode = typeof PAYMENT_MODES[number]
interface PaymentRow { mode: PaymentMode; amount: string }
const emptyPayment = (): PaymentRow => ({ mode: "cash", amount: "" })

export default function GodownSalePage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [sales, setSales] = useState<GodownSale[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  const [formData, setFormData] = useState({
    saleDate: new Date().toISOString().split("T")[0],
    purchaseBillNo: "", invoiceNumber: "", retailerId: "",
    customerName: "", numberOfBirds: "", totalWeight: "",
    weightLoss: "", ratePerKg: "", totalAmount: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial", notes: "",
  })
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()])
  const [availableCages, setAvailableCages] = useState<any[]>([])
  const [selectedCageIds, setSelectedCageIds] = useState<Set<string>>(new Set())
  const [loadingCages, setLoadingCages] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role || "")
      } catch { }
    }
    fetchRetailers()
    fetchAvailableCages()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const res = await godownApi.sales.getAll(currentPage, pageSize, searchQuery)
      if (res && res.data) {
        setSales(res.data)
        setTotalItems(res.total)
      } else {
        setSales(Array.isArray(res) ? res : [])
        setTotalItems(Array.isArray(res) ? res.length : 0)
      }
    } catch { toast.error("Failed to load sales") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (mounted) fetchSales()
  }, [mounted, currentPage, searchQuery])

  const fetchAvailableCages = async () => {
    try {
      setLoadingCages(true)
      const data = await purchasesApi.getInGodownCages()
      setAvailableCages(Array.isArray(data) ? data.map(c => ({
        ...c, totalBirds: c.numberOfBirds, totalWeight: Number(c.godownInwardWeight || c.purchaseWeight || 0),
        soldBirds: c.numberOfBirds, soldWeight: Number(c.godownInwardWeight || c.purchaseWeight || 0), weightLoss: "0.00"
      })) : [])
    } catch { }
    finally { setLoadingCages(false) }
  }

  const fetchRetailers = async () => {
    try {
      const data = await retailersApi.getAll()
      if (Array.isArray(data)) setRetailers(data.filter(r => r.status === "active"))
    } catch { }
  }

  const resetForm = () => {
    setFormData({
      saleDate: new Date().toISOString().split("T")[0],
      purchaseBillNo: "", invoiceNumber: "", retailerId: "",
      customerName: "", numberOfBirds: "", totalWeight: "",
      weightLoss: "", ratePerKg: "", totalAmount: "",
      paymentStatus: "pending", notes: "",
    })
    setPayments([emptyPayment()])
    setSelectedCageIds(new Set())
    setEditingId(null)
    fetchAvailableCages()
  }

  const handleEdit = (sale: GodownSale) => {
    setFormData({
      saleDate: sale.saleDate,
      purchaseBillNo: (sale as any).purchaseBillNo || "",
      invoiceNumber: (sale as any).invoiceNumber || "",
      retailerId: (sale as any).retailerId || "",
      customerName: sale.customerName,
      numberOfBirds: String(sale.numberOfBirds || ""),
      totalWeight: String(sale.totalWeight || ""),
      weightLoss: String((sale as any).weightLoss || ""),
      ratePerKg: String(sale.ratePerKg || ""),
      totalAmount: String(sale.totalAmount || ""),
      paymentStatus: (sale as any).paymentStatus || "pending",
      notes: sale.notes || "",
    })
    const salePayments = (sale as any).payments
    if (salePayments?.length) setPayments(salePayments.map((p: any) => ({ mode: p.paymentMode || "cash", amount: String(p.amount) })))
    else setPayments([emptyPayment()])
    setEditingId(sale.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.customerName || !formData.numberOfBirds) { toast.error("Required fields missing"); return }
    try {
      setLoading(true)
      const data = {
        ...formData,
        numberOfBirds: parseInt(formData.numberOfBirds) || 0,
        totalWeight: parseFloat(formData.totalWeight) || 0,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        ratePerKg: parseFloat(formData.ratePerKg) || 0,
        weightLoss: parseFloat(formData.weightLoss) || 0,
        amountReceived: payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
        payments: payments.filter(p => parseFloat(p.amount) > 0).map(p => ({ paymentMode: p.mode, amount: parseFloat(p.amount) })),
        cages: Array.from(selectedCageIds).map(id => {
          const c = availableCages.find(it => it.id === id);
          return { id, numberOfBirds: parseInt(c?.soldBirds || 0), cageWeight: parseFloat(c?.soldWeight || 0), weightLoss: parseFloat(c?.weightLoss || 0) }
        })
      }
      if (editingId) await godownApi.sales.update(editingId, data)
      else await godownApi.sales.create(data)
      toast.success("Saved")
      await fetchSales()
      resetForm()
      setShowDialog(false)
    } catch { toast.error("Failed to save") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try { setLoading(true); await godownApi.sales.delete(id); toast.success("Deleted"); await fetchSales() }
    catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  const toggleCage = (id: string) => {
    setSelectedCageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      const sel = availableCages.filter(c => next.has(c.id))
      const birds = sel.reduce((s, c) => s + Number(c.soldBirds || 0), 0)
      const wt = sel.reduce((s, c) => s + Number(c.soldWeight || 0), 0)
      const loss = sel.reduce((s, c) => s + Number(c.weightLoss || 0), 0)
      setFormData(f => ({ ...f, numberOfBirds: String(birds), totalWeight: wt.toFixed(2), weightLoss: loss.toFixed(2), totalAmount: (wt * (parseFloat(f.ratePerKg) || 0)).toFixed(2) }))
      return next
    })
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Godown Sales</h1><p className="text-muted-foreground">Record sales from godown</p></div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2" size={20} />New Sale</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader><DialogTitle>{editingId ? "Edit Sale" : "New Sale"}</DialogTitle></DialogHeader>
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Date *</Label><DatePicker value={formData.saleDate} onChange={d => setFormData({ ...formData, saleDate: d })} disabled={loading} /></div>
                  <div className="space-y-2"><Label>Invoice No</Label><Input value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="Invoice" disabled={loading} /></div>
                </div>
                <div className="space-y-2"><Label>Retailer</Label>
                  <Select value={formData.retailerId || "__none__"} onValueChange={v => { const r = retailers.find(it => it.id === v); setFormData({ ...formData, retailerId: v === "__none__" ? "" : v, customerName: r ? r.name : "" }) }} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none__">None</SelectItem>{retailers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Customer *</Label><Input value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} disabled={loading} /></div>

                {availableCages.length > 0 && (
                  <div className="border rounded bg-purple-50 p-3 space-y-2 text-xs">
                    <strong>Available Cages</strong>
                    <Table>
                      <TableHeader><TableRow><TableHead></TableHead><TableHead>Cage</TableHead><TableHead>Birds</TableHead><TableHead>Weight</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {availableCages.map(c => (
                          <TableRow key={c.id} className={selectedCageIds.has(c.id) ? "bg-green-50" : ""} onClick={() => toggleCage(c.id)}>
                            <TableCell><input type="checkbox" checked={selectedCageIds.has(c.id)} readOnly /></TableCell>
                            <TableCell>{c.cageId}</TableCell><TableCell>{c.soldBirds}</TableCell><TableCell>{c.soldWeight}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Birds *</Label><Input type="number" value={formData.numberOfBirds} onChange={e => setFormData({ ...formData, numberOfBirds: e.target.value })} disabled={loading} /></div>
                  <div className="space-y-2"><Label>Rate/Kg</Label><Input type="number" step="0.01" value={formData.ratePerKg} onChange={e => { const r = e.target.value; setFormData({ ...formData, ratePerKg: r, totalAmount: (parseFloat(formData.totalWeight || '0') * parseFloat(r || '0')).toFixed(2) }) }} disabled={loading} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" step="0.01" value={formData.totalWeight} onChange={e => { const w = e.target.value; setFormData({ ...formData, totalWeight: w, totalAmount: (parseFloat(w || '0') * parseFloat(formData.ratePerKg || '0')).toFixed(2) }) }} disabled={loading} /></div>
                  <div className="space-y-2"><Label>Loss (kg)</Label><Input type="number" step="0.01" value={formData.weightLoss} onChange={e => setFormData({ ...formData, weightLoss: e.target.value })} disabled={loading} /></div>
                </div>
                <div className="space-y-2"><Label>Total Amount</Label><Input value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })} disabled={loading} /></div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1" disabled={loading}>{loading ? "Saving..." : "Save Sale"}</Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}><X size={20} /></Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <CardTitle>Sales List</CardTitle>
              <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[250px]" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Birds</TableHead><TableHead>Weight</TableHead><TableHead>Total</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {sales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{new Date(s.saleDate).toLocaleDateString()}</TableCell><TableCell>{(s as any).invoiceNumber || "-"}</TableCell><TableCell>{s.customerName}</TableCell>
                    <TableCell>{s.numberOfBirds}</TableCell><TableCell>{s.totalWeight}</TableCell><TableCell className="font-bold">₹{s.totalAmount}</TableCell>
                    <TableCell>
                      {userRole !== 'staff' && userRole !== 'Staff' && (
                        <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Edit2 size={16} /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></Button></div>
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
