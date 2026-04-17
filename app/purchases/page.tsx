"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Download, Printer, Eye, Paperclip, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { purchasesApi, farmersApi, vehiclesApi, type PurchaseOrder as ApiPurchaseOrder, type Farmer } from "@/lib/api"
import { toast } from "sonner"

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer"] as const
type PaymentMode = typeof PAYMENT_MODES[number]

interface PaymentRow { mode: PaymentMode; amount: string }
const emptyPayment = (): PaymentRow => ({ mode: "cash", amount: "" })
const emptyCage = () => ({ cageId: "", numberOfBirds: "", cageWeight: "" })

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<ApiPurchaseOrder[]>([])
  const [invoiceList, setInvoiceList] = useState<Array<{ id: string; orderNumber: string; orderDate: string; supplierName: string }>>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>()
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>()
  const [viewingPurchase, setViewingPurchase] = useState<ApiPurchaseOrder | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    orderNumber: "",
    supplierName: "",
    orderDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "pending" as "pending" | "received" | "cancelled",
    branch: "",
    farmerId: "",
    farmerMobile: "",
    farmLocation: "",
    vehicleId: "",
    purchasePaymentStatus: "pending" as "paid" | "pending" | "partial",
    ratePerKg: "",
    transportCharges: "",
    otherCharges: "",
    notes: "",
  })
  const [cages, setCages] = useState([emptyCage()])
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()])

  useEffect(() => {
    setMounted(true)
    fetchPurchases()
    fetchInvoiceList()
    fetchFarmers()
    fetchVehicles()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const data = await purchasesApi.getAll()
      setPurchases(Array.isArray(data) ? data : [])
    } catch { toast.error("Failed to load purchases") }
    finally { setLoading(false) }
  }

  const fetchInvoiceList = async () => {
    try { setInvoiceList(Array.isArray(await purchasesApi.getInvoiceList()) ? await purchasesApi.getInvoiceList() : []) }
    catch { setInvoiceList([]) }
  }

  const fetchFarmers = async () => {
    try { setFarmers(Array.isArray(await farmersApi.getActive()) ? await farmersApi.getActive() as Farmer[] : []) }
    catch { setFarmers([]) }
  }

  const fetchVehicles = async () => {
    try { setVehicles(Array.isArray(await vehiclesApi.getAll()) ? await vehiclesApi.getAll() : []) }
    catch { setVehicles([]) }
  }

  const resetForm = () => {
    setFormData({
      orderNumber: "", supplierName: "",
      orderDate: new Date().toISOString().split("T")[0],
      dueDate: "", status: "pending", branch: "",
      farmerId: "", farmerMobile: "", farmLocation: "", vehicleId: "",
      purchasePaymentStatus: "pending", ratePerKg: "",
      transportCharges: "", otherCharges: "", notes: "",
    })
    setCages([emptyCage()])
    setPayments([emptyPayment()])
    setEditingId(null)
    setInvoiceFile(null)
  }

  const handleFarmerChange = (farmerId: string) => {
    const f = farmers.find(f => f.id === farmerId)
    if (f) setFormData(prev => ({ ...prev, farmerId, supplierName: f.name, farmerMobile: f.phone || "", farmLocation: f.address || "" }))
  }

  const handleEdit = async (purchase: ApiPurchaseOrder) => {
    // Fetch full detail to get cages and payments
    let full: ApiPurchaseOrder = purchase
    try {
      full = await purchasesApi.getOne(purchase.id)
    } catch { /* fallback to list data */ }

    setFormData({
      orderNumber: full.orderNumber,
      supplierName: full.supplierName,
      orderDate: full.orderDate,
      dueDate: full.dueDate || "",
      status: full.status,
      branch: (full as any).branch || "",
      farmerId: full.farmerId || "",
      farmerMobile: full.farmerMobile || "",
      farmLocation: full.farmLocation || "",
      vehicleId: full.vehicleId || "",
      purchasePaymentStatus: full.purchasePaymentStatus || "pending",
      ratePerKg: String(full.ratePerKg || ""),
      transportCharges: String(full.transportCharges || ""),
      otherCharges: String((full as any).otherCharges || ""),
      notes: full.notes || "",
    })
    setCages(full.cages && full.cages.length > 0
      ? full.cages.map(c => ({ cageId: c.cageId || "", numberOfBirds: String(c.numberOfBirds), cageWeight: String(c.cageWeight) }))
      : [emptyCage()])
    setPayments((full as any).payments && (full as any).payments.length > 0
      ? (full as any).payments.map((p: any) => ({ mode: p.paymentMode as PaymentMode, amount: String(p.amount) }))
      : [emptyPayment()])
    setEditingId(full.id)
    setInvoiceFile(null)
    setShowDialog(true)
  }

  // Cage helpers
  const addCage = () => setCages(prev => [...prev, emptyCage()])
  const removeCage = (i: number) => setCages(prev => prev.filter((_, idx) => idx !== i))
  const updateCage = (i: number, field: string, value: string) => setCages(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))

  // Payment helpers
  const addPayment = () => setPayments(prev => [...prev, emptyPayment()])
  const removePayment = (i: number) => setPayments(prev => prev.filter((_, idx) => idx !== i))
  const updatePayment = (i: number, field: keyof PaymentRow, value: string) => setPayments(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))

  // Calculations
  const totalWeight = cages.reduce((s, c) => s + (parseFloat(c.cageWeight) || 0), 0)
  const totalAmount = totalWeight * (parseFloat(formData.ratePerKg) || 0)
  const transportCharges = parseFloat(formData.transportCharges) || 0
  const otherCharges = parseFloat(formData.otherCharges) || 0
  const grossAmount = totalAmount + transportCharges + otherCharges
  const netAmount = grossAmount
  const totalPaymentMade = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceAmount = Math.max(0, netAmount - totalPaymentMade)

  const handleSave = async () => {
    if (!formData.orderNumber || !formData.supplierName) {
      toast.error("Purchase Bill No and Supplier are required")
      return
    }
    try {
      setLoading(true)
      const validCages = cages.filter(c => c.numberOfBirds && c.cageWeight)
        .map(c => ({ cageId: c.cageId || undefined, numberOfBirds: parseInt(c.numberOfBirds) || 0, cageWeight: parseFloat(c.cageWeight) || 0 }))
      const validPayments = payments.filter(p => p.amount && parseFloat(p.amount) > 0)
        .map(p => ({ paymentMode: p.mode, amount: p.amount }))

      const payload: any = {
        orderNumber: formData.orderNumber,
        supplierName: formData.supplierName,
        orderDate: formData.orderDate,
        dueDate: formData.dueDate || undefined,
        status: formData.status,
        branch: formData.branch || undefined,
        farmerId: formData.farmerId || undefined,
        farmerMobile: formData.farmerMobile || undefined,
        farmLocation: formData.farmLocation || undefined,
        vehicleId: formData.vehicleId || undefined,
        totalWeight: String(totalWeight),
        ratePerKg: formData.ratePerKg || undefined,
        transportCharges: formData.transportCharges || undefined,
        otherCharges: formData.otherCharges || undefined,
        purchasePaymentStatus: formData.purchasePaymentStatus,
        notes: formData.notes || undefined,
        cages: validCages,
        payments: validPayments,
      }

      let saved: ApiPurchaseOrder
      if (editingId) {
        saved = await purchasesApi.update(editingId, payload)
        toast.success("Purchase order updated")
      } else {
        saved = await purchasesApi.create(payload)
        toast.success("Purchase order created")
      }

      if (invoiceFile && saved?.id) {
        try {
          setUploadingFile(true)
          await purchasesApi.uploadInvoice(saved.id, invoiceFile)
          toast.success("Invoice attachment uploaded")
        } catch { toast.error("Order saved but file upload failed") }
        finally { setUploadingFile(false) }
      }

      await fetchPurchases()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save purchase order")
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this purchase order?")) return
    try {
      setLoading(true)
      await purchasesApi.delete(id)
      toast.success("Deleted")
      await fetchPurchases()
    } catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  const stats = useMemo(() => ({
    total: purchases.length,
    totalBirds: purchases.reduce((s, p) => s + (p.cages || []).reduce((cs, c) => cs + Number(c.numberOfBirds || 0), 0), 0),
    totalValue: purchases.reduce((s, p) => s + Number(p.netAmount || p.totalAmount || 0), 0),
    totalPaid: purchases.reduce((s, p) => s + Number(p.totalPaymentMade || 0), 0),
  }), [purchases])

  const filtered = useMemo(() => {
    let list = [...purchases]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => p.orderNumber.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q))
    }
    if (dateRangeStart && dateRangeEnd) {
      const s = new Date(dateRangeStart); s.setHours(0,0,0,0)
      const e = new Date(dateRangeEnd); e.setHours(23,59,59,999)
      list = list.filter(p => { const d = new Date(p.orderDate); return d >= s && d <= e })
    }
    return list
  }, [purchases, searchQuery, dateRangeStart, dateRangeEnd])

  function FarmerSearch({ value, onChange, disabled }: { value: string; onChange: (id: string) => void; disabled?: boolean }) {
    const [query, setQuery] = useState("")
    const [open, setOpen] = useState(false)
    const selected = farmers.find(f => f.id === value)
    const filtered = farmers.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    return (
      <div className="relative">
        <Input
          value={open ? query : (selected?.name || "")}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setQuery(""); setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={`Search farmer (${farmers.length} available)`}
          disabled={disabled}
        />
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <div className="px-3 py-2 text-sm text-muted-foreground">No farmers found</div>
              : filtered.map(f => (
                <div key={f.id} className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                  onMouseDown={() => { onChange(f.id); setOpen(false) }}>
                  {f.name}
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage your purchase orders</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="mr-2" size={20} />Add New Purchase</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" aria-describedby="purchase-dialog-desc">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
                <p id="purchase-dialog-desc" className="sr-only">Purchase order form</p>
              </DialogHeader>
              <div className="space-y-5 overflow-y-auto flex-1 pr-1 pb-2">

                {/* Section 1: Header Information */}
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50 border-b border-blue-100 py-3">
                    <CardTitle className="text-blue-900 text-base">Section 1: Header Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Purchase Bill No *</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">PO-</span>
                          <Input
                            value={formData.orderNumber.replace('PO-', '')}
                            onChange={e => setFormData(prev => ({ ...prev, orderNumber: 'PO-' + e.target.value }))}
                            placeholder="001, 002..."
                            className="rounded-l-none"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Purchase Date *</Label>
                        <DatePicker value={formData.orderDate} onChange={date => setFormData(prev => ({ ...prev, orderDate: date }))} disabled={loading} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Input value={formData.branch} onChange={e => setFormData(prev => ({ ...prev, branch: e.target.value }))} placeholder="Branch name" disabled={loading} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Farmer Name *</Label>
                        <FarmerSearch value={formData.farmerId} onChange={handleFarmerChange} disabled={loading} />
                      </div>
                      <div className="space-y-2">
                        <Label>Farmer Mobile</Label>
                        <Input value={formData.farmerMobile} placeholder="Auto-filled" disabled className="bg-gray-50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Farm Location</Label>
                        <Input value={formData.farmLocation} placeholder="Auto-filled" disabled className="bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle No</Label>
                        <Select value={formData.vehicleId} onValueChange={v => setFormData(prev => ({ ...prev, vehicleId: v }))} disabled={loading}>
                          <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                          <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Attach Invoice (PDF/JPG/PNG)</Label>
                      <div className="flex items-center gap-3">
                        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                          onChange={e => setInvoiceFile(e.target.files?.[0] || null)} />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                          <Paperclip size={14} className="mr-1" /> Choose File
                        </Button>
                        {invoiceFile && (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded">
                            <span>{invoiceFile.name}</span>
                            <button onClick={() => setInvoiceFile(null)}><X size={12} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional notes" rows={2} disabled={loading} />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Bird Details */}
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50 border-b border-green-100 py-3">
                    <CardTitle className="text-green-900 text-base">Section 2: Bird Details (Broiler)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <Label className="text-sm font-medium">Cage ID</Label>
                        <Label className="text-sm font-medium">Number of Birds</Label>
                        <Label className="text-sm font-medium">Cage Weight (Kg)</Label>
                      </div>
                      {cages.map((cage, i) => (
                        <div key={i} className="grid grid-cols-3 gap-4">
                          <Input placeholder="Cage ID" value={cage.cageId} onChange={e => updateCage(i, "cageId", e.target.value)} disabled={loading} />
                          <Input type="number" placeholder="Birds" value={cage.numberOfBirds} onChange={e => updateCage(i, "numberOfBirds", e.target.value)} disabled={loading} />
                          <div className="flex gap-1">
                            <Input type="number" step="0.01" placeholder="Weight" value={cage.cageWeight} onChange={e => updateCage(i, "cageWeight", e.target.value)} disabled={loading} />
                            {cages.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeCage(i)} className="px-2 text-red-500"><X size={14} /></Button>}
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addCage} disabled={loading}>
                        <Plus size={14} className="mr-1" /> Add Cage
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Total Weight (Kg)</Label>
                        <Input value={totalWeight.toFixed(2)} disabled className="bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Rate per Kg (₹)</Label>
                        <Input type="number" step="0.01" value={formData.ratePerKg} onChange={e => setFormData(prev => ({ ...prev, ratePerKg: e.target.value }))} placeholder="0.00" disabled={loading} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Bird Amount (₹)</Label>
                      <Input value={`₹${totalAmount.toFixed(2)}`} disabled className="bg-gray-50 font-semibold" />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Charges */}
                <Card className="border-orange-200">
                  <CardHeader className="bg-orange-50 border-b border-orange-100 py-3">
                    <CardTitle className="text-orange-900 text-base">Section 3: Charges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Transport Charges (₹)</Label>
                        <Input type="number" step="0.01" value={formData.transportCharges} onChange={e => setFormData(prev => ({ ...prev, transportCharges: e.target.value }))} placeholder="0.00" disabled={loading} />
                      </div>
                      <div className="space-y-2">
                        <Label>Other Charges (₹)</Label>
                        <Input type="number" step="0.01" value={formData.otherCharges} onChange={e => setFormData(prev => ({ ...prev, otherCharges: e.target.value }))} placeholder="0.00" disabled={loading} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Gross Amount (₹)</Label>
                        <Input value={`₹${grossAmount.toFixed(2)}`} disabled className="bg-gray-50 font-semibold" />
                      </div>
                      <div className="space-y-2">
                        <Label>Net Amount (₹)</Label>
                        <Input value={`₹${netAmount.toFixed(2)}`} disabled className="bg-gray-50 font-semibold text-green-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 4: Payment */}
                <Card className="border-purple-200">
                  <CardHeader className="bg-purple-50 border-b border-purple-100 py-3">
                    <CardTitle className="text-purple-900 text-base">Section 4: Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Payment Status</Label>
                      <Select value={formData.purchasePaymentStatus} onValueChange={(v: any) => setFormData(prev => ({ ...prev, purchasePaymentStatus: v }))} disabled={loading}>
                        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <Label className="text-sm font-medium">Payment Mode</Label>
                        <Label className="text-sm font-medium">Amount (₹)</Label>
                      </div>
                      {payments.map((p, i) => (
                        <div key={i} className="grid grid-cols-2 gap-4">
                          <Select value={p.mode} onValueChange={v => updatePayment(i, "mode", v)} disabled={loading}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1">
                            <Input type="number" step="0.01" placeholder="0.00" value={p.amount} onChange={e => updatePayment(i, "amount", e.target.value)} disabled={loading} />
                            {payments.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removePayment(i)} className="px-2 text-red-500"><X size={14} /></Button>}
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addPayment} disabled={loading}>
                        <Plus size={14} className="mr-1" /> Add Payment Mode
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-2">
                        <Label>Total Payment Made (₹)</Label>
                        <Input value={`₹${totalPaymentMade.toFixed(2)}`} disabled className="bg-gray-50 font-semibold text-green-700" />
                      </div>
                      <div className="space-y-2">
                        <Label>Balance Amount (₹)</Label>
                        <Input value={`₹${balanceAmount.toFixed(2)}`} disabled className="bg-gray-50 font-semibold text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>Cancel</Button>
                  <Button onClick={handleSave} disabled={loading || uploadingFile} className="bg-green-600 hover:bg-green-700">
                    {loading || uploadingFile ? "Saving..." : editingId ? "Update" : "Create Purchase Order"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Birds</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.totalBirds}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Value (₹)</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">₹{stats.totalValue.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Paid (₹)</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">₹{stats.totalPaid.toFixed(2)}</div></CardContent></Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <CardTitle>Purchase Orders List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all purchase orders</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter startDate={dateRangeStart} endDate={dateRangeEnd} onDateRangeChange={(s, e) => { setDateRangeStart(s); setDateRangeEnd(e) }} />
                <Input placeholder="Search by bill no, farmer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[220px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && purchases.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No purchase orders found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase Bill No</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Weight</TableHead>
                      <TableHead>Rate/Kg</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.orderNumber}</TableCell>
                        <TableCell>{p.supplierName}</TableCell>
                        <TableCell>{new Date(p.orderDate).toLocaleDateString()}</TableCell>
                        <TableCell>{Number(p.totalWeight || 0).toFixed(2)} kg</TableCell>
                        <TableCell>₹{Number(p.ratePerKg || 0).toFixed(2)}</TableCell>
                        <TableCell>₹{Number(p.netAmount || p.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.purchasePaymentStatus === "paid" ? "bg-green-100 text-green-800" :
                            p.purchasePaymentStatus === "partial" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>{p.purchasePaymentStatus}</span>
                        </TableCell>
                        <TableCell>₹{Number(p.balanceAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={async () => {
                              setViewingPurchase(p)
                              setShowInvoiceModal(true)
                              setLoadingPreview(true)
                              try {
                                const full = await purchasesApi.getOne(p.id)
                                setViewingPurchase(full)
                              } catch { /* keep list data */ }
                              finally { setLoadingPreview(false) }
                            }}><Eye size={14} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Edit2 size={14} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 size={14} /></Button>
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

        {/* Invoice View Modal */}
        {showInvoiceModal && viewingPurchase && (
          <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Purchase Bill — {viewingPurchase.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 space-y-4 text-sm">
                {loadingPreview && (
                  <div className="text-center py-4 text-muted-foreground text-sm">Loading full details...</div>
                )}
                <div className="grid grid-cols-2 gap-2 border p-3 rounded text-xs">
                  <div><span className="font-semibold">Bill No:</span> {viewingPurchase.orderNumber}</div>
                  <div><span className="font-semibold">Date:</span> {new Date(viewingPurchase.orderDate).toLocaleDateString()}</div>
                  <div><span className="font-semibold">Supplier:</span> {viewingPurchase.supplierName}</div>
                  {viewingPurchase.farmerMobile && <div><span className="font-semibold">Mobile:</span> {viewingPurchase.farmerMobile}</div>}
                  {viewingPurchase.farmLocation && <div className="col-span-2"><span className="font-semibold">Location:</span> {viewingPurchase.farmLocation}</div>}
                  {(viewingPurchase as any).branch && <div><span className="font-semibold">Branch:</span> {(viewingPurchase as any).branch}</div>}
                </div>
                {viewingPurchase.cages && viewingPurchase.cages.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">Cage Details</span>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">Pending: {viewingPurchase.cages.filter(c => !c.status || c.status === 'pending').length}</span>
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">Sold: {viewingPurchase.cages.filter(c => c.status === 'sold').length}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">In Godown: {viewingPurchase.cages.filter(c => c.status === 'in_godown').length}</span>
                      </div>
                    </div>
                    <table className="w-full border-collapse text-xs">
                      <thead><tr className="bg-gray-100">
                        <th className="border px-2 py-1">S.N.</th>
                        <th className="border px-2 py-1">Cage ID</th>
                        <th className="border px-2 py-1">Birds</th>
                        <th className="border px-2 py-1">Weight (Kg)</th>
                        <th className="border px-2 py-1">Status</th>
                      </tr></thead>
                      <tbody>{viewingPurchase.cages.map((c, i) => (
                        <tr key={i} className={c.status === 'sold' ? 'bg-green-50' : c.status === 'in_godown' ? 'bg-blue-50' : ''}>
                          <td className="border px-2 py-1 text-center">{i + 1}</td>
                          <td className="border px-2 py-1 font-medium">{c.cageId || "-"}</td>
                          <td className="border px-2 py-1 text-right">{c.numberOfBirds}</td>
                          <td className="border px-2 py-1 text-right">{Number(c.cageWeight).toFixed(2)}</td>
                          <td className="border px-2 py-1 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              c.status === 'sold' ? 'bg-green-100 text-green-800' :
                              c.status === 'in_godown' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>{c.status || 'pending'}</span>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                <div className="border p-3 rounded text-xs space-y-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold">Total Weight:</span> {Number(viewingPurchase.totalWeight || 0).toFixed(2)} kg</div>
                    <div><span className="font-semibold">Rate/Kg:</span> ₹{Number(viewingPurchase.ratePerKg || 0).toFixed(2)}</div>
                    <div><span className="font-semibold">Bird Amount:</span> ₹{(Number(viewingPurchase.totalWeight || 0) * Number(viewingPurchase.ratePerKg || 0)).toFixed(2)}</div>
                    {Number(viewingPurchase.transportCharges) > 0 && <div><span className="font-semibold">Transport:</span> ₹{Number(viewingPurchase.transportCharges).toFixed(2)}</div>}
                    <div className="font-bold"><span className="font-semibold">Net Amount:</span> ₹{Number(viewingPurchase.netAmount || viewingPurchase.totalAmount || 0).toFixed(2)}</div>
                    <div><span className="font-semibold">Balance:</span> ₹{Number(viewingPurchase.balanceAmount || 0).toFixed(2)}</div>
                  </div>
                  {(viewingPurchase as any).payments && (viewingPurchase as any).payments.length > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <div className="font-semibold mb-1">Payments:</div>
                      {(viewingPurchase as any).payments.map((p: any, i: number) => (
                        <div key={i}>{p.paymentMode}: ₹{Number(p.amount).toFixed(2)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
