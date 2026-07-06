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
import { Plus, Edit2, Trash2, X, Printer, ChevronLeft, ChevronRight } from "lucide-react"
import { DateRangeFilter } from "@/components/date-range-filter"
import { Textarea } from "@/components/ui/textarea"
import { godownApi, type GodownMortality, type GodownInward } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function GodownMortalityPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [mortalities, setMortalities] = useState<GodownMortality[]>([])
  const [inwardEntries, setInwardEntries] = useState<GodownInward[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  const [formData, setFormData] = useState({
    mortalityDate: new Date().toISOString().split("T")[0],
    godownInwardId: "", numberOfBirdsDied: "",
    weightOfDeadBirds: "", reason: "", notes: "",
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
    godownApi.inward.getAll().then(res => setInwardEntries(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))).catch(() => { })
  }, [])

  const fetchMortalities = async () => {
    try {
      setLoading(true)
      const res = await godownApi.mortality.getAll(currentPage, pageSize, searchQuery)
      if (res && res.data) {
        setMortalities(res.data)
        setTotalItems(res.total)
      } else {
        setMortalities(Array.isArray(res) ? res : [])
        setTotalItems(Array.isArray(res) ? res.length : 0)
      }
    } catch { toast.error("Failed to load records") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (mounted) fetchMortalities()
  }, [mounted, currentPage, searchQuery, dateRangeStart, dateRangeEnd])

  const filteredMortalities = useMemo(() => {
    if (!dateRangeStart && !dateRangeEnd) return mortalities
    return mortalities.filter(m => {
      const d = new Date(m.mortalityDate)
      if (dateRangeStart && d < dateRangeStart) return false
      if (dateRangeEnd) {
        const end = new Date(dateRangeEnd)
        end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })
  }, [mortalities, dateRangeStart, dateRangeEnd])

  const resetForm = () => {
    setFormData({ mortalityDate: new Date().toISOString().split("T")[0], godownInwardId: "", numberOfBirdsDied: "", weightOfDeadBirds: "", reason: "", notes: "" })
    setEditingId(null)
  }

  const handleEdit = (m: GodownMortality) => {
    setFormData({
      mortalityDate: m.mortalityDate, godownInwardId: (m as any).godownInwardId || "",
      numberOfBirdsDied: String(m.numberOfBirdsDied || ""), weightOfDeadBirds: String((m as any).weightOfDeadBirds || ""),
      reason: m.reason || "", notes: m.notes || "",
    })
    setEditingId(m.id); setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.numberOfBirdsDied) { toast.error("Required fields missing"); return }
    try {
      setLoading(true)
      const data = { ...formData, numberOfBirdsDied: parseInt(formData.numberOfBirdsDied), weightOfDeadBirds: parseFloat(formData.weightOfDeadBirds) || 0 }
      if (editingId) await godownApi.mortality.update(editingId, data)
      else await godownApi.mortality.create(data)
      toast.success("Saved")
      await fetchMortalities()
      resetForm(); setShowDialog(false)
    } catch { toast.error("Failed to save") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try { setLoading(true); await godownApi.mortality.delete(id); toast.success("Deleted"); await fetchMortalities() }
    catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Godown Mortality</h1><p className="text-muted-foreground">Track mortality in godown</p></div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button onClick={resetForm}><Plus className="mr-2" size={20} />New Record</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingId ? "Edit Record" : "New Record"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Date *</Label><DatePicker value={formData.mortalityDate} onChange={d => setFormData({ ...formData, mortalityDate: d })} disabled={loading} /></div>
                <div className="space-y-2"><Label>Inward Entry</Label>
                  <Select value={formData.godownInwardId || "__none__"} onValueChange={v => setFormData({ ...formData, godownInwardId: v === "__none__" ? "" : v })} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="Select entry" /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="__none__">None</SelectItem>
                      {inwardEntries.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          Inward No: {e.inwardNo || 'N/A'} {e.purchaseInvoiceNo ? `(Inv: ${e.purchaseInvoiceNo})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Birds Died *</Label><Input type="number" value={formData.numberOfBirdsDied} onChange={e => setFormData({ ...formData, numberOfBirdsDied: e.target.value })} disabled={loading} /></div>
                  <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" step="0.01" value={formData.weightOfDeadBirds} onChange={e => setFormData({ ...formData, weightOfDeadBirds: e.target.value })} disabled={loading} /></div>
                </div>
                <div className="space-y-2"><Label>Reason</Label><Input value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} disabled={loading} /></div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} disabled={loading} /></div>
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
            <div className="flex flex-wrap justify-between items-center gap-2">
              <CardTitle>Mortality Records</CardTitle>
              <div className="flex items-center gap-2">
                <DateRangeFilter startDate={dateRangeStart} endDate={dateRangeEnd} onDateRangeChange={(s, e) => { setDateRangeStart(s); setDateRangeEnd(e); setCurrentPage(1) }} />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[200px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Inward</TableHead><TableHead>Birds</TableHead><TableHead>Weight</TableHead><TableHead>Reason</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredMortalities.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.mortalityDate).toLocaleDateString()}</TableCell>
                    <TableCell>{(m as any).godownInward?.purchaseInvoiceNo || (m as any).godownInwardId || '-'}</TableCell>
                    <TableCell>{m.numberOfBirdsDied}</TableCell><TableCell>{(m as any).weightOfDeadBirds}</TableCell>
                    <TableCell>{m.reason || "-"}</TableCell>
                    <TableCell>
                      {userRole !== 'staff' && userRole !== 'Staff' && (
                        <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => handleEdit(m)}><Edit2 size={16} /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}><Trash2 size={16} /></Button></div>
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
