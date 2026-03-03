"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { godownApi, vehiclesApi, farmersApi, type GodownInward, type Vehicle, type Farmer } from "@/lib/api"
import { toast } from "sonner"

export default function GodownInwardPage() {
  const [entries, setEntries] = useState<GodownInward[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    purchaseInvoiceNo: "",
    supplierName: "",
    vehicleId: "",
    numberOfBirds: "",
    averageWeight: "",
    totalWeight: "",
    ratePerKg: "",
    totalAmount: "",
    notes: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchEntries()
    fetchVehicles()
    fetchFarmers()
  }, [])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const data = await godownApi.inward.getAll()
      setEntries(data)
    } catch (error: any) {
      console.error("Failed to fetch entries:", error)
      toast.error("Failed to load inward entries")
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const data = await vehiclesApi.getAll()
      setVehicles(data.filter(v => v.status === "active"))
    } catch (error) {
      console.error("Failed to fetch vehicles:", error)
    }
  }

  const fetchFarmers = async () => {
    try {
      const data = await farmersApi.getAll()
      setFarmers(data.filter(f => f.status === "active"))
    } catch (error) {
      console.error("Failed to fetch farmers:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      entryDate: new Date().toISOString().split("T")[0],
      purchaseInvoiceNo: "",
      supplierName: "",
      vehicleId: "",
      numberOfBirds: "",
      averageWeight: "",
      totalWeight: "",
      ratePerKg: "",
      totalAmount: "",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (entry: GodownInward) => {
    setFormData({
      entryDate: entry.entryDate,
      purchaseInvoiceNo: entry.purchaseInvoiceNo || "",
      supplierName: entry.supplierName || "",
      vehicleId: entry.vehicleId || "",
      numberOfBirds: String(entry.numberOfBirds || ""),
      averageWeight: String(entry.averageWeight || ""),
      totalWeight: String(entry.totalWeight || ""),
      ratePerKg: String(entry.ratePerKg || ""),
      totalAmount: String(entry.totalAmount || ""),
      notes: entry.notes || "",
    })
    setEditingId(entry.id)
    setShowDialog(true)
  }

  const calculateTotal = () => {
    const totalWeight = parseFloat(formData.totalWeight) || 0
    const ratePerKg = parseFloat(formData.ratePerKg) || 0
    return (totalWeight * ratePerKg).toFixed(2)
  }

  const calculateTotalWeight = () => {
    const numberOfBirds = parseFloat(formData.numberOfBirds) || 0
    const averageWeight = parseFloat(formData.averageWeight) || 0
    const total = (numberOfBirds * averageWeight).toFixed(2)
    setFormData({ ...formData, totalWeight: total })
  }

  const handleSave = async () => {
    if (!formData.supplierName || !formData.numberOfBirds || !formData.ratePerKg) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const numberOfBirds = parseInt(formData.numberOfBirds)
      const averageWeight = parseFloat(formData.averageWeight) || 0
      const totalWeight = parseFloat(formData.totalWeight) || 0
      const ratePerKg = parseFloat(formData.ratePerKg)
      const totalAmount = totalWeight * ratePerKg

      const entryData = {
        entryDate: formData.entryDate,
        purchaseInvoiceNo: formData.purchaseInvoiceNo || undefined,
        supplierName: formData.supplierName,
        vehicleId: formData.vehicleId || undefined,
        numberOfBirds,
        averageWeight: averageWeight || undefined,
        totalWeight: totalWeight || undefined,
        ratePerKg,
        totalAmount,
        notes: formData.notes || undefined,
      }

      if (editingId) {
        await godownApi.inward.update(editingId, entryData)
        toast.success("Entry updated successfully")
      } else {
        await godownApi.inward.create(entryData)
        toast.success("Entry created successfully")
      }

      await fetchEntries()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save entry:", error)
      toast.error(error.message || "Failed to save entry")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      setLoading(true)
      await godownApi.inward.delete(id)
      toast.success("Entry deleted successfully")
      await fetchEntries()
    } catch (error: any) {
      console.error("Failed to delete entry:", error)
      toast.error("Failed to delete entry")
    } finally {
      setLoading(false)
    }
  }

  const handleFarmerChange = (farmerId: string) => {
    const farmer = farmers.find(f => f.id === farmerId)
    if (farmer) {
      setFormData({
        ...formData,
        supplierName: farmer.name,
      })
    }
  }

  const handleVehicleChange = (vehicleId: string) => {
    setFormData({
      ...formData,
      vehicleId: vehicleId,
    })
  }

  // Auto-calculate total weight when birds or average weight changes
  useEffect(() => {
    if (formData.numberOfBirds && formData.averageWeight) {
      const numberOfBirds = parseFloat(formData.numberOfBirds) || 0
      const averageWeight = parseFloat(formData.averageWeight) || 0
      const total = (numberOfBirds * averageWeight).toFixed(2)
      if (formData.totalWeight !== total) {
        setFormData(prev => ({ ...prev, totalWeight: total }))
      }
    }
  }, [formData.numberOfBirds, formData.averageWeight])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Godown Inward Entry</h1>
            <p className="text-muted-foreground">Record stock received into godown</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Entry" : "New Entry"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit godown inward entry details" : "Create a new godown inward entry"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Entry Date *</Label>
                    <DatePicker
                      value={formData.entryDate}
                      onChange={(date) => setFormData({ ...formData, entryDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Invoice No</Label>
                    <Input
                      value={formData.purchaseInvoiceNo}
                      onChange={(e) => setFormData({ ...formData, purchaseInvoiceNo: e.target.value })}
                      placeholder="PO-2024-001"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Farmer (Optional)</Label>
                    <Select value={formData.supplierName || undefined} onValueChange={handleFarmerChange} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select farmer" />
                      </SelectTrigger>
                      <SelectContent>
                        {farmers.map((farmer) => (
                          <SelectItem key={farmer.id} value={farmer.id}>
                            {farmer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier Name *</Label>
                    <Input
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      placeholder="Supplier name"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select
                    value={formData.vehicleId || undefined}
                    onValueChange={handleVehicleChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicleNumber} - {vehicle.driverName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Birds *</Label>
                    <Input
                      type="number"
                      value={formData.numberOfBirds}
                      onChange={(e) => setFormData({ ...formData, numberOfBirds: e.target.value })}
                      placeholder="1000"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Average Weight (Kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.averageWeight}
                      onChange={(e) => setFormData({ ...formData, averageWeight: e.target.value })}
                      placeholder="1.5"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Weight (Kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalWeight}
                      onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
                      placeholder="Auto-calculated"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate per Kg *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.ratePerKg}
                      onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                      placeholder="125.00"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Amount</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                      <span className="text-lg font-semibold">₹{calculateTotal()}</span>
                    </div>
                  </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Inward Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && entries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : entries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No entries found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry Date</TableHead>
                    <TableHead>Reference No</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Birds</TableHead>
                    <TableHead>Weight (Kg)</TableHead>
                    <TableHead>Rate/Kg</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.purchaseInvoiceNo || "-"}</TableCell>
                      <TableCell>{entry.supplierName}</TableCell>
                      <TableCell>{entry.numberOfBirds}</TableCell>
                      <TableCell>{entry.totalWeight ? Number(entry.totalWeight).toFixed(2) : "-"}</TableCell>
                      <TableCell>₹{entry.ratePerKg ? Number(entry.ratePerKg).toFixed(2) : "0.00"}</TableCell>
                      <TableCell className="font-semibold">₹{entry.totalAmount ? Number(entry.totalAmount).toFixed(2) : "0.00"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
