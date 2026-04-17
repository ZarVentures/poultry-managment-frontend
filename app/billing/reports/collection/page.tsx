'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Printer, Calendar, Banknote, CreditCard, Smartphone, CheckCircle } from 'lucide-react'
import { salesApi } from '@/lib/api'

const CollectionReportPage = () => {
  const [allSales, setAllSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [modeFilter, setModeFilter] = useState('all')

  useEffect(() => {
    salesApi.getAll()
      .then(data => setAllSales(data))
      .catch(err => console.error('Collection report error:', err))
      .finally(() => setLoading(false))
  }, [])

  // Build collection entries from sales payments
  const collectionEntries = allSales.flatMap(sale => {
    if (!sale.payments || sale.payments.length === 0) {
      // If no payment breakdown but amountReceived > 0, show as single entry
      if (Number(sale.amountReceived) > 0) {
        return [{
          id: `${sale.id}-direct`,
          saleId: sale.id,
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customerName,
          date: sale.saleDate,
          mode: 'Cash',
          amount: Number(sale.amountReceived),
          status: sale.paymentStatus === 'paid' ? 'Completed' : 'Partial',
        }]
      }
      return []
    }
    return sale.payments.map((p: any) => ({
      id: `${sale.id}-${p.id}`,
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      date: sale.saleDate,
      mode: p.paymentMode || 'Cash',
      amount: Number(p.amount),
      status: 'Completed',
    }))
  })

  const filtered = collectionEntries.filter(e => {
    const inRange = new Date(e.date) >= new Date(dateFrom) && new Date(e.date) <= new Date(dateTo)
    const matchesMode = modeFilter === 'all' || e.mode.toLowerCase() === modeFilter.toLowerCase()
    return inRange && matchesMode
  })

  const totalCollected = filtered.reduce((s, e) => s + e.amount, 0)

  const modeBreakdown = (mode: string) => filtered.filter(e => e.mode.toLowerCase() === mode.toLowerCase()).reduce((s, e) => s + e.amount, 0)

  const downloadCSV = () => {
    if (!filtered.length) { alert('No data to export.'); return }
    const headers = 'Date,Invoice,Customer,Mode,Amount,Status'
    const rows = filtered.map(e => `${e.date},${e.invoiceNumber},${e.customerName},${e.mode},${e.amount},${e.status}`).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `collection_${new Date().toISOString().split('T')[0]}.csv`
    a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collection Report</h1>
            <p className="text-muted-foreground mt-2">Payments received from sales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV} type="button"><Download className="w-4 h-4 mr-2" />Export</Button>
            <Button variant="outline" onClick={() => window.print()} type="button"><Printer className="w-4 h-4 mr-2" />Print</Button>
          </div>
        </div>

        <Card className="border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">From Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="pl-10" /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">To Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="pl-10" /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Mode</label>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger><SelectValue placeholder="All Modes" /></SelectTrigger>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-green-200 bg-green-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-2">₹{totalCollected.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-600 mt-2">{filtered.length} transactions</p>
          </Card>
          <Card className="border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-2"><div><p className="text-xs text-gray-600 font-medium">Cash</p><p className="text-xl font-bold text-gray-900 mt-1">₹{modeBreakdown('cash').toLocaleString('en-IN')}</p></div><Banknote className="w-5 h-5 text-green-600 opacity-30" /></div>
          </Card>
          <Card className="border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-2"><div><p className="text-xs text-gray-600 font-medium">Bank / UPI</p><p className="text-xl font-bold text-gray-900 mt-1">₹{(modeBreakdown('bank') + modeBreakdown('upi') + modeBreakdown('bank_transfer')).toLocaleString('en-IN')}</p></div><CreditCard className="w-5 h-5 text-blue-600 opacity-30" /></div>
          </Card>
          <Card className="border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-2"><div><p className="text-xs text-gray-600 font-medium">Cheque</p><p className="text-xl font-bold text-gray-900 mt-1">₹{modeBreakdown('cheque').toLocaleString('en-IN')}</p></div><CheckCircle className="w-5 h-5 text-amber-600 opacity-30" /></div>
          </Card>
        </div>

        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Invoice #</TableHead>
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
                    <TableCell className="font-medium">{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="font-mono text-sm">{e.invoiceNumber}</TableCell>
                    <TableCell className="font-semibold">{e.customerName}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getModeColor(e.mode)}`}>{e.mode}</span>
                    </TableCell>
                    <TableCell className="text-right font-bold">₹{e.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${e.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{e.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default CollectionReportPage
