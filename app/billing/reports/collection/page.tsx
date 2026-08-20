'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Printer, Calendar, Banknote, CreditCard, CheckCircle, ChevronLeft, ChevronRight, CircleDollarSign } from 'lucide-react'
import { reportsApi } from '@/lib/api'

const CollectionReportPage = () => {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [modeFilter, setModeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [summary, setSummary] = useState<any>(null)
  const pageSize = 20

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await reportsApi.getCollectionReport({
        startDate: dateFrom,
        endDate: dateTo,
        mode: modeFilter,
        page: currentPage,
        limit: pageSize
      })
      setCollections(res.data)
      setTotalItems(res.total)
      setSummary(res.summary)
    } catch (err) {
      console.error('Collection report error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dateFrom, dateTo, modeFilter, currentPage])

  const filtered = collections

  const totalCollected = summary?.totalAmount || 0
  const modeBreakdown = (mode: string) => summary?.modeTotals?.[mode.toLowerCase()] || 0

  const getRowDate = (e: any) => new Date(e.createdAt || e.created_at).toLocaleDateString('en-GB')
  const getRowMode = (e: any) => e.paymentMode || e.payment_mode || e.mode || '-'
  const getRowStatus = (e: any) => e.status || 'Completed'

  const downloadCSV = () => {
    if (!filtered.length) { alert('No data to export.'); return }
    const headers = 'Date,Invoice,Customer,Mode,Amount,Status'
    const rows = filtered.map(e => `${getRowDate(e)},${e.invoiceNumber || ''},${e.customerName || ''},${getRowMode(e)},${e.amount},${getRowStatus(e)}`).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `collection_${new Date().toISOString().split('T')[0]}.csv`
    a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    if (!filtered.length) { alert('No data to print.'); return }
    const rows = filtered.map(e => `
      <tr>
        <td>${getRowDate(e)}</td>
        <td>${e.invoiceNumber || '-'}</td>
        <td>${e.customerName || '-'}</td>
        <td>${getRowMode(e)}</td>
        <td style="text-align:right">₹${Number(e.amount || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:center">${getRowStatus(e)}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html><html><head><title>Collection Report</title>
      <style>@page{size:landscape;margin:8mm}body{font-family:Arial,sans-serif;padding:10px}
      h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ddd;padding:6px;font-size:11px}th{background:#293e56;color:#fff}</style></head><body>
      <h2>Collection Report</h2>
      <p style="text-align:center">${new Date(dateFrom).toLocaleDateString('en-GB')} - ${new Date(dateTo).toLocaleDateString('en-GB')}</p>
      <p style="text-align:center;font-weight:bold">Total Collected: ₹${totalCollected.toLocaleString('en-IN')}</p>
      <table><thead><tr><th>Date</th><th>Bill No</th><th>Customer</th><th>Mode</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print() }
  }

  const getModeColor = (mode: string) => {
    const m = mode.toLowerCase()
    if (m === 'cash') return 'bg-green-100 text-green-800'
    if (m === 'bank' || m === 'bank_transfer') return 'bg-blue-100 text-blue-800'
    if (m === 'upi') return 'bg-purple-100 text-purple-800'
    if (m === 'cheque') return 'bg-amber-100 text-amber-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Collection Report</h1>
            <p className="text-muted-foreground mt-2">Payments received from sales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV} type="button" className="rounded-full h-10"><Download className="w-4 h-4 mr-2" />Export</Button>
            <Button variant="outline" onClick={handlePrint} type="button" className="rounded-full h-10"><Printer className="w-4 h-4 mr-2" />Print</Button>
          </div>
        </div>

        <Card className="rounded-2xl p-4 no-print">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-10 rounded-full pl-10 w-full sm:w-[160px]" /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-10 rounded-full pl-10 w-full sm:w-[160px]" /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Mode</label>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="!h-10 rounded-full w-full sm:w-[160px]"><SelectValue placeholder="All Modes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 no-print">
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Total Collected</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CircleDollarSign size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-green-600 min-w-0 truncate">₹{totalCollected.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1.5 truncate">{filtered.length} transactions</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Cash</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Banknote size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight min-w-0 truncate">₹{modeBreakdown('cash').toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Bank / UPI</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><CreditCard size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-blue-600 min-w-0 truncate">₹{(modeBreakdown('bank') + modeBreakdown('upi') + modeBreakdown('bank_transfer')).toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Cheque</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><CheckCircle size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-yellow-600 min-w-0 truncate">₹{modeBreakdown('cheque').toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Bill No</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Mode</TableHead>
                  <TableHead className="text-right font-semibold">Amount</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No collections found for the selected period</TableCell></TableRow>
                ) : filtered.map(e => (
                  <TableRow key={e.id} className="border-b border-gray-200">
                    <TableCell className="font-medium">{getRowDate(e)}</TableCell>
                    <TableCell className="font-mono text-sm">{e.invoiceNumber || '-'}</TableCell>
                    <TableCell className="font-semibold">{e.customerName || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getModeColor(getRowMode(e))}`}>{getRowMode(e)}</span>
                    </TableCell>
                    <TableCell className="text-right font-bold">₹{Number(e.amount || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRowStatus(e) === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{getRowStatus(e)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalItems > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium">{totalItems}</span> transactions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage * pageSize >= totalItems || loading}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      <style>{`
        @media print {
          @page { size: landscape; margin: 8mm; }
          * { overflow: visible !important; }
          aside { display: none !important; }
          .flex.h-screen { display: block !important; height: auto !important; }
          main, main > div { display: block !important; height: auto !important; overflow: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}

export default CollectionReportPage
