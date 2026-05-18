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
import { Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, Wallet, ShoppingCart, TrendingUp, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { godownApi, retailersApi, purchasesApi, type GodownSale, type Retailer } from "@/lib/api"
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/api-base-url"

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer", "advance"] as const
type PaymentMode = typeof PAYMENT_MODES[number]
interface PaymentRow { mode: PaymentMode; amount: string }
const emptyPayment = (): PaymentRow => ({ mode: "cash", amount: "" })

// Represents a cage row with editable partial-sale fields
interface CageRow {
  id: string
  cageId: string
  totalBirds: number
  totalWeight: number
  sellBirds: string   // editable: how many birds to sell
  sellWeight: string  // editable: weight to sell (after loss)
  weightLoss: string  // editable: weight loss for this cage
  selected: boolean
}

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
  const [allowEditBillNo, setAllowEditBillNo] = useState(false)

  const [formData, setFormData] = useState({
    saleDate: new Date().toISOString().split("T")[0],
    saleNo: "", purchaseBillNo: "", invoiceNumber: "", retailerId: "",
    customerName: "", numberOfBirds: "", totalWeight: "",
    weightLoss: "", ratePerKg: "", totalAmount: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial", notes: "",
  })
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()])
  const [cageRows, setCageRows] = useState<CageRow[]>([])
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
      if (Array.isArray(data)) {
        setCageRows(data.map(c => {
          const tw = Number(c.godownInwardWeight || c.purchaseWeight || 0)
          return {
            id: String(c.id),
            cageId: c.cageId || String(c.id),
            totalBirds: Number(c.numberOfBirds) || 0,
            totalWeight: tw,
            sellBirds: String(c.numberOfBirds || 0),
            sellWeight: tw.toFixed(2),
            weightLoss: "0.00",
            selected: false,
          } as CageRow
        }))
      }
    } catch { }
    finally { setLoadingCages(false) }
  }

  const fetchRetailers = async () => {
    try {
      const data = await retailersApi.getAll()
      if (Array.isArray(data)) setRetailers(data.filter(r => r.status === "active"))
    } catch { }
  }

  const fetchNextSaleNumber = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiBaseUrl()}/godown/sales/generate/next-sale-number`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        return data.nextSaleNumber || ""
      }
    } catch (error) {
      console.error('Failed to fetch next sale number:', error)
    }
    return ""
  }

  // Dynamic values based on form inputs & selected cages
  const selectedCages = useMemo(() => cageRows.filter(c => c.selected), [cageRows])
  const rate = parseFloat(formData.ratePerKg) || 0

  const totalBirds = useMemo(() => {
    return selectedCages.length > 0
      ? selectedCages.reduce((s, c) => s + (parseInt(c.sellBirds) || 0), 0)
      : (parseInt(formData.numberOfBirds) || 0)
  }, [selectedCages, formData.numberOfBirds])

  const totalWeight = useMemo(() => {
    return selectedCages.length > 0
      ? selectedCages.reduce((s, c) => s + (parseFloat(c.sellWeight) || 0), 0)
      : (parseFloat(formData.totalWeight) || 0)
  }, [selectedCages, formData.totalWeight])

  const totalLoss = useMemo(() => {
    return selectedCages.length > 0
      ? selectedCages.reduce((s, c) => s + (parseFloat(c.weightLoss) || 0), 0)
      : (parseFloat(formData.weightLoss) || 0)
  }, [selectedCages, formData.weightLoss])

  const totalAmount = useMemo(() => totalWeight * rate, [totalWeight, rate])

  const totalPaymentMade = useMemo(() => {
    return payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  }, [payments])

  const balance = useMemo(() => Math.max(0, totalAmount - totalPaymentMade), [totalAmount, totalPaymentMade])

  const updateCageRow = (id: string, patch: Partial<CageRow>) => {
    setCageRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  const addPayment = () => setPayments(p => [...p, emptyPayment()])
  const removePayment = (i: number) => setPayments(p => p.filter((_, idx) => idx !== i))
  const updatePayment = (i: number, field: keyof PaymentRow, value: string) =>
    setPayments(p => p.map((x, idx) => idx === i ? { ...x, [field]: value } : x))

  const resetForm = async () => {
    const nextNumber = editingId ? "" : await fetchNextSaleNumber()
    setFormData({
      saleDate: new Date().toISOString().split("T")[0],
      saleNo: nextNumber, purchaseBillNo: "", invoiceNumber: nextNumber, retailerId: "",
      customerName: "", numberOfBirds: "", totalWeight: "",
      weightLoss: "", ratePerKg: "", totalAmount: "",
      paymentStatus: "pending", notes: "",
    })
    setPayments([emptyPayment()])
    setEditingId(null)
    fetchAvailableCages()
    setAllowEditBillNo(false)
  }

  const handleEdit = (sale: GodownSale) => {
    setFormData({
      saleDate: sale.saleDate,
      saleNo: (sale as any).saleNo || "",
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
    if (salePayments?.length) {
      setPayments(salePayments.map((p: any) => ({ mode: p.paymentMode || "cash", amount: String(p.amount) })))
    } else {
      setPayments([emptyPayment()])
    }
    // Deselect cages when editing (cage editing post-sale not supported)
    setCageRows(prev => prev.map(r => ({ ...r, selected: false })))
    setEditingId(sale.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.customerName || totalBirds <= 0) { toast.error("Required fields missing"); return }
    if (!editingId && selectedCages.length === 0) { toast.error("Please select at least one cage"); return }
    
    // Validate per-cage: sellBirds must not exceed total
    for (const c of selectedCages) {
      const sb = parseInt(c.sellBirds) || 0
      if (sb <= 0) { toast.error(`Enter birds to sell for cage ${c.cageId}`); return }
      if (sb > c.totalBirds) { toast.error(`Birds to sell (${sb}) cannot exceed total birds (${c.totalBirds}) for cage ${c.cageId}`); return }
      const sw = parseFloat(c.sellWeight) || 0
      if (sw > c.totalWeight) { toast.error(`Weight to sell (${sw}) cannot exceed total weight (${c.totalWeight}) for cage ${c.cageId}`); return }
    }
    
    try {
      setLoading(true)
      const data = {
        ...formData,
        invoiceNumber: formData.saleNo || formData.invoiceNumber,
        numberOfBirds: totalBirds,
        totalWeight: totalWeight,
        totalAmount: totalAmount,
        ratePerKg: rate,
        weightLoss: totalLoss,
        amountReceived: totalPaymentMade,
        payments: payments.filter(p => parseFloat(p.amount) > 0).map(p => ({ paymentMode: p.mode, amount: parseFloat(p.amount) })),
        cages: selectedCages.map(c => ({
          id: c.id,
          soldBirds: parseInt(c.sellBirds) || 0,
          numberOfBirds: parseInt(c.sellBirds) || 0,
          soldWeight: parseFloat(c.sellWeight) || 0,
          cageWeight: parseFloat(c.sellWeight) || 0,
          weightLoss: parseFloat(c.weightLoss) || 0,
        }))
      } as any
      
      let saved: any
      if (editingId) {
        saved = await godownApi.sales.update(editingId, data)
        toast.success("Sale updated")
      } else {
        saved = await godownApi.sales.create(data)
        if (saved?.saleNo && !formData.saleNo) {
          setFormData(prev => ({ ...prev, saleNo: saved.saleNo, invoiceNumber: saved.saleNo }))
          toast.success(`Sale recorded - Sale No: ${saved.saleNo}`)
        } else {
          toast.success("Sale recorded")
        }
      }
      
      await fetchSales()
      if (editingId) {
        resetForm()
        setShowDialog(false)
      }
    } catch (e: any) { toast.error(e?.message || "Failed to save") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try { setLoading(true); await godownApi.sales.delete(id); toast.success("Deleted"); await fetchSales() }
    catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  // Calculate mini-dashboard stats
  const stats = useMemo(() => {
    return {
      count: sales.length,
      totalBirds: sales.reduce((s, x) => s + (parseFloat(String(x.totalWeight || 0))), 0),
      totalRevenue: sales.reduce((s, x) => s + (parseFloat(String(x.totalAmount || 0))), 0),
      totalReceived: sales.reduce((s, x) => s + (parseFloat(String(x.amountReceived || 0))), 0),
      totalPending: sales.reduce((s, x) => s + Math.max(0, parseFloat(String(x.totalAmount || 0)) - parseFloat(String(x.amountReceived || 0))), 0),
    }
  }, [sales])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Godown Sales</h1><p className="text-muted-foreground">Record sales from godown</p></div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2" size={20} />New Sale</Button></DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
              <DialogHeader><DialogTitle>{editingId ? "Edit Sale" : "New Sale"}</DialogTitle></DialogHeader>
              <div className="space-y-5 overflow-y-auto flex-1 pr-1 pb-2">
                
                {/* Section 1: Header Information */}
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50 border-b border-blue-100 py-3">
                    <CardTitle className="text-blue-900 text-base">Section 1: Header Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <DatePicker value={formData.saleDate} onChange={d => setFormData({ ...formData, saleDate: d })} disabled={loading} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Sale No. (Auto-generated)</Label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" checked={allowEditBillNo} onChange={e => setAllowEditBillNo(e.target.checked)} className="cursor-pointer" />
                            <span>Edit manually</span>
                          </label>
                        </div>
                        <Input value={formData.saleNo} onChange={e => setFormData({ ...formData, saleNo: e.target.value, invoiceNumber: e.target.value })} placeholder="Auto-generated on save" disabled={loading} readOnly={!allowEditBillNo} className={!allowEditBillNo ? "bg-gray-50" : ""} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Shop / Retailer *</Label>
                        <Select value={formData.retailerId || "__none__"} onValueChange={v => {
                          const r = retailers.find(it => it.id === v)
                          setFormData({ ...formData, retailerId: v === "__none__" ? "" : v, customerName: r ? r.name : "" })
                        }} disabled={loading}>
                          <SelectTrigger><SelectValue placeholder="Select retailer" /></SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="__none__">Select retailer...</SelectItem>
                            {retailers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Customer Name *</Label>
                        <Input value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} placeholder="Customer Name" disabled={loading} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional" disabled={loading} />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Cage Selection & Customer Details */}
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50 border-b border-green-100 py-3">
                    <CardTitle className="text-green-900 text-base">Section 2: Cage Selection & Customer Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Cage Selection Panel with partial-sale support */}
                    {cageRows.length > 0 && !editingId && (
                      <div className="border rounded-lg bg-purple-50/60 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-semibold text-purple-900">Available Cages ({selectedCages.length} selected)</strong>
                          <span className="text-xs text-muted-foreground">Edit birds/weight to sell partial cage</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-muted-foreground border-b bg-purple-100/50">
                                <th className="pb-1 p-2"></th>
                                <th className="pb-1 p-2">Cage ID</th>
                                <th className="pb-1 p-2">Total Birds</th>
                                <th className="pb-1 p-2 w-24">Birds to Sell</th>
                                <th className="pb-1 p-2">Total Weight</th>
                                <th className="pb-1 p-2 w-28">Weight to Sell (kg)</th>
                                <th className="pb-1 p-2 w-24">Loss (kg)</th>
                                <th className="pb-1 p-2">Remaining</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cageRows.map(cage => {
                                const remBirds = cage.totalBirds - (parseInt(cage.sellBirds) || 0)
                                const remWeight = cage.totalWeight - (parseFloat(cage.sellWeight) || 0)
                                const isPartial = cage.selected && (parseInt(cage.sellBirds) || 0) < cage.totalBirds
                                return (
                                  <tr key={cage.id} className={`border-b last:border-0 transition-colors ${cage.selected ? 'bg-green-50' : 'hover:bg-white/70'}`}>
                                    <td className="p-2">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded cursor-pointer"
                                        checked={cage.selected}
                                        onChange={() => updateCageRow(cage.id, { selected: !cage.selected })}
                                      />
                                    </td>
                                    <td className="p-2 font-medium">{cage.cageId}</td>
                                    <td className="p-2 text-muted-foreground">{cage.totalBirds}</td>
                                    <td className="p-1">
                                      <Input
                                        type="number" min="1" max={cage.totalBirds}
                                        className="h-8 text-xs text-center"
                                        value={cage.sellBirds}
                                        disabled={!cage.selected || loading}
                                        onChange={e => updateCageRow(cage.id, { sellBirds: e.target.value })}
                                      />
                                    </td>
                                    <td className="p-2 text-muted-foreground">{cage.totalWeight.toFixed(2)} kg</td>
                                    <td className="p-1">
                                      <Input
                                        type="number" min="0" step="0.01" max={cage.totalWeight}
                                        className="h-8 text-xs"
                                        value={cage.sellWeight}
                                        disabled={!cage.selected || loading}
                                        onChange={e => updateCageRow(cage.id, { sellWeight: e.target.value })}
                                      />
                                    </td>
                                    <td className="p-1">
                                      <Input
                                        type="number" min="0" step="0.01"
                                        className="h-8 text-xs"
                                        value={cage.weightLoss}
                                        disabled={!cage.selected || loading}
                                        onChange={e => updateCageRow(cage.id, { weightLoss: e.target.value })}
                                      />
                                    </td>
                                    <td className="p-2">
                                      {cage.selected ? (
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${isPartial ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                                          {remBirds}🐔 / {remWeight.toFixed(1)}kg
                                        </span>
                                      ) : <span className="text-muted-foreground">—</span>}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Birds *</Label>
                        <Input type="number" value={formData.numberOfBirds} onChange={e => setFormData({ ...formData, numberOfBirds: e.target.value })} disabled={loading || selectedCages.length > 0} className={selectedCages.length > 0 ? "bg-gray-50 font-semibold" : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label>Rate per KG (₹) *</Label>
                        <Input type="number" step="0.01" value={formData.ratePerKg} onChange={e => setFormData({ ...formData, ratePerKg: e.target.value })} placeholder="e.g. 146" disabled={loading} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Weight (kg) *</Label>
                        <Input type="number" step="0.01" value={formData.totalWeight} onChange={e => setFormData({ ...formData, totalWeight: e.target.value })} placeholder="0.00" disabled={loading || selectedCages.length > 0} className={selectedCages.length > 0 ? "bg-gray-50 font-semibold" : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Weight Loss (kg)</Label>
                        <Input type="number" step="0.01" value={formData.weightLoss} onChange={e => setFormData({ ...formData, weightLoss: e.target.value })} placeholder="0.00" disabled={loading || selectedCages.length > 0} className={selectedCages.length > 0 ? "bg-gray-50 font-semibold" : ""} />
                      </div>
                    </div>

                    {/* Calculated Summary Box */}
                    <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded p-3">
                      <span className="font-semibold text-green-900">Total Calculated Amount</span>
                      <span className="text-xl font-bold text-green-700">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Payment Summary */}
                <Card className="border-purple-200">
                  <CardHeader className="bg-purple-50 border-b border-purple-100 py-3">
                    <CardTitle className="text-purple-900 text-base">Section 3: Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Payment Status</Label>
                      <Select value={formData.paymentStatus} onValueChange={(v: any) => setFormData(f => ({ ...f, paymentStatus: v }))} disabled={loading}>
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
                          <Select value={p.mode} onValueChange={v => updatePayment(i, "mode", v as PaymentMode)} disabled={loading}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="advance">Advance</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Input type="number" step="0.01" placeholder="0.00" value={p.amount} onChange={e => updatePayment(i, "amount", e.target.value)} disabled={loading} />
                            {payments.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removePayment(i)} className="px-2 text-red-500 hover:text-red-700">
                                <X size={16} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addPayment} disabled={loading}><Plus size={14} className="mr-1" /> Add Payment Mode</Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div className="space-y-2">
                        <Label>Total Received (₹)</Label>
                        <Input value={`₹${totalPaymentMade.toFixed(2)}`} disabled className="bg-gray-50 font-semibold text-green-700" />
                      </div>
                      <div className="space-y-2">
                        <Label>Balance (₹)</Label>
                        <Input value={`₹${balance.toFixed(2)}`} disabled className="bg-gray-50 font-semibold text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  {!editingId && formData.saleNo ? (
                    <Button variant="outline" onClick={() => { resetForm(); setShowDialog(false) }} disabled={loading}>Close</Button>
                  ) : (
                    <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>Cancel</Button>
                  )}
                  <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                    {loading ? "Saving..." : editingId ? "Update Sale" : "Create Sale"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mini Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <ShoppingCart size={14} className="text-blue-600" />
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{stats.count}</div></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">Total Weight</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-purple-600">{stats.totalBirds.toFixed(2)} kg</div></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <TrendingUp size={14} className="text-orange-600" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-600">₹{stats.totalRevenue.toFixed(2)}</div></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Wallet size={14} className="text-green-600" />
                Received
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">₹{stats.totalReceived.toFixed(2)}</div></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Clock size={14} className="text-red-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">₹{stats.totalPending.toFixed(2)}</div></CardContent>
          </Card>
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
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Birds</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Weight Loss</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{new Date(s.saleDate).toLocaleDateString()}</TableCell>
                    <TableCell>{(s as any).invoiceNumber || "-"}</TableCell>
                    <TableCell>{s.customerName}</TableCell>
                    <TableCell>{s.numberOfBirds} Birds</TableCell>
                    <TableCell>{s.totalWeight} kg</TableCell>
                    <TableCell className="text-orange-600">{parseFloat((s as any).weightLoss || 0).toFixed(2)} kg</TableCell>
                    <TableCell className="font-bold">₹{s.totalAmount}</TableCell>
                    <TableCell>
                      {userRole !== 'staff' && userRole !== 'Staff' && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Edit2 size={16} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></Button>
                        </div>
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
