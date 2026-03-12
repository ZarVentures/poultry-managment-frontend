"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search, X, Download, Printer } from "lucide-react"
import { DateRangeFilter } from "@/components/date-range-filter"
import { farmersApi, type Farmer as ApiFarmer } from "@/lib/api"
import { toast } from "sonner"

interface Farmer {
  id: string
  name: string
  email?: string
  phone: string
  address?: string
  birdCount?: number
  joinDate?: string
  status: "active" | "inactive"
  note?: string
  notes?: string
  farmhouseName?: string
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingFarmer, setViewingFarmer] = useState<Farmer | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    joinDate: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "inactive",
    note: "",
    farmhouseName: "",
  })

  // Fetch farmers from API
  const fetchFarmers = async () => {
    try {
      setLoading(true)
      const response = await farmersApi.getAll()
      // Handle wrapped response {data: [...]} or direct array
      const data = (response as any).data || response
      setFarmers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch farmers:', error)
      toast.error('Failed to load farmers')
      setFarmers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchFarmers()
  }, [])

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      
      if (editingId) {
        // Update existing farmer
        await farmersApi.update(editingId, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          farmhouseName: formData.farmhouseName,
          status: formData.status,
          notes: formData.note,
        })
        toast.success("Farmer updated successfully")
      } else {
        // Create new farmer
        await farmersApi.create({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          farmhouseName: formData.farmhouseName,
          status: formData.status,
          notes: formData.note,
        })
        toast.success("Farmer created successfully")
      }

      // Refresh farmers list
      await fetchFarmers()
      resetForm()
      setShowDialog(false)
    } catch (error) {
      console.error('Failed to save farmer:', error)
      toast.error(editingId ? "Failed to update farmer" : "Failed to create farmer")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      address: "",
      joinDate: new Date().toISOString().split("T")[0],
      status: "active" as "active" | "inactive",
      note: "",
      farmhouseName: "",
    })
    setEditingId(null)
  }

  const handleEdit = (farmer: Farmer) => {
    setEditingId(farmer.id)
    setFormData({
      name: farmer.name,
      phone: farmer.phone,
      address: farmer.address || "",
      joinDate: farmer.joinDate || new Date().toISOString().split("T")[0],
      status: farmer.status || "active",
      note: farmer.note || "",
      farmhouseName: farmer.farmhouseName || "",
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this farmer?")) {
      try {
        setLoading(true)
        await farmersApi.delete(id)
        toast.success("Farmer deleted successfully")
        await fetchFarmers()
      } catch (error) {
        console.error('Failed to delete farmer:', error)
        toast.error("Failed to delete farmer")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDeleteOld = (id: string) => {
    if (confirm("Are you sure you want to delete this farmer?")) {
      const updated = farmers.filter((farmer) => farmer.id !== id)
      setFarmers(updated)
    }
  }

  const handleView = (farmer: Farmer) => {
    setViewingFarmer(farmer)
    setShowViewDialog(true)
  }

  const handleSort = () => {
    if (sortOrder === null) {
      setSortOrder("asc")
    } else if (sortOrder === "asc") {
      setSortOrder("desc")
    } else {
      setSortOrder(null)
    }
  }

  const getFilteredAndSortedFarmers = () => {
    if (!Array.isArray(farmers)) {
      return []
    }
    
    let filtered = farmers

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((farmer) => {
        if (!farmer.joinDate) return false
        const joinDate = new Date(farmer.joinDate)
        joinDate.setHours(0, 0, 0, 0)
        return joinDate >= start && joinDate <= end
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (farmer) =>
          farmer.name.toLowerCase().includes(query) ||
          (farmer.phone && farmer.phone.toLowerCase().includes(query)),
      )
    }

    // Apply sorting
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (sortOrder === "asc") {
          return nameA.localeCompare(nameB)
        } else {
          return nameB.localeCompare(nameA)
        }
      })
    }

    return filtered
  }

  const filteredFarmers = useMemo(() => getFilteredAndSortedFarmers(), [farmers, dateRangeStart, dateRangeEnd, searchQuery, sortOrder])

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const handleDownloadPDF = () => {
    const filtered = getFilteredAndSortedFarmers()
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Farmers Report</title>
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
            <h1>Farmers List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Farmers:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Farm House Name</th>
                <th>Farmer Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(farmer => `
                <tr>
                  <td>${farmer.farmhouseName || "N/A"}</td>
                  <td>${farmer.name}</td>
                  <td>${farmer.phone}</td>
                  <td>${farmer.address || "N/A"}</td>
                  <td>${farmer.joinDate}</td>
                  <td>${(farmer.status || "active") === "active" ? "Active" : "Inactive"}</td>
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

  const handlePrintReport = () => {
    const filtered = getFilteredAndSortedFarmers()
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Farmers Report</title>
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
            <h1>Farmers List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Farmers:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Farm House Name</th>
                <th>Farmer Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(farmer => `
                <tr>
                  <td>${farmer.farmhouseName || "N/A"}</td>
                  <td>${farmer.name}</td>
                  <td>${farmer.phone}</td>
                  <td>${farmer.address || "N/A"}</td>
                  <td>${farmer.joinDate}</td>
                  <td>${(farmer.status || "active") === "active" ? "Active" : "Inactive"}</td>
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

  if (!mounted) return null

  return (
    <DashboardLayout>
    <div className="space-y-6">
        <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Farmers Management</h1>
            <p className="text-muted-foreground">Manage all farmers and their information</p>
        </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Farmer
        </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Farmer" : "Add New Farmer"}</DialogTitle>
                <DialogDescription>Enter farmer details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Farmer Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Farmer name"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farm House Name</Label>
                    <Input
                      value={formData.farmhouseName}
                      onChange={(e) => setFormData({ ...formData, farmhouseName: e.target.value })}
                      placeholder="Farm House name"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Join Date *</Label>
                    <DatePicker
                      value={formData.joinDate}
                      onChange={(date) => setFormData({ ...formData, joinDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Farm address"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Note</Label>
                    <Textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Additional notes about the farmer"
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Add"} Farmer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Farmers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Array.isArray(farmers) ? farmers.length : 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Farmers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Array.isArray(farmers) ? farmers.filter((f) => (f.status || "active") === "active").length : 0}
              </div>
          </CardContent>
        </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Farmers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Array.isArray(farmers) ? farmers.filter((f) => (f.status || "active") === "inactive").length : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Farmers List</CardTitle>
                <CardDescription>View and manage all farmers</CardDescription>
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
                      placeholder="Search by name or phone..."
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
                    <TableHead>Farm House Name</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 lg:px-3"
                        onClick={handleSort}
                      >
                        Farmer Name
                        {sortOrder === null && <ArrowUpDown className="ml-2 h-4 w-4" />}
                        {sortOrder === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
                        {sortOrder === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
                      </Button>
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFarmers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {searchQuery || (dateRangeStart && dateRangeEnd) ? "No farmers found matching your filters." : "No farmers added yet. Click \"Add New Farmer\" to get started."}
                      </TableCell>
                    </TableRow>
        ) : (
          filteredFarmers.map((farmer) => (
                      <TableRow 
                        key={farmer.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleView(farmer)}
                      >
                        <TableCell className="text-sm text-muted-foreground">{farmer.farmhouseName || "N/A"}</TableCell>
                        <TableCell className="font-medium">{farmer.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{farmer.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{farmer.address || "N/A"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{farmer.joinDate}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (farmer.status || "active") === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {(farmer.status || "active") === "active" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="icon" onClick={() => handleEdit(farmer)}>
                            <Edit2 size={16} />
                    </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(farmer.id)}>
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
              <DialogTitle>Farmer Details</DialogTitle>
              <DialogDescription>View complete farmer information</DialogDescription>
            </DialogHeader>
            {viewingFarmer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Farmer Name</Label>
                    <div className="text-sm font-medium">{viewingFarmer.name}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Farm House Name</Label>
                    <div className="text-sm font-medium">{viewingFarmer.farmhouseName || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <div className="text-sm font-medium">{viewingFarmer.phone}</div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Address</Label>
                    <div className="text-sm font-medium">{viewingFarmer.address || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Join Date</Label>
                    <div className="text-sm font-medium">{viewingFarmer.joinDate}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Status</Label>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        viewingFarmer.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {viewingFarmer.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  {viewingFarmer.note && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-muted-foreground">Note</Label>
                      <div className="text-sm font-medium whitespace-pre-wrap">{viewingFarmer.note}</div>
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
