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
import { Plus, Edit2, Trash2, ClipboardPaste, X, Printer, Eye, Paperclip } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { salesApi, retailersApi, vehiclesApi, type Sale as ApiSale } from "@/lib/api"
import { toast } from "sonner"

// ── Types ──────────────────────────────────────────────────────
interface CustomerRow {
  id: string // local key only
  customerName: string
  numBirds: string
  weight: string
  amount: number // auto = weight * rate
}

const emptyRow = (): CustomerRow => ({
  id: Math.random().toString(36).slice(2),
  customerName: "",
  numBirds: "",
  weight: "",
  amount: 0,
})

export default function SalesPage() {
  const [sales, setSales] = useState<ApiSale[]>([])
  const [invoiceList, setInvoiceList] = useState<Array<{ id: string; invoiceNumber: string; saleDate: string; customerName: string }>>([])
  const [retailers, setRetailers] = useState<Array<{ id: string; name: string; ownerName?: string; phone: string; address?: string }>>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>()
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>()
  const pasteRef = useRef<HTMLTextAreaElement>(null)

  // ── Form state ─────────────────────────────────────────────
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    saleDate: new Date().toISOString().split("T")[0],
    retailerId: "",
    customerName: "",
    ownerName: "",
    phone: "",
    address: "",
    saleMode: "from_vehicle" as "from_vehicle" | "from_godown",
    vehicleId: "",
    productType: "meat" as "meat" | "eggs" | "chicks" | "other",
    ratePerKg: "",
    transportCharges: "",
    loadingCharges: "",
    commission: "",
    otherCharges: "",
    deductions: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial",
    amountReceived: "",
    notes: "",
  })

  const [customerRows, setCustomerRows] = useState<CustomerRow[]>([emptyRow()])
  const [pasteText, setPasteText] = useState("")
  const [showPasteBox, setShowPasteBox] = useState(false)
  const [printSale, setPrintSale] = useState<ApiSale | null>(null)
  const [printRows, setPrintRows] = useState<CustomerRow[]>([])
  // File upload
  const [saleFile, setSaleFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const saleFileRef = useRef<HTMLInputElement>(null)
  // Preview modal
  const [previewSale, setPreviewSale] = useState<ApiSale | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewTab, setPreviewTab] = useState<"invoice" | "attachment">("invoice")

  useEffect(() => {
    setMounted(true)
    fetchSales(); fetchInvoiceList(); fetchRetailers(); fetchVehicles()
  }, [])

  const fetchSales = async () => {
    try { setLoading(true); const d = await salesApi.getAll(); setSales(Array.isArray(d) ? d : []) }
    catch { setSales([]); toast.error("Failed to load sales") }
    finally { setLoading(false) }
  }
  const fetchInvoiceList = async () => {
    try { const d = await salesApi.getInvoiceList(); setInvoiceList(Array.isArray(d) ? d : []) }
    catch { setInvoiceList([]) }
  }
  const fetchRetailers = async () => {
    try { const d = await retailersApi.getActive(); setRetailers(Array.isArray(d) ? d : []) }
    catch { setRetailers([]) }
  }
  const fetchVehicles = async () => {
    try { const d = await vehiclesApi.getAll(); setVehicles(Array.isArray(d) ? d : []) }
    catch { setVehicles([]) }
  }

  // ── Customer rows helpers ──────────────────────────────────
  const rate = parseFloat(formData.ratePerKg) || 0

  const updateRow = (id: string, field: keyof CustomerRow, value: string) => {
    setCustomerRows(rows => rows.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      updated.amount = (parseFloat(updated.weight) || 0) * rate
      return updated
    }))
  }

  // Recalculate amounts when rate changes
  useEffect(() => {
    setCustomerRows(rows => rows.map(r => ({ ...r, amount: (parseFloat(r.weight) || 0) * rate })))
  }, [formData.ratePerKg])

  const addRow = () => setCustomerRows(r => [...r, emptyRow()])
  const removeRow = (id: string) => setCustomerRows(r => r.filter(x => x.id !== id))

  // Totals
  const totalBirds = customerRows.reduce((s, r) => s + (parseInt(r.numBirds) || 0), 0)
  const totalWeight = customerRows.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0)
  const totalAmount = customerRows.reduce((s, r) => s + r.amount, 0)
  const avgWeight = totalBirds > 0 ? totalWeight / totalBirds : 0

  const charges = (parseFloat(formData.transportCharges) || 0) + (parseFloat(formData.loadingCharges) || 0)
    + (parseFloat(formData.commission) || 0) + (parseFloat(formData.otherCharges) || 0)
  const deductions = parseFloat(formData.deductions) || 0
  const grossAmount = totalAmount + charges
  const netAmount = grossAmount - deductions
  const balance = netAmount - (parseFloat(formData.amountReceived) || 0)

  // ── Paste parser ───────────────────────────────────────────
  const handlePaste = () => {
    const lines = pasteText.trim().split("\n").filter(l => l.trim())
    const parsed: CustomerRow[] = []
    for (const line of lines) {
      // Support tab, comma, or multiple spaces as delimiter
      const parts = line.trim().split(/[\t,]+|\s{2,}/).map(p => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        const name = parts[0]
        // Try to find numeric values
        const nums = parts.slice(1).map(p => parseFloat(p)).filter(n => !isNaN(n))
        if (nums.length >= 1) {
          const numBirds = nums.length >= 2 ? String(Math.round(nums[0])) : ""
          const weight = nums.length >= 2 ? String(nums[1]) : String(nums[0])
          const r = emptyRow()
          r.customerName = name
          r.numBirds = numBirds
          r.weight = weight
          r.amount = (parseFloat(weight) || 0) * rate
          parsed.push(r)
        }
      }
    }
    if (parsed.length > 0) {
      setCustomerRows(parsed)
      setPasteText("")
      setShowPasteBox(false)
      toast.success(`Parsed ${parsed.length} rows`)
    } else {
      toast.error("Could not parse data. Format: Name  Birds  Weight")
    }
  }

  // ── Reset ──────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      invoiceNumber: "", saleDate: new Date().toISOString().split("T")[0],
      retailerId: "", customerName: "", ownerName: "", phone: "", address: "",
      saleMode: "from_vehicle", vehicleId: "", productType: "meat",
      ratePerKg: "", transportCharges: "", loadingCharges: "", commission: "",
      otherCharges: "", deductions: "", paymentStatus: "pending", amountReceived: "", notes: "",
    })
    setCustomerRows([emptyRow()])
    setEditingId(null)
    setSaleFile(null)
  }

  const handleRetailerChange = (id: string) => {
    const r = retailers.find(x => x.id === id)
    if (r) setFormData(f => ({ ...f, retailerId: id, customerName: r.name, ownerName: r.ownerName || "", phone: r.phone || "", address: r.address || "" }))
  }

  const handleInvoiceSelect = async (id: string) => {
    if (!id) return
    try {
      setLoading(true)
      const sale = await salesApi.getOne(id)
      handleEdit(sale)
    } catch { toast.error("Failed to load invoice") }
    finally { setLoading(false) }
  }

  const handleEdit = (sale: ApiSale) => {
    const retailer = retailers.find(r => r.id === sale.retailerId)
    setFormData({
      invoiceNumber: sale.invoiceNumber,
      saleDate: sale.saleDate,
      retailerId: sale.retailerId || "",
      customerName: sale.customerName,
      ownerName: retailer?.ownerName || "",
      phone: retailer?.phone || "",
      address: retailer?.address || "",
      saleMode: sale.saleMode || "from_vehicle",
      vehicleId: "",
      productType: (sale.productType as any) || "meat",
      ratePerKg: String(sale.unitPrice || 0),
      transportCharges: String(sale.transportCharges || 0),
      loadingCharges: String(sale.loadingCharges || 0),
      commission: String(sale.commission || 0),
      otherCharges: String(sale.otherCharges || 0),
      deductions: String(sale.mortalityDeduction || 0),
      paymentStatus: sale.paymentStatus,
      amountReceived: String(sale.amountReceived || 0),
      notes: sale.notes || "",
    })
    setEditingId(sale.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.invoiceNumber || !formData.customerName) {
      toast.error("Invoice number and customer name are required")
      return
    }
    const validRows = customerRows.filter(r => r.customerName && parseFloat(r.weight) > 0)
    if (validRows.length === 0) {
      toast.error("Add at least one customer row with weight")
      return
    }
    try {
      setLoading(true)
      const saleData = {
        invoiceNumber: formData.invoiceNumber,
        customerName: formData.customerName,
        saleDate: formData.saleDate,
        saleMode: formData.saleMode,
        productType: formData.productType,
        quantity: String(totalWeight),
        unit: "kg",
        unitPrice: formData.ratePerKg || "0",
        transportCharges: formData.transportCharges || "0",
        loadingCharges: formData.loadingCharges || "0",
        commission: formData.commission || "0",
        otherCharges: formData.otherCharges || "0",
        weightShortage: "0",
        mortalityDeduction: formData.deductions || "0",
        otherDeduction: "0",
        paymentStatus: formData.paymentStatus,
        amountReceived: formData.amountReceived || "0",
        notes: JSON.stringify({
          text: formData.notes,
          customerRows: validRows.map(r => ({
            customerName: r.customerName,
            numBirds: parseInt(r.numBirds) || 0,
            weight: parseFloat(r.weight) || 0,
            ratePerKg: rate,
          })),
        }),
        retailerId: formData.retailerId || undefined,
        // Extra fields for bulk entry
        totalBirds,
        totalWeight,
        customerRows: validRows.map(r => ({
          customerName: r.customerName,
          numBirds: parseInt(r.numBirds) || 0,
          weight: parseFloat(r.weight) || 0,
          ratePerKg: rate,
        })),
      }
      if (editingId) {
        await salesApi.update(editingId, saleData)
        toast.success("Sale updated")
      } else {
        const saved = await salesApi.create(saleData)
        toast.success("Sale created")
        // Upload file if selected
        if (saleFile && saved?.id) {
          try {
            setUploadingFile(true)
            await salesApi.uploadAttachment(saved.id, saleFile)
            toast.success("Attachment uploaded")
          } catch (err: any) {
            toast.error("Sale saved but file upload failed: " + err.message)
          } finally { setUploadingFile(false) }
        }
      }
      await fetchSales(); await fetchInvoiceList()
      resetForm(); setShowDialog(false)
    } catch (e: any) {
      toast.error(e.message || "Failed to save sale")
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sale?")) return
    try {
      setLoading(true)
      await salesApi.delete(id)
      toast.success("Sale deleted")
      await fetchSales(); await fetchInvoiceList()
    } catch { toast.error("Failed to delete sale") }
    finally { setLoading(false) }
  }

  const handlePrint = (sale: ApiSale) => {
    // Try to parse customer rows from notes JSON
    let rows: CustomerRow[] = []
    try {
      const parsed = JSON.parse(sale.notes || "")
      if (Array.isArray(parsed?.customerRows)) {
        rows = parsed.customerRows.map((r: any) => ({
          id: Math.random().toString(36).slice(2),
          customerName: r.customerName || "",
          numBirds: String(r.numBirds || ""),
          weight: String(r.weight || ""),
          amount: (parseFloat(r.weight) || 0) * (parseFloat(r.ratePerKg) || parseFloat(String(sale.unitPrice)) || 0),
        }))
      }
    } catch { /* no rows stored */ }
    setPrintRows(rows)
    setPrintSale(sale)
    setTimeout(() => window.print(), 100)
  }

  const stats = useMemo(() => {
    const totalAmt = sales.reduce((s, x) => s + (parseFloat(String(x.totalAmount || 0))), 0)
    const totalRcv = sales.reduce((s, x) => s + (parseFloat(String(x.amountReceived || 0))), 0)
    return { count: sales.length, totalAmount: totalAmt, totalReceived: totalRcv, totalPending: totalAmt - totalRcv }
  }, [sales])

  const filteredSales = useMemo(() => {
    let f = [...sales]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      f = f.filter(s => s.invoiceNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q))
    }
    if (dateRangeStart && dateRangeEnd) {
      const s = new Date(dateRangeStart); s.setHours(0,0,0,0)
      const e = new Date(dateRangeEnd); e.setHours(23,59,59,999)
      f = f.filter(x => { const d = new Date(x.saleDate); return d >= s && d <= e })
    }
    return f
  }, [sales, searchQuery, dateRangeStart, dateRangeEnd])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales Tracking</h1>
            <p className="text-muted-foreground">Manage your sales records</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="mr-2" size={20} />Add New Sale</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Sale" : "Add New Sale"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                {/* Section 1: Header */}
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <CardTitle className="text-blue-900">Section 1: Header Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Invoice No. *</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">SI-</span>
                          <Input value={formData.invoiceNumber.replace('SI-','')}
                            onChange={e => setFormData(f => ({ ...f, invoiceNumber: 'SI-' + e.target.value }))}
                            placeholder="001" className="rounded-l-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sale Date *</Label>
                        <DatePicker value={formData.saleDate} onChange={d => setFormData(f => ({ ...f, saleDate: d }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Shop / Retailer *</Label>
                        <Select value={formData.retailerId} onValueChange={handleRetailerChange}>
                          <SelectTrigger><SelectValue placeholder="Select shop" /></SelectTrigger>
                          <SelectContent>
                            {retailers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Owner Name</Label>
                        <Input value={formData.ownerName} disabled className="bg-gray-50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Sale Mode</Label>
                        <Select value={formData.saleMode} onValueChange={(v: any) => setFormData(f => ({ ...f, saleMode: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="from_vehicle">From Vehicle</SelectItem>
                            <SelectItem value="from_godown">From Godown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle</Label>
                        <Select value={formData.vehicleId} onValueChange={v => setFormData(f => ({ ...f, vehicleId: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                          <SelectContent>
                            {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Product Type</Label>
                        <Select value={formData.productType} onValueChange={(v: any) => setFormData(f => ({ ...f, productType: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meat">Meat</SelectItem>
                            <SelectItem value="eggs">Eggs</SelectItem>
                            <SelectItem value="chicks">Chicks</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Payment Status</Label>
                        <Select value={formData.paymentStatus} onValueChange={(v: any) => setFormData(f => ({ ...f, paymentStatus: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
                      </div>
                    </div>

                    {/* File attachment */}
                    <div className="space-y-2">
                      <Label>Attach Sales Sheet (PDF/JPG/PNG)</Label>
                      <div className="flex items-center gap-3">
                        <input ref={saleFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                          onChange={e => setSaleFile(e.target.files?.[0] || null)} />
                        <Button type="button" variant="outline" size="sm" onClick={() => saleFileRef.current?.click()} disabled={loading}>
                          <Paperclip size={14} className="mr-1" /> Choose File
                        </Button>
                        {saleFile && (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded">
                            <Paperclip size={12} />
                            <span>{saleFile.name}</span>
                            <button onClick={() => setSaleFile(null)} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                          </div>
                        )}
                        {editingId && sales.find(s => s.id === editingId)?.saleAttachment && !saleFile && (
                          <span className="text-xs text-blue-600">✓ Sheet already attached</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Customer Rows */}
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50 border-b border-green-100">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-green-900">Section 2: Customer Details</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setShowPasteBox(v => !v)}>
                          <ClipboardPaste size={16} className="mr-1" /> Paste from Excel/WhatsApp
                        </Button>
                        <Button size="sm" onClick={addRow}><Plus size={16} className="mr-1" /> Add Row</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {/* Rate input */}
                    <div className="flex items-center gap-4">
                      <div className="space-y-1 w-48">
                        <Label>Rate per KG *</Label>
                        <Input type="number" step="0.01" value={formData.ratePerKg}
                          onChange={e => setFormData(f => ({ ...f, ratePerKg: e.target.value }))}
                          placeholder="e.g. 146" />
                      </div>
                      <div className="text-sm text-muted-foreground mt-5">
                        All amounts auto-calculate from this rate
                      </div>
                    </div>

                    {/* Paste box */}
                    {showPasteBox && (
                      <div className="border rounded-lg p-3 bg-yellow-50 space-y-2">
                        <p className="text-sm font-medium">Paste data below (Name, Birds, Weight per line):</p>
                        <p className="text-xs text-muted-foreground">Format: <code>Akka  2  3.450</code> or <code>Akka,2,3.450</code></p>
                        <Textarea ref={pasteRef} value={pasteText} onChange={e => setPasteText(e.target.value)}
                          placeholder={"Akka\t2\t3.450\nAlim\t24\t51.500\n..."} rows={6} className="font-mono text-sm" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handlePaste}>Parse & Fill Rows</Button>
                          <Button size="sm" variant="outline" onClick={() => { setShowPasteBox(false); setPasteText("") }}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* Customer table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-2 w-8">#</th>
                            <th className="text-left p-2">Customer Name</th>
                            <th className="text-left p-2 w-24">Birds</th>
                            <th className="text-left p-2 w-28">Weight (kg)</th>
                            <th className="text-right p-2 w-28">Amount</th>
                            <th className="p-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerRows.map((row, i) => (
                            <tr key={row.id} className="border-b hover:bg-gray-50">
                              <td className="p-1 text-muted-foreground text-xs">{i + 1}</td>
                              <td className="p-1">
                                <Input value={row.customerName}
                                  onChange={e => updateRow(row.id, 'customerName', e.target.value)}
                                  placeholder="Name" className="h-8 text-sm" />
                              </td>
                              <td className="p-1">
                                <Input type="number" value={row.numBirds}
                                  onChange={e => updateRow(row.id, 'numBirds', e.target.value)}
                                  placeholder="0" className="h-8 text-sm" />
                              </td>
                              <td className="p-1">
                                <Input type="number" step="0.001" value={row.weight}
                                  onChange={e => updateRow(row.id, 'weight', e.target.value)}
                                  placeholder="0.000" className="h-8 text-sm" />
                              </td>
                              <td className="p-1 text-right font-medium">
                                {row.amount > 0 ? row.amount.toFixed(0) : '-'}
                              </td>
                              <td className="p-1">
                                {customerRows.length > 1 && (
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500"
                                    onClick={() => removeRow(row.id)}><X size={14} /></Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 bg-green-50 font-semibold">
                            <td className="p-2" colSpan={2}>TOTAL</td>
                            <td className="p-2">{totalBirds}</td>
                            <td className="p-2">{totalWeight.toFixed(3)}</td>
                            <td className="p-2 text-right">{totalAmount.toFixed(0)}</td>
                            <td></td>
                          </tr>
                          <tr className="bg-gray-50 text-xs text-muted-foreground">
                            <td className="p-2" colSpan={2}>Avg Weight per Bird</td>
                            <td className="p-2" colSpan={4}>{avgWeight > 0 ? avgWeight.toFixed(3) + ' kg' : '-'} (auto)</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Charges */}
                <Card className="border-orange-200">
                  <CardHeader className="bg-orange-50 border-b border-orange-100">
                    <CardTitle className="text-orange-900">Section 3: Charges & Deductions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Transport Charges</Label>
                        <Input type="number" step="0.01" value={formData.transportCharges}
                          onChange={e => setFormData(f => ({ ...f, transportCharges: e.target.value }))} placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Loading Charges</Label>
                        <Input type="number" step="0.01" value={formData.loadingCharges}
                          onChange={e => setFormData(f => ({ ...f, loadingCharges: e.target.value }))} placeholder="0.00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Commission</Label>
                        <Input type="number" step="0.01" value={formData.commission}
                          onChange={e => setFormData(f => ({ ...f, commission: e.target.value }))} placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Other Charges</Label>
                        <Input type="number" step="0.01" value={formData.otherCharges}
                          onChange={e => setFormData(f => ({ ...f, otherCharges: e.target.value }))} placeholder="0.00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Deductions</Label>
                      <Input type="number" step="0.01" value={formData.deductions}
                        onChange={e => setFormData(f => ({ ...f, deductions: e.target.value }))} placeholder="0.00" />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 4: Payment Summary */}
                <Card className="border-purple-200">
                  <CardHeader className="bg-purple-50 border-b border-purple-100">
                    <CardTitle className="text-purple-900">Section 4: Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-muted-foreground">Gross Amount</div>
                        <div className="text-xl font-bold">{grossAmount.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-muted-foreground">Net Amount</div>
                        <div className="text-xl font-bold text-green-700">{netAmount.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-muted-foreground">Balance</div>
                        <div className={`text-xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{balance.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount Received</Label>
                      <Input type="number" step="0.01" value={formData.amountReceived}
                        onChange={e => setFormData(f => ({ ...f, amountReceived: e.target.value }))} placeholder="0.00" />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : editingId ? "Update Sale" : "Save Sale"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Sales", value: stats.count, color: "blue" },
            { label: "Total Amount", value: `₹${stats.totalAmount.toLocaleString()}`, color: "green" },
            { label: "Received", value: `₹${stats.totalReceived.toLocaleString()}`, color: "purple" },
            { label: "Pending", value: `₹${stats.totalPending.toLocaleString()}`, color: "red" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <Input placeholder="Search by invoice or customer..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
          <DateRangeFilter startDate={dateRangeStart} endDate={dateRangeEnd}
            onDateRangeChange={(s, e) => { setDateRangeStart(s); setDateRangeEnd(e) }} />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Total Wt</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No sales found</TableCell></TableRow>
                ) : filteredSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                    <TableCell>{sale.saleDate}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell><span className="text-xs bg-gray-100 px-2 py-1 rounded">{sale.saleMode?.replace('_', ' ')}</span></TableCell>
                    <TableCell className="text-right">{parseFloat(String(sale.quantity || 0)).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{parseFloat(String(sale.unitPrice || 0)).toFixed(0)}</TableCell>
                    <TableCell className="text-right font-medium">{parseFloat(String(sale.netAmount || 0)).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        sale.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'}`}>{sale.paymentStatus}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" title="Preview" onClick={() => { setPreviewSale(sale); setPreviewTab("invoice"); setShowPreview(true) }}><Eye size={14} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(sale)}><Edit2 size={14} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handlePrint(sale)} title="Print Invoice"><Printer size={14} /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(sale.id)}><Trash2 size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Sale Preview Modal ── */}
      {showPreview && previewSale && (() => {
        const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'https://13.234.140.190.nip.io'
        let rows: CustomerRow[] = []
        try {
          const parsed = JSON.parse(previewSale.notes || "")
          if (Array.isArray(parsed?.customerRows)) {
            rows = parsed.customerRows.map((r: any) => ({
              id: Math.random().toString(36).slice(2),
              customerName: r.customerName || "",
              numBirds: String(r.numBirds || ""),
              weight: String(r.weight || ""),
              amount: (parseFloat(r.weight) || 0) * (parseFloat(r.ratePerKg) || parseFloat(String(previewSale.unitPrice)) || 0),
            }))
          }
        } catch {}
        const totalW = rows.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0) || parseFloat(String(previewSale.quantity || 0))
        const totalB = rows.reduce((s, r) => s + (parseInt(r.numBirds) || 0), 0)
        const isImage = previewSale.saleAttachment && /\.(jpg|jpeg|png)$/i.test(previewSale.saleAttachment)
        const isPdf = previewSale.saleAttachment && /\.pdf$/i.test(previewSale.saleAttachment)
        return (
          <Dialog open={true} onOpenChange={() => setShowPreview(false)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Sale Preview — {previewSale.invoiceNumber}</DialogTitle>
              </DialogHeader>
              {/* Tabs */}
              <div className="flex border-b mb-4">
                <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${previewTab === "invoice" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
                  onClick={() => setPreviewTab("invoice")}>📄 System Invoice</button>
                <button className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${previewTab === "attachment" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
                  onClick={() => setPreviewTab("attachment")}>📎 Attached Sheet</button>
              </div>

              {previewTab === "invoice" && (
                <div className="p-4 border rounded bg-white text-sm space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-bold">AZIZ POULTRY</h2>
                    <p className="text-xs text-gray-500">Sale Invoice / Challan</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs border p-3 rounded">
                    <div><span className="font-semibold">Invoice No:</span> {previewSale.invoiceNumber}</div>
                    <div><span className="font-semibold">Date:</span> {previewSale.saleDate}</div>
                    <div><span className="font-semibold">Customer:</span> {previewSale.customerName}</div>
                    <div><span className="font-semibold">Mode:</span> {previewSale.saleMode?.replace('_', ' ')}</div>
                    <div><span className="font-semibold">Product:</span> {previewSale.productType}</div>
                    <div><span className="font-semibold">Payment:</span> {previewSale.paymentStatus}</div>
                  </div>
                  {rows.length > 0 && (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 px-2 py-1 text-left">S.N.</th>
                          <th className="border border-gray-400 px-2 py-1 text-left">Customer</th>
                          <th className="border border-gray-400 px-2 py-1 text-right">Birds</th>
                          <th className="border border-gray-400 px-2 py-1 text-right">Kgs</th>
                          <th className="border border-gray-400 px-2 py-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <td className="border border-gray-400 px-2 py-1">{i + 1}</td>
                            <td className="border border-gray-400 px-2 py-1">{r.customerName}</td>
                            <td className="border border-gray-400 px-2 py-1 text-right">{r.numBirds || "-"}</td>
                            <td className="border border-gray-400 px-2 py-1 text-right">{parseFloat(r.weight).toFixed(3)}</td>
                            <td className="border border-gray-400 px-2 py-1 text-right">₹{r.amount.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div className="border p-3 rounded text-xs space-y-1">
                    <div className="grid grid-cols-2 gap-x-8">
                      <div><span className="font-semibold">Total Birds:</span> {totalB || "-"}</div>
                      <div><span className="font-semibold">Total Kgs:</span> {totalW.toFixed(3)}</div>
                      <div><span className="font-semibold">Rate/Kg:</span> ₹{parseFloat(String(previewSale.unitPrice || 0)).toFixed(2)}</div>
                      <div><span className="font-semibold">Total Amount:</span> ₹{parseFloat(String(previewSale.totalAmount || 0)).toFixed(2)}</div>
                    </div>
                    <div className="border-t pt-2 mt-2 grid grid-cols-2 gap-x-8">
                      {parseFloat(String(previewSale.transportCharges)) > 0 && <div><span className="font-semibold">Transport:</span> ₹{parseFloat(String(previewSale.transportCharges)).toFixed(2)}</div>}
                      {parseFloat(String(previewSale.commission)) > 0 && <div><span className="font-semibold">Commission:</span> ₹{parseFloat(String(previewSale.commission)).toFixed(2)}</div>}
                      <div className="font-bold text-green-700"><span className="font-semibold">Net Amount:</span> ₹{parseFloat(String(previewSale.netAmount || 0)).toFixed(2)}</div>
                      <div><span className="font-semibold">Received:</span> ₹{parseFloat(String(previewSale.amountReceived || 0)).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => {
                      const w = window.open('', '_blank')
                      if (w) {
                        w.document.write(`<!DOCTYPE html><html><head><title>Sale ${previewSale.invoiceNumber}</title><style>body{font-family:Arial,sans-serif;margin:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:4px 6px}th{background:#f0f0f0}@media print{body{margin:10px}}</style></head><body>${document.querySelector('.bg-white.text-sm')?.innerHTML || ''}</body></html>`)
                        w.document.close(); w.onload = () => w.print()
                      }
                    }}><Printer size={14} className="mr-1" /> Print</Button>
                  </div>
                </div>
              )}

              {previewTab === "attachment" && (
                <div className="p-4 min-h-48">
                  {previewSale.saleAttachment ? (
                    <div className="space-y-3">
                      {isImage && (
                        <img src={`${backendBase}${previewSale.saleAttachment}`} alt="Sale attachment"
                          className="max-w-full rounded border shadow" />
                      )}
                      {isPdf && (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-600 mb-3">PDF attachment</p>
                          <a href={`${backendBase}${previewSale.saleAttachment}`} target="_blank" rel="noreferrer"
                            className="text-blue-600 underline text-sm">Open PDF in new tab</a>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 text-center">
                        <a href={`${backendBase}${previewSale.saleAttachment}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          Download / View Full Size
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Paperclip size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No attachment for this sale.</p>
                      <p className="text-xs mt-1">Edit the sale to add a sheet.</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )
      })()}

      {/* ── Print Invoice (hidden, shown only on print) ── */}
      {printSale && (
        <div id="print-invoice" className="hidden print:block p-6 font-mono text-sm">
          <div className="flex justify-between mb-2">
            <div className="text-lg font-bold">{printSale.saleDate}</div>
            <div className="text-lg font-bold">{printSale.customerName} (Dukan)</div>
          </div>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 text-left">Name</th>
                <th className="border border-black p-1 text-right">Pcs.</th>
                <th className="border border-black p-1 text-right">Wt.</th>
                <th className="border border-black p-1 text-right">Rate</th>
                <th className="border border-black p-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {printRows.length > 0 ? printRows.map((r, i) => (
                <tr key={i}>
                  <td className="border border-black p-1">{r.customerName}</td>
                  <td className="border border-black p-1 text-right">{r.numBirds}</td>
                  <td className="border border-black p-1 text-right">{parseFloat(r.weight).toFixed(3)}</td>
                  <td className="border border-black p-1 text-right">{parseFloat(String(printSale.unitPrice)).toFixed(0)}</td>
                  <td className="border border-black p-1 text-right">{r.amount.toFixed(0)}</td>
                </tr>
              )) : (
                <tr>
                  <td className="border border-black p-1" colSpan={5}>
                    Total Weight: {parseFloat(String(printSale.quantity)).toFixed(3)} kg @ {parseFloat(String(printSale.unitPrice)).toFixed(0)}/kg
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="border border-black p-1">TOTAL</td>
                <td className="border border-black p-1 text-right">
                  {printRows.reduce((s, r) => s + (parseInt(r.numBirds) || 0), 0) || ""}
                </td>
                <td className="border border-black p-1 text-right">
                  {printRows.length > 0
                    ? printRows.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0).toFixed(3)
                    : parseFloat(String(printSale.quantity)).toFixed(3)}
                </td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 text-right">
                  {parseFloat(String(printSale.totalAmount)).toFixed(0)}
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-3 text-xs space-y-1">
            {parseFloat(String(printSale.transportCharges)) > 0 && <div>Transport: {printSale.transportCharges}</div>}
            {parseFloat(String(printSale.commission)) > 0 && <div>Commission: {printSale.commission}</div>}
            <div className="font-bold text-sm mt-2">Net Amount: ₹{parseFloat(String(printSale.netAmount)).toLocaleString()}</div>
            <div>Payment: {printSale.paymentStatus} | Received: ₹{parseFloat(String(printSale.amountReceived)).toLocaleString()}</div>
            <div>Invoice: {printSale.invoiceNumber}</div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
