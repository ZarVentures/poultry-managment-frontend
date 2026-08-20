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
import { Plus, Edit2, Trash2, X, Download, Printer, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Store, UserCheck, Calendar, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { retailersApi, type Retailer as ApiRetailer } from "@/lib/api"
import { usePermissions } from "@/lib/permissions"
import { toast } from "sonner"

export default function RetailersPage() {
  const router = useRouter()
  const { canUpdate, canDelete } = usePermissions()
  const [retailers, setRetailers] = useState<ApiRetailer[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    status: "active" as "active" | "inactive",
    notes: "",
    openingBalance: 0,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchRetailers = async () => {
    try {
      setLoading(true)
      const res = await retailersApi.getAll(currentPage, pageSize, searchQuery)
      if (res && res.data) {
        setRetailers(res.data)
        setTotalItems(res.total)
      } else {
        setRetailers(Array.isArray(res) ? res : [])
        setTotalItems(Array.isArray(res) ? res.length : 0)
      }
    } catch (error: any) {
      console.error("Failed to fetch retailers:", error)
      toast.error("Failed to load retailers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) fetchRetailers()
  }, [mounted, currentPage, searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const resetForm = () => {
    setFormData({
      name: "", ownerName: "", phone: "",
      email: "", address: "", status: "active", notes: "",
      openingBalance: 0,
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
      openingBalance: (retailer as any).openingBalance || 0,
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
          name: formData.name, ownerName: formData.ownerName || undefined,
          phone: formData.phone, email: formData.email || undefined,
          address: formData.address || undefined, status: formData.status,
          notes: formData.notes || undefined,
          openingBalance: formData.openingBalance,
        })
        toast.success("Retailer updated successfully")
      } else {
        await retailersApi.create({
          name: formData.name, ownerName: formData.ownerName || undefined,
          phone: formData.phone, email: formData.email || undefined,
          address: formData.address || undefined, status: formData.status,
          notes: formData.notes || undefined,
          openingBalance: formData.openingBalance,
        })
        toast.success("Retailer created successfully")
      }
      await fetchRetailers()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      toast.error(editingId ? "Failed to update retailer" : "Failed to create retailer")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      setLoading(true)
      await retailersApi.delete(id)
      toast.success("Deleted")
      await fetchRetailers()
    } catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  const handleSort = () => {
    if (sortOrder === null) setSortOrder("asc")
    else if (sortOrder === "asc") setSortOrder("desc")
    else setSortOrder(null)
  }

  const filteredRetailers = useMemo(() => {
    if (!sortOrder) return retailers
    return [...retailers].sort((a, b) => {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [retailers, sortOrder])

  const handlePrintReport = () => {
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
          </style>
        </head>
        <body>
          <h1>Retailers List Report</h1>
          <div><strong>Total Retailers:</strong> ${totalItems}</div>
          <table>
            <thead>
              <tr><th>Shop Name</th><th>Owner</th><th>Phone</th><th>Address</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${filteredRetailers.map(r => `
                <tr>
                  <td>${r.name}</td><td>${r.ownerName || "-"}</td><td>${r.phone}</td>
                  <td>${r.address || "-"}</td>
                  <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : "-"}</td>
                  <td>${r.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    if (win) { win.document.write(printContent); win.document.close(); win.onload = () => win.print() }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Retailers Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage all retailers and their information</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-fit h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm md:h-10 md:px-4 md:text-sm">
                <Plus className="mr-1 sm:mr-0" size={16} />
                New Retailer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-sm:max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingId ? "Edit Retailer" : "New Retailer"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Shop Name *</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Shop name" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Owner Name</Label><Input value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} placeholder="Owner name" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Opening Balance (₹)</Label><Input type="number" step="0.01" value={formData.openingBalance} onChange={e => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })} placeholder="0" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Phone *</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email" disabled={loading} /></div>
                </div>
                <div className="space-y-2"><Label>Address</Label><Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Address" disabled={loading} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes" rows={3} disabled={loading} /></div>
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <Button onClick={handleSave} className="flex-1" disabled={loading}>{loading ? "Saving..." : editingId ? "Update" : "Create"}</Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100">
                  <Store size={14} className="text-blue-600" />
                </span>
                Total Retailers
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold whitespace-nowrap text-blue-600">{totalItems}</div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-100">
                  <UserCheck size={14} className="text-green-600" />
                </span>
                Active
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold whitespace-nowrap text-green-600">{retailers.filter(r => r.status === 'active').length}</div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100">
                  <Calendar size={14} className="text-amber-600" />
                </span>
                Page
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold whitespace-nowrap text-orange-600">{currentPage}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl p-4 print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div className="relative md:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search shop name, owner or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-10 rounded-full pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReport}
              className="rounded-full h-10"
            >
              <Printer className="mr-1" size={16} />
              Print Report
            </Button>
          </div>
        </Card>
        <Card>
          <CardContent className="px-3 sm:px-6">
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={handleSort}>Shop Name {sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : sortOrder === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}</Button>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Owner</TableHead>
                    <TableHead className="whitespace-nowrap">Phone</TableHead>
                    <TableHead className="whitespace-nowrap">Address</TableHead>
                    <TableHead className="whitespace-nowrap">Join Date</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRetailers.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No retailers found.</TableCell></TableRow>
                  ) : (
                    filteredRetailers.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium whitespace-nowrap">{r.name}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.ownerName || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{r.address || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.status}</span>
                        </TableCell>
                        <TableCell>
                          {(canUpdate('retailers') || canDelete('retailers')) && (
                            <div className="flex gap-1 sm:gap-2">
                              {canUpdate('retailers') && (
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}><Edit2 size={16} /></Button>
                              )}
                              {canDelete('retailers') && (
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}><Trash2 size={16} /></Button>
                              )}
                            </div>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * pageSize >= totalItems || loading}><ChevronRight size={16} /></Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
