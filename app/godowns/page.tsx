"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  MapPin,
  Plus,
  Printer,
  Search,
  Trash2,
  Warehouse,
  X,
  Zap,
} from "lucide-react"
import { godownsApi, type GodownMaster } from "@/lib/api"
import { usePermissions } from "@/lib/permissions"
import { toast } from "sonner"

const blankForm = {
  name: "",
  code: "",
  location: "",
  address: "",
  capacityBirds: "",
  managerName: "",
  phone: "",
  status: "active" as "active" | "inactive",
  notes: "",
}

export default function GodownsPage() {
  const { canCreate, canUpdate, canDelete } = usePermissions()
  const [godowns, setGodowns] = useState<GodownMaster[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [formData, setFormData] = useState(blankForm)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchGodowns = async () => {
    try {
      setLoading(true)
      const res = await godownsApi.getAll(currentPage, pageSize, searchQuery, statusFilter)
      if (res && res.data) {
        setGodowns(res.data)
        setTotalItems(res.total)
      } else {
        const list = Array.isArray(res) ? res : []
        setGodowns(list)
        setTotalItems(list.length)
      }
    } catch (error: any) {
      console.error("Failed to load godowns:", error)
      toast.error(error?.message || "Failed to load godowns")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) fetchGodowns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentPage, searchQuery, statusFilter])

  const resetForm = () => {
    setFormData(blankForm)
    setEditingId(null)
  }

  const handleEdit = (godown: GodownMaster) => {
    setFormData({
      name: godown.name || "",
      code: godown.code || "",
      location: godown.location || "",
      address: godown.address || "",
      capacityBirds: godown.capacityBirds != null ? String(godown.capacityBirds) : "",
      managerName: godown.managerName || "",
      phone: godown.phone || "",
      status: godown.status || "active",
      notes: godown.notes || "",
    })
    setEditingId(godown.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Godown name and code are required")
      return
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      location: formData.location.trim() || undefined,
      address: formData.address.trim() || undefined,
      capacityBirds: formData.capacityBirds ? Number(formData.capacityBirds) : undefined,
      managerName: formData.managerName.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      status: formData.status,
      notes: formData.notes.trim() || undefined,
    }

    try {
      setLoading(true)
      if (editingId) {
        await godownsApi.update(editingId, payload)
        toast.success("Godown updated successfully")
      } else {
        await godownsApi.create(payload)
        toast.success("Godown created successfully")
      }
      await fetchGodowns()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save godown:", error)
      toast.error(error?.message || "Failed to save godown")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this godown?")) return
    try {
      setLoading(true)
      await godownsApi.delete(id)
      toast.success("Godown deleted")
      await fetchGodowns()
    } catch (error: any) {
      console.error("Failed to delete godown:", error)
      toast.error(error?.message || "Failed to delete godown")
    } finally {
      setLoading(false)
    }
  }

  const filteredGodowns = useMemo(() => {
    if (!sortOrder) return godowns
    return [...godowns].sort((a, b) => {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [godowns, sortOrder])

  const handleSort = () => {
    if (sortOrder === null) setSortOrder("asc")
    else if (sortOrder === "asc") setSortOrder("desc")
    else setSortOrder(null)
  }

  const handlePrintReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Godowns Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Godowns List Report</h1>
          <div><strong>Total Godowns:</strong> ${totalItems}</div>
          <table>
            <thead>
              <tr><th>Name</th><th>Code</th><th>Location</th><th>Capacity</th><th>Manager</th><th>Phone</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${filteredGodowns.map(g => `
                <tr>
                  <td>${g.name}</td><td>${g.code}</td><td>${g.location || g.address || "-"}</td>
                  <td>${g.capacityBirds || "-"}</td><td>${g.managerName || "-"}</td>
                  <td>${g.phone || "-"}</td><td>${g.status}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(printContent)
      win.document.close()
      win.onload = () => win.print()
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Godown Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Create and manage all godown master entries</p>
          </div>
          {canCreate("godowns") && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-fit h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm md:h-10">
                  <Plus className="mr-1" size={16} />
                  Create Godown
                </Button>
              </DialogTrigger>
              <DialogContent className="max-sm:max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Godown" : "Create Godown"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Main Godown" disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label>Code *</Label>
                      <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="GD-001" disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="City / area" disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label>Capacity Birds</Label>
                      <Input type="number" value={formData.capacityBirds} onChange={e => setFormData({ ...formData, capacityBirds: e.target.value })} placeholder="10000" disabled={loading} onWheel={e => e.currentTarget.blur()} />
                    </div>
                    <div className="space-y-2">
                      <Label>Manager Name</Label>
                      <Input value={formData.managerName} onChange={e => setFormData({ ...formData, managerName: e.target.value })} placeholder="Manager" disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone" disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })} disabled={loading}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Address</Label>
                      <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Full address" disabled={loading} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Notes</Label>
                      <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" rows={3} disabled={loading} />
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <Button onClick={handleSave} className="flex-1" disabled={loading}>{loading ? "Saving..." : editingId ? "Update" : "Create"} Godown</Button>
                    <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100"><Warehouse size={14} className="text-blue-600" /></span>
                Total Godowns
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold whitespace-nowrap text-blue-600">{totalItems}</div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-100"><Zap size={14} className="text-green-600" /></span>
                Active
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold whitespace-nowrap text-green-600">{godowns.filter(g => g.status === "active").length}</div>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100"><MapPin size={14} className="text-amber-600" /></span>
                Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold whitespace-nowrap text-orange-600">
                {godowns.reduce((sum, g) => sum + Number(g.capacityBirds || 0), 0).toLocaleString("en-IN")}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl p-4 print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div className="relative md:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search godown name, code, location..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                className="h-10 rounded-full pl-9"
              />
              {searchQuery && (
                <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                  <X size={14} />
                </Button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={value => { setStatusFilter(value); setCurrentPage(1) }}>
              <SelectTrigger className="h-10 rounded-full md:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handlePrintReport} className="rounded-full h-10">
              <Printer className="mr-1" size={16} />
              Print Report
            </Button>
          </div>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[850px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={handleSort}>
                        Godown
                        {sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : sortOrder === "desc" ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
                      </Button>
                    </TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGodowns.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No godowns found.</TableCell></TableRow>
                  ) : (
                    filteredGodowns.map(godown => (
                      <TableRow key={godown.id}>
                        <TableCell className="font-medium">{godown.name}</TableCell>
                        <TableCell>{godown.code}</TableCell>
                        <TableCell>{godown.location || godown.address || "-"}</TableCell>
                        <TableCell>{godown.capacityBirds ? Number(godown.capacityBirds).toLocaleString("en-IN") : "-"}</TableCell>
                        <TableCell>{godown.managerName || "-"}</TableCell>
                        <TableCell>{godown.phone || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${godown.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {godown.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {(canUpdate("godowns") || canDelete("godowns")) && (
                            <div className="flex justify-end gap-1 sm:gap-2">
                              {canUpdate("godowns") && (
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(godown)}><Edit2 size={16} /></Button>
                              )}
                              {canDelete("godowns") && (
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(godown.id)}><Trash2 size={16} /></Button>
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
