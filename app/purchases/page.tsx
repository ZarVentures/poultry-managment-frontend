"use client"

// Payment status update fix deployed - 2026-03-04
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
  const [invoiceList, setInvoiceList] = useState<Array<{ id: string; orderNumber: string; orderDate: string; supplierName: string }>>([])
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
    fetchInvoiceList()
    fetchFarmers()
    fetchVehicles()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const data = await purchasesApi.getAll()
      // Ensure data is an array and has proper structure
      if (Array.isArray(data)) {
        setPurchases(data)
      } else {
        console.error("Invalid purchases data format:", data)
        setPurchases([])
        toast.error("Invalid data format received")
      }
    } catch (error: any) {
      console.error("Failed to fetch purchases:", error)
      setPurchases([]) // Set to empty array on error
      toast.error("Failed to load purchases")
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoiceList = async () => {
    try {
      const data = await purchasesApi.getInvoiceList()
      if (Array.isArray(data)) {
        setInvoiceList(data)
      } else {
        setInvoiceList([])
      }
    } catch (error) {
      console.error("Failed to fetch invoice list:", error)
      setInvoiceList([])
    }
  }

  const fetchFarmers = async () => {
    try {
      const data = await farmersApi.getActive()
      console.log("Fetched farmers:", data)
      if (Array.isArray(data)) {
        // Cast to Farmer[] since getActive returns a subset of Farmer fields
        setFarmers(data as Farmer[])
      } else {
        console.error("Farmers data is not an array:", data)
        setFarmers([])
      }
    } catch (error) {
      console.error("Failed to fetch farmers:", error)
      setFarmers([])
      toast.error("Failed to load farmers")
    }
  }

  const fetchVehicles = async () => {
    try {
      const data = await vehiclesApi.getAll()
      if (Array.isArray(data)) {
        setVehicles(data)
      } else {
        setVehicles([])
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error)
      setVehicles([])
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
    console.log("Farmer selected:", farmerId)
    console.log("Available farmers:", farmers)
    const selectedFarmer = farmers.find(f => f.id === farmerId)
    console.log("Selected farmer data:", selectedFarmer)
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

  // Handle invoice selection (for editing existing purchase)
  const handleInvoiceSelect = async (invoiceId: string) => {
    if (!invoiceId) return
    
    try {
      setLoading(true)
      const purchase = await purchasesApi.getOne(invoiceId)
      handleEdit(purchase)
    } catch (error) {
      console.error("Failed to fetch invoice:", error)
      toast.error("Failed to load invoice")
    } finally {
      setLoading(false)
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
      items: purchase.items && Array.isArray(purchase.items) && purchase.items.length > 0
        ? purchase.items.map(item => ({
            itemName: item.itemName,
            quantity: String(item.quantity),
            unit: item.unit,
            unitPrice: String(item.unitPrice),
          }))
        : [{ itemName: "", quantity: "", unit: "", unitPrice: "" }],
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
    // Use bird-based calculation (total weight * rate per kg)
    const birdAmount = calculateTotalAmountFromWeight()
    return birdAmount + calculateCharges()
  }

  const calculateNetAmount = () => {
    return calculateGrossAmount() - calculateDeductions()
  }

  // Payment calculations
  const calculateOutstandingPayment = () => {
    const netAmount = calculateNetAmount()
    const advancePaid = parseFloat(formData.advancePaid) || 0
    return Math.max(0, netAmount - advancePaid)
  }

  const calculateBalanceAmount = () => {
    const netAmount = calculateNetAmount()
    const totalPaymentMade = parseFloat(formData.totalPaymentMade) || 0
    return Math.max(0, netAmount - totalPaymentMade)
  }

  const handleSave = async () => {
    if (!formData.orderNumber || !formData.supplierName) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      
      // Prepare items with string values for quantity and unitCost (filter out empty items)
      const items = formData.items
        .filter(item => item.itemName && item.quantity && item.unit && item.unitPrice)
        .map(item => ({
          description: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitPrice,
        }))

      // Prepare cages (filter out empty cages)
      const cages = formData.cages
        .filter(cage => cage.cageId && cage.numberOfBirds && cage.cageWeight)
        .map(cage => ({
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
        // Charges (keep as strings)
        transportCharges: formData.transportCharges || undefined,
        loadingCharges: formData.loadingCharges || undefined,
        commission: formData.commission || undefined,
        otherCharges: formData.otherCharges || undefined,
        // Deductions (keep as strings)
        weightShortage: formData.weightShortage || undefined,
        mortalityDeduction: formData.mortalityDeduction || undefined,
        otherDeduction: formData.otherDeduction || undefined,
        // Payment tracking (keep as strings)
        purchasePaymentStatus: formData.purchasePaymentStatus,
        advancePaid: formData.advancePaid || undefined,
        paymentMode: formData.paymentMode || undefined,
        totalPaymentMade: formData.totalPaymentMade || undefined,
        notes: formData.notes,
        items,
        cages: cages.length > 0 ? cages : undefined,
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
    // Ensure purchases is an array
    if (!Array.isArray(purchases)) {
      return []
    }
    
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
              <div className="space-y-5">
                {/* Section 1: Header Information */}
                <Card className="border-blue-200 shadow-sm">
                  <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <CardTitle className="text-blue-900">Section 1: Header Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Purchase Invoice No. *</Label>
                        <Select
                          value={editingId || "new"}
                          onValueChange={(value) => {
                            if (value === "new") {
                              resetForm()
                            } else {
                              handleInvoiceSelect(value)
                            }
                          }}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select existing or create new" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">
                              <span className="font-semibold text-green-600">+ Create New Invoice</span>
                            </SelectItem>
                            {Array.isArray(invoiceList) && invoiceList.map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id}>
                                {invoice.orderNumber} - {invoice.supplierName} ({invoice.orderDate})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(!editingId || editingId === "new") && (
                          <div className="flex mt-2">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              PO-
                            </span>
                            <Input
                              value={formData.orderNumber.replace('PO-', '')}
                              onChange={(e) => setFormData({ ...formData, orderNumber: 'PO-' + e.target.value })}
                              placeholder="e.g. 001, 002"
                              className="rounded-l-none"
                              disabled={loading}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <Label>Purchase Date *</Label>
                        <DatePicker
                          value={formData.orderDate}
                          onChange={(date) => setFormData({ ...formData, orderDate: date })}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Farmer Name *</Label>
                        <Select
                          value={formData.farmerId}
                          onValueChange={handleFarmerChange}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select farmer (${farmers.length} available)`} />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(farmers) && farmers.length > 0 ? (
                              farmers.map((farmer) => (
                                <SelectItem key={farmer.id} value={farmer.id}>
                                  {farmer.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-farmers" disabled>
                                No farmers available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label>Farmer Mobile</Label>
                        <Input
                          value={formData.farmerMobile}
                          placeholder="Auto-filled"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Farm Location</Label>
                        <Input
                          value={formData.farmLocation}
                          placeholder="Auto-filled"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Vehicle No</Label>
                        <Select
                          value={formData.vehicleId}
                          onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(vehicles) && vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.vehicleNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label>Purchase Payment *</Label>
                      <Select
                        value={formData.purchasePaymentStatus}
                        onValueChange={(value: any) => setFormData({ ...formData, purchasePaymentStatus: value })}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes"
                        rows={3}
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>
                {/* Section 2: Bird Details */}
                <Card className="border-green-200 shadow-sm">
                  <CardHeader className="bg-green-50 border-b border-green-100">
                    <CardTitle className="text-green-900">Section 2: Bird Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="space-y-2.5">
                      <Label>Bird Type</Label>
                      <Select
                        value={formData.birdType}
                        onValueChange={(value) => setFormData({ ...formData, birdType: value })}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Select bird type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="broiler">Broiler</SelectItem>
                          <SelectItem value="layer">Layer</SelectItem>
                          <SelectItem value="desi">Desi</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-6 mb-2">
                        <Label className="text-sm font-medium">Cage ID Number</Label>
                        <Label className="text-sm font-medium">Number of Birds</Label>
                        <Label className="text-sm font-medium">Cage Weight (Kg)</Label>
                      </div>
                      {formData.cages.map((cage, index) => (
                        <div key={index} className="grid grid-cols-3 gap-6">
                          <Input
                            placeholder="Cage ID"
                            value={cage.cageId}
                            onChange={(e) => updateCage(index, "cageId", e.target.value)}
                            disabled={loading}
                            className="h-10"
                          />
                          <Input
                            type="number"
                            placeholder="Birds"
                            value={cage.numberOfBirds}
                            onChange={(e) => updateCage(index, "numberOfBirds", e.target.value)}
                            disabled={loading}
                            className="h-10"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Weight"
                            value={cage.cageWeight}
                            onChange={(e) => updateCage(index, "cageWeight", e.target.value)}
                            disabled={loading}
                            className="h-10"
                          />
                        </div>
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addCage} 
                        disabled={loading}
                        className="mt-2"
                      >
                        <Plus size={16} className="mr-1" /> Add More Cage
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Total Weight</Label>
                        <Input
                          value={calculateTotalWeight().toFixed(2)}
                          placeholder="Auto-calculated"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Rate per Kg</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.ratePerKg}
                          onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label>Total Amount</Label>
                      <Input
                        value={`₹${calculateTotalAmountFromWeight().toFixed(2)}`}
                        placeholder="Auto-calculated"
                        disabled
                        className="bg-gray-50 text-lg font-semibold"
                      />
                    </div>
                  </CardContent>
                </Card>
                {/* Section 3: Charges */}
                <Card className="border-orange-200 shadow-sm">
                  <CardHeader className="bg-orange-50 border-b border-orange-100">
                    <CardTitle className="text-orange-900">Section 3: Charges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Transport Charges</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.transportCharges}
                          onChange={(e) => setFormData({ ...formData, transportCharges: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Loading Charges</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.loadingCharges}
                          onChange={(e) => setFormData({ ...formData, loadingCharges: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Commission</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.commission}
                          onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Other Charges</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.otherCharges}
                          onChange={(e) => setFormData({ ...formData, otherCharges: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold mb-3 block">Deductions</Label>
                      <div className="space-y-2.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.weightShortage}
                          onChange={(e) => setFormData({ ...formData, weightShortage: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Section 4: Payment */}
                <Card className="border-purple-200 shadow-sm">
                  <CardHeader className="bg-purple-50 border-b border-purple-100">
                    <CardTitle className="text-purple-900">Section 4: Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Total Invoice</Label>
                        <Input
                          value={`₹${calculateNetAmount().toFixed(2)}`}
                          placeholder="Auto-calculated"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Advance Paid</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.advancePaid}
                          onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Outstanding Payment</Label>
                        <Input
                          value={`₹${calculateOutstandingPayment().toFixed(2)}`}
                          placeholder="Auto-calculated"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Payment Mode</Label>
                        <Select
                          value={formData.paymentMode}
                          onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Total Payment Made</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.totalPaymentMade}
                          onChange={(e) => setFormData({ ...formData, totalPaymentMade: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Balance Amount</Label>
                        <Input
                          value={`₹${calculateBalanceAmount().toFixed(2)}`}
                          placeholder="Auto-calculated"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? "Saving..." : editingId ? "Update Purchase Order" : "Create Purchase Order"}
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
