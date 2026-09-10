"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Bird, ChevronLeft, ChevronRight, Warehouse, Gauge, PackagePlus, PackageCheck, Calendar, Undo2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { godownApi, settingsApi, type StockLedgerEntry } from "@/lib/api"
import { toast } from "sonner"

const DEFAULT_CAPACITY = 10000
const CAPACITY_SETTING_KEY = "godown_capacity"
const PAGE_SIZE = 15

function toYmd(d?: Date) {
  if (!d) return undefined
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function typeBadge(type: StockLedgerEntry["movementType"]) {
  if (type === "INWARD") return "bg-emerald-100 text-emerald-800 border-emerald-200"
  if (type === "SALE") return "bg-orange-100 text-orange-800 border-orange-200"
  if (type === "RETURN") return "bg-violet-100 text-violet-800 border-violet-200"
  return "bg-red-100 text-red-800 border-red-200"
}

export default function InventoryPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [movements, setMovements] = useState<StockLedgerEntry[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
  const [capacityInput, setCapacityInput] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetchOverviewData()
    fetchMovements()
  }, [mounted, dateRangeStart, dateRangeEnd])

  useEffect(() => {
    const refresh = () => {
      fetchOverviewData()
      fetchMovements()
    }
    window.addEventListener("focus", refresh)
    return () => window.removeEventListener("focus", refresh)
  }, [dateRangeStart, dateRangeEnd])

  const fetchOverviewData = async () => {
    try {
      const summaryData = await godownApi.getSummary()
      setSummary(summaryData)
    } catch {
      toast.error("Failed to load godown stock")
    }
    try {
      const capacitySetting = await settingsApi.getOne(CAPACITY_SETTING_KEY)
      const cap = parseInt(capacitySetting.value, 10)
      if (cap > 0) { setCapacity(cap); setCapacityInput(String(cap)) }
      else setCapacityInput(String(DEFAULT_CAPACITY))
    } catch {
      setCapacityInput(String(DEFAULT_CAPACITY))
    }
  }

  const fetchMovements = async () => {
    try {
      setLoading(true)
      const data = await godownApi.getStockLedger({
        startDate: toYmd(dateRangeStart),
        endDate: toYmd(dateRangeEnd),
      })
      setMovements(data?.entries || [])
      setCurrentPage(1)
    } catch {
      toast.error("Failed to load godown movements")
      setMovements([])
    } finally {
      setLoading(false)
    }
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

  const totalBirdsAvailable = Number.isFinite(Number(summary?.currentStock))
    ? Number(summary.currentStock)
    : 0
  const capacityUtilizationPercent = capacity > 0 ? Math.min(100, Math.round((totalBirdsAvailable / capacity) * 100)) : 0
  const totalPages = Math.max(1, Math.ceil(movements.length / PAGE_SIZE))
  const pageRows = movements.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Godown Overview</h1>
              <p className="mt-2 text-sm text-muted-foreground">Current status, returns, mortality, and capacity</p>
            </div>
          </div>
          <Button variant="outline" asChild className="self-start sm:self-auto">
            <Link href="/godown/stock-ledger">View Stock Ledger</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:break-words">
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
            <p className="mt-auto pt-4 text-xs text-muted-foreground">
              {(summary?.currentWeight ?? 0).toLocaleString()} kg in stock
            </p>
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
            <div className="mt-3 text-2xl font-bold tracking-tight">{(summary?.totalSold ?? summary?.totalSales ?? 0).toLocaleString()}</div>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">Total birds sold</p>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm transition-shadow hover:shadow-md dark:border-violet-800/50 dark:bg-violet-900/15">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Godown Returns</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                <Undo2 size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-violet-800 dark:text-violet-200">{(summary?.totalReturns ?? 0).toLocaleString()}</div>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">
              {(summary?.totalReturnWeight ?? 0).toLocaleString()} kg returned
            </p>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm transition-shadow hover:shadow-md dark:border-red-800/50 dark:bg-red-900/15">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Godown Mortality</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                <AlertCircle size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-red-700 dark:text-red-300">{(summary?.totalMortality ?? 0).toLocaleString()}</div>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">
              {(summary?.totalMortalityWeight ?? 0).toLocaleString()} kg dead
            </p>
          </div>
        </div>

        <Card className="rounded-2xl p-4 print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              Stock movements
            </CardTitle>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> From
              </label>
              <Input type="date" className="w-full sm:w-[160px] h-10 rounded-full" value={dateRangeStart ? toYmd(dateRangeStart) : ""} onChange={(e) => { const v = e.target.value; if (v) { const [y, m, d] = v.split("-").map(Number); setDateRangeStart(new Date(y, m - 1, d)) } else { setDateRangeStart(undefined) } }} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> To
              </label>
              <Input type="date" className="w-full sm:w-[160px] h-10 rounded-full" value={dateRangeEnd ? toYmd(dateRangeEnd) : ""} onChange={(e) => { const v = e.target.value; if (v) { const [y, m, d] = v.split("-").map(Number); setDateRangeEnd(new Date(y, m - 1, d)) } else { setDateRangeEnd(undefined) } }} />
            </div>
          </div>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                    <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">Date</TableHead>
                    <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                    <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference</TableHead>
                    <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Party</TableHead>
                    <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Birds In</TableHead>
                    <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Birds Out</TableHead>
                    <TableHead className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="h-28 px-4 text-center text-sm text-muted-foreground sm:px-6">
                        Loading movements...
                      </TableCell>
                    </TableRow>
                  ) : pageRows.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="h-28 px-4 text-center text-sm text-muted-foreground sm:px-6">
                        No inward, sale, return, or mortality movements found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((e) => (
                      <TableRow
                        key={`${e.movementType}-${e.referenceId}`}
                        className="border-b last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="whitespace-nowrap px-4 py-3.5 text-sm text-muted-foreground sm:px-6">
                          {new Date(e.date + (e.date.includes("T") ? "" : "T00:00:00")).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${typeBadge(e.movementType)}`}>
                            {e.movementType}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">
                          {e.referenceNo}
                        </TableCell>
                        <TableCell className="max-w-[16rem] truncate px-4 py-3.5 text-foreground">
                          {e.party || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums text-emerald-700">
                          {e.birdsIn ? `+${e.birdsIn}` : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums text-orange-700">
                          {e.birdsOut ? `−${e.birdsOut}` : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums text-muted-foreground">
                          {e.birdsIn ? `${e.weightIn} kg` : e.birdsOut ? `${e.weightOut} kg` : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {movements.length > PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * PAGE_SIZE, movements.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {movements.length}
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
                <span className="text-xs text-muted-foreground">{currentPage}/{totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage >= totalPages || loading}
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
