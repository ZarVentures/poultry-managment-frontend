'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Download, Printer, ArrowLeft, Calendar } from 'lucide-react'
import { purchasesApi, farmersApi } from '@/lib/api'

const FarmLedgerPage = () => {
  const [farmers, setFarmers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [purchases, setPurchases] = useState<any[]>([])
  const [loadingFarmers, setLoadingFarmers] = useState(true)
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().split('T')[0] })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
  Promise.all([farmersApi.getAll(), purchasesApi.getAll()])
    .then(([farmerList, allPurchases]: any) => {

      // ✅ safe data extraction
      const safeFarmers = Array.isArray(farmerList)
        ? farmerList
        : farmerList?.data || []

      const safePurchases = Array.isArray(allPurchases)
        ? allPurchases
        : allPurchases?.data || []

      // ✅ active farmers filter
      const farmerIdsWithPO = new Set(
        safePurchases.map((p: any) => p.farmerId).filter(Boolean)
      )

      const farmerNamesWithPO = new Set(
        safePurchases.map((p: any) => (p.supplierName || '').toLowerCase().trim())
      )

      const activeFarmers = safeFarmers.filter((f: any) =>
        farmerIdsWithPO.has(f.id) ||
        farmerNamesWithPO.has((f.name || '').toLowerCase().trim())
      )

      const list = activeFarmers.length > 0 ? activeFarmers : safeFarmers

      setFarmers(list)

      if (list.length > 0) {
        setSelectedId(String(list[0].id)) // 🔥 string fix
      }

      setPurchases(safePurchases)
    })
    .catch(err => console.error('Farm ledger error:', err))
    .finally(() => setLoadingFarmers(false))
}, [])

  const selectedFarmer = farmers.find(f => f.id === selectedId)
  const farmerPurchases = purchases.filter(p =>
    p.farmerId === selectedId ||
    (selectedFarmer && (p.supplierName || '').toLowerCase().trim() === (selectedFarmer.name || '').toLowerCase().trim())
  )
    .sort((a: any, b: any) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime())

  // Build ledger entries
  const ledgerEntries: any[] = [];
  let openingBalance = Number(selectedFarmer?.openingBalance || 0);
  let runningBalance = Number(selectedFarmer?.openingBalance || 0);
  const fromDateObj = new Date(dateFrom); fromDateObj.setHours(0,0,0,0);
  const toDateObj = new Date(dateTo); toDateObj.setHours(23,59,59,999);

  for (const po of farmerPurchases) {
    const poDateObj = new Date(po.orderDate);
    poDateObj.setHours(0,0,0,0);
    const amt = Number(po.netAmount || po.totalAmount || 0);
    const paid = Number(po.totalPaymentMade || 0);

    if (poDateObj < fromDateObj) {
      openingBalance += (amt - paid);
      runningBalance += (amt - paid);
    } else if (poDateObj >= fromDateObj && poDateObj <= toDateObj) {
      // Purchase row
      if (amt > 0) {
        runningBalance += amt;
        ledgerEntries.push({
          date: po.orderDate,
          type: 'Purchase',
          reference: po.orderNumber,
          debit: amt,
          credit: 0,
          balance: runningBalance,
          remarks: po.notes || po.remarks || ''
        });
      }
      // Payment row
      if (paid > 0) {
        runningBalance -= paid;
        ledgerEntries.push({
          date: po.orderDate,
          type: 'Payment Made',
          reference: po.orderNumber,
          debit: 0,
          credit: paid,
          balance: runningBalance,
          remarks: po.notes || po.remarks || ''
        });
      }
    }
  }

  const totalDebit = ledgerEntries.reduce((s, e) => s + e.debit, 0)
  const totalCredit = ledgerEntries.reduce((s, e) => s + e.credit, 0)
  const closingBalance = runningBalance

  const downloadCSV = () => {
    if (!ledgerEntries.length) { alert('No data to export.'); return }
    const headers = 'Date,Type,Reference,Debit,Credit,Balance'
    const rows = ledgerEntries.map(e => `${e.date},${e.type},${e.reference},${e.debit},${e.credit},${e.balance}`).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `farm_ledger_${selectedFarmer?.name || selectedId}_${new Date().toISOString().split('T')[0]}.csv`
    a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farm Ledger</h1>
            <p className="text-gray-600 mt-2">Purchase and payment ledger per farmer</p>
          </div>
          <Link href="/billing" className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </div>

        <Card className="border border-gray-200 p-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Farmer</label>
              {loadingFarmers ? <p className="text-sm text-gray-500">Loading...</p> : farmers.length === 0 ? (
                <p className="text-sm text-gray-500">No farmers with purchase orders found</p>
              ) : (
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {farmers.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
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
                {loadingFarmers ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                ) : (
                  <>
                    <TableRow className="bg-gray-100 font-medium">
                      <TableCell colSpan={6} className="text-right">Opening Balance </TableCell>
                      <TableCell className="text-right font-bold">₹{openingBalance.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    {ledgerEntries.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No purchase orders found in this date range</TableCell></TableRow>
                    ) : ledgerEntries.map((e, idx) => (
                      <TableRow key={idx} className={`border-b border-gray-200 ${e.type === 'Payment Made' ? 'bg-green-50' : ''}`}>
                        <TableCell>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${e.type === 'Purchase' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{e.type}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{e.reference}</TableCell>
                        <TableCell className="text-gray-600 text-sm max-w-[150px] truncate" title={e.remarks}>{e.remarks || '-'}</TableCell>
                        <TableCell className="text-right text-red-600">{e.debit > 0 ? `₹${e.debit.toLocaleString('en-IN')}` : '–'}</TableCell>
                        <TableCell className="text-right text-green-600">{e.credit > 0 ? `₹${e.credit.toLocaleString('en-IN')}` : '–'}</TableCell>
                        <TableCell className="text-right font-bold">₹{e.balance.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 border-t border-gray-300 font-bold">
                      <TableCell colSpan={4} className="text-right">TOTAL FOR PERIOD</TableCell>
                      <TableCell className="text-right text-red-600">₹{totalDebit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600">₹{totalCredit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-bold text-blue-900">
                      <TableCell colSpan={6} className="text-right">Closing Balance </TableCell>
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

export default FarmLedgerPage
