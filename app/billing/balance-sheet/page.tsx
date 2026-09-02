"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { reportsApi, type BalanceSheetLine, type BalanceSheetReport } from "@/lib/api"
import { formatDate, formatDateToYYYYMMDD } from "@/lib/date-utils"
import { toast } from "sonner"
import {
  Download, FileText, IndianRupee, Scale, TrendingDown, Wallet, Package,
  AlertCircle, CheckCircle2, Info, ChevronDown, Loader2, Landmark, Bird,
} from "lucide-react"

function money(n: number) {
  const v = Number(n) || 0
  const abs = Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return v < 0 ? `(₹${abs})` : `₹${abs}`
}

function StatementRow({
  line,
  muted,
}: {
  line: BalanceSheetLine
  muted?: boolean
}) {
  return (
    <div className={`group flex items-center justify-between gap-4 px-4 sm:px-5 py-3 ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{line.label}</span>
        {line.note && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="shrink-0 text-slate-400 hover:text-emerald-600 transition-colors">
                <Info size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs leading-relaxed">{line.note}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
        {money(line.amount)}
      </span>
    </div>
  )
}

function TotalRow({ label, amount, emphasize }: { label: string; amount: number; emphasize?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5 ${
        emphasize
          ? "bg-slate-900 text-white dark:bg-emerald-950"
          : "bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700"
      }`}
    >
      <span className={`text-sm font-bold ${emphasize ? "" : "text-slate-800 dark:text-slate-100"}`}>{label}</span>
      <span className="text-sm sm:text-base font-bold tabular-nums whitespace-nowrap">{money(amount)}</span>
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  hint: string
  icon: typeof Wallet
  tone: "emerald" | "rose" | "sky"
}) {
  const tones = {
    emerald: "from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 border-emerald-100 dark:border-emerald-900/40",
    rose: "from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900 border-rose-100 dark:border-rose-900/40",
    sky: "from-sky-50 to-white dark:from-sky-950/30 dark:to-slate-900 border-sky-100 dark:border-sky-900/40",
  }
  const icons = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  }
  return (
    <div className={`rounded-2xl border bg-gradient-to-b ${tones[tone]} p-4 sm:p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${icons[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
        {money(value)}
      </p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

export default function BalanceSheetPage() {
  const [asOnDate, setAsOnDate] = useState(formatDateToYYYYMMDD(new Date()))
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BalanceSheetReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showWorkings, setShowWorkings] = useState(false)

  const load = useCallback(async (date = asOnDate) => {
    try {
      setLoading(true)
      setError(null)
      const report = await reportsApi.getBalanceSheet(date)
      setData(report)
    } catch (err: any) {
      const message = err?.message || "Failed to load balance sheet"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [asOnDate])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const downloadCSV = () => {
    if (!data) return toast.error("Generate the statement first")
    const rows: string[][] = [
      ["Balance Sheet", formatDate(data.asOnDate)],
      [],
      ["Assets", "Amount"],
      ...data.assets.lines.map((l) => [l.label, String(l.amount)]),
      ["Total assets", String(data.assets.total)],
      [],
      ["Liabilities", "Amount"],
      ...data.liabilities.lines.map((l) => [l.label, String(l.amount)]),
      ["Total liabilities", String(data.liabilities.total)],
      [],
      ["Equity", "Amount"],
      ...data.equity.lines.map((l) => [l.label, String(l.amount)]),
      ["Total equity", String(data.equity.total)],
      [],
      ["Total liabilities & equity", String(data.totals.liabilitiesAndEquity)],
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `balance_sheet_${data.asOnDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    if (!data) return toast.error("Generate the statement first")
    const { default: jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")
    const doc = new jsPDF({ unit: "mm", format: "a4" })
    doc.setFontSize(16)
    doc.text("Balance Sheet", 14, 18)
    doc.setFontSize(10)
    doc.text(`As on ${formatDate(data.asOnDate)}`, 14, 25)
    autoTable(doc, {
      startY: 32,
      head: [["Assets", "Amount (INR)"]],
      body: [
        ...data.assets.lines.map((l) => [l.label, l.amount.toFixed(2)]),
        ["Total assets", data.assets.total.toFixed(2)],
      ],
    })
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Liabilities", "Amount (INR)"]],
      body: [
        ...data.liabilities.lines.map((l) => [l.label, l.amount.toFixed(2)]),
        ["Total liabilities", data.liabilities.total.toFixed(2)],
      ],
    })
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Equity", "Amount (INR)"]],
      body: [
        ...data.equity.lines.map((l) => [l.label, l.amount.toFixed(2)]),
        ["Total equity", data.equity.total.toFixed(2)],
        ["Total liabilities & equity", data.totals.liabilitiesAndEquity.toFixed(2)],
      ],
    })
    doc.save(`balance_sheet_${data.asOnDate}.pdf`)
  }

  const pl = data?.notes.profitAndLoss
  const inv = data?.notes.inventory
  const cash = data?.notes.cashMovements

  return (
    <DashboardLayout>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 text-xs font-semibold mb-3">
              <Scale size={13} /> Financial position
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Balance Sheet
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 max-w-xl">
              What the business owns and owes as on a date — from sales, purchases, godown stock and payments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-end print:hidden">
            <div className="w-full sm:w-48">
              <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase mb-1.5 block">As on</label>
              <DatePicker value={asOnDate} onChange={setAsOnDate} placeholder="As on" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => load(asOnDate)} disabled={loading} className="h-10 px-5">
                {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Scale size={16} className="mr-2" />}
                {loading ? "Updating" : "Refresh"}
              </Button>
              <Button variant="outline" className="h-10" onClick={downloadCSV} disabled={!data} aria-label="Download CSV">
                <Download size={16} />
              </Button>
              <Button variant="outline" className="h-10" onClick={downloadPDF} disabled={!data} aria-label="Download PDF">
                <FileText size={16} />
              </Button>
            </div>
          </div>
        </div>

        {loading && !data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 rounded-2xl border bg-slate-50 dark:bg-slate-900 animate-pulse" />
              ))}
            </div>
            <div className="h-80 rounded-2xl border bg-slate-50 dark:bg-slate-900 animate-pulse" />
          </div>
        )}

        {error && !data && !loading && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 px-5 py-8 text-center">
            <AlertCircle className="mx-auto mb-2 text-amber-600" size={22} />
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{error}</p>
            <Button className="mt-4" variant="outline" onClick={() => load(asOnDate)}>Try again</Button>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <KpiCard label="Assets" value={data.assets.total} hint="Cash, dues and stock" icon={Wallet} tone="emerald" />
              <KpiCard label="Liabilities" value={data.liabilities.total} hint="Payables and advances" icon={TrendingDown} tone="rose" />
              <KpiCard label="Equity" value={data.equity.total} hint="Owner residual" icon={IndianRupee} tone="sky" />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Statement of financial position</p>
                  <p className="text-xs text-slate-500 mt-0.5">As on {formatDate(data.asOnDate)}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-semibold ${
                    data.totals.isBalanced
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {data.totals.isBalanced ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {data.totals.isBalanced ? "Balanced" : `Off by ${money(data.totals.difference)}`}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-slate-100 dark:divide-slate-800">
                <section>
                  <div className="px-5 py-3 bg-emerald-50/70 dark:bg-emerald-950/20">
                    <p className="text-[11px] font-bold tracking-[0.18em] text-emerald-800 dark:text-emerald-400 uppercase">Assets</p>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.assets.lines.map((line) => (
                      <StatementRow key={line.key} line={line} />
                    ))}
                  </div>
                  <TotalRow label="Total assets" amount={data.assets.total} emphasize />
                </section>

                <section>
                  <div className="px-5 py-3 bg-rose-50/70 dark:bg-rose-950/20">
                    <p className="text-[11px] font-bold tracking-[0.18em] text-rose-800 dark:text-rose-400 uppercase">Liabilities</p>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.liabilities.lines.map((line) => (
                      <StatementRow key={line.key} line={line} />
                    ))}
                  </div>
                  <TotalRow label="Total liabilities" amount={data.liabilities.total} />

                  <div className="px-5 py-3 bg-sky-50/70 dark:bg-sky-950/20 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold tracking-[0.18em] text-sky-800 dark:text-sky-400 uppercase">Equity</p>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.equity.lines.map((line) => (
                      <StatementRow key={line.key} line={line} muted={line.amount === 0} />
                    ))}
                  </div>
                  <TotalRow label="Total equity" amount={data.equity.total} />
                  <TotalRow label="Liabilities + equity" amount={data.totals.liabilitiesAndEquity} emphasize />
                </section>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWorkings((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3.5 text-left shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors print:hidden"
            >
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">How these numbers are built</span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${showWorkings ? "rotate-180" : ""}`} />
            </button>

            {showWorkings && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <Package size={15} />
                    </span>
                    <p className="text-sm font-bold">Inventory</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1"><Bird size={11} /> Birds</p>
                      <p className="text-lg font-bold tabular-nums">{inv?.birds ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Weight</p>
                      <p className="text-lg font-bold tabular-nums">{(inv?.weightKg ?? 0).toFixed(1)}<span className="text-xs font-medium text-slate-400"> kg</span></p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Avg rate</p>
                      <p className="text-lg font-bold tabular-nums">{money(inv?.avgRatePerKg ?? 0)}</p>
                    </div>
                  </div>
                  {(inv?.godown || inv?.vehicle) && (
                    <div className="mt-3 pt-3 border-t text-xs text-slate-500 space-y-1">
                      {inv.godown && (
                        <p>Godown: {inv.godown.birds} birds · {inv.godown.weightKg.toFixed(1)} kg · {money(inv.godown.value)}</p>
                      )}
                      {inv.vehicle && (
                        <p>Vehicle: {inv.vehicle.birds} birds · {inv.vehicle.weightKg.toFixed(1)} kg · {money(inv.vehicle.value)}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <IndianRupee size={15} />
                    </span>
                    <p className="text-sm font-bold">Implied P&amp;L</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      ["Revenue", pl?.revenue ?? 0],
                      ["COGS", pl?.costOfGoodsSold ?? 0],
                      ["Gross profit", pl?.grossProfit ?? 0],
                      ["Expenses", pl?.operatingExpenses ?? 0],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>{label}</span>
                        <span className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{money(Number(value))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>Net profit</span>
                      <span className={`tabular-nums ${(pl?.netProfit ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {money(pl?.netProfit ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      <Landmark size={15} />
                    </span>
                    <p className="text-sm font-bold">Cash movement</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      ["Vehicle in", cash?.vehicleCollections ?? 0, true],
                      ["Godown in", cash?.godownCollections ?? 0, true],
                      ["Other in", cash?.voucherIn ?? 0, true],
                      ["Purchases out", cash?.purchasePayments ?? 0, false],
                      ["Expenses out", cash?.expenses ?? 0, false],
                      ["Other out", cash?.voucherOut ?? 0, false],
                    ].map(([label, value, inflow]) => (
                      <div key={String(label)} className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">{label}</span>
                        <span className={`tabular-nums font-medium ${inflow ? "text-emerald-600" : "text-rose-600"}`}>
                          {inflow ? "+" : "−"} {money(Number(value))}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{data.notes.basis}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
