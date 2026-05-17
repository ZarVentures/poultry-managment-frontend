'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Download, Printer, ArrowLeft, Calendar } from 'lucide-react'
import { salesApi, retailersApi, godownApi, billingApi } from '@/lib/api'

const RetailerLedgerContent = () => {
  const searchParams = useSearchParams()
  const [retailers, setRetailers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([])
  const [loadingRetailers, setLoadingRetailers] = useState(true)
  const [loadingLedger, setLoadingLedger] = useState(false)
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().split('T')[0] })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

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
    const selectedRetailer = retailers.find(r => r.id === selectedId)
    if (!selectedRetailer) return

    setLoadingLedger(true)
    // Fetch ledger entries from billing API using retailer name
    billingApi.getLedgerByName(selectedRetailer.name)
      .then(entries => {
        setLedgerEntries(entries || [])
      })
      .catch(err => {
        console.error('Ledger load error:', err)
        setLedgerEntries([])
      })
      .finally(() => setLoadingLedger(false))
  }, [selectedId, retailers])

  const selectedRetailer = retailers.find(r => r.id === selectedId)

  // Filter ledger entries by date range
  const fromDateObj = new Date(dateFrom); fromDateObj.setHours(0,0,0,0);
  const toDateObj = new Date(dateTo); toDateObj.setHours(23,59,59,999);

  const filteredEntries = ledgerEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0,0,0,0);
    return entryDate >= fromDateObj && entryDate <= toDateObj;
  });

  // Calculate opening balance (all entries before start date)
  const openingBalance = ledgerEntries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0,0,0,0);
      return entryDate < fromDateObj;
    })
    .reduce((acc, entry) => acc + Number(entry.debit || 0) - Number(entry.credit || 0), 0);

  // Calculate totals for the period
  const totalDebit = filteredEntries.reduce((s, e) => s + Number(e.debit || 0), 0)
  const totalCredit = filteredEntries.reduce((s, e) => s + Number(e.credit || 0), 0)
  
  // Closing balance is the last entry's balance, or opening balance if no entries
  const closingBalance = filteredEntries.length > 0 
    ? Number(filteredEntries[filteredEntries.length - 1].balance || 0)
    : openingBalance

  const downloadCSV = () => {
    if (!filteredEntries.length) { alert('No data to export.'); return }
    const headers = 'Date,Type,Reference,Debit,Credit,Balance'
    const rows = filteredEntries.map(e => `${e.date},${e.referenceType},${e.referenceId || ''},${e.debit},${e.credit},${e.balance}`).join('\n')
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
            <p className="text-gray-600 mt-2">Complete ledger including sales, payments, and vouchers</p>
          </div>
          <Link href="/billing" className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </div>

        <Card className="border border-gray-200 p-6 print:hidden">
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">From Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="pl-10" /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">To Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="pl-10" /></div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
          <Card className="p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Opening Balance</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">₹{openingBalance.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="p-4 border border-red-200 bg-red-50">
            <p className="text-sm font-medium text-red-800">Net Amount (₹)</p>
            <p className="text-2xl font-bold text-red-600 mt-2">₹{totalDebit.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="p-4 border border-green-200 bg-green-50">
            <p className="text-sm font-medium text-green-800">Total Payment Received (₹)</p>
            <p className="text-2xl font-bold text-green-600 mt-2">₹{totalCredit.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="p-4 border border-blue-200 bg-blue-50">
            <p className="text-sm font-medium text-blue-900">Closing Balance</p>
            <p className="text-2xl font-bold text-blue-700 mt-2">₹{closingBalance.toLocaleString('en-IN')}</p>
          </Card>
        </div>

        <div className="flex gap-3 print:hidden">
          <Button variant="outline" onClick={downloadCSV} type="button"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button variant="outline" onClick={() => window.print()} type="button"><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>

        <Card className="border border-gray-200 overflow-hidden print:overflow-visible print:border-none print:shadow-none">
          <div className="overflow-x-auto print:overflow-visible">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Debit (₹)</TableHead>
                  <TableHead className="text-right">Credit (₹)</TableHead>
                  <TableHead className="text-right">Balance (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLedger ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                ) : (
                  <>
                    <TableRow className="bg-gray-100 font-medium">
                      <TableCell colSpan={6} className="text-right">Opening Balance</TableCell>
                      <TableCell className="text-right font-bold">₹{openingBalance.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    {filteredEntries.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No transactions found in this date range</TableCell></TableRow>
                    ) : filteredEntries.map((e, idx) => {
                      const typeLabel = e.referenceType || 'Unknown';
                      const typeColor = 
                        typeLabel === 'Sale' ? 'bg-orange-100 text-orange-800' :
                        typeLabel === 'Payment' ? 'bg-green-100 text-green-800' :
                        typeLabel === 'Voucher' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800';
                      
                      return (
                        <TableRow key={idx} className={`border-b border-gray-200 ${typeLabel === 'Payment' ? 'bg-green-50' : typeLabel === 'Voucher' ? 'bg-purple-50' : ''}`}>
                          <TableCell>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${typeColor}`}>{typeLabel}</span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{e.referenceId || '-'}</TableCell>
                          <TableCell className="text-gray-600 text-sm max-w-[150px] truncate">-</TableCell>
                          <TableCell className="text-right text-red-600">{Number(e.debit) > 0 ? `₹${Number(e.debit).toLocaleString('en-IN')}` : '–'}</TableCell>
                          <TableCell className="text-right text-green-600">{Number(e.credit) > 0 ? `₹${Number(e.credit).toLocaleString('en-IN')}` : '–'}</TableCell>
                          <TableCell className="text-right font-bold">₹{Number(e.balance).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-50 border-t border-gray-300 font-bold">
                      <TableCell colSpan={4} className="text-right">TOTAL FOR PERIOD</TableCell>
                      <TableCell className="text-right text-red-600">₹{totalDebit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600">₹{totalCredit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-bold text-blue-900">
                      <TableCell colSpan={6} className="text-right">Closing Balance</TableCell>
                      <TableCell className="text-right">₹{closingBalance.toLocaleString('en-IN')}</TableCell>
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
