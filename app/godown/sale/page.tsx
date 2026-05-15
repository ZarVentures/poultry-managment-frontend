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
import { Plus, Edit2, Trash2, X, Printer } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { godownApi, retailersApi, purchasesApi, type GodownSale, type GodownCage, type Retailer } from "@/lib/api"
import { toast } from "sonner"

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer", "advance"] as const
type PaymentMode = typeof PAYMENT_MODES[number]
interface PaymentRow { mode: PaymentMode; amount: string }
const emptyPayment = (): PaymentRow => ({ mode: "cash", amount: "" })
const emptyCage = (): GodownCage => ({ cageId: "", birdType: "", numberOfBirds: 0, cageWeight: 0 })

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
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    saleDate: new Date().toISOString().split("T")[0],
    purchaseBillNo: "",
    invoiceNumber: "",
    retailerId: "",
    customerName: "",
    numberOfBirds: "",
    totalWeight: "",
    weightLoss: "",
    ratePerKg: "",
    totalAmount: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial",
    notes: "",
  })
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()])
  const [cages, setCages] = useState<GodownCage[]>([])
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
    fetchSales()
    fetchRetailers()
    fetchAvailableCages()
  }, [])

  const fetchAvailableCages = async () => {
    try {
      setLoadingCages(true)
      const data = await purchasesApi.getInGodownCages()
      setAvailableCages(data.map(c => ({
        ...c,
        totalBirds: c.numberOfBirds, // Store original for validation
        totalWeight: Number(c.godownInwardWeight || c.purchaseWeight || 0),
        soldBirds: c.numberOfBirds, // Default to full
        soldWeight: Number(c.godownInwardWeight || c.purchaseWeight || 0)
      })))
    } catch (error) {
      console.error("Failed to fetch available cages:", error)
    } finally {
      setLoadingCages(false)
    }
  }

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

  const addPayment = () => setPayments(p => [...p, emptyPayment()])
  const removePayment = (i: number) => setPayments(p => p.filter((_, idx) => idx !== i))
  const updatePayment = (i: number, field: keyof PaymentRow, value: string) =>
    setPayments(p => p.map((x, idx) => idx === i ? { ...x, [field]: value } : x))

  const resetForm = () => {
    setFormData({
      saleDate: new Date().toISOString().split("T")[0],
      purchaseBillNo: "",
      invoiceNumber: "",
      retailerId: "",
      customerName: "",
      numberOfBirds: "",
      totalWeight: "",
      weightLoss: "",
      ratePerKg: "",
      totalAmount: "",
      paymentStatus: "pending",
      notes: "",
    })
    setPayments([emptyPayment()])
    setCages([])
    setSelectedCageIds(new Set())
    setEditingId(null)
    fetchAvailableCages() // Refresh available stock
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

    setCages(sale.cages || [])
    setEditingId(sale.id)
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
        amount: parseFloat(p.amount)
      }))

      const saleData = {
        saleDate: formData.saleDate,
        invoiceNumber: formData.invoiceNumber || undefined,
        customerName: formData.customerName,
        numberOfBirds: parseInt(formData.numberOfBirds) || 0,
        totalWeight: parseFloat(formData.totalWeight) || undefined,
        weightLoss: parseFloat(formData.weightLoss) || 0,
        ratePerKg: parseFloat(formData.ratePerKg) || undefined,
        totalAmount: parseFloat(formData.totalAmount) || parseFloat(calculateTotal()) || 0,
        paymentStatus: formData.paymentStatus,
        amountReceived: totalPaymentMade,
        notes: formData.notes,
        payments: validPayments,
        cages: Array.from(selectedCageIds).map(id => {
          const cage = availableCages.find(c => c.id === id)
          return {
            id,
            numberOfBirds: parseInt(String(cage?.soldBirds || "0"), 10),
            cageWeight: parseFloat(String(cage?.soldWeight || "0")),
            weightLoss: parseFloat(String(cage?.weightLoss || "0")),
          }
        }),
      }

      if (editingId) {
        await godownApi.sales.update(editingId, saleData)
        toast.success("Sale updated successfully")
      } else {
        await godownApi.sales.create(saleData)
        toast.success("Sale created successfully")
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

  const toggleCage = (id: string) => {
    setSelectedCageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)

      const selected = availableCages.filter(c => next.has(c.id))
      const totalBirds = selected.reduce((s, c) => s + (Number(c.soldBirds) || 0), 0)
      const totalWt = selected.reduce((s, c) => s + (Number(c.soldWeight) || 0), 0)

      const totalInwardWt = selected.reduce((s, c) => s + (Number(c.totalWeight) || 0), 0)
      const loss = Math.max(0, totalInwardWt - totalWt)

      setFormData(f => ({
        ...f,
        numberOfBirds: String(totalBirds),
        totalWeight: totalWt.toFixed(2),
        weightLoss: loss.toFixed(2),
        totalAmount: (totalWt * (parseFloat(f.ratePerKg) || 0)).toFixed(2)
      }))
      return next
    })
  }

  const updateCageSale = (id: string, field: 'soldBirds' | 'soldWeight' | 'weightLoss', value: string) => {
    const numVal = parseFloat(value) || 0
    setAvailableCages(prev => prev.map(c => {
      if (c.id === id) {
        if (field === 'soldBirds' && numVal > c.totalBirds) {
          toast.error(`Cannot sell more than ${c.totalBirds} birds`)
          return { ...c, [field]: String(c.totalBirds) }
        }
        if (field === 'soldWeight' && numVal > c.totalWeight) {
          toast.error(`Cannot sell more than ${c.totalWeight.toFixed(2)} kg`)
          return { ...c, [field]: String(c.totalWeight.toFixed(2)) }
        }
        return { ...c, [field]: value }
      }
      return c
    }))

    // Update form totals if selected
    if (selectedCageIds.has(id)) {
      setTimeout(() => {
        setAvailableCages(currentCages => {
          const selected = currentCages.filter(c => selectedCageIds.has(c.id))
          const totalBirds = selected.reduce((s, c) => s + (Number(c.soldBirds) || 0), 0)
          const totalWt = selected.reduce((s, c) => s + (Number(c.soldWeight) || 0), 0)
          const totalLoss = selected.reduce((s, c) => s + (Number(c.weightLoss) || 0), 0)

          setFormData(f => ({
            ...f,
            numberOfBirds: String(totalBirds),
            totalWeight: totalWt.toFixed(2),
            weightLoss: totalLoss.toFixed(2),
            totalAmount: (totalWt * (parseFloat(f.ratePerKg) || 0)).toFixed(2)
          }))
          return currentCages
        })
      }, 0)
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
                  <td>${new Date(sale.saleDate).toLocaleDateString()}</td>
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
                    <Label>Godown Sale No</Label>
                    <Input
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="e.g. GDS-001"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label>Link to Purchase Bill</Label>
                  <Select value={formData.purchaseBillNo || '__none__'} onValueChange={handlePurchaseBillChange} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="Select purchase bill (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {purchaseBills.map(b => (
                        <SelectItem key={b.id} value={b.orderNumber}>{b.orderNumber} — {b.supplierName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}

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

                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Customer name"
                    disabled={loading}
                  />
                </div>

                {/* Available Cages in Godown */}
                <div className="border rounded-lg p-3 bg-purple-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-purple-900 font-semibold"> Available Cages in Godown </Label>
                    {loadingCages && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
                  </div>
                  {!loadingCages && availableCages.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2 text-center">No cages available in godown.</p>
                  )}
                  {!loadingCages && availableCages.length > 0 && (
                    <div className="max-h-60 overflow-y-auto border rounded bg-white">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-purple-100 shadow-sm">
                          <tr className="border-b">
                            <th className="p-2 w-8"></th>
                            <th className="text-left p-2">Cage ID</th>
                            <th className="text-right p-2">Total Birds</th>
                            <th className="text-right p-2">Total Wt</th>
                            <th className="text-right p-2 text-blue-700">Sold Birds</th>
                            <th className="text-right p-2 text-blue-700">Sold Wt (kg)</th>
                            <th className="text-right p-2 text-red-700">Loss (kg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableCages.map(cage => (
                            <tr key={cage.id} className={`border-b hover:bg-purple-50 transition-colors ${selectedCageIds.has(cage.id) ? 'bg-green-50' : ''}`} onClick={() => toggleCage(cage.id)}>
                              <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={selectedCageIds.has(cage.id)} onChange={() => toggleCage(cage.id)} />
                              </td>
                              <td className="p-2 font-medium">{cage.cageId || '-'}</td>
                              <td className="p-2 text-right">{cage.totalBirds}</td>
                              <td className="p-2 text-right">{cage.totalWeight.toFixed(2)}</td>
                              <td className="p-2 text-right" onClick={e => e.stopPropagation()}>
                                <input
                                  type="number"
                                  value={cage.soldBirds}
                                  onChange={e => updateCageSale(cage.id, 'soldBirds', e.target.value)}
                                  className="w-16 text-right border rounded px-1 py-0.5"
                                  onWheel={e => e.currentTarget.blur()}
                                />
                              </td>
                              <td className="p-2 text-right" onClick={e => e.stopPropagation()}>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={cage.soldWeight}
                                  onChange={e => updateCageSale(cage.id, 'soldWeight', e.target.value)}
                                  className="w-20 text-right border rounded px-1 py-0.5"
                                  onWheel={e => e.currentTarget.blur()}
                                />
                              </td>
                              <td className="p-2 text-right" onClick={e => e.stopPropagation()}>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={cage.weightLoss || "0.00"}
                                  onChange={e => updateCageSale(cage.id, 'weightLoss', e.target.value)}
                                  className="w-16 text-right border rounded px-1 py-0.5 text-red-600 font-medium"
                                  onWheel={e => e.currentTarget.blur()}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-purple-100 font-bold border-t">
                          <tr>
                            <td colSpan={2} className="p-2">Selected: {selectedCageIds.size}</td>
                            <td className="p-2 text-right">{availableCages.filter(c => selectedCageIds.has(c.id)).reduce((s, c) => s + (Number(c.soldBirds) || 0), 0)}</td>
                            <td className="p-2 text-right" colSpan={4}>
                              <div className="flex justify-end gap-4">
                                <span>Sold: {availableCages.filter(c => selectedCageIds.has(c.id)).reduce((s, c) => s + (Number(c.soldWeight) || 0), 0).toFixed(2)} kg</span>
                                <span className="text-red-600">Loss: {availableCages.filter(c => selectedCageIds.has(c.id)).reduce((s, c) => s + (Number(c.weightLoss) || 0), 0).toFixed(2)} kg</span>
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
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

                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label className="text-red-600 font-medium">Weight Loss (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.weightLoss}
                      onChange={(e) => setFormData({ ...formData, weightLoss: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                      className="border-red-200 focus-visible:ring-red-500"
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
                          <Select value={p.mode} onValueChange={v => updatePayment(i, "mode", v)} disabled={loading}>
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
                      <TableHead className="font-bold">Quantity</TableHead>
                      <TableHead className="font-bold">Rate</TableHead>
                      <TableHead className="font-bold">Total</TableHead>
                      <TableHead className="font-bold text-red-600">Loss (kg)</TableHead>
                      <TableHead className="font-bold">Received</TableHead>
                      <TableHead className="font-bold">Balance</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.invoiceNumber || "-"}</TableCell>
                        <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.numberOfBirds} birds</TableCell>
                        <TableCell>₹{Number(sale.ratePerKg || 0).toFixed(2)}/kg</TableCell>
                        <TableCell>₹{Number(sale.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-red-600 font-medium">{Number((sale as any).weightLoss || 0).toFixed(2)} kg</TableCell>
                        <TableCell className="text-green-600">₹{Number(sale.amountReceived || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-red-600">₹{Math.max(0, Number(sale.totalAmount || 0) - Number(sale.amountReceived || 0)).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            sale.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {(sale.paymentStatus || 'pending').toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {userRole !== 'staff' && userRole !== 'Staff' && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(sale)}>
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(sale.id)}>
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
    </DashboardLayout >
  )
}
