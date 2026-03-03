"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Plus, Edit2, Trash2, Download, Printer, X } from "lucide-react"
import { DateRangeFilter } from "@/components/date-range-filter"
import { useDateFilter } from "@/contexts/date-filter-context"

interface Vehicle {
  id: string
  vehicleNumber: string
  vehicleType: string
  driverName: string
  phone: string
  status: "active" | "inactive"
}

interface PurchaseOrder {
  id: string
  purchaseInvoiceNo?: string
  purchaseDate?: string
  farmerName?: string
  farmLocation?: string
  vehicleNo?: string
  numberOfBirds?: number
  birdQuantity?: number
  cageDetails?: string | Array<{ cageId?: string; numberOfBirds?: string; cageWeight?: string }>
}

interface Mortality {
  id: string
  recordNumber: string
  purchaseInvoiceNo: string
  purchaseDate: string
  farmerName: string
  farmLocation: string
  vehicleNo?: string
  cageIdNumber?: string
  totalBirdsPurchased: number
  numberOfBirdsDied: number
  cause: string
  notes: string
  // Legacy fields for backward compatibility
  date?: string
  batch?: string
  numberOfBirds?: number
}

export default function MortalityPage() {
  const [mortalities, setMortalities] = useState<Mortality[]>([])
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
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
    cause: "",
    notes: "",
  })
  const { startDate, endDate } = useDateFilter()

  useEffect(() => {
    setMounted(true)
    
    // Load mortalities from localStorage
    const saved = localStorage.getItem("mortalities")
    if (saved) {
      setMortalities(JSON.parse(saved))
    } else {
      setMortalities([])
    }
    
    // Fetch purchases from API
    const fetchPurchases = async () => {
      try {
        const response = await fetch("/api/purchases")
        if (response.ok) {
          const data = await response.json()
          setPurchases(data.data || [])
        }
      } catch (error) {
        console.error("Error fetching purchases:", error)
      }
    }
    
    fetchPurchases()
    
    // Load vehicles from localStorage
    const savedVehicles = localStorage.getItem("vehicles")
    if (savedVehicles) {
      const parsedVehicles = JSON.parse(savedVehicles)
      setVehicles(parsedVehicles.filter((v: Vehicle) => v.status === "active"))
    }
  }, [])

  // Selected purchase (for Cage ID dropdown and auto-fill)
  const selectedPurchase = useMemo(
    () =>
      purchases.find(
        (p) => (p.purchaseInvoiceNo || "").toLowerCase() === formData.purchaseInvoiceNo.toLowerCase()
      ),
    [purchases, formData.purchaseInvoiceNo]
  )

  // Cage IDs from selected purchase (parse cageDetails JSON if string)
  const cageIdOptions = useMemo(() => {
    if (!selectedPurchase?.cageDetails) return []
    const details = selectedPurchase.cageDetails
    const arr = typeof details === "string" ? (JSON.parse(details || "[]") as Array<{ cageId?: string }>) : details
    return (arr || [])
      .map((row) => row?.cageId?.trim())
      .filter((id): id is string => !!id)
  }, [selectedPurchase])

  // Auto-fill fields when Purchase Invoice No is selected
  const handlePurchaseInvoiceChange = (invoiceNo: string) => {
    const purchase = purchases.find(
      (p) => (p.purchaseInvoiceNo || "").toLowerCase() === invoiceNo.toLowerCase()
    )
    if (purchase) {
      setFormData({
        ...formData,
        purchaseInvoiceNo: invoiceNo,
        purchaseDate: purchase.purchaseDate || new Date().toISOString().split("T")[0],
        farmerName: purchase.farmerName || "",
        farmLocation: purchase.farmLocation || "",
        cageIdNumber: "",
        totalBirdsPurchased: (purchase.numberOfBirds || 0).toString(),
      })
    } else {
      setFormData({
        ...formData,
        purchaseInvoiceNo: invoiceNo,
        purchaseDate: new Date().toISOString().split("T")[0],
        farmerName: "",
        farmLocation: "",
        cageIdNumber: "",
        totalBirdsPurchased: "",
      })
    }
  }

  // Auto-fill Farm Location when Farmer Name changes
  useEffect(() => {
    if (formData.farmerName && formData.purchaseInvoiceNo) {
      const purchase = purchases.find(
        (p) => (p.purchaseInvoiceNo || "").toLowerCase() === formData.purchaseInvoiceNo.toLowerCase()
      )
      if (purchase && purchase.farmerName === formData.farmerName) {
        setFormData((prev) => ({
          ...prev,
          farmLocation: purchase.farmLocation || "",
        }))
      }
    }
  }, [formData.farmerName, formData.purchaseInvoiceNo, purchases])

  const handleSave = () => {
    if (!formData.purchaseInvoiceNo || !formData.purchaseDate || !formData.numberOfBirdsDied) {
      alert("Please fill all required fields (Purchase Invoice No, Purchase Date, Number of Birds Died)")
      return
    }

    const recordNumber = editingId
      ? mortalities.find((m) => m.id === editingId)?.recordNumber
      : `MORT-${String(mortalities.length + 1).padStart(3, "0")}`

    let updatedMortalities: Mortality[]
    if (editingId) {
      updatedMortalities = mortalities.map((mortality) =>
        mortality.id === editingId
          ? {
              ...mortality,
              purchaseInvoiceNo: formData.purchaseInvoiceNo,
              purchaseDate: formData.purchaseDate,
              farmerName: formData.farmerName,
              farmLocation: formData.farmLocation,
              cageIdNumber: formData.cageIdNumber,
              totalBirdsPurchased: Number.parseInt(formData.totalBirdsPurchased) || 0,
              numberOfBirdsDied: Number.parseInt(formData.numberOfBirdsDied),
              cause: formData.cause,
              notes: formData.notes,
              // Legacy fields for backward compatibility
              date: formData.purchaseDate,
              batch: formData.farmerName,
              numberOfBirds: Number.parseInt(formData.numberOfBirdsDied),
            }
          : mortality,
      )
    } else {
      updatedMortalities = [
        ...mortalities,
        {
          id: Date.now().toString(),
          recordNumber: recordNumber || "",
          purchaseInvoiceNo: formData.purchaseInvoiceNo,
          purchaseDate: formData.purchaseDate,
          farmerName: formData.farmerName,
          farmLocation: formData.farmLocation,
          cageIdNumber: formData.cageIdNumber,
          totalBirdsPurchased: Number.parseInt(formData.totalBirdsPurchased) || 0,
          numberOfBirdsDied: Number.parseInt(formData.numberOfBirdsDied),
          cause: formData.cause,
          notes: formData.notes,
          // Legacy fields for backward compatibility
          date: formData.purchaseDate,
          batch: formData.farmerName,
          numberOfBirds: Number.parseInt(formData.numberOfBirdsDied),
        },
      ]
    }

    setMortalities(updatedMortalities)
    localStorage.setItem("mortalities", JSON.stringify(updatedMortalities))
    resetForm()
    setShowDialog(false)
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
      cause: "",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (mortality: Mortality) => {
    setEditingId(mortality.id)
    setFormData({
      purchaseInvoiceNo: mortality.purchaseInvoiceNo || "",
      purchaseDate: mortality.purchaseDate || mortality.date || new Date().toISOString().split("T")[0],
      farmerName: mortality.farmerName || mortality.batch || "",
      farmLocation: mortality.farmLocation || "",
      cageIdNumber: mortality.cageIdNumber || mortality.vehicleNo || "",
      totalBirdsPurchased: mortality.totalBirdsPurchased?.toString() || "",
      numberOfBirdsDied: mortality.numberOfBirdsDied?.toString() || mortality.numberOfBirds?.toString() || "",
      cause: mortality.cause || "",
      notes: mortality.notes || "",
    })
    setShowDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this mortality record?")) {
      const updated = mortalities.filter((mortality) => mortality.id !== id)
      setMortalities(updated)
      localStorage.setItem("mortalities", JSON.stringify(updated))
    }
  }

  const handleView = (mortality: Mortality) => {
    setViewingMortality(mortality)
    setShowViewDialog(true)
  }

  // Filter mortalities based on date range and search
  const filteredMortalities = useMemo(() => {
    let filtered = mortalities

    // Apply date range filter (from date range picker in Mortality List section)
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((mortality) => {
        const mortalityDate = new Date(mortality.purchaseDate || mortality.date || "")
        mortalityDate.setHours(0, 0, 0, 0)
        return mortalityDate >= start && mortalityDate <= end
      })
    }

    // Also apply global date filter if set (from context)
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((mortality) => {
        const mortalityDate = new Date(mortality.purchaseDate || mortality.date || "")
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
          (mortality.farmerName || mortality.batch || "").toLowerCase().includes(query),
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
    
    // Create a printable HTML content
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
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Records:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Purchase Invoice No.</th>
                <th>Purchase Date</th>
                <th>Farmer Name</th>
                <th>Farm Location</th>
                <th>Cage ID Number</th>
                <th>Total Birds Purchased</th>
                <th>Number of Birds Died</th>
                <th>Cause of Death</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(mortality => `
                <tr>
                  <td>${mortality.purchaseInvoiceNo || "N/A"}</td>
                  <td>${mortality.purchaseDate || mortality.date || "N/A"}</td>
                  <td>${mortality.farmerName || mortality.batch || "N/A"}</td>
                  <td>${mortality.farmLocation || "N/A"}</td>
                  <td>${mortality.cageIdNumber || mortality.vehicleNo || "N/A"}</td>
                  <td>${(mortality.totalBirdsPurchased || 0).toLocaleString()}</td>
                  <td>${(mortality.numberOfBirdsDied || mortality.numberOfBirds || 0).toLocaleString()}</td>
                  <td>${mortality.cause || "N/A"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    // Create blob and download
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
    
    // Create a printable HTML content
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
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Records:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Purchase Invoice No.</th>
                <th>Purchase Date</th>
                <th>Farmer Name</th>
                <th>Farm Location</th>
                <th>Cage ID Number</th>
                <th>Total Birds Purchased</th>
                <th>Number of Birds Died</th>
                <th>Cause of Death</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(mortality => `
                <tr>
                  <td>${mortality.purchaseInvoiceNo || "N/A"}</td>
                  <td>${mortality.purchaseDate || mortality.date || "N/A"}</td>
                  <td>${mortality.farmerName || mortality.batch || "N/A"}</td>
                  <td>${mortality.farmLocation || "N/A"}</td>
                  <td>${mortality.cageIdNumber || mortality.vehicleNo || "N/A"}</td>
                  <td>${(mortality.totalBirdsPurchased || 0).toLocaleString()}</td>
                  <td>${(mortality.numberOfBirdsDied || mortality.numberOfBirds || 0).toLocaleString()}</td>
                  <td>${mortality.cause || "N/A"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    // Open new window and print
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const totalBirdsPurchased = filteredMortalities.reduce((sum, m) => sum + (m.totalBirdsPurchased || 0), 0)
  const totalBirdsDeath = filteredMortalities.reduce((sum, m) => sum + (m.numberOfBirdsDied || m.numberOfBirds || 0), 0)
  const totalRecords = filteredMortalities.length
  
  // Calculate Total Value - sum of purchase values for mortalities
  const totalValue = useMemo(() => {
    return filteredMortalities.reduce((sum, m) => {
      if (m.purchaseInvoiceNo) {
        const purchase = purchases.find(
          (p) => (p.purchaseInvoiceNo || "").toLowerCase() === m.purchaseInvoiceNo.toLowerCase()
        )
        if (purchase) {
          return sum + ((purchase as any).totalAmount || (purchase as any).totalValue || 0)
        }
      }
      return sum
    }, 0)
  }, [filteredMortalities, purchases])

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Mortality Record" : "Add New Mortality"}</DialogTitle>
                <DialogDescription>Enter mortality details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Purchase Invoice No. <span className="text-red-500">*</span></Label>
                    <Select
                      value={formData.purchaseInvoiceNo || "__none__"}
                      onValueChange={(value) => handlePurchaseInvoiceChange(value === "__none__" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select purchase invoice" />
                      </SelectTrigger>
                      <SelectContent>
                        {purchases
                          .filter((p) => (p.purchaseInvoiceNo || "").trim() !== "")
                          .map((purchase) => (
                            <SelectItem key={purchase.id} value={purchase.purchaseInvoiceNo || ""}>
                              {purchase.purchaseInvoiceNo}
                            </SelectItem>
                          ))}
                        {purchases.filter((p) => (p.purchaseInvoiceNo || "").trim() !== "").length === 0 && (
                          <SelectItem value="__none__" disabled>No purchase orders found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Date <span className="text-red-500">*</span></Label>
                    <DatePicker
                      value={formData.purchaseDate}
                      onChange={(date) => setFormData({ ...formData, purchaseDate: date })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Farmer Name</Label>
                    <Input
                      value={formData.farmerName}
                      onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                      placeholder="Auto-fill from purchase invoice"
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farm Location</Label>
                    <Input
                      value={formData.farmLocation}
                      onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                      placeholder="Auto-fill from farmer name"
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cage ID Number</Label>
                    <Select
                      value={formData.cageIdNumber || (formData.purchaseInvoiceNo && cageIdOptions.length > 0 ? "" : "__none__")}
                      onValueChange={(value) => setFormData({ ...formData, cageIdNumber: value === "__none__" ? "" : value })}
                      disabled={!formData.purchaseInvoiceNo || cageIdOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!formData.purchaseInvoiceNo ? "Select invoice first" : cageIdOptions.length === 0 ? "No cage IDs for this invoice" : "Select cage ID"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cageIdOptions.map((cageId) => (
                          <SelectItem key={cageId} value={cageId}>
                            {cageId}
                          </SelectItem>
                        ))}
                        {formData.purchaseInvoiceNo && cageIdOptions.length === 0 && (
                          <SelectItem value="__none__" disabled>No cage IDs for this invoice</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Birds Purchased</Label>
                    <Input
                      type="number"
                      value={formData.totalBirdsPurchased}
                      onChange={(e) => setFormData({ ...formData, totalBirdsPurchased: e.target.value })}
                      placeholder="Auto-fill from purchase invoice"
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Birds Died <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={formData.numberOfBirdsDied}
                      onChange={(e) => setFormData({ ...formData, numberOfBirdsDied: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cause of Death</Label>
                    <Input
                      value={formData.cause}
                      onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                      placeholder="Cause of death"
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
                  />
                </div>

                <Button onClick={handleSave} className="w-full">
                  {editingId ? "Update" : "Add"} Mortality
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Birds Purchase (Qty)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalBirdsPurchased}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Birds Death (Qty)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalBirdsDeath}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value (rs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Mortality List</CardTitle>
                <CardDescription>View and manage all mortality records</CardDescription>
              </div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase Invoice No.</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Farmer Name</TableHead>
                    <TableHead>Farm Location</TableHead>
                    <TableHead>Cage ID Number</TableHead>
                    <TableHead>Total Birds Purchased</TableHead>
                    <TableHead>Number of Birds Died</TableHead>
                    <TableHead>Cause of Death</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMortalities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
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
                        <TableCell className="font-medium">{mortality.purchaseInvoiceNo || "N/A"}</TableCell>
                        <TableCell>{mortality.purchaseDate || mortality.date || "N/A"}</TableCell>
                        <TableCell>{mortality.farmerName || mortality.batch || "N/A"}</TableCell>
                        <TableCell>{mortality.farmLocation || "N/A"}</TableCell>
                        <TableCell>{mortality.cageIdNumber || mortality.vehicleNo || "N/A"}</TableCell>
                        <TableCell>{mortality.totalBirdsPurchased || 0}</TableCell>
                        <TableCell>{mortality.numberOfBirdsDied || mortality.numberOfBirds || 0}</TableCell>
                        <TableCell>{mortality.cause || "N/A"}</TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="icon" onClick={() => handleEdit(mortality)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(mortality.id)}>
                            <Trash2 size={16} />
                          </Button>
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
                    <Label className="text-muted-foreground">Purchase Invoice No.</Label>
                    <div className="text-sm font-medium">{viewingMortality.purchaseInvoiceNo || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Purchase Date</Label>
                    <div className="text-sm font-medium">{viewingMortality.purchaseDate || viewingMortality.date || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Farmer Name</Label>
                    <div className="text-sm font-medium">{viewingMortality.farmerName || viewingMortality.batch || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Farm Location</Label>
                    <div className="text-sm font-medium">{viewingMortality.farmLocation || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Cage ID Number</Label>
                    <div className="text-sm font-medium">{viewingMortality.cageIdNumber || viewingMortality.vehicleNo || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Total Birds Purchased</Label>
                    <div className="text-sm font-medium">{viewingMortality.totalBirdsPurchased || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Number of Birds Died</Label>
                    <div className="text-sm font-medium">{viewingMortality.numberOfBirdsDied || viewingMortality.numberOfBirds || 0}</div>
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

