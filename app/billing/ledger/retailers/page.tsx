'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Printer, ArrowLeft } from 'lucide-react'
import { salesApi, retailersApi } from '@/lib/api'

const RetailerLedgerContent = () => {
  const searchParams = useSearchParams()
  const [retailers, setRetailers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [sales, setSales] = useState<any[]>([])
  const [loadingRetailers, setLoadingRetailers] = useState(true)
  const [loadingSales, setLoadingSales] = useState(false)

  useEffect(() => {
    retailersApi.getAll()
      .then(data => {
        setRetailers(data)
        const fromQuery = searchParams.get('retailerId')
        const first = fromQuery || (data.length > 0 ? data[0].id : '')
        setSelectedId(first)
      })
      .catch(err => console.error('Retailers load error:', err))
      .finally(() => setLoadingRetailers(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoadingSales(true)
    salesApi.getAll()
      .then(data => setSales(data.filter(s => s.retailerId === selectedId)))
      .catch(err => console.error('Sales load error:', err))
      .finally(() => setLoadingSales(false))
  }, [selectedId])

  const selectedRetailer = retailers.find(r => r.id === selectedId)

  const ledgerEntries: any[] = []
  let runningBalance = 0
  const sortedSales = [...sales].sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime())

  for (const sale of sortedSales) {
    const saleAmt = Number(sale.netAmount || sale.totalAmount || 0)
    runningBalance += saleAmt
    ledgerEntries.push({ date: sale.saleDate, type: 'Sale', reference: sale.invoiceNumber, debit: saleAmt, credit: 0, balance: runningBalance })
    const received = Number(sale.amountReceived || 0)
    if (received > 0) {
      runningBalance -= received
      ledgerEntries.push({ date: sale.saleDate, type: 'Payment', reference: `PMT-${sale.invoiceNumber}`, debit: 0, credit: received, balance: runningBalance })
    }
  }

  const totalDebit = ledgerEntries.reduce((s, e) => s + e.debit, 0)
  const totalCredit = ledgerEntries.reduce((s, e) => s + e.credit, 0)
  const currentBalance = runningBalance

  const downloadCSV = () => {
    if (!ledgerEntries.length) { alert('No data to export.'); return }
    const headers = 'Date,Type,Reference,Debit,Credit,Balance'
    const rows = ledgerEntries.map(e => `${e.date},${e.type},${e.reference},${e.debit},${e.credit},${e.balance}`).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `retailer_ledger_${selectedRetailer?.name || selectedId}_${new Date().toISOString().split('T')[0]}.csv`
    a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Retailer Ledger</h1>
            <p className="text-gray-600 mt-2">Sales and payment ledger per retailer</p>
          </div>
          <Link href="/billing" className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </div>

        <Card className="border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Retailer</label>
              {loadingRetailers ? <p className="text-sm text-gray-500">Loading...</p> : (
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {retailers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Outstanding Balance</p>
              <p className={`text-2xl font-bold mt-2 ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{currentBalance.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹{totalDebit.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadCSV} type="button"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button variant="outline" onClick={() => window.print()} type="button"><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>

        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Debit (₹)</TableHead>
                  <TableHead className="text-right">Credit (₹)</TableHead>
                  <TableHead className="text-right">Balance (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSales ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                ) : ledgerEntries.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No transactions found for this retailer</TableCell></TableRow>
                ) : (
                  <>
                    {ledgerEntries.map((e, idx) => (
                      <TableRow key={idx} className={`border-b border-gray-200 ${e.type === 'Payment' ? 'bg-green-50' : ''}`}>
                        <TableCell>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${e.type === 'Sale' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>{e.type}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{e.reference}</TableCell>
                        <TableCell className="text-right text-red-600">{e.debit > 0 ? `₹${e.debit.toLocaleString('en-IN')}` : '–'}</TableCell>
                        <TableCell className="text-right text-green-600">{e.credit > 0 ? `₹${e.credit.toLocaleString('en-IN')}` : '–'}</TableCell>
                        <TableCell className="text-right font-bold">₹{e.balance.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                      <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
                      <TableCell className="text-right text-red-600">₹{totalDebit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600">₹{totalCredit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{currentBalance.toLocaleString('en-IN')}</TableCell>
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

export default function RetailerLedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <RetailerLedgerContent />
    </Suspense>
  )
}
