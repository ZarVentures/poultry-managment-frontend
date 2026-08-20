'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Download, Printer, ChevronLeft, ChevronRight, Calendar, Search, CircleDollarSign, BadgeDollarSign, Users } from 'lucide-react'
import { reportsApi, retailersApi } from '@/lib/api'
import { Input } from '@/components/ui/input'

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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [retailerId, setRetailerId] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [retailers, setRetailers] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    retailersApi.getActive().then((res) => setRetailers(Array.isArray(res) ? res : [])).catch(() => {})
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await reportsApi.getOutstandingReport({
        page: currentPage,
        limit: pageSize,
        sortBy,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        retailerId: retailerId !== 'all' ? retailerId : undefined,
        paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
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
    fetchData()
  }, [currentPage, sortBy, dateFrom, dateTo, retailerId, paymentStatus, search])

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
            <Button variant="outline" onClick={() => window.print()} type="button" className="rounded-full h-10"><Printer className="w-4 h-4 mr-2" />Print</Button>
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
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Users size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
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
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1) }} className="h-10 rounded-full pl-10 w-full sm:w-[160px]" /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setCurrentPage(1) }} className="h-10 rounded-full pl-10 w-full sm:w-[160px]" /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Retailer</label>
              <Select value={retailerId} onValueChange={v => { setRetailerId(v); setCurrentPage(1) }}>
                <SelectTrigger className="!h-10 rounded-full w-full sm:w-[160px]"><SelectValue placeholder="All Retailers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Retailers</SelectItem>
                  {retailers.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Status</label>
              <Select value={paymentStatus} onValueChange={v => { setPaymentStatus(v); setCurrentPage(1) }}>
                <SelectTrigger className="!h-10 rounded-full w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="outstanding">Outstanding</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="overpaid">Overpaid</SelectItem>
                </SelectContent>
              </Select>
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

        <Card className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
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
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                ) : sorted.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No retailers found</TableCell></TableRow>
                ) : sorted.map(r => (
                  <TableRow key={r.id} className="border-b border-gray-200">
                    <TableCell className="font-semibold">
                      <Link href={`/billing/ledger/retailers?retailerId=${r.id}`} className="text-blue-600 hover:underline">{r.name}</Link>
                    </TableCell>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell className="text-right">₹{r.totalSales.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-green-600">₹{r.totalReceived.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">₹{r.outstanding.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(r.outstanding)}`}>
                        {getStatusText(r.outstanding)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && sorted.length > 0 && (
                  <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right">₹{data.reduce((s, r) => s + r.totalSales, 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-green-600">₹{data.reduce((s, r) => s + r.totalReceived, 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-red-600">₹{totalOutstanding.toLocaleString('en-IN')}</TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalItems > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
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
