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
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { godownApi, vehiclesApi, farmersApi, purchasesApi, type GodownInward, type GodownCage, type Vehicle } from "@/lib/api"
import { toast } from "sonner"

type ActiveFarmer = { id: string; name: string; phone: string; address?: string }

const emptyCage = (): GodownCage => ({ cageId: "", birdType: "", numberOfBirds: 0, cageWeight: 0 })

export default function GodownInwardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [entries, setEntries] = useState<GodownInward[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [farmers, setFarmers] = useState<ActiveFarmer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    purchaseInvoiceNo: "",
    purchaseBillNo: "",
    purchaseBillId: "",
    supplierName: "",
    selectedFarmerId: "",
    vehicleId: "",
    numberOfBirds: "",
    averageWeight: "",
    actualWeight: "",
    weightLoss: "",
    totalWeight: "",
    ratePerKg: "",
    totalAmount: "",
    notes: "",
  })
  const [cages, setCages] = useState<GodownCage[]>([emptyCage()])
  const [purchaseBills, setPurchaseBills] = useState<Array<{ id: string; orderNumber: string; supplierName: string }>>([])
  const [purchaseCages, setPurchaseCages] = useState<Array<{ id: string; cageId?: string; numberOfBirds: number; purchaseWeight: number; godownWeight: string }>>([])
  const [selectedCageIds, setSelectedCageIds] = useState<Set<string>>(new Set())
  const [loadingCages, setLoadingCages] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role || "")
      } catch { }
    }
    fetchEntries()
    fetchVehicles()
    fetchFarmers()
    fetchPurchaseBills()
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
      // getActive() returns a plain array of active farmers
      const data = await farmersApi.getActive()
      setFarmers(data)
    } catch (error) {
      console.error("Failed to fetch farmers:", error)
    }
  }

  const fetchPurchaseBills = async () => {
    try {
      const data = await purchasesApi.getInvoiceList()
      setPurchaseBills(Array.isArray(data) ? data : [])
    } catch { setPurchaseBills([]) }
  }

  const handlePurchaseBillChange = async (billId: string) => {
    if (!billId || billId === "__none__") {
      setFormData((f) => ({
        ...f,
        purchaseBillId: "",
        purchaseBillNo: "",
        purchaseInvoiceNo: "",
        supplierName: "",
      }))
      setPurchaseCages([])
      setSelectedCageIds(new Set())
      return
    }

    const bill = purchaseBills.find((b) => b.id === billId)
    if (bill) {
      const orderNumber = bill.orderNumber
      setFormData((f) => ({
        ...f,
        purchaseBillId: billId,
        purchaseBillNo: orderNumber,
        purchaseInvoiceNo: orderNumber,
        supplierName: bill.supplierName,
      }))
      setPurchaseCages([])
      setSelectedCageIds(new Set())

      try {
        setLoadingCages(true)
        // Fetch full purchase order to get farmer, vehicle, rate
        const fullOrder = await purchasesApi.getOne(bill.id)
        setFormData((f) => ({
          ...f,
          purchaseBillId: billId,
          purchaseBillNo: orderNumber,
          purchaseInvoiceNo: orderNumber,
          supplierName: fullOrder.supplierName || bill.supplierName,
          selectedFarmerId: fullOrder.farmerId || f.selectedFarmerId,
          vehicleId: fullOrder.vehicleId || f.vehicleId,
          ratePerKg: fullOrder.ratePerKg ? String(fullOrder.ratePerKg) : f.ratePerKg,
        }))

        // Load cages
        const cageData = await purchasesApi.getCagesByOrderNumber(orderNumber, "pending")
        setPurchaseCages(
          Array.isArray(cageData)
            ? cageData.map((c) => ({
              ...c,
              id: c.id ?? "",
              purchaseWeight: Number(c.purchaseWeight ?? c.cageWeight ?? 0),
              godownWeight: "",
            }))
            : [],
        )
      } catch (error) {
        console.error("Failed to load bill details:", error)
        toast.error("Failed to load details for this purchase bill")
      } finally {
        setLoadingCages(false)
      }
    }
  }

  const toggleCage = (id: string) => {
    setSelectedCageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      // Auto-fill birds from selected cages; weight comes from godownWeight entries
      const selected = purchaseCages.filter(c => next.has(c.id))
      const totalBirds = selected.reduce((s, c) => s + c.numberOfBirds, 0)
      const totalGodownWt = selected.reduce((s, c) => s + (Number(c.godownWeight) || 0), 0)
      setFormData(f => ({
        ...f,
        numberOfBirds: totalBirds > 0 ? String(totalBirds) : f.numberOfBirds,
        actualWeight: totalGodownWt > 0 ? totalGodownWt.toFixed(2) : f.actualWeight,
      }))
      return next
    })
  }

  const toggleAllCages = () => {
    if (selectedCageIds.size === purchaseCages.length) {
      setSelectedCageIds(new Set())
      setFormData(f => ({ ...f, numberOfBirds: '', totalWeight: '' }))
    } else {
      const allIds = new Set(purchaseCages.map(c => c.id))
      const totalBirds = purchaseCages.reduce((s, c) => s + c.numberOfBirds, 0)
      const totalGodownWt = purchaseCages.reduce((s, c) => s + (Number(c.godownWeight) || 0), 0)
      setSelectedCageIds(allIds)
      setFormData(f => ({
        ...f,
        numberOfBirds: String(totalBirds),
        actualWeight: totalGodownWt.toFixed(2),
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      entryDate: new Date().toISOString().split("T")[0],
      purchaseInvoiceNo: "",
      purchaseBillNo: "",
      purchaseBillId: "",
      supplierName: "",
      selectedFarmerId: "",
      vehicleId: "",
      numberOfBirds: "",
      averageWeight: "",
      actualWeight: "",
      weightLoss: "",
      totalWeight: "",
      ratePerKg: "",
      totalAmount: "",
      notes: "",
    })
    setCages([emptyCage()])
    setPurchaseCages([])
    setSelectedCageIds(new Set())
    setEditingId(null)
  }

  const handleEdit = (entry: GodownInward) => {
    setFormData({
      entryDate: entry.entryDate,
      purchaseInvoiceNo: entry.purchaseInvoiceNo || "",
      purchaseBillNo: "",
      purchaseBillId: "",
      supplierName: entry.supplierName || "",
      selectedFarmerId: "",
      vehicleId: entry.vehicleId || "",
      numberOfBirds: String(entry.numberOfBirds || ""),
      averageWeight: String(entry.averageWeight || ""),
      actualWeight: String((entry as any).actualWeight || ""),
      weightLoss: String((entry as any).weightLoss || ""),
      totalWeight: String(entry.totalWeight || ""),
      ratePerKg: String(entry.ratePerKg || ""),
      totalAmount: String(entry.totalAmount || ""),
      notes: entry.notes || "",
    })
    setCages(entry.cages && entry.cages.length > 0 ? entry.cages : [emptyCage()])
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
        actualWeight: parseFloat(formData.actualWeight) || 0,
        weightLoss: parseFloat(formData.weightLoss) || 0,
        totalWeight: totalWeight || undefined,
        ratePerKg,
        totalAmount,
        notes: formData.notes || undefined,
        cages: cages
          .filter(c => c.numberOfBirds > 0 || c.cageWeight > 0)
          .map(c => ({
            cageId: c.cageId || undefined,
            birdType: c.birdType || undefined,
            numberOfBirds: Number(c.numberOfBirds) || 0,
            cageWeight: Number(c.cageWeight) || 0,
          })),
      }

      if (editingId) {
        await godownApi.inward.update(editingId, entryData)
        toast.success("Entry updated successfully")
      } else {
        await godownApi.inward.create(entryData)
        toast.success("Entry created successfully")
      }

      // Mark selected purchase cages as in_godown with their godown inward weights
      if (selectedCageIds.size > 0) {
        try {
          const selectedCages = purchaseCages.filter(c => selectedCageIds.has(c.id))
          // Group by weight for batch update — pass individual weights
          for (const cage of selectedCages) {
            const godownWeight = Number(cage.godownWeight) || undefined
            await purchasesApi.markCagesInGodown([cage.id], godownWeight)
          }
        } catch { toast.error("Entry saved but failed to update cage status") }
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
        selectedFarmerId: farmerId,
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

  // Auto-calculate final weight when actual weight or loss changes
  useEffect(() => {
    const actual = parseFloat(formData.actualWeight) || 0
    const loss = parseFloat(formData.weightLoss) || 0
    const total = (actual - loss).toFixed(2)
    if (formData.totalWeight !== total) {
      setFormData(prev => ({ ...prev, totalWeight: total }))
    }
  }, [formData.actualWeight, formData.weightLoss])

  const filteredEntries = useMemo(() => {
    let f = [...entries]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      f = f.filter(e =>
        (e.purchaseInvoiceNo || '').toLowerCase().includes(q) ||
        (e.supplierName || '').toLowerCase().includes(q)
      )
    }
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart); start.setHours(0, 0, 0, 0)
      const end = new Date(dateRangeEnd); end.setHours(23, 59, 59, 999)
      f = f.filter(e => {
        if (!e.entryDate) return false
        const d = new Date(e.entryDate); d.setHours(0, 0, 0, 0)
        return d >= start && d <= end
      })
    }
    return f
  }, [entries, searchQuery, dateRangeStart, dateRangeEnd])

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
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Entry" : "New Entry"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit godown inward entry details" : "Create a new godown inward entry"}
                </p>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
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
                    <Label>Purchase Bill No</Label>
                    <Input
                      value={formData.purchaseInvoiceNo}
                      readOnly
                      placeholder="Auto-filled from Purchase Bill"
                      className={formData.purchaseInvoiceNo ? "bg-green-50 border-green-300" : "bg-gray-50"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Link to Purchase Bill (loads remaining cages)</Label>
                  <Select value={formData.purchaseBillId || "__none__"} onValueChange={handlePurchaseBillChange} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purchase bill (optional)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="__none__">None</SelectItem>
                      {purchaseBills.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.orderNumber} — {b.supplierName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Remaining cages from purchase bill */}
                {formData.purchaseBillId && (
                  <div className="border rounded-lg p-3 bg-blue-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-blue-900 font-semibold">
                        Remaining Cages from {formData.purchaseBillNo}
                      </Label>
                      {loadingCages && <span className="text-xs text-muted-foreground">Loading...</span>}
                      {!loadingCages && purchaseCages.length > 0 && (
                        <button type="button" onClick={toggleAllCages} className="text-xs text-blue-700 underline">
                          {selectedCageIds.size === purchaseCages.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>
                    {!loadingCages && purchaseCages.length === 0 && (
                      <p className="text-xs text-muted-foreground">No remaining cages (all sold or already in godown).</p>
                    )}
                    {!loadingCages && purchaseCages.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b bg-blue-100">
                              <th className="p-1 w-8"></th>
                              <th className="text-left p-1">Cage ID</th>
                              <th className="text-right p-1">Birds</th>
                              <th className="text-right p-1">Purchase Wt (kg)</th>
                              <th className="text-right p-1">Godown Wt (kg) *</th>
                              <th className="text-right p-1 text-red-600">Loss (kg)</th>
                              <th className="text-right p-1 text-orange-700">Wt Loss %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchaseCages.map(cage => {
                              const purchaseWt = Number(cage.purchaseWeight)
                              const godownWt = Number(cage.godownWeight) || 0
                              const lossKg = purchaseWt - godownWt
                              const lossPct = purchaseWt > 0 && godownWt > 0 ? (lossKg / purchaseWt) * 100 : null
                              return (
                                <tr key={cage.id} className={`border-b cursor-pointer hover:bg-blue-100 ${selectedCageIds.has(cage.id) ? 'bg-green-50' : ''}`}
                                  onClick={() => toggleCage(cage.id)}>
                                  <td className="p-1 text-center">
                                    <input type="checkbox" checked={selectedCageIds.has(cage.id)} onChange={() => toggleCage(cage.id)} onClick={e => e.stopPropagation()} />
                                  </td>
                                  <td className="p-1 font-medium">{cage.cageId || '-'}</td>
                                  <td className="p-1 text-right">{cage.numberOfBirds}</td>
                                  <td className="p-1 text-right">{purchaseWt.toFixed(2)}</td>
                                  <td className="p-1 text-right" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={cage.godownWeight}
                                      onChange={e => {
                                        const val = e.target.value
                                        const enteredWt = parseFloat(val) || 0
                                        if (enteredWt > purchaseWt && purchaseWt > 0) {
                                          toast.error(`Godown weight (${enteredWt} kg) cannot exceed purchase weight (${purchaseWt.toFixed(2)} kg) for cage ${cage.cageId || cage.id}`)
                                          return
                                        }
                                        const updatedCages = purchaseCages.map(c => c.id === cage.id ? { ...c, godownWeight: val } : c)
                                        setPurchaseCages(updatedCages)
                                        if (val) {
                                          setSelectedCageIds(prev => {
                                            const next = new Set([...prev, cage.id])
                                            const selected = updatedCages.filter(c => next.has(c.id))
                                            const totalBirds = selected.reduce((s, c) => s + c.numberOfBirds, 0)
                                            const totalGodownWt = selected.reduce((s, c) => s + (Number(c.godownWeight) || 0), 0)
                                            setFormData(f => ({
                                              ...f,
                                              numberOfBirds: String(totalBirds),
                                              totalWeight: totalGodownWt.toFixed(2),
                                              actualWeight: totalGodownWt.toFixed(2),
                                            }))
                                            return next
                                          })
                                        }
                                      }}
                                      className="w-20 text-right border rounded px-1 py-0.5 text-xs"
                                    />
                                  </td>
                                  <td className="p-1 text-right text-red-600 font-medium">
                                    {cage.godownWeight ? lossKg.toFixed(2) : '-'}
                                  </td>
                                  <td className="p-1 text-right">
                                    {lossPct !== null ? (
                                      <span className={`font-medium ${lossPct > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                        {lossPct.toFixed(1)}%
                                      </span>
                                    ) : <span className="text-muted-foreground">-</span>}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            {(() => {
                              const selCages = purchaseCages.filter(c => selectedCageIds.has(c.id))
                              const totalPurchaseWt = selCages.reduce((s, c) => s + Number(c.purchaseWeight), 0)
                              const totalGodownWt = selCages.reduce((s, c) => s + (Number(c.godownWeight) || 0), 0)
                              const totalLossPct = totalPurchaseWt > 0 && totalGodownWt > 0
                                ? ((totalPurchaseWt - totalGodownWt) / totalPurchaseWt) * 100
                                : null
                              return (
                                <tr className="border-t font-semibold bg-blue-100">
                                  <td colSpan={2} className="p-1">{selectedCageIds.size} selected / {purchaseCages.length} total</td>
                                  <td className="p-1 text-right">{selCages.reduce((s, c) => s + c.numberOfBirds, 0)}</td>
                                  <td className="p-1 text-right">{totalPurchaseWt.toFixed(2)}</td>
                                  <td className="p-1 text-right">{totalGodownWt.toFixed(2)}</td>
                                  <td className="p-1 text-right text-red-600">{(totalPurchaseWt - totalGodownWt).toFixed(2)}</td>
                                  <td className="p-1 text-right">
                                    {totalLossPct !== null ? (
                                      <span className={totalLossPct > 5 ? 'text-red-600' : 'text-green-600'}>
                                        {totalLossPct.toFixed(1)}%
                                      </span>
                                    ) : '-'}
                                  </td>
                                </tr>
                              )
                            })()}
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Farmer (Optional)</Label>
                    <Select value={formData.selectedFarmerId || undefined} onValueChange={handleFarmerChange} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select farmer" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
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
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicleNumber} - {vehicle.driverName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Birds *</Label>
                    <Input
                      type="number"
                      value={formData.numberOfBirds}
                      onChange={(e) => setFormData({ ...formData, numberOfBirds: e.target.value })}
                      placeholder="1000"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Actual Inward Wt (Kg) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.actualWeight}
                      onChange={(e) => setFormData({ ...formData, actualWeight: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-red-600">Weight Loss (Kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.weightLoss}
                      onChange={(e) => setFormData({ ...formData, weightLoss: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                      className="border-red-200"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Final Stock Wt (Kg)</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-green-50 border-green-200 font-bold text-green-700">
                      {formData.totalWeight || "0.00"}
                    </div>
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
                      onWheel={(e) => e.currentTarget.blur()}
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
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle>Inward Entries</CardTitle>
              <div className="flex items-center gap-2 flex-wrap ml-auto">
                <DateRangeFilter
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onDateRangeChange={(s, e) => { setDateRangeStart(s); setDateRangeEnd(e) }}
                />
                <Input
                  placeholder="Search by bill no or supplier..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-[220px]"
                />
                {(searchQuery || dateRangeStart) && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setDateRangeStart(undefined); setDateRangeEnd(undefined) }}>
                    <X size={14} className="mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && entries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredEntries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {entries.length === 0 ? 'No entries found' : 'No entries match your filters'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry Date</TableHead>
                    <TableHead>Reference No</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Birds</TableHead>
                    <TableHead>Actual (Kg)</TableHead>
                    <TableHead className="text-red-600">Loss (Kg)</TableHead>
                    <TableHead className="text-green-700 font-bold">Final (Kg)</TableHead>
                    <TableHead>Rate/Kg</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.purchaseInvoiceNo || "-"}</TableCell>
                      <TableCell>{entry.supplierName}</TableCell>
                      <TableCell>{entry.numberOfBirds}</TableCell>
                      <TableCell>{(entry as any).actualWeight ? Number((entry as any).actualWeight).toFixed(2) : "-"}</TableCell>
                      <TableCell className="text-red-600 font-medium">{Number((entry as any).weightLoss || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-green-700 font-bold">{entry.totalWeight ? Number(entry.totalWeight).toFixed(2) : "-"}</TableCell>
                      <TableCell>₹{entry.ratePerKg ? Number(entry.ratePerKg).toFixed(2) : "0.00"}</TableCell>
                      <TableCell className="font-semibold">₹{entry.totalAmount ? Number(entry.totalAmount).toFixed(2) : "0.00"}</TableCell>
                      <TableCell>
                        {userRole !== 'staff' && userRole !== 'Staff' && (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        )}
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
