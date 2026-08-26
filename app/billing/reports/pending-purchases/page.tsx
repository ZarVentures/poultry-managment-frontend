'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Printer, Search, ChevronLeft, ChevronRight, AlertCircle, CircleDollarSign, CheckCircle, Scale, Package } from 'lucide-react'
import { purchasesApi } from '@/lib/api'

const PendingPurchasesPage = () => {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize] = useState(20)
  const [summaryStats, setSummaryStats] = useState<any>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await purchasesApi.getAll({
        supplier: searchQuery,
        status: statusFilter === 'all' ? 'pending_or_partial' : statusFilter,
        page: currentPage,
        limit: pageSize
      })

      if (res && res.data) {
        setPurchases(res.data)
        setTotalItems(res.total)
        setSummaryStats(res.summary)
      } else {
        setPurchases([])
        setTotalItems(0)
        setSummaryStats(null)
      }
    } catch (err) {
      console.error('Failed to load pending purchases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchQuery, statusFilter, currentPage])

  const filteredPurchases = purchases

  const stats = {
    totalPendingPurchases: totalItems,
    totalOutstandingAmount: summaryStats?.totalBalance || 0,
    totalAdvancePaid: summaryStats?.totalPaid || 0,
    totalWeight: summaryStats?.totalWeight || 0,
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300'
      case 'partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-slate-500/15 dark:text-slate-300'
    }
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    ).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    if (!filteredPurchases.length) { alert('No data to export.'); return }
    downloadCSV(filteredPurchases.map(p => ({
      Order_Number: p.orderNumber,
      Supplier: p.supplierName,
      Order_Date: p.orderDate,
      Total_Amount: p.totalAmount,
      Payment_Made: p.totalPaymentMade || 0,
      Balance_Amount: p.balanceAmount || 0,
      Status: p.purchasePaymentStatus,
    })), 'pending_purchases_report')
  }

  const handlePrint = () => {
    if (!filteredPurchases.length) { alert('No data to print.'); return }
    const rows = filteredPurchases.map(p => `
      <tr>
        <td>${p.orderNumber || '-'}</td>
        <td>${p.supplierName || '-'}</td>
        <td>${p.orderDate ? new Date(p.orderDate).toLocaleDateString('en-GB') : '-'}</td>
        <td>${p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:right">₹${Number(p.totalAmount || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:right">₹${Number(p.totalPaymentMade || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:right">₹${Number(p.balanceAmount || 0).toLocaleString('en-IN')}</td>
        <td>${p.purchasePaymentStatus || '-'}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html><html><head><title>Pending Purchases</title>
      <style>@page{size:landscape;margin:8mm}body{font-family:Arial,sans-serif;padding:10px}
      h2{text-align:center}table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ddd;padding:6px;font-size:11px}th{background:#293e56;color:#fff}</style></head><body>
      <h2>Pending Purchases Report</h2>
      <table><thead><tr><th>Order #</th><th>Supplier</th><th>Order Date</th><th>Due Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print() }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pending Purchases</h1>
            <p className="text-muted-foreground mt-2">View purchases with outstanding payments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} type="button" className="rounded-full h-10">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" onClick={handlePrint} type="button" className="rounded-full h-10">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl p-4 print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div className="md:w-[320px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by order number or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-full pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="!h-10 rounded-full w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Total Pending</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"><AlertCircle size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-red-600 dark:text-red-400 min-w-0 truncate">{stats.totalPendingPurchases}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Outstanding Amount</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"><CircleDollarSign size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400 min-w-0 truncate">₹{stats.totalOutstandingAmount.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Amount Paid</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><CheckCircle size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 min-w-0 truncate">₹{stats.totalAdvancePaid.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Total Weight</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"><Scale size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400 min-w-0 truncate">{stats.totalWeight.toLocaleString('en-IN')} kg</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Total Volume</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><Package size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400 min-w-0 truncate">₹{summaryStats?.totalAmount?.toLocaleString('en-IN') || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <CardHeader>
            <CardTitle>Pending Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">Loading...</div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">No pending purchases found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.orderNumber}</TableCell>
                      <TableCell>{purchase.supplierName}</TableCell>
                      <TableCell>{new Date(purchase.orderDate).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{purchase.dueDate ? new Date(purchase.dueDate).toLocaleDateString('en-GB') : '—'}</TableCell>
                      <TableCell className="text-right">₹{Number(purchase.totalAmount).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{Number(purchase.totalPaymentMade || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                        ₹{Number(purchase.balanceAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.purchasePaymentStatus)}`}>
                          {purchase.purchasePaymentStatus}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {totalItems > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
              <div className="text-sm text-gray-500 dark:text-slate-400">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium">{totalItems}</span> orders
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
    </DashboardLayout>
  )
}

export default PendingPurchasesPage
