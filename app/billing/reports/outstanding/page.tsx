'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Download, Printer, ChevronLeft, ChevronRight, Search, CircleDollarSign, BadgeDollarSign, Users } from 'lucide-react'
import { reportsApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { escapeHtml, fetchOrgInfo, type OrgInfo } from '@/lib/org-info'

interface RetailerOutstanding {
  id: string
  name: string
  phone: string
  totalSales: number
  totalReceived: number
  outstanding: number
  salesCount: number
}

const OutstandingReportPage = () => {
  const [data, setData] = useState<RetailerOutstanding[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('outstanding')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [summary, setSummary] = useState<any>(null)
  const [orgInfo, setOrgInfo] = useState<OrgInfo>({ name: '', location: '', phone: '' })

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await reportsApi.getOutstandingReport({
        page: currentPage,
        limit: pageSize,
        sortBy,
        search: search || undefined,
      })
      setData(res.data)
      setTotalItems(res.total)
      setSummary(res.summary)
    } catch (err) {
      console.error('Outstanding report error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgInfo().then(setOrgInfo).catch(() => {})
  }, [])

  useEffect(() => {
    fetchData()
  }, [currentPage, sortBy, search])

  const sorted = data // Already sorted by backend

  const totalOutstanding = summary?.totalOutstanding || 0
  const totalOverpaid = summary?.totalOverpaid || 0
  const overdueCount = summary?.overdueCount || 0
  const totalRetailersCount = summary?.totalRetailers || 0

  const downloadCSV = () => {
    if (!sorted.length) return
    const headers = 'Name,Phone,Total Sales,Total Received,Outstanding,Sales Count'
    const rows = sorted.map(r => `${r.name},${r.phone},${r.totalSales},${r.totalReceived},${r.outstanding},${r.salesCount}`).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `outstanding_${new Date().toISOString().split('T')[0]}.csv`
    a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handlePrint = async () => {
    let printRows = sorted
    let printSummary = summary
    try {
      const res = await reportsApi.getOutstandingReport({
        page: 1,
        limit: Math.max(totalItems || 0, sorted.length, 1000),
        sortBy,
        search: search || undefined,
      })
      if (Array.isArray(res.data) && res.data.length) printRows = res.data
      if (res.summary) printSummary = res.summary
    } catch {
      // Use rows already on screen.
    }
    if (!printRows.length) { alert('No data to print.'); return }

    const org = await fetchOrgInfo().catch(() => orgInfo)
    const farmName = (org.name || orgInfo.name || '').trim()
    const farmMeta = [org.location || orgInfo.location, org.phone || orgInfo.phone].filter(Boolean).join('  |  ')
    const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`
    const rows = printRows.map(r => `
      <tr>
        <td>${escapeHtml(r.name || '-')}</td>
        <td>${escapeHtml(r.phone || '-')}</td>
        <td style="text-align:right">${money(r.totalSales)}</td>
        <td style="text-align:right">${money(r.totalReceived)}</td>
        <td style="text-align:right;font-weight:bold">${money(r.outstanding)}</td>
        <td style="text-align:center">${escapeHtml(getStatusText(Number(r.outstanding || 0)))}</td>
      </tr>`).join('')
    const totalSales = printRows.reduce((s, r) => s + Number(r.totalSales || 0), 0)
    const totalReceived = printRows.reduce((s, r) => s + Number(r.totalReceived || 0), 0)
    const totalOut = printSummary?.totalOutstanding ?? printRows.reduce((s, r) => s + Math.max(0, Number(r.outstanding || 0)), 0)

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receivable Report</title>
      <style>
        @page{size:landscape;margin:8mm}
        body{font-family:Arial,sans-serif;margin:0;padding:12px;color:#111}
        h1,h2,p{text-align:center;margin:0}
        h1{font-size:22px;margin-bottom:2px}
        h2{font-size:16px;font-weight:normal;color:#444;margin:4px 0 10px}
        .meta{font-size:12px;color:#555;margin-top:2px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{border:1px solid #ddd;padding:6px;font-size:11px}
        th{background:#293e56;color:#fff}
        .totals td{font-weight:bold;background:#f3f4f6}
      </style></head><body>
      ${farmName ? `<h1>${escapeHtml(farmName)}</h1>` : ''}
      ${farmMeta ? `<p class="meta">${escapeHtml(farmMeta)}</p>` : ''}
      <h2>Receivable / Outstanding Report</h2>
      <table>
        <thead><tr><th>Retailer Name</th><th>Phone</th><th>Total Sales</th><th>Amount Received</th><th>Outstanding</th><th>Status</th></tr></thead>
        <tbody>
          ${rows}
          <tr class="totals">
            <td colspan="2">TOTAL</td>
            <td style="text-align:right">${money(totalSales)}</td>
            <td style="text-align:right">${money(totalReceived)}</td>
            <td style="text-align:right">${money(totalOut)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      </body></html>`

    const w = window.open('', '_blank')
    if (!w) { alert('Please allow popups to print the receivable report.'); return }
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  const getStatusColor = (outstanding: number) => {
    if (outstanding < 0) return 'bg-blue-100 text-blue-800'
    if (outstanding === 0) return 'bg-green-100 text-green-800'
    return 'bg-red-100 text-red-800'
  }

  const getStatusText = (outstanding: number) => {
    if (outstanding < 0) return 'Overpaid'
    if (outstanding === 0) return 'Cleared'
    return 'Outstanding'
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full min-w-0 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Outstanding Report</h1>
            <p className="text-muted-foreground mt-2">Pending balance per retailer from actual sales data</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV} type="button" className="rounded-full h-10"><Download className="w-4 h-4 mr-2" />Export</Button>
            <Button variant="outline" onClick={handlePrint} type="button" className="rounded-full h-10"><Printer className="w-4 h-4 mr-2" />Print</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Total Outstanding</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600"><CircleDollarSign size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-red-600 min-w-0 truncate">₹{totalOutstanding.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1.5 truncate">From {overdueCount} retailers</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Overpaid Amount</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><BadgeDollarSign size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-blue-600 min-w-0 truncate">₹{totalOverpaid.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Total Retailers</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><Users size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-green-600 min-w-0 truncate">{totalRetailersCount}</div>
            </CardContent>
          </Card>
        </div>

        {overdueCount > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>⚠️</strong> {overdueCount} retailers have outstanding balances.
            </AlertDescription>
          </Alert>
        )}

        <Card className="rounded-2xl p-4 no-print">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div className="md:w-[320px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Name or phone" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} className="h-10 rounded-full pl-9" /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="!h-10 rounded-full w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outstanding">Outstanding (Highest)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead className="font-semibold">Retailer Name</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="text-right font-semibold">Total Sales</TableHead>
                  <TableHead className="text-right font-semibold">Amount Received</TableHead>
                  <TableHead className="text-right font-semibold">Outstanding</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-slate-400">Loading...</TableCell></TableRow>
                ) : sorted.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-slate-400">No retailers found</TableCell></TableRow>
                ) : sorted.map(r => (
                  <TableRow key={r.id} className="border-b border-gray-200 dark:border-slate-700">
                    <TableCell className="font-semibold">
                      <Link href={`/billing/ledger/retailers?retailerId=${r.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">{r.name}</Link>
                    </TableCell>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell className="text-right">₹{r.totalSales.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">₹{r.totalReceived.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-bold text-red-600 dark:text-red-400">₹{r.outstanding.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(r.outstanding)}`}>
                        {getStatusText(r.outstanding)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && sorted.length > 0 && (
                  <TableRow className="bg-gray-100 dark:bg-slate-800 font-bold border-t-2 border-gray-300 dark:border-slate-600">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right">₹{data.reduce((s, r) => s + r.totalSales, 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">₹{data.reduce((s, r) => s + r.totalReceived, 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">₹{totalOutstanding.toLocaleString('en-IN')}</TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalItems > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 text-center sm:text-left">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium">{totalItems}</span> retailers
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="rounded-full h-9"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage * pageSize >= totalItems || loading}
                  className="rounded-full h-9"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default OutstandingReportPage
