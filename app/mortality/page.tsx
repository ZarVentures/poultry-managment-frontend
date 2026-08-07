"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash2, Download, Printer, X, Eye } from "lucide-react"
import { DateRangeFilter } from "@/components/date-range-filter"
import { useDateFilter } from "@/contexts/date-filter-context"
import { mortalityApi, purchasesApi, type PurchaseOrder } from "@/lib/api"
import { usePermissions } from "@/lib/permissions"
import { toast } from "sonner"

interface Mortality {
  id: string
  recordNumber: string
  purchaseInvoiceNo: string
  purchaseDate: string
  farmerName: string
  farmLocation?: string
  cageIdNumber?: string
  totalBirdsPurchased: number
  numberOfBirdsDied: number
  weightOfDeadBirds?: number
  ratePerKg?: number
  amount?: number
  cause: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export default function MortalityPage() {
  const router = useRouter()
  const { canUpdate, canDelete } = usePermissions()
  const [mortalities, setMortalities] = useState<Mortality[]>([])
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingMortality, setViewingMortality] = useState<Mortality | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState<{
    purchaseInvoiceNo: string
    purchaseDate: string
    farmerName: string
    farmLocation: string
    cageIdNumber: string
    totalBirdsPurchased: string
    numberOfBirdsDied: string
    weightOfDeadBirds: string
    ratePerKg: string
    amount: string
    cause: string
    notes: string
  }>({
    purchaseInvoiceNo: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    farmerName: "",
    farmLocation: "",
    cageIdNumber: "",
    totalBirdsPurchased: "",
    numberOfBirdsDied: "",
    weightOfDeadBirds: "",
    ratePerKg: "",
    amount: "",
    cause: "",
    notes: "",
  })
  const { startDate, endDate } = useDateFilter()

  // Fetch data from API
  useEffect(() => {
    setMounted(true)
    fetchMortalities()
    fetchPurchases()
  }, [])

  const fetchMortalities = async () => {
    try {
      setLoading(true)
      const data = await mortalityApi.getAll()
      setMortalities(data)
    } catch (error: any) {
      console.error("Error fetching mortalities:", error)
      toast.error(error.message || "Failed to fetch mortality records")
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    try {
      const response = await purchasesApi.getAll()
      const data = (response as any).data || response
      setPurchases(data)
    } catch (error) {
      console.error("Error fetching purchases:", error)
    }
  }

  const [selectedPurchaseFull, setSelectedPurchaseFull] = useState<PurchaseOrder | null>(null)

  // Selected purchase (for Cage ID dropdown and auto-fill)
  const selectedPurchase = useMemo(
    () =>
      purchases.find(
        (p) => (p.orderNumber || "").toLowerCase() === formData.purchaseInvoiceNo.toLowerCase()
      ),
    [purchases, formData.purchaseInvoiceNo]
  )

  // Cage IDs from selected purchase (use full order with cages)
  const cageIdOptions = useMemo(() => {
    const src = selectedPurchaseFull || selectedPurchase
    if (!src?.cages) return []
    const ids = src.cages
      .map((cage) => cage.cageId?.trim())
      .filter((id): id is string => !!id)
    return [...new Set(ids)]
  }, [selectedPurchaseFull, selectedPurchase])

  const calcAmount = (weight: string, rate: string) => {
    const w = parseFloat(weight) || 0
    const r = parseFloat(rate) || 0
    return w > 0 && r > 0 ? (w * r).toFixed(2) : ""
  }

  // Calculate total birds from cages
  const calculateTotalBirds = (purchase: PurchaseOrder): number => {
    if (!purchase.cages || purchase.cages.length === 0) return 0
    return purchase.cages.reduce((sum, cage) => sum + (cage.numberOfBirds || 0), 0)
  }

  // Auto-fill fields when Purchase Invoice No is selected
  const handlePurchaseInvoiceChange = async (invoiceNo: string) => {
    setSelectedPurchaseFull(null)
    const purchase = purchases.find(
      (p) => (p.orderNumber || "").toLowerCase() === invoiceNo.toLowerCase()
    )
    if (purchase) {
      // Fetch full order to get cages
      try {
        const full = await purchasesApi.getOne(purchase.id)
        setSelectedPurchaseFull(full)
        const totalBirds = full.cages
          ? full.cages.reduce((sum, cage) => sum + (cage.numberOfBirds || 0), 0)
          : calculateTotalBirds(purchase)
        const rate = full.ratePerKg != null ? String(full.ratePerKg) : ""
        setFormData(prev => ({
          ...prev,
          purchaseInvoiceNo: invoiceNo,
          purchaseDate: full.orderDate || new Date().toISOString().split("T")[0],
          farmerName: full.supplierName || "",
          farmLocation: full.farmLocation || "",
          cageIdNumber: "",
          totalBirdsPurchased: totalBirds.toString(),
          ratePerKg: rate,
          amount: calcAmount(prev.weightOfDeadBirds, rate),
        }))
      } catch {
        const totalBirds = calculateTotalBirds(purchase)
        const rate = purchase.ratePerKg != null ? String(purchase.ratePerKg) : ""
        setFormData(prev => ({
          ...prev,
          purchaseInvoiceNo: invoiceNo,
          purchaseDate: purchase.orderDate || new Date().toISOString().split("T")[0],
          farmerName: purchase.supplierName || "",
          farmLocation: purchase.farmLocation || "",
          cageIdNumber: "",
          totalBirdsPurchased: totalBirds.toString(),
          ratePerKg: rate,
          amount: calcAmount(prev.weightOfDeadBirds, rate),
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        purchaseInvoiceNo: invoiceNo,
        purchaseDate: new Date().toISOString().split("T")[0],
        farmerName: "",
        farmLocation: "",
        cageIdNumber: "",
        totalBirdsPurchased: "",
        ratePerKg: "",
        amount: "",
      }))
    }
  }

  const handleSave = async () => {
    if (!formData.purchaseDate || !formData.numberOfBirdsDied) {
      toast.error("Please fill date and number of birds died")
      return
    }

    try {
      setLoading(true)
      const weight = parseFloat(formData.weightOfDeadBirds) || undefined
      const rate = parseFloat(formData.ratePerKg) || undefined
      const amount = weight && rate ? weight * rate : undefined
      const mortalityData = {
        purchaseInvoiceNo: formData.purchaseInvoiceNo || "N/A",
        purchaseDate: formData.purchaseDate,
        farmerName: "N/A",
        totalBirdsPurchased: 0,
        numberOfBirdsDied: Number.parseInt(formData.numberOfBirdsDied),
        weightOfDeadBirds: weight,
        ratePerKg: rate,
        amount,
        cause: formData.cause || "",
        notes: formData.notes || "",
      }

      if (editingId) {
        await mortalityApi.update(editingId, mortalityData)
        toast.success("Mortality record updated successfully")
      } else {
        await mortalityApi.create(mortalityData)
        toast.success("Mortality record created successfully")
      }

      await fetchMortalities()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Error saving mortality:", error)
      toast.error(error.message || "Failed to save mortality record")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      purchaseInvoiceNo: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      farmerName: "",
      farmLocation: "",
      cageIdNumber: "",
      totalBirdsPurchased: "",
      numberOfBirdsDied: "",
      weightOfDeadBirds: "",
      ratePerKg: "",
      amount: "",
      cause: "",
      notes: "",
    })
    setSelectedPurchaseFull(null)
    setEditingId(null)
  }

  const handleEdit = (mortality: Mortality) => {
    setEditingId(mortality.id)
    const weight = mortality.weightOfDeadBirds?.toString() || ""
    const rate = mortality.ratePerKg?.toString() || ""
    setFormData({
      purchaseInvoiceNo: mortality.purchaseInvoiceNo || "",
      purchaseDate: mortality.purchaseDate || new Date().toISOString().split("T")[0],
      farmerName: mortality.farmerName || "",
      farmLocation: mortality.farmLocation || "",
      cageIdNumber: mortality.cageIdNumber || "",
      totalBirdsPurchased: mortality.totalBirdsPurchased?.toString() || "",
      numberOfBirdsDied: mortality.numberOfBirdsDied?.toString() || "",
      weightOfDeadBirds: weight,
      ratePerKg: rate,
      amount: mortality.amount?.toString() || calcAmount(weight, rate),
      cause: mortality.cause || "",
      notes: mortality.notes || "",
    })
    setShowDialog(true)
    // Load purchase cages for cage ID dropdown when editing
    if (mortality.purchaseInvoiceNo) {
      const purchase = purchases.find(
        (p) => (p.orderNumber || "").toLowerCase() === mortality.purchaseInvoiceNo.toLowerCase()
      )
      if (purchase) {
        purchasesApi.getOne(purchase.id).then(setSelectedPurchaseFull).catch(() => {})
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mortality record?")) return

    try {
      setLoading(true)
      await mortalityApi.delete(id)
      toast.success("Mortality record deleted successfully")
      await fetchMortalities()
    } catch (error: any) {
      console.error("Error deleting mortality:", error)
      toast.error(error.message || "Failed to delete mortality record")
    } finally {
      setLoading(false)
    }
  }

  const handleView = (mortality: Mortality) => {
    setViewingMortality(mortality)
    setShowViewDialog(true)
  }

  // Filter mortalities based on date range and search
  const filteredMortalities = useMemo(() => {
    let filtered = mortalities

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((mortality) => {
        const mortalityDate = new Date(mortality.purchaseDate || "")
        mortalityDate.setHours(0, 0, 0, 0)
        return mortalityDate >= start && mortalityDate <= end
      })
    }

    // Apply global date filter if set
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((mortality) => {
        const mortalityDate = new Date(mortality.purchaseDate || "")
        mortalityDate.setHours(0, 0, 0, 0)
        return mortalityDate >= start && mortalityDate <= end
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (mortality) =>
          (mortality.purchaseInvoiceNo || "").toLowerCase().includes(query) ||
          (mortality.farmerName || "").toLowerCase().includes(query),
      )
    }

    return filtered
  }, [mortalities, dateRangeStart, dateRangeEnd, startDate, endDate, searchQuery])

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const handleDownloadPDF = () => {
    const filtered = filteredMortalities
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mortality Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { margin-bottom: 20px; }
            .date-range { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Mortality List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString('en-GB')} - ${dateRangeEnd.toLocaleDateString('en-GB')}</div>` : ''}
            <div><strong>Total Records:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Purchase Date</th>
                <th>Number of Birds Died</th>
                <th>Cause of Death</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(mortality => `
                <tr>
                  <td>${mortality.purchaseDate || "N/A"}</td>
                  <td>${(mortality.numberOfBirdsDied || 0).toLocaleString()}</td>
                  <td>${mortality.cause || "N/A"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob([printContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mortality-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePrintReport = () => {
    const filtered = filteredMortalities
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mortality Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { margin-bottom: 20px; }
            .date-range { margin-bottom: 10px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Mortality List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString('en-GB')} - ${dateRangeEnd.toLocaleDateString('en-GB')}</div>` : ''}
            <div><strong>Total Records:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Purchase Bill No.</th>
                <th>Purchase Date</th>
                <th>Farmer Name</th>
                <th>Farm Location</th>
                <th>Cage ID Number</th>
                <th>Number of Birds Died</th>
                <th>Cause of Death</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(mortality => `
                <tr>
                  <td>${mortality.purchaseInvoiceNo || "N/A"}</td>
                  <td>${mortality.purchaseDate || "N/A"}</td>
                  <td>${mortality.farmerName || "N/A"}</td>
                  <td>${mortality.farmLocation || "N/A"}</td>
                  <td>${mortality.cageIdNumber || "N/A"}</td>
                  <td>${(mortality.numberOfBirdsDied || 0).toLocaleString()}</td>
                  <td>${mortality.cause || "N/A"}</td>
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

  const totalMortalityBirds = filteredMortalities.reduce((sum, m) => sum + (m.numberOfBirdsDied || 0), 0)
  const totalRecords = filteredMortalities.length
  
  // Total Value = saved amount, or weight × ratePerKg
  const totalValue = useMemo(() => {
    return filteredMortalities.reduce((sum, m) => {
      if (m.amount != null && Number(m.amount) > 0) {
        return sum + Number(m.amount)
      }
      const weight = Number(m.weightOfDeadBirds) || 0
      const rate = Number(m.ratePerKg) || 0
      if (weight > 0 && rate > 0) {
        return sum + weight * rate
      }
      return sum
    }, 0)
  }, [filteredMortalities])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mortality Tracking</h1>
            <p className="text-muted-foreground">Record and manage bird mortality</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Mortality
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Mortality Record" : "Add New Mortality"}</DialogTitle>
                <DialogDescription>Enter mortality details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date <span className="text-red-500">*</span></Label>
                    <DatePicker
                      value={formData.purchaseDate}
                      onChange={(date) => setFormData({ ...formData, purchaseDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Birds Died <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.numberOfBirdsDied}
                      onChange={(e) => setFormData({ ...formData, numberOfBirdsDied: e.target.value })}
                      placeholder="0"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Weight of Dead Birds (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.weightOfDeadBirds}
                      onChange={(e) => {
                        const weight = e.target.value
                        setFormData({
                          ...formData,
                          weightOfDeadBirds: weight,
                          amount: calcAmount(weight, formData.ratePerKg),
                        })
                      }}
                      placeholder="0.00"
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
                        setFormData({
                          ...formData,
                          ratePerKg: rate,
                          amount: calcAmount(formData.weightOfDeadBirds, rate),
                        })
                      }}
                      placeholder="0.00"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    readOnly
                    className="bg-muted"
                    placeholder="Auto (weight × rate)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cause of Death</Label>
                  <Input
                    value={formData.cause}
                    onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                    placeholder="Cause of death"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>

                <Button onClick={handleSave} className="w-full" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Add"} Mortality
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Mortality Birds (Qty)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{totalMortalityBirds}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Mortality Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRecords}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value (₹)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* <div>
                <CardTitle>Mortality List</CardTitle>
                <CardDescription>View and manage all mortality records</CardDescription>
              </div> */}
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onDateRangeChange={handleDateRangeChange}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Filter:</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search by invoice or farmer name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[200px]"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchQuery("")}
                        className="h-10 w-10"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-2" size={16} />
                  Download PDF
                </Button> */}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Purchase Date</TableHead>
                    <TableHead className="font-bold">Number of Birds Died</TableHead>
                    <TableHead className="font-bold">Weight (kg)</TableHead>
                    <TableHead className="font-bold">Rate/Kg</TableHead>
                    <TableHead className="font-bold">Amount (₹)</TableHead>
                    <TableHead className="font-bold">Cause of Death</TableHead>
                    <TableHead className="font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredMortalities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                        {searchQuery || (dateRangeStart && dateRangeEnd) ? "No mortality records found matching your filters." : "No mortality records found. Click \"Add New Mortality\" to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMortalities.map((mortality) => (
                      <TableRow 
                        key={mortality.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleView(mortality)}
                      >
                        <TableCell>{mortality.purchaseDate || "N/A"}</TableCell>
                        <TableCell>{mortality.numberOfBirdsDied || 0}</TableCell>
                        <TableCell>{mortality.weightOfDeadBirds != null ? Number(mortality.weightOfDeadBirds).toFixed(2) : "—"}</TableCell>
                        <TableCell>{mortality.ratePerKg != null ? `₹${Number(mortality.ratePerKg).toFixed(2)}` : "—"}</TableCell>
                        <TableCell>
                          {mortality.amount != null
                            ? `₹${Number(mortality.amount).toFixed(2)}`
                            : mortality.weightOfDeadBirds && mortality.ratePerKg
                              ? `₹${(Number(mortality.weightOfDeadBirds) * Number(mortality.ratePerKg)).toFixed(2)}`
                              : "—"}
                        </TableCell>
                        <TableCell>{mortality.cause || "N/A"}</TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="icon" title="View" onClick={() => handleView(mortality)}>
                            <Eye size={16} />
                          </Button>
                          {canUpdate('mortality') && (
                            <Button variant="outline" size="icon" title="Edit" onClick={() => handleEdit(mortality)}>
                              <Edit2 size={16} />
                            </Button>
                          )}
                          {canDelete('mortality') && (
                            <Button variant="outline" size="icon" title="Delete" onClick={() => handleDelete(mortality.id)}>
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mortality Record Details</DialogTitle>
              <DialogDescription>View complete mortality record information</DialogDescription>
            </DialogHeader>
            {viewingMortality && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Record Number</Label>
                    <div className="text-sm font-medium">{viewingMortality.recordNumber}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Purchase Date</Label>
                    <div className="text-sm font-medium">{viewingMortality.purchaseDate || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Number of Birds Died</Label>
                    <div className="text-sm font-medium">{viewingMortality.numberOfBirdsDied || 0}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Weight of Dead Birds (kg)</Label>
                    <div className="text-sm font-medium">
                      {viewingMortality.weightOfDeadBirds != null ? Number(viewingMortality.weightOfDeadBirds).toFixed(2) : "N/A"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Rate per Kg (₹)</Label>
                    <div className="text-sm font-medium">
                      {viewingMortality.ratePerKg != null ? `₹${Number(viewingMortality.ratePerKg).toFixed(2)}` : "N/A"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Amount (₹)</Label>
                    <div className="text-sm font-medium">
                      {viewingMortality.amount != null
                        ? `₹${Number(viewingMortality.amount).toFixed(2)}`
                        : viewingMortality.weightOfDeadBirds && viewingMortality.ratePerKg
                          ? `₹${(Number(viewingMortality.weightOfDeadBirds) * Number(viewingMortality.ratePerKg)).toFixed(2)}`
                          : "N/A"}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Cause of Death</Label>
                    <div className="text-sm font-medium">{viewingMortality.cause || "N/A"}</div>
                  </div>
                  {viewingMortality.notes && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-muted-foreground">Notes</Label>
                      <div className="text-sm font-medium">{viewingMortality.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
