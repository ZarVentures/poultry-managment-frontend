'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Printer, ArrowLeft } from 'lucide-react'
import { purchasesApi, farmersApi } from '@/lib/api'

const FarmLedgerPage = () => {
  const [farmers, setFarmers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [purchases, setPurchases] = useState<any[]>([])
  const [loadingFarmers, setLoadingFarmers] = useState(true)
  const [loadingPurchases, setLoadingPurchases] = useState(false)

  useEffect(() => {
    Promise.all([farmersApi.getAll(), purchasesApi.getAll()])
      .then(([farmerList, allPurchases]) => {
        // Only show farmers that have purchase orders
        const farmerIdsWithPO = new Set(allPurchases.map((p: any) => p.farmerId).filter(Boolean))
        const activeFarmers = farmerList.filter(f => farmerIdsWithPO.has(f.id))
        const list = activeFarmers.length > 0 ? activeFarmers : farmerList
        setFarmers(list)
        if (list.length > 0) setSelectedId(list[0].id)
        setPurchases(allPurchases)
      })
      .catch(err => console.error('Farm ledger error:', err))
      .finally(() => setLoadingFarmers(false))
  }, [])

  const selectedFarmer = farmers.find(f => f.id === selectedId)
  const farmerPurchases = purchases.filter(p => p.farmerId === selectedId)
    .sort((a: any, b: any) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime())

  // Build ledger entries
  const ledgerEntries: any[] = []
  let runningBalance = 0

  for (const po of farmerPurchases) {
    const amt = Number(po.netAmount || po.totalAmount || 0)
    runningBalance += amt
    ledgerEntries.push({
      date: po.orderDate,
      type: 'Purchase',
      reference: po.orderNumber,
      debit: amt,
      credit: 0,
      balance: runningBalance,
    })
    const paid = Number(po.totalPaymentMade || 0)
    if (paid > 0) {
      runningBalance -= paid
      ledgerEntries.push({
        date: po.orderDate,
        type: 'Payment Made',
        reference: `PAY-${po.orderNumber}`,
        debit: 0,
        credit: paid,
        balance: runningBalance,
      })
    }
  }

  const totalDebit = ledgerEntries.reduce((s, e) => s + e.debit, 0)
  const totalCredit = ledgerEntries.reduce((s, e) => s + e.credit, 0)

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
          <Link href="/billing" className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </div>

        <Card className="border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Farmer</label>
              {loadingFarmers ? <p className="text-sm text-gray-500">Loading...</p> : farmers.length === 0 ? (
                <p className="text-sm text-gray-500">No farmers with purchase orders found</p>
              ) : (
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {farmers.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Outstanding Balance</p>
              <p className={`text-2xl font-bold mt-2 ${runningBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{runningBalance.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Purchases</p>
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
                {loadingFarmers ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                ) : ledgerEntries.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No purchase orders found for this farmer</TableCell></TableRow>
                ) : (
                  <>
                    {ledgerEntries.map((e, idx) => (
                      <TableRow key={idx} className={`border-b border-gray-200 ${e.type === 'Payment Made' ? 'bg-green-50' : ''}`}>
                        <TableCell>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${e.type === 'Purchase' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{e.type}</span>
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
                      <TableCell className="text-right">₹{runningBalance.toLocaleString('en-IN')}</TableCell>
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
