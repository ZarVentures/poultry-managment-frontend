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
import { Plus, Edit2, Trash2, X, Download, Printer } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { purchasesApi, farmersApi, vehiclesApi, type PurchaseOrder as ApiPurchaseOrder, type Farmer, type Vehicle } from "@/lib/api"
import { toast } from "sonner"

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<ApiPurchaseOrder[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    orderNumber: "",
    supplierName: "",
    orderDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "pending" as "pending" | "received" | "cancelled",
    // Farmer integration
    farmerId: "",
    farmerMobile: "",
    farmLocation: "",
    // Vehicle integration
    vehicleId: "",
    // Purchase payment
    purchasePaymentStatus: "pending" as "paid" | "pending" | "partial",
    // Bird details
    birdType: "",
    cages: [{ cageId: "", numberOfBirds: "", cageWeight: "" }],
    ratePerKg: "",
    // Charges
    transportCharges: "",
    loadingCharges: "",
    commission: "",
    otherCharges: "",
    // Deductions
    weightShortage: "",
    mortalityDeduction: "",
    otherDeduction: "",
    // Payment
    advancePaid: "",
    paymentMode: "",
    totalPaymentMade: "",
    notes: "",
    items: [{ itemName: "", quantity: "", unit: "", unitPrice: "" }],
  })

  useEffect(() => {
    setMounted(true)
    fetchPurchases()
    fetchFarmers()
    fetchVehicles()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const data = await purchasesApi.getAll()
      setPurchases(data)
    } catch (error: any) {
      console.error("Failed to fetch purchases:", error)
      toast.error("Failed to load purchases")
    } finally {
      setLoading(false)
    }
  }

  const fetchFarmers = async () => {
    try {
      const data = await farmersApi.getAll()
      setFarmers(data)
    } catch (error) {
      console.error("Failed to fetch farmers:", error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const data = await vehiclesApi.getAll()
      setVehicles(data)
    } catch (error) {
      console.error("Failed to fetch vehicles:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      orderNumber: "",
      supplierName: "",
      orderDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      status: "pending",
      farmerId: "",
      farmerMobile: "",
      farmLocation: "",
      vehicleId: "",
      purchasePaymentStatus: "pending",
      birdType: "",
      cages: [{ cageId: "", numberOfBirds: "", cageWeight: "" }],
      ratePerKg: "",
      transportCharges: "",
      loadingCharges: "",
      commission: "",
      otherCharges: "",
      weightShortage: "",
      mortalityDeduction: "",
      otherDeduction: "",
      advancePaid: "",
      paymentMode: "",
      totalPaymentMade: "",
      notes: "",
      items: [{ itemName: "", quantity: "", unit: "", unitPrice: "" }],
    })
    setEditingId(null)
  }

  // Handle farmer selection
  const handleFarmerChange = (farmerId: string) => {
    const selectedFarmer = farmers.find(f => f.id === farmerId)
    if (selectedFarmer) {
      setFormData({
        ...formData,
        farmerId,
        supplierName: selectedFarmer.name,
        farmerMobile: selectedFarmer.phone || "",
        farmLocation: selectedFarmer.address || "",
      })
    }
  }

  // Cage management functions
  const addCage = () => {
    setFormData({
      ...formData,
      cages: [...formData.cages, { cageId: "", numberOfBirds: "", cageWeight: "" }],
    })
  }

  const removeCage = (index: number) => {
    setFormData({
      ...formData,
      cages: formData.cages.filter((_, i) => i !== index),
    })
  }

  const updateCage = (index: number, field: string, value: string) => {
    const newCages = [...formData.cages]
    newCages[index] = { ...newCages[index], [field]: value }
    setFormData({ ...formData, cages: newCages })
  }

  // Calculate total weight from cages
  const calculateTotalWeight = () => {
    return formData.cages.reduce((sum, cage) => {
      const weight = parseFloat(cage.cageWeight) || 0
      return sum + weight
    }, 0)
  }

  // Calculate total amount from weight and rate
  const calculateTotalAmountFromWeight = () => {
    const totalWeight = calculateTotalWeight()
    const ratePerKg = parseFloat(formData.ratePerKg) || 0
    return totalWeight * ratePerKg
  }

  const handleEdit = (purchase: ApiPurchaseOrder) => {
    setFormData({
      orderNumber: purchase.orderNumber,
      supplierName: purchase.supplierName,
      orderDate: purchase.orderDate,
      dueDate: purchase.dueDate || "",
      status: purchase.status,
      farmerId: purchase.farmerId || "",
      farmerMobile: purchase.farmerMobile || "",
      farmLocation: purchase.farmLocation || "",
      vehicleId: purchase.vehicleId || "",
      purchasePaymentStatus: purchase.purchasePaymentStatus || "pending",
      birdType: purchase.birdType || "",
      cages: purchase.cages && purchase.cages.length > 0 
        ? purchase.cages.map(cage => ({
            cageId: cage.cageId || "",
            numberOfBirds: String(cage.numberOfBirds),
            cageWeight: String(cage.cageWeight),
          }))
        : [{ cageId: "", numberOfBirds: "", cageWeight: "" }],
      ratePerKg: String(purchase.ratePerKg || ""),
      transportCharges: String(purchase.transportCharges || ""),
      loadingCharges: String(purchase.loadingCharges || ""),
      commission: String(purchase.commission || ""),
      otherCharges: String(purchase.otherCharges || ""),
      weightShortage: String(purchase.weightShortage || ""),
      mortalityDeduction: String(purchase.mortalityDeduction || ""),
      otherDeduction: String(purchase.otherDeduction || ""),
      advancePaid: String(purchase.advancePaid || ""),
      paymentMode: purchase.paymentMode || "",
      totalPaymentMade: String(purchase.totalPaymentMade || ""),
      notes: purchase.notes || "",
      items: purchase.items.map(item => ({
        itemName: item.itemName,
        quantity: String(item.quantity),
        unit: item.unit,
        unitPrice: String(item.unitPrice),
      })),
    })
    setEditingId(purchase.id)
    setShowDialog(true)
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: "", quantity: "", unit: "", unitPrice: "" }],
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const unitPrice = parseFloat(item.unitPrice) || 0
      return sum + (quantity * unitPrice)
    }, 0)
  }

  const calculateCharges = () => {
    const transport = parseFloat(formData.transportCharges) || 0
    const loading = parseFloat(formData.loadingCharges) || 0
    const comm = parseFloat(formData.commission) || 0
    const other = parseFloat(formData.otherCharges) || 0
    return transport + loading + comm + other
  }

  const calculateDeductions = () => {
    const weight = parseFloat(formData.weightShortage) || 0
    const mortality = parseFloat(formData.mortalityDeduction) || 0
    const other = parseFloat(formData.otherDeduction) || 0
    return weight + mortality + other
  }

  const calculateGrossAmount = () => {
    return calculateTotal() + calculateCharges()
  }

  const calculateNetAmount = () => {
    return calculateGrossAmount() - calculateDeductions()
  }

  // Payment calculations
  const calculateOutstandingPayment = () => {
    const netAmount = calculateNetAmount()
    const advancePaid = parseFloat(formData.advancePaid) || 0
    return netAmount - advancePaid
  }

  const calculateBalanceAmount = () => {
    const netAmount = calculateNetAmount()
    const totalPaymentMade = parseFloat(formData.totalPaymentMade) || 0
    return netAmount - totalPaymentMade
  }

  const handleSave = async () => {
    if (!formData.orderNumber || !formData.supplierName) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      
      // Prepare items
      const items = formData.items.map(item => ({
        itemName: item.itemName,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice) || 0,
        totalPrice: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
      }))

      // Prepare cages
      const cages = formData.cages.map(cage => ({
        cageId: cage.cageId,
        birdType: formData.birdType,
        numberOfBirds: parseInt(cage.numberOfBirds) || 0,
        cageWeight: parseFloat(cage.cageWeight) || 0,
      }))

      const purchaseData: any = {
        orderNumber: formData.orderNumber,
        supplierName: formData.supplierName,
        orderDate: formData.orderDate,
        dueDate: formData.dueDate || undefined,
        status: formData.status,
        // Farmer integration
        farmerId: formData.farmerId || undefined,
        farmerMobile: formData.farmerMobile || undefined,
        farmLocation: formData.farmLocation || undefined,
        // Vehicle integration
        vehicleId: formData.vehicleId || undefined,
        // Bird details
        birdType: formData.birdType || undefined,
        totalWeight: calculateTotalWeight().toString(),
        ratePerKg: formData.ratePerKg || undefined,
        // Charges
        transportCharges: formData.transportCharges || undefined,
        loadingCharges: formData.loadingCharges || undefined,
        commission: formData.commission || undefined,
        otherCharges: formData.otherCharges || undefined,
        // Deductions
        weightShortage: formData.weightShortage || undefined,
        mortalityDeduction: formData.mortalityDeduction || undefined,
        otherDeduction: formData.otherDeduction || undefined,
        // Payment tracking
        purchasePaymentStatus: formData.purchasePaymentStatus,
        advancePaid: formData.advancePaid || undefined,
        paymentMode: formData.paymentMode || undefined,
        totalPaymentMade: formData.totalPaymentMade || undefined,
        notes: formData.notes,
        items,
        cages: cages.length > 0 && cages[0].numberOfBirds > 0 ? cages : undefined,
      }

      if (editingId) {
        await purchasesApi.update(editingId, purchaseData)
        toast.success("Purchase order updated successfully")
      } else {
        await purchasesApi.create(purchaseData)
        toast.success("Purchase order created successfully")
      }

      await fetchPurchases()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save purchase:", error)
      toast.error(error.message || "Failed to save purchase order")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) return

    try {
      setLoading(true)
      await purchasesApi.delete(id)
      toast.success("Purchase order deleted successfully")
      await fetchPurchases()
    } catch (error: any) {
      console.error("Failed to delete purchase:", error)
      toast.error("Failed to delete purchase order")
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const stats = useMemo(() => {
    const totalPurchases = purchases.length
    const totalBirds = purchases.reduce((sum, purchase) => {
      return sum + purchase.items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0)
    }, 0)
    const totalValue = purchases.reduce((sum, purchase) => sum + Number(purchase.netAmount || purchase.totalAmount), 0)
    const totalPaymentMade = purchases
      .filter(p => p.status === 'received')
      .reduce((sum, purchase) => sum + Number(purchase.netAmount || purchase.totalAmount), 0)

    return {
      totalPurchases,
      totalBirds,
      totalValue,
      totalPaymentMade,
    }
  }, [purchases])

  const filteredPurchases = useMemo(() => {
    let filtered = [...purchases]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (purchase) =>
          purchase.orderNumber.toLowerCase().includes(query) ||
          purchase.supplierName.toLowerCase().includes(query)
      )
    }

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((purchase) => {
        const purchaseDate = new Date(purchase.orderDate)
        purchaseDate.setHours(0, 0, 0, 0)
        return purchaseDate >= start && purchaseDate <= end
      })
    }

    return filtered
  }, [purchases, searchQuery, dateRangeStart, dateRangeEnd])

  const handleDownloadPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Orders Report</title>
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
            <h1>Purchase Orders Report</h1>
            <div><strong>Total Purchases:</strong> ${stats.totalPurchases}</div>
            <div><strong>Total Value:</strong> ₹${stats.totalValue.toFixed(2)}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Bird Amount</th>
                <th>Net Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPurchases.map(purchase => `
                <tr>
                  <td>${purchase.orderNumber}</td>
                  <td>${purchase.supplierName}</td>
                  <td>${new Date(purchase.orderDate).toLocaleDateString()}</td>
                  <td>₹${Number(purchase.totalAmount).toFixed(2)}</td>
                  <td>₹${Number(purchase.netAmount || purchase.totalAmount).toFixed(2)}</td>
                  <td>${purchase.status}</td>
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

  const handlePrintReport = () => {
    handleDownloadPDF()
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
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
               Add New purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit purchase order details" : "Create a new purchase order"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Order Number *</Label>
                    <Input
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      placeholder="PO-001"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier Name *</Label>
                    <Input
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      placeholder="Supplier name"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Order Date *</Label>
                    <DatePicker
                      value={formData.orderDate}
                      onChange={(date) => setFormData({ ...formData, orderDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <DatePicker
                      value={formData.dueDate}
                      onChange={(date) => setFormData({ ...formData, dueDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Items *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus size={16} className="mr-1" /> Add Item
                    </Button>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <Input
                        placeholder="Item name"
                        value={item.itemName}
                        onChange={(e) => updateItem(index, "itemName", e.target.value)}
                        disabled={loading}
                      />
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        disabled={loading}
                      />
                      <Input
                        placeholder="Unit"
                        value={item.unit}
                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                        disabled={loading}
                      />
                      <Input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1 || loading}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <div className="text-lg font-semibold">
                    Bird Amount: ₹{calculateTotal().toFixed(2)}
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <Label className="text-lg font-semibold">Section 3: Charges & Deductions</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transport Charges</Label>
                      <Input
                        type="number"
                        value={formData.transportCharges}
                        onChange={(e) => setFormData({ ...formData, transportCharges: e.target.value })}
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Loading Charges</Label>
                      <Input
                        type="number"
                        value={formData.loadingCharges}
                        onChange={(e) => setFormData({ ...formData, loadingCharges: e.target.value })}
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commission</Label>
                      <Input
                        type="number"
                        value={formData.commission}
                        onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Charges</Label>
                      <Input
                        type="number"
                        value={formData.otherCharges}
                        onChange={(e) => setFormData({ ...formData, otherCharges: e.target.value })}
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end text-sm">
                    <span className="font-medium">Total Charges: ₹{calculateCharges().toFixed(2)}</span>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold mb-3 block">Deductions</Label>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Weight Shortage</Label>
                        <Input
                          type="number"
                          value={formData.weightShortage}
                          onChange={(e) => setFormData({ ...formData, weightShortage: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mortality Deduction</Label>
                        <Input
                          type="number"
                          value={formData.mortalityDeduction}
                          onChange={(e) => setFormData({ ...formData, mortalityDeduction: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Other Deduction</Label>
                        <Input
                          type="number"
                          value={formData.otherDeduction}
                          onChange={(e) => setFormData({ ...formData, otherDeduction: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end text-sm mt-2">
                      <span className="font-medium">Total Deductions: ₹{calculateDeductions().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-base">
                      <span>Bird Amount:</span>
                      <span className="font-medium">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span>Total Charges:</span>
                      <span className="font-medium">₹{calculateCharges().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Gross Amount:</span>
                      <span>₹{calculateGrossAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base text-red-600">
                      <span>Total Deductions:</span>
                      <span className="font-medium">-₹{calculateDeductions().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t pt-2 text-green-600">
                      <span>Net Amount:</span>
                      <span>₹{calculateNetAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total purchase (no)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPurchases}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Birds Purchase (Qty)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalBirds.toFixed(0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value (₹)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{stats.totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total payment Made (₹)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{stats.totalPaymentMade.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Purchase Orders List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all purchase orders</p>
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
                    placeholder="Search by invoice, farmer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[250px]"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-2" size={16} />
                  Download PDF
                </Button>
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
            {loading && purchases.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredPurchases.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || (dateRangeStart && dateRangeEnd) 
                  ? "No purchase orders match your filters" 
                  : "No purchase orders found"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Bird Amount</TableHead>
                      <TableHead>Gross Amount</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{purchase.orderNumber}</TableCell>
                        <TableCell>{purchase.supplierName}</TableCell>
                        <TableCell>{new Date(purchase.orderDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {purchase.dueDate ? new Date(purchase.dueDate).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>₹{Number(purchase.totalAmount).toFixed(2)}</TableCell>
                        <TableCell>₹{Number(purchase.grossAmount || purchase.totalAmount).toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₹{Number(purchase.netAmount || purchase.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              purchase.status === "received"
                                ? "bg-green-100 text-green-800"
                                : purchase.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(purchase)}>
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(purchase.id)}>
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
