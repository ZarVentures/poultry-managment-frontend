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
import { Plus, Edit2, Trash2, X, Printer } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
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
  const [formData, setFormData] = useState({
    mortalityDate: new Date().toISOString().split("T")[0],
    godownInwardId: "",
    numberOfBirdsDied: "",
    weightOfDeadBirds: "",
    reason: "",
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
    fetchMortalities()
    godownApi.inward.getAll().then(d => setInwardEntries(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const fetchMortalities = async () => {
    try {
      setLoading(true)
      const data = await godownApi.mortality.getAll()
      setMortalities(data)
    } catch (error: any) {
      console.error("Failed to fetch mortalities:", error)
      toast.error("Failed to load mortality records")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      mortalityDate: new Date().toISOString().split("T")[0],
      godownInwardId: "",
      numberOfBirdsDied: "",
      weightOfDeadBirds: "",
      reason: "",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (mortality: GodownMortality) => {
    setFormData({
      mortalityDate: mortality.mortalityDate,
      godownInwardId: (mortality as any).godownInwardId || "",
      numberOfBirdsDied: String(mortality.numberOfBirdsDied || ""),
      weightOfDeadBirds: String((mortality as any).weightOfDeadBirds || ""),
      reason: mortality.reason || "",
      notes: mortality.notes || "",
    })
    setEditingId(mortality.id)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.numberOfBirdsDied) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const mortalityData = {
        mortalityDate: formData.mortalityDate,
        godownInwardId: formData.godownInwardId || undefined,
        numberOfBirdsDied: parseInt(formData.numberOfBirdsDied),
        weightOfDeadBirds: parseFloat(formData.weightOfDeadBirds) || undefined,
        reason: formData.reason,
        notes: formData.notes,
      }

      if (editingId) {
        await godownApi.mortality.update(editingId, mortalityData)
        toast.success("Mortality record updated successfully")
      } else {
        await godownApi.mortality.create(mortalityData)
        toast.success("Mortality record created successfully")
      }

      await fetchMortalities()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save mortality:", error)
      toast.error(error.message || "Failed to save mortality record")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mortality record?")) return

    try {
      setLoading(true)
      await godownApi.mortality.delete(id)
      toast.success("Mortality record deleted successfully")
      await fetchMortalities()
    } catch (error: any) {
      console.error("Failed to delete mortality:", error)
      toast.error("Failed to delete mortality record")
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const filteredMortalities = useMemo(() => {
    let filtered = [...mortalities]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (mortality) =>
          (mortality.reason && mortality.reason.toLowerCase().includes(query))
      )
    }

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((mortality) => {
        const mortalityDate = new Date(mortality.mortalityDate)
        mortalityDate.setHours(0, 0, 0, 0)
        return mortalityDate >= start && mortalityDate <= end
      })
    }

    return filtered
  }, [mortalities, searchQuery, dateRangeStart, dateRangeEnd])

  const handlePrintReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Godown Mortality Report</title>
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
            <h1>Godown Mortality Report</h1>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMortalities.map(mortality => `
                <tr>
                  <td>${new Date(mortality.mortalityDate).toLocaleDateString()}</td>
                  <td>${mortality.numberOfBirdsDied} birds</td>
                  <td>${mortality.reason || "-"}</td>
                  <td>${mortality.notes || "-"}</td>
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

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Godown Mortality</h1>
            <p className="text-muted-foreground">Track mortality in godown</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                New Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Mortality Record" : "New Mortality Record"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit godown mortality record" : "Create a new godown mortality record"}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <DatePicker
                    value={formData.mortalityDate}
                    onChange={(date) => setFormData({ ...formData, mortalityDate: date })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link to Godown Inward Entry</Label>
                  <Select
                    value={formData.godownInwardId || "__none__"}
                    onValueChange={v => setFormData({ ...formData, godownInwardId: v === "__none__" ? "" : v })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select inward entry (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {inwardEntries.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.purchaseInvoiceNo || `Entry #${e.id}`} — {e.supplierName || "Unknown"} ({new Date(e.entryDate).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Birds Died *</Label>
                    <Input
                      type="number"
                      value={formData.numberOfBirdsDied}
                      onChange={(e) => setFormData({ ...formData, numberOfBirdsDied: e.target.value })}
                      placeholder="0"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight of Dead Birds (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.weightOfDeadBirds}
                      onChange={(e) => setFormData({ ...formData, weightOfDeadBirds: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Reason for mortality"
                    disabled={loading}
                  />
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
            <div className="flex justify-between items-start">
              {/* <div>
                <CardTitle>Mortality Records</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage mortality records</p>
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
                    placeholder="Search by reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[250px]"
                  />
                </div>
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
            {loading && mortalities.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredMortalities.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || (dateRangeStart && dateRangeEnd) 
                  ? "No mortality records match your filters" 
                  : "No mortality records found"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Inward Entry</TableHead>
                      <TableHead>Birds Died</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMortalities.map((mortality) => (
                      <TableRow key={mortality.id}>
                        <TableCell>{new Date(mortality.mortalityDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(mortality as any).godownInward
                            ? `${(mortality as any).godownInward.purchaseInvoiceNo || `#${(mortality as any).godownInwardId}`} — ${(mortality as any).godownInward.supplierName || ''}`
                            : '-'}
                        </TableCell>
                        <TableCell>{mortality.numberOfBirdsDied} birds</TableCell>
                        <TableCell>{(mortality as any).weightOfDeadBirds ? `${Number((mortality as any).weightOfDeadBirds).toFixed(2)} kg` : '-'}</TableCell>
                        <TableCell>{mortality.reason || "-"}</TableCell>
                        <TableCell>
                          {userRole !== 'staff' && userRole !== 'Staff' && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(mortality)}>
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(mortality.id)}>
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
