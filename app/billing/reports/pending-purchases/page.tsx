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
import { Download, Printer, Search, ChevronLeft, ChevronRight } from 'lucide-react'
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
      case 'pending': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pending Purchases</h1>
            <p className="text-muted-foreground mt-2">View purchases with outstanding payments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} type="button">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" onClick={handlePrint} type="button">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by order number, supplier, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Pending</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalPendingPurchases}</p>
          </Card>
          <Card className="border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Outstanding Amount</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">₹{stats.totalOutstandingAmount.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Amount Paid</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">₹{stats.totalAdvancePaid.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-purple-200 bg-purple-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Weight</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalWeight.toLocaleString('en-IN')} kg</p>
          </Card>
          <Card className="border border-yellow-200 bg-yellow-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Volume</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">₹{summaryStats?.totalAmount?.toLocaleString('en-IN') || 0}</p>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No pending purchases found</div>
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
                      <TableCell className="text-right font-semibold text-red-600">
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
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-500">
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
