"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Eye, Paperclip, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { purchasesApi, farmersApi, vehiclesApi, type PurchaseOrder as ApiPurchaseOrder, type Farmer } from "@/lib/api"
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/api-base-url"

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer"] as const
type PaymentMode = typeof PAYMENT_MODES[number]
interface PaymentRow { mode: PaymentMode; amount: string; isAdvance: boolean }
const emptyPayment = (): PaymentRow => ({ mode: "cash", amount: "", isAdvance: false })
const emptyCage = () => ({ cageId: "", numberOfBirds: "", cageWeight: "" })

export default function PurchasesPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [purchases, setPurchases] = useState<ApiPurchaseOrder[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalItems, setTotalItems] = useState(0)

  const [viewingPurchase, setViewingPurchase] = useState<ApiPurchaseOrder | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [allowEditBillNo, setAllowEditBillNo] = useState(false)

  const [formData, setFormData] = useState({
    orderNumber: "", supplierName: "", orderDate: new Date().toISOString().split("T")[0], dueDate: "",
    status: "pending" as "pending" | "received" | "cancelled", branch: "", farmerId: "", farmerMobile: "", farmLocation: "",
    vehicleId: "", purchasePaymentStatus: "pending" as "paid" | "pending" | "partial", ratePerKg: "",
    transportCharges: "", otherCharges: "", notes: "",
  })
  const [cages, setCages] = useState([emptyCage()])
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()])

  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("user")
    if (userData) { try { const user = JSON.parse(userData); setUserRole(user.role || "") } catch { } }
    fetchFarmers(); fetchVehicles()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const res = await purchasesApi.getAll({ page: currentPage, limit: pageSize, supplier: searchQuery, status: filterPaymentStatus })
      if (res && res.data) {
        setPurchases(res.data)
        setTotalItems(res.total)
      } else {
        setPurchases(Array.isArray(res) ? res : [])
        setTotalItems(Array.isArray(res) ? res.length : 0)
      }
    } catch { toast.error("Failed to load purchases") }
    finally { setLoading(false) }
  }

  useEffect(() => { if (mounted) fetchPurchases() }, [mounted, currentPage, searchQuery, filterPaymentStatus])

  const fetchFarmers = async () => { try { const data = await farmersApi.getActive(); setFarmers(Array.isArray(data) ? data as Farmer[] : []) } catch { setFarmers([]) } }
  const fetchVehicles = async () => { try { const data = await vehiclesApi.getAll(); setVehicles(Array.isArray(data) ? data : []) } catch { setVehicles([]) } }

  const fetchNextOrderNumber = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiBaseUrl()}/purchases/next-order-number`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        return data.nextOrderNumber || ""
      }
    } catch (error) {
      console.error('Failed to fetch next order number:', error)
    }
    return ""
  }

  const resetForm = async () => {
    const nextNumber = editingId ? "" : await fetchNextOrderNumber()
    setFormData({ orderNumber: nextNumber, supplierName: "", orderDate: new Date().toISOString().split("T")[0], dueDate: "", status: "pending", branch: "", farmerId: "", farmerMobile: "", farmLocation: "", vehicleId: "", purchasePaymentStatus: "pending", ratePerKg: "", transportCharges: "", otherCharges: "", notes: "" })
    setCages([emptyCage()]); setPayments([emptyPayment()]); setEditingId(null); setInvoiceFile(null)
    setAllowEditBillNo(false)
  }

  const handleFarmerChange = (id: string) => {
    const f = farmers.find(it => it.id === id)
    if (f) setFormData(prev => ({ ...prev, farmerId: id, supplierName: f.name, farmerMobile: f.phone || "", farmLocation: f.address || "" }))
  }

  const handleEdit = async (p: ApiPurchaseOrder) => {
    let full = p
    try { full = await purchasesApi.getOne(p.id) } catch { }
    setFormData({ orderNumber: full.orderNumber, supplierName: full.supplierName, orderDate: full.orderDate, dueDate: full.dueDate || "", status: full.status, branch: (full as any).branch || "", farmerId: full.farmerId || "", farmerMobile: full.farmerMobile || "", farmLocation: full.farmLocation || "", vehicleId: full.vehicleId || "", purchasePaymentStatus: full.purchasePaymentStatus || "pending", ratePerKg: String(full.ratePerKg || ""), transportCharges: String(full.transportCharges || ""), otherCharges: String((full as any).otherCharges || ""), notes: full.notes || "" })
    setCages(full.cages?.length ? full.cages.map(c => ({ cageId: c.cageId || "", numberOfBirds: String(c.numberOfBirds), cageWeight: String((c as any).purchaseWeight || c.cageWeight || "") })) : [emptyCage()])
    setPayments((full as any).payments?.length ? (full as any).payments.map((py: any) => ({ mode: py.paymentMode as PaymentMode, amount: String(py.amount), isAdvance: py.isAdvance ?? false })) : [emptyPayment()])
    setEditingId(full.id); setInvoiceFile(null); setShowDialog(true)
  }

  const handleSave = async () => {
    // orderNumber is now optional - backend will auto-generate if not provided
    if (!formData.supplierName) { toast.error("Supplier is required"); return }
    try {
      setLoading(true)
      const payload = { ...formData, totalWeight: String(cages.reduce((s, c) => s + (parseFloat(c.cageWeight) || 0), 0)), cages: cages.filter(c => c.numberOfBirds).map(c => ({ cageId: c.cageId || undefined, numberOfBirds: parseInt(c.numberOfBirds), cageWeight: parseFloat(c.cageWeight) })), payments: payments.filter(p => parseFloat(p.amount) > 0).map(p => ({ paymentMode: p.mode, amount: p.amount, isAdvance: p.isAdvance })) }
      let saved: ApiPurchaseOrder
      if (editingId) saved = await purchasesApi.update(editingId, payload)
      else saved = await purchasesApi.create(payload)
      
      // Update form with auto-generated order number if it was empty
      if (saved?.orderNumber && !formData.orderNumber) {
        setFormData(prev => ({ ...prev, orderNumber: saved.orderNumber }))
        toast.success(`Saved - Bill No: ${saved.orderNumber}`)
      } else {
        toast.success("Saved")
      }
      
      if (invoiceFile && saved?.id) await purchasesApi.uploadInvoice(saved.id, invoiceFile)
      fetchPurchases()
      // Don't reset form immediately so user can see the generated number
      if (editingId) {
        resetForm()
        setShowDialog(false)
      }
    } catch (err: any) { toast.error(err.message || "Failed to save") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return
    try { setLoading(true); await purchasesApi.delete(id); toast.success("Deleted"); fetchPurchases() } catch { toast.error("Failed") }
    finally { setLoading(false) }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Purchase Orders</h1><p className="text-muted-foreground">Manage purchase orders</p></div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2" size={20} />New Purchase</Button></DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader><DialogTitle>{editingId ? "Edit" : "New"} Purchase</DialogTitle></DialogHeader>
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
                <Card className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Bill No (Auto-generated)</Label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" checked={allowEditBillNo} onChange={e => setAllowEditBillNo(e.target.checked)} className="cursor-pointer" />
                          <span>Edit manually</span>
                        </label>
                      </div>
                      <Input value={formData.orderNumber} onChange={e => setFormData({ ...formData, orderNumber: e.target.value })} placeholder="Auto-generated on save" readOnly={!allowEditBillNo} className={!allowEditBillNo ? "bg-gray-50" : ""} />
                    </div>
                    <div className="space-y-2"><Label>Date *</Label><DatePicker value={formData.orderDate} onChange={d => setFormData({ ...formData, orderDate: d })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Farmer *</Label>
                      <Select value={formData.farmerId} onValueChange={handleFarmerChange}>
                        <SelectTrigger><SelectValue placeholder="Select farmer" /></SelectTrigger>
                        <SelectContent>{farmers.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Vehicle</Label>
                      <Select value={formData.vehicleId} onValueChange={v => setFormData({ ...formData, vehicleId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                        <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 space-y-4">
                  <Label>Cages</Label>
                  {cages.map((c, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <Input placeholder="ID" value={c.cageId} onChange={e => setCages(cages.map((it, idx) => idx === i ? { ...it, cageId: e.target.value } : it))} />
                      <Input type="number" placeholder="Birds" value={c.numberOfBirds} onChange={e => setCages(cages.map((it, idx) => idx === i ? { ...it, numberOfBirds: e.target.value } : it))} />
                      <Input type="number" placeholder="Weight" value={c.cageWeight} onChange={e => setCages(cages.map((it, idx) => idx === i ? { ...it, cageWeight: e.target.value } : it))} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setCages([...cages, emptyCage()])}>+ Add Cage</Button>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2"><Label>Rate/Kg</Label><Input type="number" value={formData.ratePerKg} onChange={e => setFormData({ ...formData, ratePerKg: e.target.value })} /></div>
                  </div>
                </Card>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading} className="flex-1">{loading ? "Saving..." : "Save Order"}</Button>
                  {!editingId && formData.orderNumber && (
                    <Button variant="outline" onClick={() => { resetForm(); setShowDialog(false) }} disabled={loading}>Close</Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center gap-2">
              <CardTitle>Purchases List</CardTitle>
              <div className="flex gap-2">
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[200px]" />
                <Select value={filterPaymentStatus || "__all__"} onValueChange={v => setFilterPaymentStatus(v === "__all__" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">All Status</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="partial">Partial</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Bill No</TableHead><TableHead>Supplier</TableHead><TableHead>Date</TableHead><TableHead>Weight</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {purchases.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.orderNumber}</TableCell><TableCell>{p.supplierName}</TableCell><TableCell>{new Date(p.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>{p.totalWeight}kg</TableCell><TableCell>₹{p.netAmount || p.totalAmount}</TableCell>
                    <TableCell>{p.purchasePaymentStatus}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Edit2 size={16} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></Button>
                      </div>
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
