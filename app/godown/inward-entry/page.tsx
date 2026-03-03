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
    farmerName: "",
    vehicleNumber: "",
    quantity: "",
    unit: "kg",
    rate: "",
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
      farmerName: "",
      vehicleNumber: "",
      quantity: "",
      unit: "kg",
      rate: "",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (entry: GodownInward) => {
    setFormData({
      entryDate: entry.entryDate,
      farmerName: entry.farmerName,
      vehicleNumber: entry.vehicleNumber,
      quantity: String(entry.quantity),
      unit: entry.unit,
      rate: String(entry.rate),
      notes: entry.notes || "",
    })
    setEditingId(entry.id)
    setShowDialog(true)
  }

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0
    const rate = parseFloat(formData.rate) || 0
    return (quantity * rate).toFixed(2)
  }

  const handleSave = async () => {
    if (!formData.farmerName || !formData.quantity || !formData.rate) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const quantity = parseFloat(formData.quantity)
      const rate = parseFloat(formData.rate)
      const totalAmount = quantity * rate

      const entryData = {
        entryDate: formData.entryDate,
        farmerName: formData.farmerName,
        vehicleNumber: formData.vehicleNumber,
        quantity,
        unit: formData.unit,
        rate,
        totalAmount,
        notes: formData.notes,
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
        farmerName: farmer.name,
      })
    }
  }

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
                    <Label>Farmer (Optional)</Label>
                    <Select value={formData.farmerName || undefined} onValueChange={handleFarmerChange} disabled={loading}>
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
                </div>

                <div className="space-y-2">
                  <Label>Farmer Name *</Label>
                  <Input
                    value={formData.farmerName}
                    onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                    placeholder="Farmer name"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Number</Label>
                  <Select
                    value={formData.vehicleNumber || undefined}
                    onValueChange={(value) => setFormData({ ...formData, vehicleNumber: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.vehicleNumber}>
                          {vehicle.vehicleNumber} - {vehicle.driverName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="kg, pcs"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="text-lg font-semibold">
                    Total: ₹{calculateTotal()}
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
                    <TableHead>Date</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.farmerName}</TableCell>
                      <TableCell>{entry.vehicleNumber || "-"}</TableCell>
                      <TableCell>
                        {entry.quantity} {entry.unit}
                      </TableCell>
                      <TableCell>₹{Number(entry.rate).toFixed(2)}</TableCell>
                      <TableCell>₹{Number(entry.totalAmount).toFixed(2)}</TableCell>
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
