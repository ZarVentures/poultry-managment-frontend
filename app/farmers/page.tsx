"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import { Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search, X, Download, Printer, ChevronLeft, ChevronRight } from "lucide-react"
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
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    joinDate: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "inactive",
    note: "",
    farmhouseName: "",
    openingBalance: 0,
  })

  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role || "")
      } catch { }
    }
  }, [])

  // Fetch farmers from API
  const fetchFarmers = async () => {
    try {
      setLoading(true)
      const response = await farmersApi.getAll(currentPage, pageSize, searchQuery)
      if (response && response.data) {
        setFarmers(response.data)
        setTotalItems(response.total)
      } else {
        setFarmers(Array.isArray(response) ? response : [])
        setTotalItems(Array.isArray(response) ? response.length : 0)
      }
    } catch (error) {
      console.error('Failed to fetch farmers:', error)
      toast.error('Failed to load farmers')
      setFarmers([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) fetchFarmers()
  }, [mounted, currentPage, searchQuery])

  // Reset to first page whenever search text changes so matches aren't missed on later pages
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      if (editingId) {
        await farmersApi.update(editingId, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          farmhouseName: formData.farmhouseName,
          status: formData.status,
          notes: formData.note,
          openingBalance: formData.openingBalance,
        })
        toast.success("Farmer updated successfully")
      } else {
        await farmersApi.create({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          farmhouseName: formData.farmhouseName,
          status: formData.status,
          notes: formData.note,
          openingBalance: formData.openingBalance,
        })
        toast.success("Farmer created successfully")
      }
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
      openingBalance: 0,
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
      openingBalance: (farmer as any).openingBalance || 0,
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

  const handleView = (farmer: Farmer) => {
    setViewingFarmer(farmer)
    setShowViewDialog(true)
  }

  const handleSort = () => {
    if (sortOrder === null) setSortOrder("asc")
    else if (sortOrder === "asc") setSortOrder("desc")
    else setSortOrder(null)
  }

  // Frontend sorting of current page data
  const filteredFarmers = useMemo(() => {
    if (!sortOrder) return farmers
    return [...farmers].sort((a, b) => {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [farmers, sortOrder])

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const handlePrintReport = () => {
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
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Farmers List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString('en-GB')} - ${dateRangeEnd.toLocaleDateString('en-GB')}</div>` : ''}
            <div><strong>Total Farmers:</strong> ${totalItems}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</div>
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
              ${filteredFarmers.map(farmer => `
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
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => printWindow.print()
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
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Farmer name" disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label>Farm House Name</Label>
                    <Input value={formData.farmhouseName} onChange={(e) => setFormData({ ...formData, farmhouseName: e.target.value })} placeholder="Farm House name" disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label>Opening Balance (₹)</Label>
                    <Input type="number" step="0.01" value={formData.openingBalance} onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })} placeholder="0" disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label>Join Date *</Label>
                    <DatePicker value={formData.joinDate} onChange={(date) => setFormData({ ...formData, joinDate: date })} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })} disabled={loading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Farm address" disabled={loading} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Note</Label>
                    <Textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Additional notes about the farmer" rows={3} disabled={loading} />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={loading}>{loading ? "Saving..." : editingId ? "Update" : "Add"} Farmer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Farmers</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{totalItems}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">On Current Page</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{farmers.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Page</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{currentPage}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter startDate={dateRangeStart} endDate={dateRangeEnd} onDateRangeChange={handleDateRangeChange} />
                <div className="flex items-center gap-2">
                  <Input placeholder="Search by name, farmhouse or phone..." value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="w-[240px]" />
                  {searchQuery && <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")} className="h-10 w-10"><X size={16} /></Button>}
                </div>
                <Button variant="outline" size="sm" onClick={handlePrintReport}><Printer className="mr-2" size={16} /> Print Report</Button>
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
                      <Button variant="ghost" size="sm" onClick={handleSort}>
                        Farmer Name
                        {sortOrder === null && <ArrowUpDown className="ml-2 h-4 w-4" />}
                        {sortOrder === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
                        {sortOrder === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Address</TableHead>
                    <TableHead className="font-bold">Join Date</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFarmers.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No farmers found.</TableCell></TableRow>
                  ) : (
                    filteredFarmers.map((farmer) => (
                      <TableRow key={farmer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(farmer)}>
                        <TableCell className="text-sm text-muted-foreground">{farmer.farmhouseName || "N/A"}</TableCell>
                        <TableCell className="font-medium">{farmer.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{farmer.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{farmer.address || "N/A"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{farmer.joinDate}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${(farmer.status || "active") === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {(farmer.status || "active") === "active" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          {userRole !== 'staff' && userRole !== 'Staff' && (
                            <>
                              <Button variant="outline" size="icon" onClick={() => handleEdit(farmer)}><Edit2 size={16} /></Button>
                              <Button variant="outline" size="icon" onClick={() => handleDelete(farmer.id)}><Trash2 size={16} /></Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          {totalItems > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium">{totalItems}</span> farmers
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * pageSize >= totalItems || loading}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
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
                  <div className="space-y-2"><Label className="text-muted-foreground">Farmer Name</Label><div className="text-sm font-medium">{viewingFarmer.name}</div></div>
                  <div className="space-y-2"><Label className="text-muted-foreground">Farm House Name</Label><div className="text-sm font-medium">{viewingFarmer.farmhouseName || "N/A"}</div></div>
                  <div className="space-y-2"><Label className="text-muted-foreground">Phone</Label><div className="text-sm font-medium">{viewingFarmer.phone}</div></div>
                  <div className="space-y-2 md:col-span-2"><Label className="text-muted-foreground">Address</Label><div className="text-sm font-medium">{viewingFarmer.address || "N/A"}</div></div>
                  <div className="space-y-2"><Label className="text-muted-foreground">Join Date</Label><div className="text-sm font-medium">{viewingFarmer.joinDate}</div></div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Status</Label>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${viewingFarmer.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {viewingFarmer.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  {(viewingFarmer.note || viewingFarmer.notes) && (
                    <div className="space-y-2 md:col-span-2"><Label className="text-muted-foreground">Note</Label><div className="text-sm font-medium whitespace-pre-wrap">{viewingFarmer.note || viewingFarmer.notes}</div></div>
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
