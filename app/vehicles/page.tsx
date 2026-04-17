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
import { Plus, Edit2, Trash2, X, Download, Printer, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { vehiclesApi, type Vehicle as ApiVehicle } from "@/lib/api"
import { toast } from "sonner"

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    vehicleType: "",
    driverName: "",
    phone: "",
    ownerName: "",
    address: "",
    totalCapacity: "",
    petrolTankCapacity: "",
    fuelType: "diesel",
    mileage: "",
    joinDate: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "inactive",
    note: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const data = await vehiclesApi.getAll()
      setVehicles(data)
    } catch (error: any) {
      console.error("Failed to fetch vehicles:", error)
      toast.error("Failed to load vehicles")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      vehicleNumber: "",
      vehicleType: "",
      driverName: "",
      phone: "",
      ownerName: "",
      address: "",
      totalCapacity: "",
      petrolTankCapacity: "",
      fuelType: "diesel",
      mileage: "",
      joinDate: new Date().toISOString().split("T")[0],
      status: "active",
      note: "",
    })
    setEditingId(null)
  }

  const handleEdit = (vehicle: ApiVehicle) => {
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      driverName: vehicle.driverName,
      phone: vehicle.phone,
      ownerName: vehicle.ownerName || "",
      address: vehicle.address || "",
      totalCapacity: vehicle.totalCapacity || "",
      petrolTankCapacity: vehicle.petrolTankCapacity || "",
      fuelType: (vehicle as any).fuelType || "diesel",
      mileage: vehicle.mileage || "",
      joinDate: vehicle.joinDate,
      status: vehicle.status,
      note: vehicle.note || "",
    })
    setEditingId(vehicle.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.vehicleNumber || !formData.vehicleType || !formData.driverName || !formData.phone) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)

      if (editingId) {
        await vehiclesApi.update(editingId, formData)
        toast.success("Vehicle updated successfully")
      } else {
        await vehiclesApi.create(formData)
        toast.success("Vehicle created successfully")
      }

      await fetchVehicles()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save vehicle:", error)
      toast.error(editingId ? "Failed to update vehicle" : "Failed to create vehicle")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return

    try {
      setLoading(true)
      await vehiclesApi.delete(id)
      toast.success("Vehicle deleted successfully")
      await fetchVehicles()
    } catch (error: any) {
      console.error("Failed to delete vehicle:", error)
      toast.error("Failed to delete vehicle")
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
    const total = vehicles.length
    const active = vehicles.filter(v => v.status === 'active')
    const inactive = vehicles.filter(v => v.status === 'inactive')
    
    return {
      total: {
        count: total,
        truck: vehicles.filter(v => v.vehicleType === 'Truck').length,
        miniTruck: vehicles.filter(v => v.vehicleType === 'Mini Truck').length,
        pickupVan: vehicles.filter(v => v.vehicleType === 'Pickup Van').length,
      },
      active: {
        count: active.length,
        truck: active.filter(v => v.vehicleType === 'Truck').length,
        miniTruck: active.filter(v => v.vehicleType === 'Mini Truck').length,
        pickupVan: active.filter(v => v.vehicleType === 'Pickup Van').length,
      },
      inactive: {
        count: inactive.length,
        truck: inactive.filter(v => v.vehicleType === 'Truck').length,
        miniTruck: inactive.filter(v => v.vehicleType === 'Mini Truck').length,
        pickupVan: inactive.filter(v => v.vehicleType === 'Pickup Van').length,
      },
    }
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.driverName.toLowerCase().includes(query) ||
          vehicle.vehicleNumber.toLowerCase().includes(query)
      )
    }

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((vehicle) => {
        const joinDate = new Date(vehicle.joinDate)
        joinDate.setHours(0, 0, 0, 0)
        return joinDate >= start && joinDate <= end
      })
    }

    // Apply sorting
    if (sortOrder) {
      filtered.sort((a, b) => {
        const nameA = a.driverName.toLowerCase()
        const nameB = b.driverName.toLowerCase()
        if (sortOrder === "asc") {
          return nameA.localeCompare(nameB)
        } else {
          return nameB.localeCompare(nameA)
        }
      })
    }

    return filtered
  }, [vehicles, searchQuery, dateRangeStart, dateRangeEnd, sortOrder])

  const handleDownloadPDF = () => {
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
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Vehicles List Report</h1>
            <div><strong>Total Vehicles:</strong> ${filteredVehicles.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Vehicle No</th>
                <th>Vehicle Type</th>
                <th>Owner Name</th>
                <th>Driver Name</th>
                <th>Phone</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredVehicles.map(vehicle => `
                <tr>
                  <td>${vehicle.vehicleNumber}</td>
                  <td>${vehicle.vehicleType}</td>
                  <td>${vehicle.ownerName || "N/A"}</td>
                  <td>${vehicle.driverName}</td>
                  <td>${vehicle.phone}</td>
                  <td>${new Date(vehicle.joinDate).toLocaleDateString()}</td>
                  <td>${vehicle.status === "active" ? "Active" : "Inactive"}</td>
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
            <h1 className="text-3xl font-bold">Vehicles Management</h1>
            <p className="text-muted-foreground">Manage all vehicles and their information</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Vehicle" : "New Vehicle"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit vehicle details" : "Add a new vehicle to the system"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle Number *</Label>
                    <Input
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      placeholder="Vehicle number"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Type *</Label>
                    <Select
                      value={formData.vehicleType}
                      onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Truck">Truck</SelectItem>
                        <SelectItem value="Mini Truck">Mini Truck</SelectItem>
                        <SelectItem value="Pickup Van">Pickup Van</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Driver Name *</Label>
                    <Input
                      value={formData.driverName}
                      onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                      placeholder="Driver name"
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Owner Name</Label>
                    <Input
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="Owner name"
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Capacity (Load)</Label>
                    <Input
                      value={formData.totalCapacity}
                      onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })}
                      placeholder="e.g. 5000 kg"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fuel Tank Capacity</Label>
                    <Input
                      value={formData.petrolTankCapacity}
                      onChange={(e) => setFormData({ ...formData, petrolTankCapacity: e.target.value })}
                      placeholder="e.g. 80 L"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fuel Type</Label>
                    <Select
                      value={formData.fuelType}
                      onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="cng">CNG</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mileage</Label>
                    <Input
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      placeholder="km/L"
                      disabled={loading}
                    />
                  </div>
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
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total.count}</div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div>Truck: {stats.total.truck}</div>
                <div>Mini Truck: {stats.total.miniTruck}</div>
                <div>Pickup Van: {stats.total.pickupVan}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.active.count}</div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div>Truck: {stats.active.truck}</div>
                <div>Mini Truck: {stats.active.miniTruck}</div>
                <div>Pickup Van: {stats.active.pickupVan}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.inactive.count}</div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div>Truck: {stats.inactive.truck}</div>
                <div>Mini Truck: {stats.inactive.miniTruck}</div>
                <div>Pickup Van: {stats.inactive.pickupVan}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Vehicles List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all vehicles</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onDateRangeChange={handleDateRangeChange}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Filter:</Label>
                  <Input
                    placeholder="Search by driver name or vehicle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[250px]"
                  />
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
            {loading && vehicles.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredVehicles.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || (dateRangeStart && dateRangeEnd) 
                  ? "No vehicles match your filters" 
                  : "No vehicles found"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle No</TableHead>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Owner Name</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 lg:px-3"
                          onClick={handleSort}
                        >
                          Driver Name
                          {sortOrder === null && <ArrowUpDown className="ml-2 h-4 w-4" />}
                          {sortOrder === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
                          {sortOrder === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
                        </Button>
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.vehicleNumber}</TableCell>
                        <TableCell>{vehicle.vehicleType}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{vehicle.ownerName || "-"}</TableCell>
                        <TableCell>{vehicle.driverName}</TableCell>
                        <TableCell>{vehicle.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(vehicle.joinDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vehicle.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vehicle.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(vehicle)}>
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(vehicle.id)}>
                              <Trash2 size={16} />
                            </Button>
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
