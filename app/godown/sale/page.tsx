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
import { godownApi, retailersApi, purchasesApi, type GodownSale, type GodownCage, type Retailer } from "@/lib/api"

const emptyCage = (): GodownCage => ({ cageId: "", birdType: "", numberOfBirds: 0, cageWeight: 0 })
import { toast } from "sonner"

export default function GodownSalePage() {
  const [sales, setSales] = useState<GodownSale[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [purchaseBills, setPurchaseBills] = useState<Array<{ id: string; orderNumber: string; supplierName: string }>>([])
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
    customerName: "",
    numberOfBirds: "",
    totalWeight: "",
    ratePerKg: "",
    totalAmount: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial",
    paymentMode: "cash",
    amountReceived: "",
    notes: "",
  })
  const [cages, setCages] = useState<GodownCage[]>([emptyCage()])

  useEffect(() => {
    setMounted(true)
    fetchSales()
    fetchRetailers()
    fetchPurchaseBills()
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
      setRetailers(data.filter(r => r.status === "active"))
    } catch (error) {
      console.error("Failed to fetch retailers:", error)
    }
  }

  const fetchPurchaseBills = async () => {
    try {
      const data = await purchasesApi.getInvoiceList()
      setPurchaseBills(Array.isArray(data) ? data : [])
    } catch { setPurchaseBills([]) }
  }

  const handlePurchaseBillChange = (orderNumber: string) => {
    const billNo = orderNumber === '__none__' ? '' : orderNumber
    // Auto-generate Godown Sale No: GDS-TEST001 from PO-TEST001
    const autoGdsNo = billNo ? 'GDS-' + billNo.replace(/^PO-/i, '') : ''
    setFormData(f => ({
      ...f,
      purchaseBillNo: billNo,
      invoiceNumber: autoGdsNo,
    }))
  }

  const resetForm = () => {
    setFormData({
      saleDate: new Date().toISOString().split("T")[0],
      purchaseBillNo: "",
      invoiceNumber: "",
      customerName: "",
      numberOfBirds: "",
      totalWeight: "",
      ratePerKg: "",
      totalAmount: "",
      paymentStatus: "pending",
      paymentMode: "cash",
      amountReceived: "",
      notes: "",
    })
    setCages([emptyCage()])
    setEditingId(null)
  }

  const handleEdit = (sale: GodownSale) => {
    setFormData({
      saleDate: sale.saleDate,
      purchaseBillNo: (sale as any).purchaseBillNo || "",
      invoiceNumber: (sale as any).invoiceNumber || "",
      customerName: sale.customerName,
      numberOfBirds: String(sale.numberOfBirds || ""),
      totalWeight: String(sale.totalWeight || ""),
      ratePerKg: String(sale.ratePerKg || ""),
      totalAmount: String(sale.totalAmount || ""),
      paymentStatus: (sale as any).paymentStatus || "pending",
      paymentMode: (sale as any).paymentMode || "cash",
      amountReceived: String((sale as any).amountReceived || ""),
      notes: sale.notes || "",
    })
    setCages(sale.cages && sale.cages.length > 0 ? sale.cages : [emptyCage()])
    setEditingId(sale.id)
    setShowDialog(true)
  }

  const calculateTotal = () => {
    const weight = parseFloat(formData.totalWeight) || 0
    const rate = parseFloat(formData.ratePerKg) || 0
    return (weight * rate).toFixed(2)
  }

  const handleSave = async () => {
    if (!formData.customerName || !formData.numberOfBirds || !formData.paymentStatus) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const saleData = {
        saleDate: formData.saleDate,
        invoiceNumber: formData.invoiceNumber || undefined,
        customerName: formData.customerName,
        numberOfBirds: parseInt(formData.numberOfBirds) || 0,
        totalWeight: parseFloat(formData.totalWeight) || undefined,
        ratePerKg: parseFloat(formData.ratePerKg) || undefined,
        totalAmount: parseFloat(formData.totalAmount) || parseFloat(calculateTotal()) || 0,
        paymentStatus: formData.paymentStatus,
        paymentMode: formData.paymentMode || undefined,
        amountReceived: parseFloat(formData.amountReceived) || 0,
        notes: formData.notes,
        cages: cages
          .filter(c => c.numberOfBirds > 0 || c.cageWeight > 0)
          .map(c => ({
            cageId: c.cageId || undefined,
            numberOfBirds: Number(c.numberOfBirds) || 0,
            cageWeight: Number(c.cageWeight) || 0,
          })),
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
        customerName: retailer.name,
      })
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
                    <Label>Godown Sale No (auto)</Label>
                    <Input
                      value={formData.invoiceNumber}
                      readOnly
                      placeholder="Auto-filled from Purchase Bill"
                      className={formData.invoiceNumber ? "bg-green-50 border-green-300" : "bg-gray-50"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
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
                </div>

                <div className="space-y-2">
                  <Label>Retailer (Optional)</Label>
                  <select
                    className="w-full border rounded p-2"
                    onChange={(e) => handleRetailerChange(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select retailer</option>
                    {retailers.map((retailer) => (
                      <option key={retailer.id} value={retailer.id}>
                        {retailer.name}
                      </option>
                    ))}
                  </select>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status *</Label>
                    <select
                      className="w-full border rounded p-2"
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                      disabled={loading}
                    >
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount Received (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amountReceived}
                      onChange={(e) => setFormData({ ...formData, amountReceived: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <select
                      className="w-full border rounded p-2"
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      disabled={loading}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Balance display */}
                {formData.totalAmount && (
                  <div className="bg-gray-50 border rounded p-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Balance Amount</span>
                    <span className={`text-lg font-bold ${(parseFloat(formData.totalAmount) - parseFloat(formData.amountReceived || '0')) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{Math.max(0, parseFloat(formData.totalAmount) - parseFloat(formData.amountReceived || '0')).toFixed(2)}
                    </span>
                  </div>
                )}

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

                {/* Cage Details Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Cage Details</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCages([...cages, emptyCage()])}
                      disabled={loading}
                    >
                      <Plus size={14} className="mr-1" /> Add Cage
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">Cage ID</TableHead>
                          <TableHead className="text-xs">Birds</TableHead>
                          <TableHead className="text-xs">Weight (kg)</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cages.map((cage, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="p-1">
                              <Input
                                value={cage.cageId || ""}
                                onChange={(e) => {
                                  const updated = [...cages]
                                  updated[idx] = { ...updated[idx], cageId: e.target.value }
                                  setCages(updated)
                                }}
                                placeholder="C1"
                                className="h-8 text-sm"
                                disabled={loading}
                              />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input
                                type="number"
                                value={cage.numberOfBirds || ""}
                                onChange={(e) => {
                                  const updated = [...cages]
                                  updated[idx] = { ...updated[idx], numberOfBirds: Number(e.target.value) }
                                  setCages(updated)
                                  const total = updated.reduce((s, c) => s + (Number(c.numberOfBirds) || 0), 0)
                                  setFormData(f => ({ ...f, numberOfBirds: String(total) }))
                                }}
                                placeholder="0"
                                className="h-8 text-sm"
                                disabled={loading}
                              />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={cage.cageWeight || ""}
                                onChange={(e) => {
                                  const updated = [...cages]
                                  updated[idx] = { ...updated[idx], cageWeight: Number(e.target.value) }
                                  setCages(updated)
                                  const total = updated.reduce((s, c) => s + (Number(c.cageWeight) || 0), 0)
                                  setFormData(f => ({ ...f, totalWeight: total.toFixed(2) }))
                                }}
                                placeholder="0.00"
                                className="h-8 text-sm"
                                disabled={loading}
                              />
                            </TableCell>
                            <TableCell className="p-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCages(cages.filter((_, i) => i !== idx))}
                                disabled={loading || cages.length === 1}
                              >
                                <X size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total: {cages.reduce((s, c) => s + (Number(c.numberOfBirds) || 0), 0)} birds,{" "}
                    {cages.reduce((s, c) => s + (Number(c.cageWeight) || 0), 0).toFixed(2)} kg
                  </div>
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
              <div>
                <CardTitle>Sales List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage godown sales</p>
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
                      <TableHead>GDS No</TableHead>
                      <TableHead>Purchase Bill</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{(sale as any).invoiceNumber || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{(sale as any).purchaseBillNo || '-'}</TableCell>
                        <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.numberOfBirds} birds</TableCell>
                        <TableCell>₹{Number(sale.ratePerKg || 0).toFixed(2)}/kg</TableCell>
                        <TableCell>₹{Number(sale.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(sale)}>
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(sale.id)}>
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
