"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X, Download, Printer, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { retailersApi, type Retailer as ApiRetailer } from "@/lib/api"
import { toast } from "sonner"

export default function RetailersPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [retailers, setRetailers] = useState<ApiRetailer[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    status: "active" as "active" | "inactive",
    notes: "",
  })

  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role || "")
      } catch {}
    }
    fetchRetailers()
  }, [])

  const fetchRetailers = async () => {
    try {
      setLoading(true)
      const data = await retailersApi.getAll()
      setRetailers(data)
    } catch (error: any) {
      console.error("Failed to fetch retailers:", error)
      toast.error("Failed to load retailers")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      ownerName: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (retailer: ApiRetailer) => {
    setFormData({
      name: retailer.name,
      ownerName: retailer.ownerName || "",
      phone: retailer.phone,
      email: retailer.email || "",
      address: retailer.address || "",
      status: retailer.status,
      notes: retailer.notes || "",
    })
    setEditingId(retailer.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      
      if (editingId) {
        await retailersApi.update(editingId, {
          name: formData.name,
          ownerName: formData.ownerName || undefined,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address || undefined,
          status: formData.status,
          notes: formData.notes || undefined,
        })
        toast.success("Retailer updated successfully")
      } else {
        await retailersApi.create({
          name: formData.name,
          ownerName: formData.ownerName || undefined,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address || undefined,
          status: formData.status,
          notes: formData.notes || undefined,
        })
        toast.success("Retailer created successfully")
      }

      await fetchRetailers()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error('Failed to save retailer:', error)
      toast.error(editingId ? "Failed to update retailer" : "Failed to create retailer")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this retailer?")) return

    try {
      setLoading(true)
      await retailersApi.delete(id)
      toast.success("Retailer deleted successfully")
      await fetchRetailers()
    } catch (error: any) {
      console.error('Failed to delete retailer:', error)
      toast.error("Failed to delete retailer")
    } finally {
      setLoading(false)
    }
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

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const stats = useMemo(() => {
    return {
      total: retailers.length,
      active: retailers.filter(r => r.status === 'active').length,
      inactive: retailers.filter(r => r.status === 'inactive').length,
    }
  }, [retailers])

  const filteredRetailers = useMemo(() => {
    let filtered = [...retailers]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (retailer) =>
          retailer.name.toLowerCase().includes(query) ||
          (retailer.phone && retailer.phone.toLowerCase().includes(query))
      )
    }

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((retailer) => {
        if (!retailer.createdAt) return false
        const createdDate = new Date(retailer.createdAt)
        createdDate.setHours(0, 0, 0, 0)
        return createdDate >= start && createdDate <= end
      })
    }

    // Apply sorting
    if (sortOrder) {
      filtered.sort((a, b) => {
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
  }, [retailers, searchQuery, dateRangeStart, dateRangeEnd, sortOrder])

  const handleDownloadPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Retailers Report</title>
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
            <h1>Retailers List Report</h1>
            <div><strong>Total Retailers:</strong> ${filteredRetailers.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Owner Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRetailers.map(retailer => `
                <tr>
                  <td>${retailer.name}</td>
                  <td>${retailer.ownerName || "N/A"}</td>
                  <td>${retailer.phone}</td>
                  <td>${retailer.address || "N/A"}</td>
                  <td>${retailer.createdAt ? new Date(retailer.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td>${retailer.status === "active" ? "Active" : "Inactive"}</td>
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
            <h1 className="text-3xl font-bold">Retailers Management</h1>
            <p className="text-muted-foreground">Manage all retailers and their information</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Retailer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Retailer" : "New Retailer"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit retailer details" : "Add a new retailer to the system"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shop Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Shop name"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Name</Label>
                    <Input
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="Owner name"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email address"
                      disabled={loading}
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
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Total Retailers
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-blue-600">
        {stats.total}
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Active Retailers
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-green-600">
        {stats.active}
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Inactive Retailers
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-red-600">
        {stats.inactive}
      </div>
    </CardContent>
  </Card>

</div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              {/* <div>
                <CardTitle>Retailers List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all retailers</p>
              </div> */}
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onDateRangeChange={handleDateRangeChange}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Filter:</Label>
                  <Input
                    placeholder="Search by shop name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[250px]"
                  />
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
            {loading && retailers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredRetailers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || (dateRangeStart && dateRangeEnd) 
                  ? "No retailers match your filters" 
                  : "No retailers found"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 lg:px-3"
                          onClick={handleSort}
                        >
                          Shop Name
                          {sortOrder === null && <ArrowUpDown className="ml-2 h-4 w-4" />}
                          {sortOrder === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
                          {sortOrder === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
                        </Button>
                      </TableHead>
                      <TableHead>Owner Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRetailers.map((retailer) => (
                      <TableRow key={retailer.id}>
                        <TableCell className="font-medium">{retailer.name}</TableCell>
                        <TableCell>{retailer.ownerName || "-"}</TableCell>
                        <TableCell>{retailer.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{retailer.address || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {retailer.createdAt ? new Date(retailer.createdAt).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              retailer.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {retailer.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {userRole !== 'staff' && userRole !== 'Staff' && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(retailer)}>
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(retailer.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          )}
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
