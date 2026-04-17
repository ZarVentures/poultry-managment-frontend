'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Printer, Calendar } from 'lucide-react'
import { salesApi } from '@/lib/api'

const DailyDispatchReportPage = () => {
  const [allSales, setAllSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    salesApi.getAll()
      .then(data => setAllSales(data))
      .catch(err => console.error('Dispatch report error:', err))
      .finally(() => setLoading(false))
  }, [])

  // sales use saleDate field
  const filteredData = allSales.filter(s => {
    const d = s.saleDate || s.createdAt || ''
    return d.startsWith(dateFilter)
  })

  const totals = filteredData.reduce(
    (acc, s) => ({
      quantity: acc.quantity + Number(s.quantity || 0),
      gross: acc.gross + Number(s.grossAmount || s.totalAmount || 0),
      net: acc.net + Number(s.netAmount || s.totalAmount || 0),
    }),
    { quantity: 0, gross: 0, net: 0 }
  )

  const downloadCSV = () => {
    if (!filteredData.length) { alert('No data to export.'); return }
    const headers = 'Invoice,Customer,Quantity,Unit,Rate,Gross Amount,Net Amount,Payment Status'
    const rows = filteredData.map(s =>
      `${s.invoiceNumber},${s.customerName},${s.quantity},${s.unit || 'kg'},${s.unitPrice},${s.grossAmount || s.totalAmount},${s.netAmount || s.totalAmount},${s.paymentStatus}`
    ).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dispatch_${dateFilter}.csv`
    a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = { paid: 'bg-green-100 text-green-800', pending: 'bg-red-100 text-red-800', partial: 'bg-yellow-100 text-yellow-800' }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Dispatch Report</h1>
            <p className="text-muted-foreground mt-2">Sales dispatched on the selected date</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV} type="button"><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline" onClick={() => window.print()} type="button"><Printer className="h-4 w-4 mr-2" />Print</Button>
          </div>
        </div>

        <Card className="border border-gray-200 p-6">
          <div className="max-w-xs">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="pl-10" />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Dispatches</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredData.length}</p>
          </Card>
          <Card className="border border-green-200 bg-green-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Quantity</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{Number(totals.quantity).toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Gross Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">₹{totals.gross.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-purple-200 bg-purple-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Net Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">₹{totals.net.toLocaleString('en-IN')}</p>
          </Card>
        </div>

        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Invoice #</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Mode</TableHead>
                  <TableHead className="text-right font-semibold">Qty</TableHead>
                  <TableHead className="text-right font-semibold">Rate</TableHead>
                  <TableHead className="text-right font-semibold">Gross</TableHead>
                  <TableHead className="text-right font-semibold">Net Amount</TableHead>
                  <TableHead className="text-right font-semibold">Received</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">No dispatches on {new Date(dateFilter + 'T00:00:00').toLocaleDateString('en-IN')}</TableCell></TableRow>
                ) : (
                  <>
                    {filteredData.map(s => (
                      <TableRow key={s.id} className="border-b border-gray-200">
                        <TableCell className="font-mono text-sm">{s.invoiceNumber}</TableCell>
                        <TableCell className="font-semibold">{s.customerName}</TableCell>
                        <TableCell className="text-sm text-gray-600">{s.saleMode === 'from_godown' ? 'Godown' : 'Vehicle'}</TableCell>
                        <TableCell className="text-right">{Number(s.quantity).toLocaleString('en-IN')} {s.unit || 'kg'}</TableCell>
                        <TableCell className="text-right">₹{Number(s.unitPrice).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">₹{Number(s.grossAmount || s.totalAmount).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-bold">₹{Number(s.netAmount || s.totalAmount).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-green-600">₹{Number(s.amountReceived || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getPaymentBadge(s.paymentStatus)}`}>
                            {s.paymentStatus}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                      <TableCell colSpan={3}>TOTAL</TableCell>
                      <TableCell className="text-right">{Number(totals.quantity).toLocaleString('en-IN')}</TableCell>
                      <TableCell />
                      <TableCell className="text-right">₹{totals.gross.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{totals.net.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600">
                        ₹{filteredData.reduce((s, x) => s + Number(x.amountReceived || 0), 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default DailyDispatchReportPage
