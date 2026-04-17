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
import { Download, Printer, Search } from 'lucide-react'
import { purchasesApi } from '@/lib/api'

const PendingPurchasesPage = () => {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    purchasesApi.getAll()
      .then((data) => {
        // Only show pending or partial payment status
        const pending = data.filter(
          (p) => p.purchasePaymentStatus === 'pending' || p.purchasePaymentStatus === 'partial'
        )
        setPurchases(pending)
      })
      .catch((err) => console.error('Failed to load pending purchases:', err))
      .finally(() => setLoading(false))
  }, [])

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      (p.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.farmerMobile || '').includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || p.purchasePaymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalPendingPurchases: filteredPurchases.length,
    totalOutstandingAmount: filteredPurchases.reduce((sum, p) => sum + Number(p.balanceAmount || 0), 0),
    totalAdvancePaid: filteredPurchases.reduce((sum, p) => sum + Number(p.totalPaymentMade || 0), 0),
    pendingCount: filteredPurchases.filter((p) => p.purchasePaymentStatus === 'pending').length,
    partialCount: filteredPurchases.filter((p) => p.purchasePaymentStatus === 'partial').length,
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
            <Button variant="outline" onClick={() => window.print()} type="button">
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
            <p className="text-sm text-gray-600 font-medium">Fully Pending</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.pendingCount}</p>
          </Card>
          <Card className="border border-yellow-200 bg-yellow-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Partially Paid</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.partialCount}</p>
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
                      <TableCell>{new Date(purchase.orderDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{purchase.dueDate ? new Date(purchase.dueDate).toLocaleDateString('en-IN') : '—'}</TableCell>
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
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default PendingPurchasesPage
