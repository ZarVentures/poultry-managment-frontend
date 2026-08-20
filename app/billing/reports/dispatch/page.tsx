"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Printer, Calendar, ChevronLeft, ChevronRight, Truck, Hash, CircleDollarSign, Banknote } from "lucide-react"
import { salesApi, godownApi } from "@/lib/api"
import { toast } from "sonner"

export default function DailyDispatchReportPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split("T")[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalItems, setTotalItems] = useState(0)
  const [summary, setSummary] = useState({ quantity: 0, gross: 0, net: 0, received: 0 })

  const fetchDispatchData = async () => {
    try {
      setLoading(true)
      const [vehicleRes, godownList] = await Promise.all([
        salesApi.getAll({ startDate: dateFilter, endDate: dateFilter, page: 1, limit: 1000 }),
        godownApi.sales.getAll().catch(() => []),
      ])

      const vehicleSales = Array.isArray(vehicleRes?.data) ? vehicleRes.data : Array.isArray(vehicleRes) ? vehicleRes : []
      const godownSales = (Array.isArray(godownList) ? godownList : [])
        .filter((s: any) => s.saleDate === dateFilter)
        .map((s: any) => ({
          ...s,
          invoiceNumber: s.invoiceNumber || s.saleNo || `GDS-${s.id}`,
          saleMode: "godown",
          quantity: s.totalWeight,
          unitPrice: s.ratePerKg,
          grossAmount: s.totalAmount,
          netAmount: s.totalAmount,
        }))

      const combined = [...vehicleSales, ...godownSales].sort((a, b) =>
        String(b.invoiceNumber || "").localeCompare(String(a.invoiceNumber || "")),
      )

      const start = (currentPage - 1) * pageSize
      const paged = combined.slice(start, start + pageSize)

      setSales(paged)
      setTotalItems(combined.length)

      if (vehicleRes?.summary) {
        const s = vehicleRes.summary
        setSummary({
          quantity: Number(s.totalQuantity || s.totalBirds || 0),
          gross: Number(s.totalGrossAmount || s.totalRevenue || 0),
          net: Number(s.totalNetAmount || s.totalRevenue || 0),
          received: Number(s.totalReceived || 0) + godownSales.reduce((acc: number, x: any) => acc + Number(x.amountReceived || 0), 0),
        })
      } else {
        setSummary({
          quantity: combined.reduce((acc, s) => acc + Number(s.numberOfBirds || s.quantity || 0), 0),
          gross: combined.reduce((acc, s) => acc + Number(s.grossAmount || s.totalAmount || 0), 0),
          net: combined.reduce((acc, s) => acc + Number(s.netAmount || s.totalAmount || 0), 0),
          received: combined.reduce((acc, s) => acc + Number(s.amountReceived || 0), 0),
        })
      }
    } catch {
      toast.error("Failed to load dispatch report")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDispatchData() }, [dateFilter, currentPage])

  const downloadCSV = () => {
    if (!sales.length) { alert("No data to export."); return }
    const headers = "Bill No,Customer,Mode,Birds,Quantity,Rate,Gross,Net,Received,Status"
    const rows = sales.map(s =>
      `${s.invoiceNumber},${s.customerName},${s.saleMode || "vehicle"},${s.numberOfBirds || 0},${s.quantity},${s.unitPrice || s.ratePerKg},${s.grossAmount || s.totalAmount},${s.netAmount || s.totalAmount},${s.amountReceived || 0},${s.paymentStatus}`
    ).join("\n")
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `dispatch_${dateFilter}.csv`
    a.click()
  }

  const handlePrint = () => {
    if (!sales.length) { alert("No data to print."); return }
    const rows = sales.map(s => `
      <tr>
        <td>${s.invoiceNumber || "-"}</td>
        <td>${s.customerName || "-"}</td>
        <td>${s.saleMode || "vehicle"}</td>
        <td>${s.numberOfBirds || 0}</td>
        <td>${Number(s.quantity || 0).toFixed(2)}</td>
        <td>₹${Number(s.unitPrice || s.ratePerKg || 0).toFixed(2)}</td>
        <td>₹${Number(s.netAmount || s.totalAmount || 0).toFixed(2)}</td>
        <td>₹${Number(s.amountReceived || 0).toFixed(2)}</td>
        <td>${s.paymentStatus || "-"}</td>
      </tr>`).join("")

    const html = `<!DOCTYPE html><html><head><title>Daily Dispatch Report</title>
      <style>@page{size:landscape;margin:8mm}body{font-family:Arial,sans-serif;padding:10px}
      h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ddd;padding:6px;font-size:11px;text-align:left}
      th{background:#293e56;color:#fff}</style></head><body>
      <h2>Daily Dispatch Report</h2>
      <p style="text-align:center">Date: ${new Date(dateFilter).toLocaleDateString("en-GB")}</p>
      <table><thead><tr><th>Bill No</th><th>Customer</th><th>Mode</th><th>Birds</th><th>Qty (kg)</th><th>Rate</th><th>Net</th><th>Received</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`

    const w = window.open("", "_blank")
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print() }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div><h1 className="text-2xl sm:text-3xl font-bold">Daily Dispatch Report</h1><p className="text-muted-foreground">Dispatches for {new Date(dateFilter).toLocaleDateString()}</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV} className="rounded-full h-10"><Download className="mr-2" size={16} />Export</Button>
            <Button variant="outline" onClick={handlePrint} className="rounded-full h-10"><Printer className="mr-2" size={16} />Print</Button>
          </div>
        </div>

        <Card className="rounded-2xl p-4 no-print">
          <div className="max-w-xs">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Date</label>
            <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setCurrentPage(1) }} className="h-10 rounded-full pl-10 w-full sm:w-[160px]" /></div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 no-print">
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Total Dispatches</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Truck size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-blue-600 min-w-0 truncate">{totalItems}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Total Birds / Qty</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Hash size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-green-600 min-w-0 truncate">{summary.quantity.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Net Amount</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><CircleDollarSign size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-yellow-600 min-w-0 truncate">₹{summary.net.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Received</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Banknote size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-green-600 min-w-0 truncate">₹{summary.received.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Birds</TableHead>
                  <TableHead>Qty (kg)</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow> : sales.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8">No dispatches found</TableCell></TableRow> : sales.map(s => (
                  <TableRow key={`${s.saleMode || "vehicle"}-${s.id}`}>
                    <TableCell className="font-mono">{s.invoiceNumber}</TableCell>
                    <TableCell className="font-semibold">{s.customerName}</TableCell>
                    <TableCell>{s.saleMode || "vehicle"}</TableCell>
                    <TableCell>{s.numberOfBirds || 0}</TableCell>
                    <TableCell>{Number(s.quantity || 0).toFixed(2)}</TableCell>
                    <TableCell>₹{Number(s.unitPrice || s.ratePerKg || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-bold">₹{Number(s.netAmount || s.totalAmount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-semibold">₹{Number(s.amountReceived || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.paymentStatus === "paid" ? "bg-green-100 text-green-800" : s.paymentStatus === "partial" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                        {s.paymentStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalItems > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t no-print">
              <div className="text-sm text-gray-500">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * pageSize >= totalItems || loading}><ChevronRight size={16} /></Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      <style>{`@media print { aside,.no-print{display:none!important}.flex.h-screen{display:block!important;height:auto!important}}`}</style>
    </DashboardLayout>
  )
}
