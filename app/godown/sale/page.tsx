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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { godownApi, retailersApi, purchasesApi, type GodownSale, type Retailer } from "@/lib/api"
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/api-base-url"

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer", "advance"] as const
type PaymentMode = typeof PAYMENT_MODES[number]
interface PaymentRow { mode: PaymentMode; amount: string }
const emptyPayment = (): PaymentRow => ({ mode: "cash", amount: "" })


export default function GodownSalePage() {
  const [sales, setSales] = useState<GodownSale[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])

  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [allowEditBillNo, setAllowEditBillNo] = useState(false)
  const [formData, setFormData] = useState({
    saleDate: new Date().toISOString().split("T")[0],
    purchaseBillNo: "",
    invoiceNumber: "",
    retailerId: "",
    customerName: "",
    numberOfBirds: "",
    totalWeight: "",
    ratePerKg: "",
    totalAmount: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial",
    notes: "",
  })
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()])


  useEffect(() => {
    setMounted(true)
    fetchSales()
    fetchRetailers()
  }, [])
  const fetchSales = async () => {
    try {
      setLoading(true)
      const data = await godownApi.sales.getAll()
      setSales(data)
    } catch (error: any) {
      console.error("Failed to fetch sales:", error)
      toast.error("Failed to load sales")
    } finally {
      setLoading(false)
    }
  }

  const fetchRetailers = async () => {
    try {
      const data = await retailersApi.getAll()
      if (Array.isArray(data)) {
        const activeRetailers = data.filter(r => r.status === "active")
        // Ensure uniqueness by name to prevent UI duplicates
        const uniqueRetailers = activeRetailers.filter((v, i, a) => 
          a.findIndex(t => t.name === v.name) === i
        )
        setRetailers(uniqueRetailers)
      }
    } catch (error) {
      console.error("Failed to fetch retailers:", error)
    }
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

  const addPayment = () => setPayments(p => [...p, emptyPayment()])
  const removePayment = (i: number) => setPayments(p => p.filter((_, idx) => idx !== i))
  const updatePayment = (i: number, field: keyof PaymentRow, value: string) =>
    setPayments(p => p.map((x, idx) => idx === i ? { ...x, [field]: value } : x))

  const resetForm = async () => {
    const nextNumber = editingId ? "" : await fetchNextSaleNumber()
    setFormData({
      saleDate: new Date().toISOString().split("T")[0],
      purchaseBillNo: "",
      invoiceNumber: nextNumber,
      retailerId: "",
      customerName: "",
      numberOfBirds: "",
      totalWeight: "",
      ratePerKg: "",
      totalAmount: "",
      paymentStatus: "pending",
      notes: "",
    })
    setPayments([emptyPayment()])
    setEditingId(null)
    setAllowEditBillNo(false)
  }

  const handleEdit = async (sale: GodownSale) => {
    setFormData({
      saleDate: sale.saleDate,
      purchaseBillNo: (sale as any).purchaseBillNo || "",
      invoiceNumber: (sale as any).invoiceNumber || "",
      retailerId: (sale as any).retailerId || "",
      customerName: sale.customerName,
      numberOfBirds: String(sale.numberOfBirds || ""),
      totalWeight: String(sale.totalWeight || ""),
      ratePerKg: String(sale.ratePerKg || ""),
      totalAmount: String(sale.totalAmount || ""),
      paymentStatus: (sale as any).paymentStatus || "pending",
      notes: sale.notes || "",
    })
    
    // Load payments from sale data
    const salePayments = (sale as any).payments
    if (salePayments && salePayments.length > 0) {
      setPayments(salePayments.map((p: any) => ({ 
        mode: (p.paymentMode || "cash") as PaymentMode, 
        amount: String(p.amount) 
      })))
    } else {
      setPayments([emptyPayment()])
    }
    
    setEditingId(sale.id)
    setAllowEditBillNo(false)
    setShowDialog(true)
  }



  const calculateTotal = () => {
    const weight = parseFloat(formData.totalWeight) || 0
    const rate = parseFloat(formData.ratePerKg) || 0
    return (weight * rate).toFixed(2)
  }

  const totalPaymentMade = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceAmount = Math.max(0, parseFloat(formData.totalAmount || calculateTotal()) - totalPaymentMade)

  const handleSave = async () => {
    if (!formData.customerName || !formData.numberOfBirds || !formData.paymentStatus) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const validPayments = payments.filter(p => parseFloat(p.amount) > 0).map(p => ({ 
        paymentMode: p.mode, 
        amount: p.amount 
      }))
      
      let cagePayload: Array<{ cageId: string; soldBirds: number; soldWeight: number }> = []
      if (formData.purchaseBillNo) {
        try {
          const matchedCages = await purchasesApi.getCagesByOrderNumber(formData.purchaseBillNo, 'in_godown')
          cagePayload = matchedCages
            .filter((c: any) => c?.id)
            .map((c: any) => ({
              cageId: c.id,
              soldBirds: Number(c.numberOfBirds || 0),
              soldWeight: Number(c.godownInwardWeight ?? c.purchaseWeight ?? 0),
            }))
        } catch (error) {
          console.warn('Could not resolve in-godown cages for purchase bill:', error)
        }
      }

      const saleData = {
        retailerId: formData.retailerId || undefined,
        saleDate: formData.saleDate,
        invoiceNumber: formData.invoiceNumber || undefined,
        customerName: formData.customerName,
        numberOfBirds: parseInt(formData.numberOfBirds) || 0,
        totalWeight: parseFloat(formData.totalWeight) || undefined,
        ratePerKg: parseFloat(formData.ratePerKg) || undefined,
        totalAmount: parseFloat(formData.totalAmount) || parseFloat(calculateTotal()) || 0,
        paymentStatus: formData.paymentStatus,
        amountReceived: totalPaymentMade,
        notes: formData.notes,
        payments: validPayments,
        cages: cagePayload,
        cageIds: cagePayload.map((c) => c.cageId),
      }

      if (editingId) {
        await godownApi.sales.update(editingId, saleData)
        toast.success("Sale updated successfully")
      } else {
        const saved = await godownApi.sales.create(saleData)
        if (saved?.invoiceNumber) {
          toast.success(`Sale created successfully - GDS No: ${saved.invoiceNumber}`)
        } else {
          toast.success("Sale created successfully")
        }
      }

      await fetchSales()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save sale:", error)
      toast.error(error.message || "Failed to save sale")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    try {
      setLoading(true)
      await godownApi.sales.delete(id)
      toast.success("Sale deleted successfully")
      await fetchSales()
    } catch (error: any) {
      console.error("Failed to delete sale:", error)
      toast.error("Failed to delete sale")
    } finally {
      setLoading(false)
    }
  }

  const handleRetailerChange = (retailerId: string) => {
    const retailer = retailers.find(r => r.id === retailerId)
    if (retailer) {
      setFormData({
        ...formData,
        retailerId,
        customerName: retailer.name,
      })
    } else {
      setFormData({ ...formData, retailerId: '', customerName: '' })
    }
  }

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const filteredSales = useMemo(() => {
    let filtered = [...sales]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (sale) =>
          sale.customerName.toLowerCase().includes(query)
      )
    }

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.saleDate)
        saleDate.setHours(0, 0, 0, 0)
        return saleDate >= start && saleDate <= end
      })
    }

    return filtered
  }, [sales, searchQuery, dateRangeStart, dateRangeEnd])

  const salesStats = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => {
        const birds = Number(sale.numberOfBirds || 0)
        const weight = Number(sale.totalWeight || 0)
        const totalAmount = Number(sale.totalAmount || 0)
        const amountReceived = Number((sale as any).amountReceived || 0)
        const pending = Math.max(0, totalAmount - amountReceived)

        acc.totalBirds += birds
        acc.totalWeight += weight
        acc.totalAmount += totalAmount
        acc.totalPaid += amountReceived
        acc.totalPending += pending
        return acc
      },
      { totalBirds: 0, totalWeight: 0, totalAmount: 0, totalPaid: 0, totalPending: 0 },
    )
  }, [filteredSales])

  const handlePrintReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Godown Sales Report</title>
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
            <h1>Godown Sales Report</h1>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>GDS No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(sale => `
                <tr>
                  <td>${sale.invoiceNumber || "-"}</td>
                  <td>${new Date(sale.saleDate).toLocaleDateString('en-GB')}</td>
                  <td>${sale.customerName}</td>
                  <td>${sale.numberOfBirds} birds</td>
                  <td>₹${Number(sale.ratePerKg || 0).toFixed(2)}/kg</td>
                  <td>₹${Number(sale.totalAmount || 0).toFixed(2)}</td>
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

  const handlePrintSale = (sale: GodownSale) => {
    const received = Number((sale as any).amountReceived || 0)
    const totalAmount = Number(sale.totalAmount || 0)
    const balance = Math.max(0, totalAmount - received)
    const payments = Array.isArray((sale as any).payments) ? (sale as any).payments : []
    const subtotal = totalAmount
    const discount = 0
    const tax = 0
    const grandTotal = subtotal - discount + tax
    const invoiceNumber = sale.invoiceNumber || "INV-2026-000124"
    const invoiceDate = new Date(sale.saleDate).toLocaleDateString('en-GB')
    const dueDate = new Date(sale.saleDate)
    dueDate.setDate(dueDate.getDate() + 7)
    const dueDateLabel = dueDate.toLocaleDateString('en-GB')
    const paymentStatus = ((sale as any).paymentStatus || "pending").toUpperCase()
    const matchedRetailer = 
      retailers.find((r) => String(r.id) === String((sale as any).retailerId || "")) ||
      retailers.find((r) => r.name.toLowerCase() === String(sale.customerName || "").toLowerCase().trim()) ||
      (sale as any).retailer || null
    const customerPhone = String(
      (sale as any).customerPhone ||
      (sale as any).phone ||
      matchedRetailer?.phone ||
      ""
    ).trim()
    const customerAddress = String(
      (sale as any).customerAddress ||
      (sale as any).address ||
      matchedRetailer?.address ||
      ""
    ).trim()
    const barcodeBars = Array.from({ length: 36 }, (_, i) => `<span style="height:${10 + (i % 5) * 3}px"></span>`).join("")
    const qrPattern = Array.from({ length: 64 }, (_, i) => `<span class="qr-cell ${i % 7 === 0 || i % 11 === 3 || i % 13 === 2 ? "active" : ""}"></span>`).join("")

    const invoiceRows = (() => {
      try {
        const parsed = JSON.parse(sale.notes || "")
        if (parsed?.customerRows?.length) {
          return parsed.customerRows.map((row: any) => ({
            psc: row.numBirds || 0,
            wt: Number(row.weight || 0),
            rate: Number(row.rate || Number(sale.ratePerKg || 0)),
            amt: Number(row.amount || 0),
            paid: Number(row.amount || 0),
          }))
        }
      } catch {}
      return [{
        psc: Number(sale.numberOfBirds || 0),
        wt: Number(sale.totalWeight || 0),
        rate: Number(sale.ratePerKg || 0),
        amt: Number(subtotal),
        paid: Number(received),
      }]
    })()

    const invoiceHtml = `
      <div class="invoice-shell">
        <div class="form-header">
          <div class="form-title">Aziz Poultry FARM</div>
          <div class="form-meta">
            <div class="meta-row"><span>Bill No.</span><strong>${invoiceNumber}</strong></div>
            <div class="meta-row"><span>Date</span><strong>${invoiceDate}</strong></div>
          </div>
        </div>

        <div class="customer-line">
          <div class="customer-label">Name</div>
          <div class="customer-value">${sale.customerName || matchedRetailer?.name || 'Customer Name'}</div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Psc.</th>
              <th>Wt.</th>
              <th>Rate</th>
              <th>Amt</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRows.map((row: any) => `
              <tr>
                <td>${row.psc}</td>
                <td>${row.wt.toFixed(3)}</td>
                <td>₹${row.rate.toFixed(0)}</td>
                <td>₹${row.amt.toFixed(0)}</td>
                <td>₹${row.paid.toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td><strong>Total</strong></td>
              <td><strong>${invoiceRows.reduce((sum: number, row: any) => sum + row.wt, 0).toFixed(3)}</strong></td>
              <td></td>
              <td><strong>₹${invoiceRows.reduce((sum: number, row: any) => sum + row.amt, 0).toFixed(0)}</strong></td>
              <td><strong>₹${invoiceRows.reduce((sum: number, row: any) => sum + row.paid, 0).toFixed(0)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div class="bottom-info">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="label">Authorized Signature</div>
          </div>
        </div>
      </div>
    `

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice - ${sale.invoiceNumber || "Godown Sale"}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; }
            @page { size: A4 portrait; margin: 10mm; }
            .page { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
            .invoice-shell { position: relative; background: #fff; border: 1px solid #111; border-radius: 8px; padding: 16px; }
            .form-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; border: 1px solid #111; padding: 10px; margin-bottom: 10px; }
            .form-title { font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
            .form-meta { text-align: right; min-width: 190px; }
            .meta-row { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; color: #111; margin-top: 6px; }
            .meta-row span { font-weight: 700; }
            .customer-line { display: flex; align-items: center; gap: 10px; border: 1px solid #111; padding: 10px; margin-bottom: 10px; }
            .customer-label { min-width: 60px; font-size: 13px; font-weight: 700; }
            .customer-value { flex: 1; border-bottom: 1px solid #111; padding-bottom: 4px; font-size: 13px; font-weight: 600; }
            .invoice-table { width: 100%; border-collapse: collapse; border: 1px solid #111; }
            .invoice-table th, .invoice-table td { border: 1px solid #111; padding: 8px 10px; text-align: center; font-size: 12px; }
            .invoice-table th { font-weight: 700; }
            .totals-row td { border-top: 2px solid #111; font-weight: 700; }
            .bottom-info { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-top: 12px; padding: 0 2px; }
            .signature-block { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-top: 10px; }
            .signature-line { width: 160px; height: 1px; background: #111; }
            @media print { body { background: #fff; } .page { padding: 0; } .invoice-shell { box-shadow: none; border: 1px solid #111; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="invoice-shell">
              ${invoiceHtml}
            </div>
          </div>
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
            <h1 className="text-3xl font-bold">Godown Sales</h1>
            <p className="text-muted-foreground">Record sales from godown</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                New Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Sale" : "New Sale"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit godown sale details" : "Create a new godown sale"}
                </p>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sale Date *</Label>
                    <DatePicker
                      value={formData.saleDate}
                      onChange={(date) => setFormData({ ...formData, saleDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Godown Sale No</Label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowEditBillNo}
                          onChange={(e) => setAllowEditBillNo(e.target.checked)}
                          className="cursor-pointer"
                        />
                        <span>Edit manually</span>
                      </label>
                    </div>
                    <Input
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="Auto-generated on save"
                      disabled={loading}
                      readOnly={!allowEditBillNo}
                      className={!allowEditBillNo ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>



                <div className="space-y-2">
                  <Label>Retailer (Optional)</Label>
                  <Select
                    value={formData.retailerId || '__none__'}
                    onValueChange={(v) => handleRetailerChange(v === '__none__' ? '' : v)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select retailer" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="__none__">Select retailer...</SelectItem>
                      {retailers.map((retailer) => (
                        <SelectItem key={retailer.id} value={retailer.id}>
                          {retailer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={retailers.find(r => r.id === formData.retailerId)?.phone || ""} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={retailers.find(r => r.id === formData.retailerId)?.address || ""} disabled className="bg-gray-50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Customer name"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Birds *</Label>
                    <Input
                      type="number"
                      value={formData.numberOfBirds}
                      onChange={(e) => setFormData({ ...formData, numberOfBirds: e.target.value })}
                      placeholder="0"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate per Kg (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.ratePerKg}
                      onChange={(e) => {
                        const rate = e.target.value
                        const total = (parseFloat(formData.totalWeight || "0") * parseFloat(rate || "0")).toFixed(2)
                        setFormData({ ...formData, ratePerKg: rate, totalAmount: total })
                      }}
                      placeholder="0.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Total Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalWeight}
                      onChange={(e) => {
                        const weight = e.target.value
                        const total = (parseFloat(weight || "0") * parseFloat(formData.ratePerKg || "0")).toFixed(2)
                        setFormData({ ...formData, totalWeight: weight, totalAmount: total })
                      }}
                      placeholder="0.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Amount (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status *</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(v: any) => setFormData({ ...formData, paymentStatus: v })}
                      disabled={loading}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Breakdown Card */}
                <Card className="border-purple-200">
                  <CardHeader className="bg-purple-50 border-b border-purple-100 py-3">
                    <CardTitle className="text-purple-900 text-sm">Payment Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
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
                          <div className="flex gap-1">
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              value={p.amount} 
                              onChange={e => updatePayment(i, "amount", e.target.value)} 
                              disabled={loading}  
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                            {payments.length > 1 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removePayment(i)} 
                                className="px-2 text-red-500"
                              >
                                <X size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addPayment} 
                        disabled={loading}
                      >
                        <Plus size={14} className="mr-1" /> Add Payment Mode
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-2">
                        <Label>Total Received (₹)</Label>
                        <Input 
                          value={`₹${totalPaymentMade.toFixed(2)}`} 
                          disabled 
                          className="bg-gray-50 font-semibold text-green-700" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Balance (₹)</Label>
                        <Input 
                          value={`₹${balanceAmount.toFixed(2)}`} 
                          disabled 
                          className="bg-gray-50 font-semibold text-red-600" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={3}
                    disabled={loading}
                    onWheel={(e) => e.currentTarget.blur()} 
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Birds</p>
              <p className="text-2xl font-bold">{salesStats.totalBirds.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Weight</p>
              <p className="text-2xl font-bold">{salesStats.totalWeight.toFixed(2)} kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">₹{salesStats.totalAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-green-700">₹{salesStats.totalPaid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-2xl font-bold text-red-600">₹{salesStats.totalPending.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              {/* <div>
                <CardTitle>Sales List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage godown sales</p>
              </div> */}
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onDateRangeChange={handleDateRangeChange}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Filter:</Label>
                  <Input
                    placeholder="Search by customer..."
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
            {loading && sales.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredSales.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || (dateRangeStart && dateRangeEnd) 
                  ? "No sales match your filters" 
                  : "No sales found"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">GDS No</TableHead>
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold">Customer</TableHead>
                      <TableHead className="font-bold">Birds</TableHead>
                      <TableHead className="font-bold">Rate</TableHead>
                      <TableHead className="font-bold">Total</TableHead>
                      <TableHead className="font-bold">Received</TableHead>
                      <TableHead className="font-bold">Balance</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => {
                      const totalAmount = Number(sale.totalAmount || 0)
                      const amountReceived = Number((sale as any).amountReceived || 0)
                      const balance = Math.max(0, totalAmount - amountReceived)
                      
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.invoiceNumber || "-"}</TableCell>
                          <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                          <TableCell>{sale.customerName}</TableCell>
                          <TableCell>{sale.numberOfBirds} birds</TableCell>
                          <TableCell>₹{Number(sale.ratePerKg || 0).toFixed(2)}/kg</TableCell>
                          <TableCell>₹{totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-green-700 font-medium">₹{amountReceived.toFixed(2)}</TableCell>
                          <TableCell className="text-red-600 font-medium">₹{balance.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              (sale as any).paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                              (sale as any).paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {(sale as any).paymentStatus || 'pending'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(sale)}>
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handlePrintSale(sale)}>
                                <Printer size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(sale.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
