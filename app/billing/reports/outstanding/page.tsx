'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Download, Printer } from 'lucide-react'
import { salesApi, retailersApi } from '@/lib/api'

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

  useEffect(() => {
    Promise.all([retailersApi.getAll(), salesApi.getAll()])
      .then(([retailers, sales]) => {
        const result: RetailerOutstanding[] = retailers.map(r => {
          const retailerSales = sales.filter(s => s.retailerId === r.id)
          const totalSales = retailerSales.reduce((s, x) => s + Number(x.netAmount || x.totalAmount || 0), 0)
          const totalReceived = retailerSales.reduce((s, x) => s + Number(x.amountReceived || 0), 0)
          return {
            id: r.id,
            name: r.name,
            phone: r.phone || '',
            totalSales,
            totalReceived,
            outstanding: totalSales - totalReceived,
            salesCount: retailerSales.length,
          }
        })
        setData(result)
      })
      .catch(err => console.error('Outstanding report error:', err))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'outstanding') return b.outstanding - a.outstanding
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  const totalOutstanding = data.reduce((s, r) => s + Math.max(0, r.outstanding), 0)
  const totalOverpaid = data.reduce((s, r) => s + Math.max(0, -r.outstanding), 0)
  const overdueCount = data.filter(r => r.outstanding > 0).length

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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Outstanding Report</h1>
            <p className="text-muted-foreground mt-2">Pending balance per retailer from actual sales data</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV} type="button"><Download className="w-4 h-4 mr-2" />Export</Button>
            <Button variant="outline" onClick={() => window.print()} type="button"><Printer className="w-4 h-4 mr-2" />Print</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Outstanding</p>
            <p className="text-3xl font-bold text-red-600 mt-2">₹{totalOutstanding.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-600 mt-2">From {overdueCount} retailers</p>
          </Card>
          <Card className="border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Overpaid Amount</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">₹{totalOverpaid.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-green-200 bg-green-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Retailers</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{data.length}</p>
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

        <Card className="border border-gray-200 p-4">
          <div className="max-w-xs">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="outstanding">Outstanding (Highest)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="border border-gray-200 overflow-hidden">
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
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default OutstandingReportPage
