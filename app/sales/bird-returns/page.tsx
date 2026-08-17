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
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, Package, AlertTriangle, RotateCcw, Bird, IndianRupee } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { vehicleBirdReturnsApi, salesApi, type VehicleBirdReturn, type CreateVehicleBirdReturnDto } from "@/lib/api"
import { toast } from "sonner"

export default function VehicleBirdReturnsPage() {
  const [returns, setReturns] = useState<VehicleBirdReturn[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [salesList, setSalesList] = useState<Array<{ id: string; invoiceNumber: string; saleDate: string; customerName: string }>>([])
  const [saleUnitPrice, setSaleUnitPrice] = useState<number>(0)
  
  const [formData, setFormData] = useState<CreateVehicleBirdReturnDto>({
    returnDate: new Date().toISOString().split("T")[0],
    saleId: "",
    customerName: "",
    retailerId: "",
    numberOfBirdsReturned: 0,
    weightReturned: "",
    returnReason: "dead",
    reasonDescription: "",
    refundAmount: "",
    adjustmentAmount: "",
    status: "pending",
    returnedToInventory: true,
    inventoryLocation: "Main Godown",
    notes: "",
  })

  const STANDARD_LOCATIONS = [
    "Main Godown",
    "Isolation Pen"
  ]

  useEffect(() => {
    setMounted(true)
    fetchReturns()
    fetchSalesList()
  }, [])

  // Auto-calculate refund amount based on returned weight and sale unit price
  useEffect(() => {
    if (saleUnitPrice > 0 && formData.weightReturned) {
      const weight = parseFloat(formData.weightReturned) || 0
      const calculatedRefund = (weight * saleUnitPrice).toFixed(2)
      setFormData(prev => ({
        ...prev,
        refundAmount: calculatedRefund,
      }))
    }
  }, [formData.weightReturned, saleUnitPrice])

  const fetchSalesList = async () => {
    try {
      const res = await salesApi.getAll({ limit: 100 })
      const rawSales = Array.isArray(res) ? res : res.data || []
      const mapped = rawSales.map((s: any) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber || s.saleNo || `Invoice #${s.id}`,
        saleDate: s.saleDate,
        customerName: s.customerName,
      }))
      setSalesList(mapped)
    } catch (error) {
      console.error("Failed to fetch sales list:", error)
    }
  }

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const data = await vehicleBirdReturnsApi.getAll()
      setReturns(Array.isArray(data) ? data : data.data || [])
    } catch (error: any) {
      console.error("Failed to fetch vehicle returns:", error)
      toast.error("Failed to load vehicle returns")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      returnDate: new Date().toISOString().split("T")[0],
      saleId: "",
      customerName: "",
      retailerId: "",
      numberOfBirdsReturned: 0,
      weightReturned: "",
      returnReason: "dead",
      reasonDescription: "",
      refundAmount: "",
      adjustmentAmount: "",
      status: "pending",
      returnedToInventory: true,
      inventoryLocation: "Main Godown",
      notes: "",
    })
    setEditingId(null)
    setSaleUnitPrice(0)
  }

  const handleEdit = (birdReturn: VehicleBirdReturn) => {
    setFormData({
      returnDate: birdReturn.returnDate,
      saleId: birdReturn.saleId,
      customerName: birdReturn.customerName,
      retailerId: birdReturn.retailerId,
      numberOfBirdsReturned: birdReturn.numberOfBirdsReturned,
      weightReturned: birdReturn.weightReturned ? String(birdReturn.weightReturned) : "",
      returnReason: birdReturn.returnReason,
      reasonDescription: birdReturn.reasonDescription,
      refundAmount: String(birdReturn.refundAmount || ""),
      adjustmentAmount: String(birdReturn.adjustmentAmount || ""),
      status: birdReturn.status,
      returnedToInventory: birdReturn.returnedToInventory ?? true,
      inventoryLocation: birdReturn.inventoryLocation || "Main Godown",
      notes: birdReturn.notes,
    })
    setEditingId(birdReturn.id)
    if (birdReturn.sale) {
      setSaleUnitPrice(Number(birdReturn.sale.unitPrice || 0))
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.saleId || !formData.customerName || formData.numberOfBirdsReturned <= 0) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      if (editingId) {
        await vehicleBirdReturnsApi.update(editingId, formData)
        toast.success("Vehicle return updated successfully")
      } else {
        await vehicleBirdReturnsApi.create(formData)
        toast.success("Vehicle return recorded successfully")
      }
      await fetchReturns()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save return:", error)
      toast.error(error.message || "Failed to save return")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this return?")) return
    try {
      setLoading(true)
      await vehicleBirdReturnsApi.approve(id)
      toast.success("Vehicle return approved")
      await fetchReturns()
    } catch (error: any) {
      toast.error(error.message || "Failed to approve")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason:")
    if (!reason) return
    try {
      setLoading(true)
      await vehicleBirdReturnsApi.reject(id, reason)
      toast.success("Vehicle return rejected")
      await fetchReturns()
    } catch (error: any) {
      toast.error(error.message || "Failed to reject")
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (id: string) => {
    if (!confirm("Process this return? This will update vehicle sale records and customer ledger.")) return
    try {
      setLoading(true)
      await vehicleBirdReturnsApi.process(id)
      toast.success("Vehicle return processed successfully")
      await fetchReturns()
    } catch (error: any) {
      toast.error(error.message || "Failed to process")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this return?")) return
    try {
      setLoading(true)
      await vehicleBirdReturnsApi.delete(id)
      toast.success("Vehicle return deleted successfully")
      await fetchReturns()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete")
    } finally {
      setLoading(false)
    }
  }

  const handleSaleChange = async (saleId: string) => {
    const saleBrief = salesList.find(s => s.id === saleId)
    if (!saleBrief) return

    setFormData(prev => ({
      ...prev,
      saleId,
      customerName: saleBrief.customerName,
    }))

    try {
      setLoading(true)
      const fullSale = await salesApi.getOne(saleId)
      if (fullSale) {
        const rate = Number(fullSale.unitPrice || 0)
        setSaleUnitPrice(rate)
        setFormData(prev => ({
          ...prev,
          retailerId: fullSale.retailerId || "",
          customerName: fullSale.customerName,
        }))
        toast.success(`Loaded vehicle sale details! Rate: ₹${rate.toFixed(2)}/kg`)
      }
    } catch (error) {
      console.error("Failed to load full sale details:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReturns = useMemo(() => {
    let filtered = returns

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sale?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter(r => {
        const returnDate = new Date(r.returnDate)
        returnDate.setHours(0, 0, 0, 0)
        return returnDate >= start && returnDate <= end
      })
    }

    return filtered
  }, [returns, searchQuery, statusFilter, dateRangeStart, dateRangeEnd])

  const stats = useMemo(() => {
    return {
      total: filteredReturns.length,
      pending: filteredReturns.filter(r => r.status === 'pending').length,
      approved: filteredReturns.filter(r => r.status === 'approved').length,
      processed: filteredReturns.filter(r => r.status === 'processed').length,
      totalBirds: filteredReturns.reduce((sum, r) => sum + r.numberOfBirdsReturned, 0),
      totalRefund: filteredReturns.reduce((sum, r) => sum + Number(r.refundAmount || 0), 0),
    }
  }, [filteredReturns])

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Pending" },
      approved: { icon: CheckCircle, color: "bg-blue-100 text-blue-700", label: "Approved" },
      rejected: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Rejected" },
      processed: { icon: Package, color: "bg-green-100 text-green-700", label: "Processed" },
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    )
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      dead: "Dead",
      sick: "Sick",
      underweight: "Underweight",
      quality_issue: "Quality Issue",
      customer_request: "Customer Request",
      other: "Other",
    }
    return labels[reason] || reason
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Vehicle Bird Returns & Tracking</h1>
            <p className="text-muted-foreground">Manage returned birds and track credits from vehicle sales</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="shrink-0 self-start sm:self-auto">
                <Plus className="mr-0" size={20} />
                Record Vehicle Return
              </Button>
            </DialogTrigger>
            <DialogContent className="max-sm:max-w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Vehicle Return" : "Record Vehicle Bird Return"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit vehicle bird return details" : "Record a new vehicle bird return"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Return Date *</Label>
                    <DatePicker
                      value={formData.returnDate}
                      onChange={(date) => setFormData({ ...formData, returnDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Invoice *</Label>
                    <Select
                      value={formData.saleId}
                      onValueChange={handleSaleChange}
                      disabled={loading || !!editingId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle sale invoice" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {salesList.map(sale => (
                          <SelectItem key={sale.id} value={sale.id}>
                            {sale.invoiceNumber} - {sale.customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Birds Returned *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.numberOfBirdsReturned}
                      onChange={(e) => setFormData({ ...formData, numberOfBirdsReturned: parseInt(e.target.value) || 0 })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight Returned (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.weightReturned}
                      onChange={(e) => setFormData({ ...formData, weightReturned: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Return Reason *</Label>
                  <Select
                    value={formData.returnReason}
                    onValueChange={(value: any) => setFormData({ ...formData, returnReason: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dead">Dead</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="underweight">Underweight</SelectItem>
                      <SelectItem value="quality_issue">Quality Issue</SelectItem>
                      <SelectItem value="customer_request">Customer Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Reason Description</Label>
                  <Textarea
                    value={formData.reasonDescription}
                    onChange={(e) => setFormData({ ...formData, reasonDescription: e.target.value })}
                    placeholder="Provide details about the vehicle return reason"
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Refund Amount (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.refundAmount}
                      onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Adjustment Amount (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.adjustmentAmount}
                      onChange={(e) => setFormData({ ...formData, adjustmentAmount: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Return to Inventory?</Label>
                    <Select
                      value={formData.returnedToInventory ? "yes" : "no"}
                      onValueChange={(val) => setFormData({ ...formData, returnedToInventory: val === "yes" })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes (Restock)</SelectItem>
                        <SelectItem value="no">No (Mortality/Discard)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.returnedToInventory && (
                    <div className="space-y-2">
                      <Label>Restock Location</Label>
                      <Select
                        value={formData.inventoryLocation}
                        onValueChange={(val) => setFormData({ ...formData, inventoryLocation: val })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select coop location" />
                        </SelectTrigger>
                        <SelectContent>
                          {STANDARD_LOCATIONS.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    disabled={loading}
                    rows={2}
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row pt-4">
                  <Button onClick={handleSave} disabled={loading} className="flex-1">
                    {loading ? "Saving..." : editingId ? "Update Return" : "Record Vehicle Return"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <RotateCcw size={18} className="text-gray-500 shrink-0" />
                Total Returns
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl font-bold whitespace-nowrap sm:text-2xl">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock size={18} className="text-yellow-600 shrink-0" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl font-bold text-yellow-600 whitespace-nowrap sm:text-2xl">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle size={18} className="text-blue-600 shrink-0" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl font-bold text-blue-600 whitespace-nowrap sm:text-2xl">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Package size={18} className="text-green-600 shrink-0" />
                Processed
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl font-bold text-green-600 whitespace-nowrap sm:text-2xl">{stats.processed}</div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Bird size={18} className="text-cyan-600 shrink-0" />
                Total Birds
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl font-bold text-cyan-600 whitespace-nowrap sm:text-2xl">{stats.totalBirds.toLocaleString("en-IN")}</div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <IndianRupee size={18} className="text-orange-600 shrink-0" />
                Total Refund
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl font-bold text-orange-600 whitespace-nowrap sm:text-2xl">₹{stats.totalRefund.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Input
                placeholder="Search by return number, customer, or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:flex-1 sm:min-w-[200px]"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                </SelectContent>
              </Select>
              <DateRangeFilter
                startDate={dateRangeStart}
                endDate={dateRangeEnd}
                onDateRangeChange={(start, end) => {
                  setDateRangeStart(start)
                  setDateRangeEnd(end)
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardContent className="pt-6">
            {loading && !returns.length ? (
              <div className="text-center py-8 text-muted-foreground">Loading vehicle returns...</div>
            ) : filteredReturns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="mx-auto mb-2" size={48} />
                <p>No vehicle returns found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Birds</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Restock Location</TableHead>
                      <TableHead className="text-right">Refund</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReturns.map((birdReturn) => (
                      <TableRow 
                        key={birdReturn.id}
                        className={
                          birdReturn.returnReason === 'sick' || birdReturn.inventoryLocation === 'Isolation Pen'
                            ? "bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
                            : ""
                        }
                      >
                        <TableCell className="font-medium">{birdReturn.returnNumber}</TableCell>
                        <TableCell>{new Date(birdReturn.returnDate).toLocaleDateString()}</TableCell>
                        <TableCell>{birdReturn.sale?.invoiceNumber || '-'}</TableCell>
                        <TableCell>{birdReturn.customerName}</TableCell>
                        <TableCell className="text-right">{birdReturn.numberOfBirdsReturned}</TableCell>
                        <TableCell>
                          {birdReturn.returnReason === 'sick' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              Sick
                            </span>
                          ) : birdReturn.returnReason === 'dead' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                              Dead
                            </span>
                          ) : (
                            <span className="text-sm font-medium">{getReasonLabel(birdReturn.returnReason)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {birdReturn.returnedToInventory ? (
                            birdReturn.inventoryLocation === 'Isolation Pen' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800">
                                Isolation Pen
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-muted-foreground">{birdReturn.inventoryLocation || 'Main Godown'}</span>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No Restock (Mortality)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">₹{Number(birdReturn.refundAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(birdReturn.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            {birdReturn.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(birdReturn.id)}
                                  disabled={loading}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle size={14} className="sm:mr-1" />
                                  <span className="hidden sm:inline">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(birdReturn.id)}
                                  disabled={loading}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle size={14} className="sm:mr-1" />
                                  <span className="hidden sm:inline">Reject</span>
                                </Button>
                              </>
                            )}
                            {birdReturn.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcess(birdReturn.id)}
                                disabled={loading}
                                  className="text-blue-600 hover:text-blue-700"
                              >
                                <Package size={14} className="sm:mr-1" />
                                <span className="hidden sm:inline">Process</span>
                              </Button>
                            )}
                            {birdReturn.status !== 'processed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(birdReturn)}
                                  disabled={loading}
                                >
                                  <Edit2 size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(birdReturn.id)}
                                  disabled={loading}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            )}
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
