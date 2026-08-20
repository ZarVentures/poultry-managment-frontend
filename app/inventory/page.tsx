"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bird, FileText, ChevronLeft, ChevronRight, Warehouse, Gauge, PackagePlus, PackageCheck, Calendar } from "lucide-react"
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
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
    fetchOverviewData()
  }, [])

  useEffect(() => {
    if (mounted) fetchInwardData()
  }, [mounted, currentPage])

  const filteredInwardEntries = useMemo(() => {
    if (!dateRangeStart && !dateRangeEnd) return inwardEntries
    return inwardEntries.filter(e => {
      const d = new Date(e.entryDate)
      if (dateRangeStart && d < dateRangeStart) return false
      if (dateRangeEnd) {
        const end = new Date(dateRangeEnd)
        end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })
  }, [inwardEntries, dateRangeStart, dateRangeEnd])

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Godown Overview</h1>
              <p className="mt-2 text-sm text-muted-foreground">Current status and capacity</p>
            </div>
          </div>
          <Button variant="outline" asChild className="self-start sm:self-auto">
            <Link href="/godown/stock-ledger">View Stock Ledger</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 [&>*]:break-words">
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Capacity</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Warehouse size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{capacity.toLocaleString()}</div>
            <div className="mt-auto flex gap-2 pt-4">
              <Input type="number" value={capacityInput} onChange={e => setCapacityInput(e.target.value)} className="h-9 min-w-0 flex-1 text-sm" placeholder={String(DEFAULT_CAPACITY)} />
              <Button onClick={handleSaveCapacity} className="h-9 shrink-0">Set</Button>
            </div>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Available Birds</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                <Bird size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{totalBirdsAvailable.toLocaleString()}</div>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">In Stock</p>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Utilization</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Gauge size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{capacityUtilizationPercent}%</div>
            <div className="mt-auto pt-4">
              <div className="w-full h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${capacityUtilizationPercent}%` }} />
              </div>
            </div>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Total Inward</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                <PackagePlus size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{(summary?.totalInward ?? 0).toLocaleString()}</div>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">Total birds in</p>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Total Sold</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <PackageCheck size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{(summary?.totalSold ?? 0).toLocaleString()}</div>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">Total birds sold</p>
          </div>
        </div>

        

        <Card className="rounded-2xl p-4 print:hidden">
          
          
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
        

        
      </CardTitle>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> From
              </label>
              <Input type="date" className="w-full sm:w-[160px] h-10 rounded-full" value={dateRangeStart ? `${dateRangeStart.getFullYear()}-${String(dateRangeStart.getMonth() + 1).padStart(2, "0")}-${String(dateRangeStart.getDate()).padStart(2, "0")}` : ""} onChange={(e) => { const v = e.target.value; if (v) { const [y, m, d] = v.split("-").map(Number); setDateRangeStart(new Date(y, m - 1, d)) } else { setDateRangeStart(undefined) } setCurrentPage(1) }} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> To
              </label>
              <Input type="date" className="w-full sm:w-[160px] h-10 rounded-full" value={dateRangeEnd ? `${dateRangeEnd.getFullYear()}-${String(dateRangeEnd.getMonth() + 1).padStart(2, "0")}-${String(dateRangeEnd.getDate()).padStart(2, "0")}` : ""} onChange={(e) => { const v = e.target.value; if (v) { const [y, m, d] = v.split("-").map(Number); setDateRangeEnd(new Date(y, m - 1, d)) } else { setDateRangeEnd(undefined) } setCurrentPage(1) }} />
            </div>
          </div>
        </Card>

        <Card>
  <CardContent className="p-0">
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
            <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
              Invoice No
            </TableHead>

            <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date
            </TableHead>

            <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Birds
            </TableHead>

            <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Weight
            </TableHead>

            <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Supplier
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredInwardEntries.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={5}
                className="h-28 px-4 text-center text-sm text-muted-foreground sm:px-6"
              >
                No invoice data found
              </TableCell>
            </TableRow>
          ) : (
            filteredInwardEntries.map((e) => (
              <TableRow
                key={e.id}
                className="border-b last:border-0 transition-colors hover:bg-muted/30"
              >
                <TableCell className="px-4 py-3.5 font-semibold text-foreground sm:px-6">
                  {e.purchaseInvoiceNo}
                </TableCell>

                <TableCell className="whitespace-nowrap px-4 py-3.5 text-sm text-muted-foreground">
                  {new Date(e.entryDate).toLocaleDateString()}
                </TableCell>

                <TableCell className="px-4 py-3.5 font-medium tabular-nums text-foreground">
                  {e.numberOfBirds}
                </TableCell>

                <TableCell className="px-4 py-3.5 font-medium tabular-nums text-muted-foreground">
                  {e.totalWeight} kg
                </TableCell>

                <TableCell className="max-w-[16rem] truncate px-4 py-3.5 text-foreground">
                  {e.supplierName || "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </CardContent>

  {totalInwardItems > pageSize && (
    <div className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      
      <div className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {(currentPage - 1) * pageSize + 1}
        </span>{" "}
        to{" "}
        <span className="font-medium text-foreground">
          {Math.min(currentPage * pageSize, totalInwardItems)}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">
          {totalInwardItems}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || loading}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage * pageSize >= totalInwardItems || loading}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

    </div>
  )}
</Card>
      </div>
    </DashboardLayout>
  )
}
