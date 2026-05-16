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
import { Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    purchaseInvoiceNo: "", purchaseBillNo: "", purchaseBillId: "",
    supplierName: "", selectedFarmerId: "", vehicleId: "",
    numberOfBirds: "", averageWeight: "", actualWeight: "",
    weightLoss: "", totalWeight: "", ratePerKg: "",
    totalAmount: "", notes: "",
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
    fetchVehicles()
    fetchFarmers()
    fetchPurchaseBills()
  }, [])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const res = await godownApi.inward.getAll(currentPage, pageSize, searchQuery)
      if (res && res.data) {
        setEntries(res.data)
        setTotalItems(res.total)
      } else {
        setEntries(Array.isArray(res) ? res : [])
        setTotalItems(Array.isArray(res) ? res.length : 0)
      }
    } catch (error: any) {
      toast.error("Failed to load inward entries")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) fetchEntries()
  }, [mounted, currentPage, searchQuery])

  const fetchVehicles = async () => {
    try {
      const data = await vehiclesApi.getAll()
      setVehicles(Array.isArray(data) ? data.filter(v => v.status === "active") : [])
    } catch { }
  }

  const fetchFarmers = async () => {
    try {
      const data = await farmersApi.getActive()
      setFarmers(data)
    } catch { }
  }

  const fetchPurchaseBills = async () => {
    try {
      const data = await purchasesApi.getInvoiceList()
      setPurchaseBills(Array.isArray(data) ? data : [])
    } catch { setPurchaseBills([]) }
  }

  const handlePurchaseBillChange = async (billId: string) => {
    if (!billId || billId === "__none__") {
      setFormData(f => ({ ...f, purchaseBillId: "", purchaseBillNo: "", purchaseInvoiceNo: "", supplierName: "" }))
      setPurchaseCages([])
      setSelectedCageIds(new Set())
      return
    }
    const bill = purchaseBills.find((b) => b.id === billId)
    if (bill) {
      const orderNumber = bill.orderNumber
      try {
        setLoadingCages(true)
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
        const cageData = await purchasesApi.getCagesByOrderNumber(orderNumber, "pending")
        setPurchaseCages(Array.isArray(cageData) ? cageData.map(c => ({
          ...c, id: c.id ?? "", purchaseWeight: Number(c.purchaseWeight ?? c.cageWeight ?? 0), godownWeight: "",
        })) : [])
      } catch { toast.error("Failed to load bill details") }
      finally { setLoadingCages(false) }
    }
  }

  const toggleCage = (id: string) => {
    setSelectedCageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
    } else {
      const allIds = new Set(purchaseCages.map(c => c.id))
      const totalBirds = purchaseCages.reduce((s, c) => s + c.numberOfBirds, 0)
      const totalGodownWt = purchaseCages.reduce((s, c) => s + (Number(c.godownWeight) || 0), 0)
      setSelectedCageIds(allIds)
      setFormData(f => ({ ...f, numberOfBirds: String(totalBirds), actualWeight: totalGodownWt.toFixed(2) }))
    }
  }

  const resetForm = () => {
    setFormData({
      entryDate: new Date().toISOString().split("T")[0],
      purchaseInvoiceNo: "", purchaseBillNo: "", purchaseBillId: "",
      supplierName: "", selectedFarmerId: "", vehicleId: "",
      numberOfBirds: "", averageWeight: "", actualWeight: "",
      weightLoss: "", totalWeight: "", ratePerKg: "",
      totalAmount: "", notes: "",
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
      purchaseBillNo: "", purchaseBillId: "",
      supplierName: entry.supplierName || "",
      selectedFarmerId: "", vehicleId: entry.vehicleId || "",
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

  const handleSave = async () => {
    if (!formData.supplierName || !formData.numberOfBirds || !formData.ratePerKg) {
      toast.error("Please fill all required fields")
      return
    }
    try {
      setLoading(true)
      const entryData = {
        entryDate: formData.entryDate,
        purchaseInvoiceNo: formData.purchaseInvoiceNo || undefined,
        supplierName: formData.supplierName,
        vehicleId: formData.vehicleId || undefined,
        numberOfBirds: parseInt(formData.numberOfBirds),
        averageWeight: parseFloat(formData.averageWeight) || undefined,
        actualWeight: parseFloat(formData.actualWeight) || 0,
        weightLoss: parseFloat(formData.weightLoss) || 0,
        totalWeight: parseFloat(formData.totalWeight) || 0,
        ratePerKg: parseFloat(formData.ratePerKg),
        totalAmount: parseFloat(formData.totalWeight || '0') * parseFloat(formData.ratePerKg),
        notes: formData.notes || undefined,
        cages: cages.filter(c => c.numberOfBirds > 0 || c.cageWeight > 0).map(c => ({
          cageId: c.cageId || undefined,
          birdType: c.birdType || undefined,
          numberOfBirds: Number(c.numberOfBirds) || 0,
          cageWeight: Number(c.cageWeight) || 0,
        })),
      }
      if (editingId) await godownApi.inward.update(editingId, entryData)
      else await godownApi.inward.create(entryData)
      if (selectedCageIds.size > 0) {
        for (const cage of purchaseCages.filter(c => selectedCageIds.has(c.id))) {
          await purchasesApi.markCagesInGodown([cage.id], Number(cage.godownWeight) || undefined)
        }
      }
      toast.success("Saved successfully")
      await fetchEntries()
      resetForm()
      setShowDialog(false)
    } catch (e: any) { toast.error(e.message || "Failed to save") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      setLoading(true)
      await godownApi.inward.delete(id)
      toast.success("Deleted")
      await fetchEntries()
    } catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const actual = parseFloat(formData.actualWeight) || 0
    const loss = parseFloat(formData.weightLoss) || 0
    const total = (actual - loss).toFixed(2)
    if (formData.totalWeight !== total) {
      setFormData(prev => ({ ...prev, totalWeight: total }))
    }
  }, [formData.actualWeight, formData.weightLoss])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Godown Inward Entry</h1><p className="text-muted-foreground">Record stock received into godown</p></div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2" size={20} />New Entry</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader><DialogTitle>{editingId ? "Edit Entry" : "New Entry"}</DialogTitle></DialogHeader>
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Entry Date *</Label><DatePicker value={formData.entryDate} onChange={d => setFormData({ ...formData, entryDate: d })} disabled={loading} /></div>
                  <div className="space-y-2"><Label>Bill No</Label><Input value={formData.purchaseInvoiceNo} readOnly className="bg-gray-50" /></div>
                </div>
                <div className="space-y-2"><Label>Link to Purchase Bill</Label>
                  <Select value={formData.purchaseBillId || "__none__"} onValueChange={handlePurchaseBillChange} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="Select bill" /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto"><SelectItem value="__none__">None</SelectItem>{purchaseBills.map(b => <SelectItem key={b.id} value={b.id}>{b.orderNumber} — {b.supplierName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {purchaseCages.length > 0 && (
                  <div className="border rounded-lg p-3 bg-blue-50 space-y-2 text-xs">
                    <div className="flex justify-between"><strong>Remaining Cages</strong><button onClick={toggleAllCages} className="underline">Toggle All</button></div>
                    <Table>
                      <TableHeader><TableRow><TableHead></TableHead><TableHead>Cage</TableHead><TableHead>Birds</TableHead><TableHead>Inward Kg</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {purchaseCages.map(c => (
                          <TableRow key={c.id} className={selectedCageIds.has(c.id) ? "bg-green-50" : ""} onClick={() => toggleCage(c.id)}>
                            <TableCell><input type="checkbox" checked={selectedCageIds.has(c.id)} readOnly /></TableCell>
                            <TableCell>{c.cageId}</TableCell><TableCell>{c.numberOfBirds}</TableCell>
                            <TableCell onClick={e => e.stopPropagation()}><input type="number" step="0.01" value={c.godownWeight} onChange={e => {
                              const val = e.target.value
                              const updated = purchaseCages.map(item => item.id === c.id ? { ...item, godownWeight: val } : item)
                              setPurchaseCages(updated)
                              if (val) setSelectedCageIds(prev => new Set([...prev, c.id]))
                            }} className="w-20 border rounded px-1" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Farmer</Label><Select value={formData.selectedFarmerId} onValueChange={id => { const f = farmers.find(it => it.id === id); if (f) setFormData({ ...formData, selectedFarmerId: id, supplierName: f.name }) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{farmers.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Supplier *</Label><Input value={formData.supplierName} onChange={e => setFormData({ ...formData, supplierName: e.target.value })} disabled={loading} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Birds *</Label><Input type="number" value={formData.numberOfBirds} onChange={e => setFormData({ ...formData, numberOfBirds: e.target.value })} disabled={loading} /></div>
                  <div className="space-y-2"><Label>Actual Wt (Kg) *</Label><Input type="number" step="0.01" value={formData.actualWeight} onChange={e => setFormData({ ...formData, actualWeight: e.target.value })} disabled={loading} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Loss (Kg)</Label><Input type="number" step="0.01" value={formData.weightLoss} onChange={e => setFormData({ ...formData, weightLoss: e.target.value })} disabled={loading} /></div>
                  <div className="space-y-2"><Label>Final Wt (Kg)</Label><div className="h-10 border rounded bg-green-50 flex items-center px-3 font-bold">{formData.totalWeight}</div></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Rate/Kg *</Label><Input type="number" value={formData.ratePerKg} onChange={e => setFormData({ ...formData, ratePerKg: e.target.value })} disabled={loading} /></div>
                  <div className="space-y-2"><Label>Total Amount</Label><div className="h-10 border rounded bg-muted flex items-center px-3 font-semibold">₹{(Number(formData.totalWeight || 0) * Number(formData.ratePerKg || 0)).toFixed(2)}</div></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}><X size={20} /></Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <CardTitle>Inward Entries</CardTitle>
              <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[250px]" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Bill No</TableHead><TableHead>Source</TableHead><TableHead>Birds</TableHead><TableHead>Actual</TableHead><TableHead>Loss</TableHead><TableHead>Final</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.entryDate).toLocaleDateString()}</TableCell><TableCell>{e.purchaseInvoiceNo || "-"}</TableCell><TableCell>{e.supplierName}</TableCell>
                    <TableCell>{e.numberOfBirds}</TableCell><TableCell>{(e as any).actualWeight}</TableCell><TableCell>{(e as any).weightLoss}</TableCell><TableCell className="font-bold">{e.totalWeight}</TableCell>
                    <TableCell>
                      {userRole !== 'staff' && userRole !== 'Staff' && (
                        <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => handleEdit(e)}><Edit2 size={16} /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)}><Trash2 size={16} /></Button></div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {totalItems > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
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
