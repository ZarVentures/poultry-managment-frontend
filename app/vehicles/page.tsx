"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X, Download, Printer, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { vehiclesApi, type Vehicle as ApiVehicle } from "@/lib/api"
import { toast } from "sonner"

export default function VehiclesPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  const [formData, setFormData] = useState({
    vehicleNumber: "", vehicleType: "", driverName: "", phone: "",
    ownerName: "", address: "", totalCapacity: "", petrolTankCapacity: "",
    fuelType: "diesel", mileage: "", joinDate: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "inactive", note: "",
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

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const res = await vehiclesApi.getAll(currentPage, pageSize, searchQuery)
      if (res && res.data) {
        setVehicles(res.data)
        setTotalItems(res.total)
      } else {
        setVehicles(Array.isArray(res) ? res : [])
        setTotalItems(Array.isArray(res) ? res.length : 0)
      }
    } catch (error: any) {
      toast.error("Failed to load vehicles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) fetchVehicles()
  }, [mounted, currentPage, searchQuery])

  const resetForm = () => {
    setFormData({
      vehicleNumber: "", vehicleType: "", driverName: "", phone: "",
      ownerName: "", address: "", totalCapacity: "", petrolTankCapacity: "",
      fuelType: "diesel", mileage: "", joinDate: new Date().toISOString().split("T")[0],
      status: "active", note: "",
    })
    setEditingId(null)
  }

  const handleEdit = (v: ApiVehicle) => {
    setFormData({
      vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType, driverName: v.driverName, phone: v.phone,
      ownerName: v.ownerName || "", address: v.address || "", totalCapacity: v.totalCapacity || "",
      petrolTankCapacity: v.petrolTankCapacity || "", fuelType: (v as any).fuelType || "diesel",
      mileage: v.mileage || "", joinDate: v.joinDate, status: v.status, note: v.note || "",
    })
    setEditingId(v.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.vehicleNumber || !formData.vehicleType || !formData.driverName || !formData.phone) {
      toast.error("Please fill all required fields")
      return
    }
    try {
      setLoading(true)
      if (editingId) await vehiclesApi.update(editingId, formData)
      else await vehiclesApi.create(formData)
      toast.success("Saved successfully")
      await fetchVehicles()
      resetForm()
      setShowDialog(false)
    } catch { toast.error("Failed to save") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      setLoading(true)
      await vehiclesApi.delete(id)
      toast.success("Deleted")
      await fetchVehicles()
    } catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  const handleSort = () => {
    if (sortOrder === null) setSortOrder("asc")
    else if (sortOrder === "asc") setSortOrder("desc")
    else setSortOrder(null)
  }

  const filteredVehicles = useMemo(() => {
    if (!sortOrder) return vehicles
    return [...vehicles].sort((a, b) => {
      const nameA = a.driverName.toLowerCase()
      const nameB = b.driverName.toLowerCase()
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [vehicles, sortOrder])

  const handlePrintReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vehicles Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Vehicles List Report</h1>
          <div><strong>Total Vehicles:</strong> ${totalItems}</div>
          <table>
            <thead>
              <tr><th>Vehicle No</th><th>Type</th><th>Owner</th><th>Driver</th><th>Phone</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${filteredVehicles.map(v => `
                <tr>
                  <td>${v.vehicleNumber}</td><td>${v.vehicleType}</td><td>${v.ownerName || "-"}</td>
                  <td>${v.driverName}</td><td>${v.phone}</td>
                  <td>${new Date(v.joinDate).toLocaleDateString('en-GB')}</td>
                  <td>${v.status}</td>
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Vehicles Management</h1><p className="text-muted-foreground">Manage all vehicles</p></div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2" size={20} />New Vehicle</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingId ? "Edit Vehicle" : "New Vehicle"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Vehicle Number *</Label><Input value={formData.vehicleNumber} onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })} placeholder="Number" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Type *</Label>
                    <Select value={formData.vehicleType} onValueChange={v => setFormData({ ...formData, vehicleType: v })} disabled={loading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Truck">Truck</SelectItem><SelectItem value="Mini Truck">Mini Truck</SelectItem><SelectItem value="Pickup Van">Pickup Van</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Driver Name *</Label><Input value={formData.driverName} onChange={e => setFormData({ ...formData, driverName: e.target.value })} placeholder="Driver" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Phone *</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone" disabled={loading} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Owner Name</Label><Input value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} placeholder="Owner" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Join Date *</Label><DatePicker value={formData.joinDate} onChange={d => setFormData({ ...formData, joinDate: d })} disabled={loading} /></div>
                </div>
                <div className="space-y-2"><Label>Address</Label><Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Address" disabled={loading} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Capacity</Label><Input value={formData.totalCapacity} onChange={e => setFormData({ ...formData, totalCapacity: e.target.value })} placeholder="Capacity" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Fuel Tank</Label><Input value={formData.petrolTankCapacity} onChange={e => setFormData({ ...formData, petrolTankCapacity: e.target.value })} placeholder="Fuel Tank" disabled={loading} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Fuel Type</Label>
                    <Select value={formData.fuelType} onValueChange={v => setFormData({ ...formData, fuelType: v })} disabled={loading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="petrol">Petrol</SelectItem><SelectItem value="cng">CNG</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Mileage</Label><Input value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} placeholder="Mileage" disabled={loading} /></div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="Notes" rows={2} disabled={loading} /></div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1" disabled={loading}>{loading ? "Saving..." : editingId ? "Update" : "Create"}</Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}><X size={20} /></Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Vehicles</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-600">{totalItems}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{vehicles.filter(v => v.status === 'active').length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Page</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-orange-600">{currentPage}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Input placeholder="Search driver or vehicle..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[250px]" />
                <Button variant="outline" size="sm" onClick={handlePrintReport}><Printer className="mr-2" size={16} /> Print Report</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle No</TableHead><TableHead>Type</TableHead><TableHead>Owner</TableHead>
                    <TableHead><Button variant="ghost" size="sm" onClick={handleSort}>Driver {sortOrder === 'asc' ? <ArrowUp size={16} /> : sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUpDown size={16} />}</Button></TableHead>
                    <TableHead>Phone</TableHead><TableHead>Join Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.vehicleNumber}</TableCell><TableCell>{v.vehicleType}</TableCell><TableCell>{v.ownerName || "-"}</TableCell>
                      <TableCell>{v.driverName}</TableCell><TableCell>{v.phone}</TableCell>
                      <TableCell>{new Date(v.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${v.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{v.status}</span></TableCell>
                      <TableCell>
                        {userRole !== 'staff' && userRole !== 'Staff' && (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(v)}><Edit2 size={16} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)}><Trash2 size={16} /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          {totalItems > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-500">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems}</div>
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
