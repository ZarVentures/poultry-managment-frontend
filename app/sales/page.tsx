"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { salesApi, retailersApi, type Sale as ApiSale, type Retailer } from "@/lib/api"
import { toast } from "sonner"

export default function SalesPage() {
  const [sales, setSales] = useState<ApiSale[]>([])
  const [retailers, setRetailers] = useState<Array<{ id: string; name: string; ownerName?: string; phone: string; address?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    customerName: "",
    ownerName: "",
    phone: "",
    address: "",
    saleDate: new Date().toISOString().split("T")[0],
    saleMode: "from_vehicle" as "from_vehicle" | "from_godown",
    productType: "eggs" as "eggs" | "meat" | "chicks" | "other",
    quantity: "",
    unit: "kg",
    unitPrice: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial",
    amountReceived: "",
    notes: "",
    retailerId: "",
    transportCharges: "",
    loadingCharges: "",
    commission: "",
    otherCharges: "",
    weightShortage: "",
    mortalityDeduction: "",
    otherDeduction: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchSales()
    fetchRetailers()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const data = await salesApi.getAll()
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
      const data = await retailersApi.getActive()
      setRetailers(data)
    } catch (error) {
      console.error("Failed to fetch retailers:", error)
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
      productType: "eggs",
      quantity: "",
      unit: "kg",
      unitPrice: "",
      paymentStatus: "pending",
      amountReceived: "",
      notes: "",
      retailerId: "",
      transportCharges: "",
      loadingCharges: "",
      commission: "",
      otherCharges: "",
      weightShortage: "",
      mortalityDeduction: "",
      otherDeduction: "",
    })
    setEditingId(null)
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
      productType: sale.productType,
      quantity: String(sale.quantity),
      unit: sale.unit || "kg",
      unitPrice: String(sale.unitPrice),
      paymentStatus: sale.paymentStatus,
      amountReceived: String(sale.amountReceived),
      notes: sale.notes || "",
      retailerId: sale.retailerId || "",
      transportCharges: String(sale.transportCharges || ""),
      loadingCharges: String(sale.loadingCharges || ""),
      commission: String(sale.commission || ""),
      otherCharges: String(sale.otherCharges || ""),
      weightShortage: String(sale.weightShortage || ""),
      mortalityDeduction: String(sale.mortalityDeduction || ""),
      otherDeduction: String(sale.otherDeduction || ""),
    })
    setEditingId(sale.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.invoiceNumber || !formData.customerName || !formData.quantity || !formData.unitPrice) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const quantity = parseFloat(formData.quantity)
      const unitPrice = parseFloat(formData.unitPrice)
      const totalAmount = quantity * unitPrice

      const saleData = {
        invoiceNumber: formData.invoiceNumber,
        customerName: formData.customerName,
        saleDate: formData.saleDate,
        saleMode: formData.saleMode,
        productType: formData.productType,
        quantity,
        unit: formData.unit,
        unitPrice,
        totalAmount,
        paymentStatus: formData.paymentStatus,
        amountReceived: parseFloat(formData.amountReceived) || 0,
        notes: formData.notes,
        retailerId: formData.retailerId || undefined,
        transportCharges: formData.transportCharges ? parseFloat(formData.transportCharges) : undefined,
        loadingCharges: formData.loadingCharges ? parseFloat(formData.loadingCharges) : undefined,
        commission: formData.commission ? parseFloat(formData.commission) : undefined,
        otherCharges: formData.otherCharges ? parseFloat(formData.otherCharges) : undefined,
        weightShortage: formData.weightShortage ? parseFloat(formData.weightShortage) : undefined,
        mortalityDeduction: formData.mortalityDeduction ? parseFloat(formData.mortalityDeduction) : undefined,
        otherDeduction: formData.otherDeduction ? parseFloat(formData.otherDeduction) : undefined,
      }

      if (editingId) {
        await salesApi.update(editingId, saleData)
        toast.success("Sale updated successfully")
      } else {
        await salesApi.create(saleData)
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
      await salesApi.delete(id)
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
        ownerName: retailer.ownerName || "",
        phone: retailer.phone,
        address: retailer.address || "",
      })
    } else {
      // Clear auto-filled fields if retailer is deselected
      setFormData({
        ...formData,
        retailerId: "",
        ownerName: "",
        phone: "",
        address: "",
      })
    }
  }

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0
    const unitPrice = parseFloat(formData.unitPrice) || 0
    return quantity * unitPrice
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

  const calculateBalance = () => {
    const net = calculateNetAmount()
    const received = parseFloat(formData.amountReceived) || 0
    return (net - received).toFixed(2)
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales</h1>
            <p className="text-muted-foreground">Manage your sales transactions</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                New Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Sale" : "New Sale"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit sale details" : "Create a new sale record"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Number *</Label>
                    <Input
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="INV-001"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Date *</Label>
                    <DatePicker
                      value={formData.saleDate}
                      onChange={(date) => setFormData({ ...formData, saleDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Mode *</Label>
                    <Select
                      value={formData.saleMode}
                      onValueChange={(value: any) => setFormData({ ...formData, saleMode: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="from_vehicle">From Gadi (Vehicle)</SelectItem>
                        <SelectItem value="from_godown">From Godown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Retailer (Optional)</Label>
                  <Combobox
                    options={retailers.map(r => ({
                      value: r.id,
                      label: r.name,
                      subtitle: r.phone
                    }))}
                    value={formData.retailerId}
                    onValueChange={handleRetailerChange}
                    placeholder="Select retailer"
                    searchPlaceholder="Search retailers..."
                    emptyText="No retailers found"
                    disabled={loading}
                  />
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
                    <Label>Owner Name</Label>
                    <Input
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="Owner name"
                      disabled={loading}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number"
                      disabled={loading}
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Address"
                    disabled={loading}
                    className="bg-muted/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Type *</Label>
                    <Select
                      value={formData.productType}
                      onValueChange={(value: any) => setFormData({ ...formData, productType: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eggs">Eggs</SelectItem>
                        <SelectItem value="meat">Meat</SelectItem>
                        <SelectItem value="chicks">Chicks</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="kg, pcs, dozen"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Amount</Label>
                    <Input value={`₹${calculateTotal().toFixed(2)}`} disabled className="font-semibold" />
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
                      <span>Sale Amount:</span>
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

                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label>Payment Status *</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value: any) => setFormData({ ...formData, paymentStatus: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount Received</Label>
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
                    <Label>Balance</Label>
                    <Input 
                      value={`₹${calculateBalance()}`} 
                      disabled 
                      className={`font-semibold ${parseFloat(calculateBalance()) > 0 ? 'text-red-600' : 'text-green-600'}`}
                    />
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

        <Card>
          <CardHeader>
            <CardTitle>Sales List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && sales.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : sales.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No sales found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Sale Mode</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Sale Amount</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.invoiceNumber}</TableCell>
                      <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {sale.saleMode === 'from_vehicle' ? 'Vehicle' : 'Godown'}
                        </span>
                      </TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell className="capitalize">{sale.productType}</TableCell>
                      <TableCell>
                        {sale.quantity} {sale.unit}
                      </TableCell>
                      <TableCell>₹{Number(sale.totalAmount).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₹{Number(sale.netAmount || sale.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
