"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Printer, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { salesApi } from "@/lib/api"
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
      const res = await salesApi.getAll({
        startDate: dateFilter,
        endDate: dateFilter,
        page: currentPage,
        limit: pageSize
      })

      if (res && res.data) {
        setSales(res.data)
        setTotalItems(res.total)
        // Calculating summary from current page for now, or use res.summary if backend provides it
        // If backend provides a total summary for the date range, we should use that.
        // Assuming res.summary might exist based on other reports.
        if (res.summary) {
          setSummary({
            quantity: res.summary.totalQuantity || 0,
            gross: res.summary.totalGrossAmount || 0,
            net: res.summary.totalNetAmount || 0,
            received: res.summary.totalReceived || 0
          })
        } else {
          // Fallback if no summary from backend
          const totalQty = res.data.reduce((acc: number, s: any) => acc + Number(s.quantity || 0), 0)
          const totalGross = res.data.reduce((acc: number, s: any) => acc + Number(s.grossAmount || s.totalAmount || 0), 0)
          const totalNet = res.data.reduce((acc: number, s: any) => acc + Number(s.netAmount || s.totalAmount || 0), 0)
          const totalRec = res.data.reduce((acc: number, s: any) => acc + Number(s.amountReceived || 0), 0)
          setSummary({ quantity: totalQty, gross: totalGross, net: totalNet, received: totalRec })
        }
      } else {
        setSales(Array.isArray(res) ? res : [])
        setTotalItems(Array.isArray(res) ? res.length : 0)
      }
    } catch { toast.error("Failed to load dispatch report") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDispatchData() }, [dateFilter, currentPage])

  const downloadCSV = () => {
    if (!sales.length) { alert("No data to export."); return }
    const headers = "Invoice,Customer,Mode,Quantity,Rate,Gross,Net,Received,Status"
    const rows = sales.map(s =>
      `${s.invoiceNumber},${s.customerName},${s.saleMode},${s.quantity},${s.unitPrice},${s.grossAmount || s.totalAmount},${s.netAmount || s.totalAmount},${s.amountReceived || 0},${s.paymentStatus}`
    ).join("\n")
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `dispatch_${dateFilter}.csv`
    a.click()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Daily Dispatch Report</h1><p className="text-muted-foreground">Dispatches for {new Date(dateFilter).toLocaleDateString()}</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV}><Download className="mr-2" size={16} />Export</Button>
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2" size={16} />Print</Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="max-w-xs">
            <label className="text-sm font-medium mb-1 block">Select Date</label>
            <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setCurrentPage(1) }} className="pl-10" /></div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-blue-50">
            <p className="text-sm text-gray-600">Total Dispatches</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </Card>
          <Card className="p-4 bg-green-50">
            <p className="text-sm text-gray-600">Total Quantity</p>
            <p className="text-2xl font-bold">{summary.quantity.toLocaleString()} kg</p>
          </Card>
          <Card className="p-4 bg-amber-50">
            <p className="text-sm text-gray-600">Net Amount</p>
            <p className="text-2xl font-bold">₹{summary.net.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-purple-50">
            <p className="text-sm text-gray-600">Received</p>
            <p className="text-2xl font-bold text-green-600">₹{summary.received.toLocaleString()}</p>
          </Card>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> : sales.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8">No dispatches found</TableCell></TableRow> : sales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.invoiceNumber}</TableCell>
                    <TableCell className="font-semibold">{s.customerName}</TableCell>
                    <TableCell>{s.quantity} {s.unit || "kg"}</TableCell>
                    <TableCell>₹{s.unitPrice}</TableCell>
                    <TableCell className="font-bold">₹{s.netAmount || s.totalAmount}</TableCell>
                    <TableCell className="text-green-600 font-semibold">₹{s.amountReceived || 0}</TableCell>
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
