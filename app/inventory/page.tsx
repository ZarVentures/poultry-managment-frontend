"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Bird, FileText, Calendar, AlertCircle, Percent, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { godownApi, settingsApi } from "@/lib/api"
import { toast } from "sonner"

const DEFAULT_CAPACITY = 10000
const CAPACITY_SETTING_KEY = "godown_capacity"

export default function InventoryPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inwardEntries, setInwardEntries] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
  const [capacityInput, setCapacityInput] = useState("")

  // For the Invoice-wise table pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15)
  const [totalInwardItems, setTotalInwardItems] = useState(0)

  useEffect(() => {
    setMounted(true)
    fetchOverviewData()
  }, [])

  useEffect(() => {
    if (mounted) fetchInwardData()
  }, [mounted, currentPage])

  const fetchOverviewData = async () => {
    try {
      const summaryData = await godownApi.getSummary()
      setSummary(summaryData)

      const capacitySetting = await settingsApi.getOne(CAPACITY_SETTING_KEY)
      const cap = parseInt(capacitySetting.value, 10)
      if (cap > 0) { setCapacity(cap); setCapacityInput(String(cap)) }
      else setCapacityInput(String(DEFAULT_CAPACITY))
    } catch {
      setCapacityInput(String(DEFAULT_CAPACITY))
    }
  }

  const fetchInwardData = async () => {
    try {
      setLoading(true)
      const res = await godownApi.inward.getAll(currentPage, pageSize)
      if (res && res.data) {
        setInwardEntries(res.data)
        setTotalInwardItems(res.total)
      } else {
        setInwardEntries(Array.isArray(res) ? res : [])
        setTotalInwardItems(Array.isArray(res) ? res.length : 0)
      }
    } catch { toast.error("Failed to load invoice data") }
    finally { setLoading(false) }
  }

  const handleSaveCapacity = async () => {
    const n = parseInt(capacityInput, 10)
    if (isNaN(n) || n < 0) return toast.error("Invalid capacity")
    try {
      setLoading(true)
      await settingsApi.createOrUpdate({ key: CAPACITY_SETTING_KEY, value: String(n), category: "godown" })
      setCapacity(n); toast.success("Updated")
    } catch { toast.error("Failed") }
    finally { setLoading(false) }
  }

  const totalBirdsAvailable = summary?.currentStock || 0
  const capacityUtilizationPercent = capacity > 0 ? Math.min(100, Math.round((totalBirdsAvailable / capacity) * 100)) : 0

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold">Godown Overview</h1><p className="text-muted-foreground">Current status and capacity</p></div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Capacity</p>
            <div className="text-2xl font-bold">{capacity}</div>
            <div className="flex gap-1 mt-2">
              <Input type="number" size={1} value={capacityInput} onChange={e => setCapacityInput(e.target.value)} className="h-7 text-xs" />
              <Button size="sm" className="h-7 text-xs" onClick={handleSaveCapacity}>Set</Button>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Available Birds</p>
            <div className="text-2xl font-bold">{totalBirdsAvailable}</div>
            <p className="text-xs text-muted-foreground">In Stock</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Utilization</p>
            <div className="text-2xl font-bold">{capacityUtilizationPercent}%</div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${capacityUtilizationPercent}%` }} /></div>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Total Inward</p>
            <div className="text-2xl font-bold">{summary?.totalInward || 0}</div>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Total Sold</p>
            <div className="text-2xl font-bold">{summary?.totalSold || 0}</div>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={20} />Purchase Invoice Stock</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead><TableHead>Date</TableHead><TableHead>Birds</TableHead><TableHead>Weight</TableHead><TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inwardEntries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-bold">{e.purchaseInvoiceNo}</TableCell>
                    <TableCell>{new Date(e.entryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{e.numberOfBirds}</TableCell>
                    <TableCell>{e.totalWeight}kg</TableCell>
                    <TableCell>{e.supplierName || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {totalInwardItems > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
              <div className="text-sm text-gray-500">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalInwardItems)} of {totalInwardItems}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * pageSize >= totalInwardItems || loading}><ChevronRight size={16} /></Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
