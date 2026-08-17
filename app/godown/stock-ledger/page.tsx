"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft, Calendar, Download, FileText, Printer, Search,
  Bird, PackagePlus, PackageMinus, AlertCircle, Scale, Undo2,
} from "lucide-react"
import { godownApi, settingsApi, type StockLedgerEntry, type StockLedgerResponse } from "@/lib/api"
import { toast } from "sonner"

function fmtNum(n: number, digits = 0) {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function fmtDate(d: string) {
  if (!d) return "-"
  return new Date(d + (d.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en-GB")
}

function typeBadge(type: StockLedgerEntry["movementType"]) {
  if (type === "INWARD") return "bg-emerald-100 text-emerald-800 border-emerald-200"
  if (type === "SALE") return "bg-orange-100 text-orange-800 border-orange-200"
  if (type === "RETURN") return "bg-violet-100 text-violet-800 border-violet-200"
  return "bg-red-100 text-red-800 border-red-200"
}

export default function StockLedgerPage() {
  const yearStart = () => {
    const d = new Date()
    d.setMonth(0, 1)
    return d.toISOString().split("T")[0]
  }

  const [dateFrom, setDateFrom] = useState(yearStart)
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0])
  const [type, setType] = useState("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [ledger, setLedger] = useState<StockLedgerResponse | null>(null)
  const [orgInfo, setOrgInfo] = useState({ name: "", location: "", phone: "" })

  useEffect(() => {
    settingsApi.getAll()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : []
        const map = Object.fromEntries(list.map((s: any) => [s.key, s.value]))
        setOrgInfo({
          name: map.farmName || map.company_name || "",
          location: map.farmLocation || map.company_address || "",
          phone: map.farmPhone || map.company_phone || "",
        })
      })
      .catch(() => {})
  }, [])

  const fetchLedger = async () => {
    try {
      setLoading(true)
      const data = await godownApi.getStockLedger({
        startDate: dateFrom,
        endDate: dateTo,
        type,
        search: search || undefined,
      })
      setLedger(data)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to load stock ledger")
      setLedger(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, type, search])

  const entries = ledger?.entries || []
  const opening = ledger?.opening || { birds: 0, weight: 0 }
  const period = ledger?.period || {
    birdsIn: 0, birdsOut: 0, weightIn: 0, weightOut: 0, amountIn: 0, amountOut: 0,
    soldBirds: 0, soldWeight: 0, mortalityBirds: 0, mortalityWeight: 0,
  }
  const closing = ledger?.closing || { birds: 0, weight: 0 }
  const soldBirds = period.soldBirds ?? entries.filter((e) => e.movementType === "SALE").reduce((s, e) => s + e.birdsOut, 0)
  const soldWeight = period.soldWeight ?? entries.filter((e) => e.movementType === "SALE").reduce((s, e) => s + e.weightOut, 0)
  const mortalityBirds = period.mortalityBirds ?? entries.filter((e) => e.movementType === "MORTALITY").reduce((s, e) => s + e.birdsOut, 0)
  const mortalityWeight = period.mortalityWeight ?? entries.filter((e) => e.movementType === "MORTALITY").reduce((s, e) => s + e.weightOut, 0)
  const returnBirds = period.returnBirds ?? entries.filter((e) => e.movementType === "RETURN").reduce((s, e) => s + e.birdsIn, 0)
  const returnWeight = period.returnWeight ?? entries.filter((e) => e.movementType === "RETURN").reduce((s, e) => s + e.weightIn, 0)

  const downloadCSV = () => {
    if (!entries.length && opening.birds === 0) {
      toast.error("No data to export")
      return
    }
    const headers = [
      "Date", "Type", "Reference", "Party", "Purchase Invoice",
      "Birds In", "Birds Out", "Weight In (kg)", "Weight Out (kg)",
      "Rate/kg", "Amount", "Balance Birds", "Balance Weight (kg)", "Notes",
    ].join(",")
    const openingRow = [
      dateFrom, "OPENING", "-", "Opening Balance", "",
      "", "", "", "", "", "", opening.birds, opening.weight.toFixed(2), "",
    ].join(",")
    const rows = entries.map((e) => [
      e.date,
      e.movementType,
      `"${e.referenceNo || ""}"`,
      `"${(e.party || "").replace(/"/g, '""')}"`,
      e.purchaseInvoiceNo || "",
      e.birdsIn || "",
      e.birdsOut || "",
      e.weightIn || "",
      e.weightOut || "",
      e.ratePerKg ?? "",
      e.amount ?? "",
      e.runningBirds,
      e.runningWeight,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ].join(","))
    const closingRow = [
      dateTo, "CLOSING", "-", "Closing Balance", "",
      period.birdsIn, period.birdsOut, period.weightIn, period.weightOut,
      "", "", closing.birds, closing.weight.toFixed(2), "",
    ].join(",")
    const blob = new Blob([[headers, openingRow, ...rows, closingRow].join("\n")], {
      type: "text/csv;charset=utf-8;",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stock_ledger_${dateFrom}_${dateTo}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    const { default: jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const pageW = doc.internal.pageSize.getWidth()

    let titleY = 16
    if (orgInfo.name) {
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(orgInfo.name, 14, 12)
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      let iy = 17
      if (orgInfo.location) { doc.text(orgInfo.location, 14, iy); iy += 4 }
      if (orgInfo.phone) { doc.text(`Phone: ${orgInfo.phone}`, 14, iy); iy += 4 }
      titleY = iy + 2
    }

    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Godown Stock Ledger", pageW / 2, titleY, { align: "center" })
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Period: ${fmtDate(dateFrom)} - ${fmtDate(dateTo)}`,
      pageW / 2,
      titleY + 6,
      { align: "center" },
    )

    const body: any[] = [
      [
        { content: "Opening Balance", colSpan: 8, styles: { fontStyle: "bold" as const, halign: "right" as const } },
        String(opening.birds),
        `${opening.weight.toFixed(2)} kg`,
        "",
      ],
      ...entries.map((e) => [
        fmtDate(e.date),
        e.movementType,
        e.referenceNo,
        e.party || "-",
        e.birdsIn || "-",
        e.birdsOut || "-",
        e.weightIn ? `${e.weightIn.toFixed(2)}` : "-",
        e.weightOut ? `${e.weightOut.toFixed(2)}` : "-",
        String(e.runningBirds),
        `${Number(e.runningWeight).toFixed(2)} kg`,
        e.amount != null ? `₹${fmtNum(e.amount, 2)}` : "-",
      ]),
      [
        { content: "Closing Balance", colSpan: 8, styles: { fontStyle: "bold" as const, halign: "right" as const } },
        String(closing.birds),
        `${closing.weight.toFixed(2)} kg`,
        "",
      ],
    ]

    autoTable(doc, {
      startY: titleY + 10,
      head: [["Date", "Type", "Ref", "Party", "In", "Out", "Wt In", "Wt Out", "Bal Birds", "Bal Wt", "Amount"]],
      body,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 64, 175], fontSize: 7 },
    })

    doc.save(`stock_ledger_${dateFrom}_${dateTo}.pdf`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 print:space-y-4">
        <div className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-start lg:gap-20">
          <div className="min-w-0">
            <Link href="/inventory" className="mb-2 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft size={14} className="mr-1" /> Back to Godown Overview
            </Link>
            <div className="flex items-center gap-3">
              
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Stock Ledger</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Chronological bird stock movements with opening, period, and closing balance
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 self-start lg:ml-auto">
  <Button variant="outline" size="sm" onClick={downloadCSV}>
    <Download size={14} className="mr-1" /> CSV
  </Button>

  <Button variant="outline" size="sm" onClick={downloadPDF}>
    <FileText size={14} className="mr-1" /> PDF
  </Button>

  <Button variant="outline" size="sm" onClick={handlePrint}>
    <Printer size={14} className="mr-1" /> Print
  </Button>
</div>
        </div>

        <div className="hidden print:block text-center mb-4">
          {orgInfo.name && <h2 className="text-xl font-bold">{orgInfo.name}</h2>}
          <h1 className="text-lg font-semibold">Godown Stock Ledger</h1>
          <p className="text-sm">{fmtDate(dateFrom)} — {fmtDate(dateTo)}</p>
        </div>

        <Card className="rounded-2xl p-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> From
              </label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> To
              </label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Movements</SelectItem>
                  <SelectItem value="inward">Inward (+)</SelectItem>
                  <SelectItem value="sale">Sale (−)</SelectItem>
                  <SelectItem value="return">Return (+)</SelectItem>
                  <SelectItem value="mortality">Mortality (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Ref no, party, invoice, notes..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput.trim())}
                  />
                </div>
                <Button onClick={() => setSearch(searchInput.trim())} disabled={loading}>
                  {loading ? "Loading..." : "Apply"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7 [&>*]:break-words">
          <Card className="rounded-2xl border-blue-200 bg-blue-50/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-blue-700">
              <Bird size={20} /> Opening
            </div>
            <div className="text-xl font-bold tracking-tight text-blue-900 sm:text-2xl">{fmtNum(opening.birds)}</div>
            <div className="mt-0.5 text-xs text-blue-600">{fmtNum(opening.weight, 2)} kg</div>
          </Card>
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-emerald-700">
              <PackagePlus size={20} /> Inward
            </div>
            <div className="text-xl font-bold tracking-tight text-emerald-900 sm:text-2xl">+{fmtNum(period.birdsIn - returnBirds)}</div>
            <div className="mt-0.5 text-xs text-emerald-600">{fmtNum(Math.max(0, period.weightIn - returnWeight), 2)} kg</div>
          </Card>
          <Card className="rounded-2xl border-violet-200 bg-violet-50/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-violet-700">
              <Undo2 size={20} /> Returns
            </div>
            <div className="text-xl font-bold tracking-tight text-violet-900 sm:text-2xl">+{fmtNum(returnBirds)}</div>
            <div className="mt-0.5 text-xs text-violet-600">{fmtNum(returnWeight, 2)} kg</div>
          </Card>
          <Card className="rounded-2xl border-orange-200 bg-orange-50/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-orange-700">
              <PackageMinus size={20} /> Sold
            </div>
            <div className="text-xl font-bold tracking-tight text-orange-900 sm:text-2xl">−{fmtNum(soldBirds)}</div>
            <div className="mt-0.5 text-xs text-orange-600">{fmtNum(soldWeight, 2)} kg</div>
          </Card>
          <Card className="rounded-2xl border-red-200 bg-red-50/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-red-700">
              <AlertCircle size={20} /> Mortality
            </div>
            <div className="text-xl font-bold tracking-tight text-red-900 sm:text-2xl">−{fmtNum(mortalityBirds)}</div>
            <div className="mt-0.5 text-xs text-red-600">{fmtNum(mortalityWeight, 2)} kg</div>
          </Card>
          <Card className="rounded-2xl border-indigo-200 bg-indigo-50/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-indigo-700">
              <Scale size={20} /> Closing
            </div>
            <div className="text-xl font-bold tracking-tight text-indigo-900 sm:text-2xl">{fmtNum(closing.birds)}</div>
            <div className="mt-0.5 text-xs text-indigo-600">{fmtNum(closing.weight, 2)} kg</div>
          </Card>
          <Card className="rounded-2xl border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-1 text-xs font-medium text-slate-600">Period Value</div>
            <div className="text-sm font-semibold text-slate-800">In ₹{fmtNum(period.amountIn, 2)}</div>
            <div className="text-sm font-semibold text-slate-800">Out ₹{fmtNum(period.amountOut, 2)}</div>
          </Card>
        </div>

        <Card className="overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <Table className="[&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-3">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Party / Detail</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purchase Inv</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-emerald-700">Birds In</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-orange-700">Birds Out</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wt In</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wt Out</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rate</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bal. Birds</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bal. Wt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-blue-50/80 font-medium">
                  <TableCell colSpan={5} className="text-right text-blue-800">
                    Opening Balance ({fmtDate(dateFrom)})
                  </TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right text-blue-900 font-bold">{fmtNum(opening.birds)}</TableCell>
                  <TableCell className="text-right text-blue-900 font-bold">{fmtNum(opening.weight, 2)} kg</TableCell>
                </TableRow>

                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-10 text-muted-foreground animate-pulse">
                      Loading stock movements...
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-10 text-muted-foreground">
                      No stock movements in this period
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((e) => (
                    <TableRow key={`${e.movementType}-${e.referenceId}`} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap text-sm">{fmtDate(e.date)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${typeBadge(e.movementType)}`}>
                          {e.movementType}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{e.referenceNo}</TableCell>
                      <TableCell className="max-w-[180px] truncate" title={e.party}>{e.party}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.purchaseInvoiceNo || "—"}</TableCell>
                      <TableCell className="text-right text-emerald-700 font-medium">
                        {e.birdsIn ? `+${fmtNum(e.birdsIn)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-orange-700 font-medium">
                        {e.birdsOut ? `−${fmtNum(e.birdsOut)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {e.weightIn ? `${fmtNum(e.weightIn, 2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {e.weightOut ? `${fmtNum(e.weightOut, 2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {e.ratePerKg != null ? `₹${fmtNum(e.ratePerKg, 2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {e.amount != null ? `₹${fmtNum(e.amount, 2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{fmtNum(e.runningBirds)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmtNum(e.runningWeight, 2)} kg</TableCell>
                    </TableRow>
                  ))
                )}

                <TableRow className="bg-slate-100 font-medium border-t-2">
                  <TableCell colSpan={5} className="text-right">Period Totals</TableCell>
                  <TableCell className="text-right text-emerald-700">+{fmtNum(period.birdsIn)}</TableCell>
                  <TableCell className="text-right text-orange-700">−{fmtNum(period.birdsOut)}</TableCell>
                  <TableCell className="text-right">{fmtNum(period.weightIn, 2)}</TableCell>
                  <TableCell className="text-right">{fmtNum(period.weightOut, 2)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right text-xs">
                    <div>In ₹{fmtNum(period.amountIn, 2)}</div>
                    <div>Out ₹{fmtNum(period.amountOut, 2)}</div>
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>

                <TableRow className="bg-indigo-50 font-bold">
                  <TableCell colSpan={5} className="text-right text-indigo-900">
                    Closing Balance ({fmtDate(dateTo)})
                  </TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right text-indigo-900 text-lg">{fmtNum(closing.birds)}</TableCell>
                  <TableCell className="text-right text-indigo-900">{fmtNum(closing.weight, 2)} kg</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground print:hidden">
          Stock formula: Opening + Inward + Returns − Sale − Mortality = Closing.
          Processed godown bird returns appear as violet RETURN rows (restocked / dead / not restocked).
        </p>
      </div>
    </DashboardLayout>
  )
}
