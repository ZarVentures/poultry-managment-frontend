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
import { Plus, Edit2, Trash2, Download, Printer } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { salesApi, retailersApi, vehiclesApi, type Sale as ApiSale } from "@/lib/api"
import { toast } from "sonner"

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
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    customerName: "",
    ownerName: "",
    phone: "",
    address: "",
    saleDate: new Date().toISOString().split("T")[0],
    saleMode: "from_vehicle" as "from_vehicle" | "from_godown",
    vehicleId: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial",
    notes: "",
    retailerId: "",
    // Bird details
    birdType: "",
    numberOfCages: "",
    numberOfBirds: "",
    ratePerKg: "",
    averageWeight: "",
    // Charges
    transportCharges: "",
    loadingCharges: "",
    commission: "",
    otherCharges: "",
    // Deductions
    deductions: "",
    // Payment
    advancePaid: "",
    creditBalance: "",
    paymentMode: "",
    totalPaymentReceived: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchSales()
    fetchInvoiceList()
    fetchRetailers()
    fetchVehicles()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const data = await salesApi.getAll()
      if (Array.isArray(data)) {
        setSales(data)
      } else {
        setSales([])
      }
    } catch (error: any) {
      console.error("Failed to fetch sales:", error)
      setSales([])
      toast.error("Failed to load sales")
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoiceList = async () => {
    try {
      const data = await salesApi.getInvoiceList()
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

  const fetchRetailers = async () => {
    try {
      const data = await retailersApi.getActive()
      if (Array.isArray(data)) {
        setRetailers(data)
      } else {
        setRetailers([])
      }
    } catch (error) {
      console.error("Failed to fetch retailers:", error)
      setRetailers([])
      toast.error("Failed to load retailers")
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
      invoiceNumber: "",
      customerName: "",
      ownerName: "",
      phone: "",
      address: "",
      saleDate: new Date().toISOString().split("T")[0],
      saleMode: "from_vehicle",
      vehicleId: "",
      paymentStatus: "pending",
      notes: "",
      retailerId: "",
      birdType: "",
      numberOfCages: "",
      numberOfBirds: "",
      ratePerKg: "",
      averageWeight: "",
      transportCharges: "",
      loadingCharges: "",
      commission: "",
      otherCharges: "",
      deductions: "",
      advancePaid: "",
      creditBalance: "",
      paymentMode: "",
      totalPaymentReceived: "",
    })
    setEditingId(null)
  }

  // Handle retailer selection
  const handleRetailerChange = (retailerId: string) => {
    const selectedRetailer = retailers.find(r => r.id === retailerId)
    if (selectedRetailer) {
      setFormData({
        ...formData,
        retailerId,
        customerName: selectedRetailer.name,
        ownerName: selectedRetailer.ownerName || "",
        phone: selectedRetailer.phone || "",
        address: selectedRetailer.address || "",
      })
    }
  }

  // Handle invoice selection
  const handleInvoiceSelect = async (invoiceId: string) => {
    if (!invoiceId) return
    
    try {
      setLoading(true)
      const sale = await salesApi.getOne(invoiceId)
      handleEdit(sale)
    } catch (error) {
      console.error("Failed to fetch invoice:", error)
      toast.error("Failed to load invoice")
    } finally {
      setLoading(false)
    }
  }

  // Calculation functions
  const calculateTotalWeight = () => {
    const numberOfBirds = parseFloat(formData.numberOfBirds) || 0
    const averageWeight = parseFloat(formData.averageWeight) || 0
    return numberOfBirds * averageWeight
  }

  const calculateTotalAmount = () => {
    const totalWeight = calculateTotalWeight()
    const ratePerKg = parseFloat(formData.ratePerKg) || 0
    return totalWeight * ratePerKg
  }

  const calculateCharges = () => {
    const transport = parseFloat(formData.transportCharges) || 0
    const loading = parseFloat(formData.loadingCharges) || 0
    const commission = parseFloat(formData.commission) || 0
    const other = parseFloat(formData.otherCharges) || 0
    return transport + loading + commission + other
  }

  const calculateDeductions = () => {
    return parseFloat(formData.deductions) || 0
  }

  const calculateTotalInvoice = () => {
    const totalAmount = calculateTotalAmount()
    const charges = calculateCharges()
    const deductions = calculateDeductions()
    return totalAmount + charges - deductions
  }

  const calculateOutstandingPayment = () => {
    const totalInvoice = calculateTotalInvoice()
    const advancePaid = parseFloat(formData.advancePaid) || 0
    return Math.max(0, totalInvoice - advancePaid)
  }

  const calculateBalanceAmount = () => {
    const totalInvoice = calculateTotalInvoice()
    const totalPaymentReceived = parseFloat(formData.totalPaymentReceived) || 0
    return Math.max(0, totalInvoice - totalPaymentReceived)
  }

  const handleEdit = (sale: ApiSale) => {
    const retailer = retailers.find(r => r.id === sale.retailerId)
    setFormData({
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      ownerName: retailer?.ownerName || "",
      phone: retailer?.phone || "",
      address: retailer?.address || "",
      saleDate: sale.saleDate,
      saleMode: sale.saleMode || "from_vehicle",
      vehicleId: sale.vehicleId || "",
      paymentStatus: sale.paymentStatus,
      notes: sale.notes || "",
      retailerId: sale.retailerId || "",
      birdType: sale.birdType || "",
      numberOfCages: String(sale.numberOfCages || ""),
      numberOfBirds: String(sale.numberOfBirds || ""),
      ratePerKg: String(sale.ratePerKg || ""),
      averageWeight: String(sale.averageWeight || ""),
      transportCharges: String(sale.transportCharges || ""),
      loadingCharges: String(sale.loadingCharges || ""),
      commission: String(sale.commission || ""),
      otherCharges: String(sale.otherCharges || ""),
      deductions: String(sale.deductions || ""),
      advancePaid: String(sale.advancePaid || ""),
      creditBalance: String(sale.creditBalance || ""),
      paymentMode: sale.paymentMode || "",
      totalPaymentReceived: String(sale.totalPaymentReceived || ""),
    })
    setEditingId(sale.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.invoiceNumber || !formData.customerName) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)

      const saleData = {
        invoiceNumber: formData.invoiceNumber,
        customerName: formData.customerName,
        saleDate: formData.saleDate,
        saleMode: formData.saleMode,
        vehicleId: formData.vehicleId || undefined,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes,
        retailerId: formData.retailerId || undefined,
        birdType: formData.birdType || undefined,
        numberOfCages: formData.numberOfCages ? parseInt(formData.numberOfCages) : undefined,
        numberOfBirds: formData.numberOfBirds ? parseInt(formData.numberOfBirds) : undefined,
        ratePerKg: formData.ratePerKg ? parseFloat(formData.ratePerKg) : undefined,
        averageWeight: formData.averageWeight ? parseFloat(formData.averageWeight) : undefined,
        totalWeight: calculateTotalWeight(),
        totalAmount: calculateTotalAmount(),
        transportCharges: formData.transportCharges ? parseFloat(formData.transportCharges) : undefined,
        loadingCharges: formData.loadingCharges ? parseFloat(formData.loadingCharges) : undefined,
        commission: formData.commission ? parseFloat(formData.commission) : undefined,
        otherCharges: formData.otherCharges ? parseFloat(formData.otherCharges) : undefined,
        deductions: formData.deductions ? parseFloat(formData.deductions) : undefined,
        advancePaid: formData.advancePaid ? parseFloat(formData.advancePaid) : undefined,
        creditBalance: formData.creditBalance ? parseFloat(formData.creditBalance) : undefined,
        paymentMode: formData.paymentMode || undefined,
        totalPaymentReceived: formData.totalPaymentReceived ? parseFloat(formData.totalPaymentReceived) : undefined,
        balanceAmount: calculateBalanceAmount(),
      }

      if (editingId) {
        await salesApi.update(editingId, saleData)
        toast.success("Sale updated successfully")
      } else {
        await salesApi.create(saleData)
        toast.success("Sale created successfully")
      }

      await fetchSales()
      await fetchInvoiceList()
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
      await salesApi.delete(id)
      toast.success("Sale deleted successfully")
      await fetchSales()
      await fetchInvoiceList()
    } catch (error: any) {
      console.error("Failed to delete sale:", error)
      toast.error("Failed to delete sale")
    } finally {
      setLoading(false)
    }
  }

  // Stats calculations
  const stats = useMemo(() => {
    const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    const totalReceived = sales.reduce((sum, sale) => sum + (sale.totalPaymentReceived || 0), 0)
    const totalPending = totalSales - totalReceived

    return {
      totalSales: sales.length,
      totalAmount: totalSales,
      totalReceived,
      totalPending,
    }
  }, [sales])

  const filteredSales = useMemo(() => {
    if (!Array.isArray(sales)) {
      return []
    }
    
    let filtered = [...sales]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (sale) =>
          sale.invoiceNumber.toLowerCase().includes(query) ||
          sale.customerName.toLowerCase().includes(query)
      )
    }

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

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales Tracking</h1>
            <p className="text-muted-foreground">Manage your sales records</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Sale" : "Add New Sale"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit sale details" : "Enter sale details"}
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
                        <Label>Sale Invoice No. *</Label>
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
                                {invoice.invoiceNumber} - {invoice.customerName} ({invoice.saleDate})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(!editingId || editingId === "new") && (
                          <div className="flex mt-2">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              SI-
                            </span>
                            <Input
                              value={formData.invoiceNumber.replace('SI-', '')}
                              onChange={(e) => setFormData({ ...formData, invoiceNumber: 'SI-' + e.target.value })}
                              placeholder="e.g. 001, 002"
                              className="rounded-l-none"
                              disabled={loading}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <Label>Sale Date *</Label>
                        <DatePicker
                          value={formData.saleDate}
                          onChange={(date) => setFormData({ ...formData, saleDate: date })}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Shop Name *</Label>
                        <Select
                          value={formData.retailerId}
                          onValueChange={handleRetailerChange}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select shop (${retailers.length} available)`} />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(retailers) && retailers.length > 0 ? (
                              retailers.map((retailer) => (
                                <SelectItem key={retailer.id} value={retailer.id}>
                                  {retailer.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-retailers" disabled>
                                No retailers available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label>Owner Name</Label>
                        <Input
                          value={formData.ownerName}
                          placeholder="Auto-filled"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Phone</Label>
                        <Input
                          value={formData.phone}
                          placeholder="Auto-filled"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Address</Label>
                        <Input
                          value={formData.address}
                          placeholder="Auto-filled"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Sale Mode *</Label>
                        <Select
                          value={formData.saleMode}
                          onValueChange={(value: any) => setFormData({ ...formData, saleMode: value })}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-[250px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="from_vehicle">From Vehicle</SelectItem>
                            <SelectItem value="from_godown">From Godown</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <Label>Sale Payment *</Label>
                      <Select
                        value={formData.paymentStatus}
                        onValueChange={(value: any) => setFormData({ ...formData, paymentStatus: value })}
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
                    <div className="grid grid-cols-2 gap-6">
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
                      <div className="space-y-2.5">
                        <Label>Number of Cages *</Label>
                        <Input
                          type="number"
                          value={formData.numberOfCages}
                          onChange={(e) => setFormData({ ...formData, numberOfCages: e.target.value })}
                          placeholder="0"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Number of Birds</Label>
                        <Input
                          type="number"
                          value={formData.numberOfBirds}
                          onChange={(e) => setFormData({ ...formData, numberOfBirds: e.target.value })}
                          placeholder="0"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Rate per Kg *</Label>
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

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Average Weight (Kg)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.averageWeight}
                          onChange={(e) => setFormData({ ...formData, averageWeight: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Total Weight</Label>
                        <Input
                          value={calculateTotalWeight().toFixed(2)}
                          placeholder="Auto-calculated"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label>Total Amount</Label>
                      <Input
                        value={`₹${calculateTotalAmount().toFixed(2)}`}
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
                          value={formData.deductions}
                          onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
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
                          value={`₹${calculateTotalInvoice().toFixed(2)}`}
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
                        <Label>Credit Balance</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.creditBalance}
                          onChange={(e) => setFormData({ ...formData, creditBalance: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label>Outstanding Payment</Label>
                        <Input
                          value={`₹${calculateOutstandingPayment().toFixed(2)}`}
                          placeholder="Auto-calculated"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
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
                      <div className="space-y-2.5">
                        <Label>Total Payment Received</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.totalPaymentReceived}
                          onChange={(e) => setFormData({ ...formData, totalPaymentReceived: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>
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
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? "Saving..." : editingId ? "Update Sale" : "Add Sale"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{stats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₹{stats.totalReceived.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">₹{stats.totalPending.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by invoice number or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DateRangeFilter
                startDate={dateRangeStart}
                endDate={dateRangeEnd}
                onDateRangeChange={(start, end) => {
                  setDateRangeStart(start)
                  setDateRangeEnd(end)
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Download size={20} />
                </Button>
                <Button variant="outline" size="icon">
                  <Printer size={20} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className="capitalize">{sale.saleMode?.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell className="text-right">₹{(sale.totalAmount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{(sale.totalPaymentReceived || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sale.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : sale.paymentStatus === "partial"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
