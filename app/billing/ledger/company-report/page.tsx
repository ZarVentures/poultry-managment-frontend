'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Printer, TrendingUp, TrendingDown, Calendar, Building2 } from 'lucide-react'
import { salesApi, retailersApi, purchasesApi, expensesApi, mortalityApi } from '@/lib/api'

interface LedgerEntry {
  date: string
  type: string
  party: string
  reference: string
  debit: number
  credit: number
  category: 'sale' | 'purchase' | 'expense' | 'mortality' | 'payment'
  count?: number
  remarks?: string
}

const CompanyLedgerReportPage = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().split('T')[0] })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    Promise.all([salesApi.getAll(), retailersApi.getAll(), purchasesApi.getAll(), expensesApi.getAll(), mortalityApi.getAll()])
      .then(([sales, retailers, purchases, expenses, mortalities]) => {
        const retailerMap: Record<string, string> = {}
        retailers.forEach(r => { retailerMap[r.id] = r.name })

        const all: LedgerEntry[] = []

        // Sales as debit entries
        for (const sale of (Array.isArray(sales) ? sales : [])) {
          const partyName = sale.retailerId ? (retailerMap[sale.retailerId] || sale.customerName) : sale.customerName
          const saleAmt = Number(sale.netAmount || sale.totalAmount || 0)
          const received = Number(sale.amountReceived || 0)
          
          if (saleAmt > 0 || received > 0) {
            all.push({
              date: sale.saleDate,
              type: saleAmt > 0 ? 'Sale' : 'Payment Received',
              party: partyName,
              reference: sale.invoiceNumber,
              debit: saleAmt,
              credit: received,
              category: 'sale',
              remarks: sale.notes || (sale as any).remarks || ''
            })
          }
        }

        // Purchases as credit entries (money going out)
        for (const po of (Array.isArray(purchases) ? purchases : [])) {
          const poAmt = Number(po.netAmount || po.totalAmount || 0)
          const paid = Number(po.totalPaymentMade || 0)

          if (poAmt > 0 || paid > 0) {
            all.push({
              date: po.orderDate,
              type: poAmt > 0 ? 'Purchase' : 'Purchase Payment',
              party: po.supplierName,
              reference: po.orderNumber,
              debit: paid,
              credit: poAmt,
              category: 'purchase',
              remarks: po.notes || (po as any).remarks || ''
            })
          }
        }

        // Expenses
        for (const exp of (Array.isArray(expenses) ? expenses : [])) {
          all.push({
            date: exp.expenseDate,
            type: 'Expense',
            party: exp.category,
            reference: exp.description || 'Expense',
            debit: 0,
            credit: Number(exp.amount || 0),
            category: 'expense',
            remarks: exp.notes || (exp as any).remarks || ''
          })
        }

        // Mortality
        for (const m of (Array.isArray(mortalities) ? mortalities : [])) {
          const mDate = (m as any).mortalityDate || m.purchaseDate || m.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
          all.push({
            date: mDate,
            type: 'Mortality',
            party: m.farmerName || 'Farm',
            reference: `Died: ${m.numberOfBirdsDied} birds`,
            debit: 0,
            credit: 0,
            category: 'mortality',
            count: Number(m.numberOfBirdsDied || 0),
            remarks: m.notes || (m as any).remarks || ''
          })
        }

        all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setEntries(all)
      })
      .catch(err => console.error('Company ledger error:', err))
      .finally(() => setLoading(false))
  }, [])

  let runningBalance = 0;
  const filtered = entries.map(e => {
    runningBalance += (e.debit - e.credit);
    return { ...e, balance: runningBalance };
  }).filter(e => {
    const d = new Date(e.date)
    return d >= new Date(dateFrom) && d <= new Date(dateTo)
  })

  const totals = filtered.reduce((acc, e) => ({ debit: acc.debit + e.debit, credit: acc.credit + e.credit }), { debit: 0, credit: 0 })
  
  const stats = {
    totalSales: filtered.filter(e => e.category === 'sale').reduce((sum, e) => sum + e.debit, 0),
    totalPurchase: filtered.filter(e => e.category === 'purchase').reduce((sum, e) => sum + e.credit, 0),
    totalExpense: filtered.filter(e => e.category === 'expense').reduce((sum, e) => sum + e.credit, 0),
    totalMortality: filtered.filter(e => e.category === 'mortality').reduce((sum, e) => sum + (e.count || 0), 0)
  }

  const getTypeColor = (type: string) => {
    if (type === 'Sale') return 'border-l-4 border-l-orange-400 bg-orange-50'
    if (type === 'Payment Received') return 'border-l-4 border-l-green-500 bg-green-50'
    if (type === 'Purchase') return 'border-l-4 border-l-red-400 bg-red-50'
    if (type === 'Purchase Payment') return 'border-l-4 border-l-blue-400 bg-blue-50'
    if (type === 'Expense') return 'border-l-4 border-l-purple-400 bg-purple-50'
    if (type === 'Mortality') return 'border-l-4 border-l-gray-400 bg-gray-50'
    return ''
  }

  const downloadCSV = () => {
    if (!filtered.length) { alert('No data to export.'); return }
    const headers = 'Date,Type,Party,Reference,Debit,Credit'
    const rows = filtered.map(e => `${e.date},${e.type},${e.party},${e.reference},${e.debit},${e.credit}`).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `company_ledger_${new Date().toISOString().split('T')[0]}.csv`
    a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Company Ledger Report</h1>
          </div>
          <p className="text-gray-600 mt-2">All sales, purchases, and payments across the company</p>
        </div>

        <Card className="border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 print:hidden">
          <Card className="border border-orange-200 bg-orange-50 p-6">
            <TrendingUp className="w-5 h-5 text-orange-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium"> Total Money Out</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">₹{totals.debit.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-green-200 bg-green-50 p-6">
            <TrendingDown className="w-5 h-5 text-green-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Money In</p>
            <p className="text-2xl font-bold text-green-600 mt-2">₹{totals.credit.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-gray-300 bg-gray-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Net Outstanding</p>
            <p className={`text-2xl font-bold mt-2 ${(totals.debit - totals.credit) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{(totals.debit - totals.credit).toLocaleString('en-IN')}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
          <Card className="border border-orange-200 bg-orange-50 p-6">
            <TrendingUp className="w-5 h-5 text-orange-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Sales</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">₹{stats.totalSales.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-red-200 bg-red-50 p-6">
            <TrendingDown className="w-5 h-5 text-red-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Purchase</p>
            <p className="text-2xl font-bold text-red-600 mt-2">₹{stats.totalPurchase.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-purple-200 bg-purple-50 p-6">
            <TrendingDown className="w-5 h-5 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Expense</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">₹{stats.totalExpense.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-gray-300 bg-gray-50 p-6">
            <TrendingDown className="w-5 h-5 text-gray-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Mortality</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalMortality} Birds</p>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadCSV} type="button"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button variant="outline" onClick={() => window.print()} type="button"><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>

        <Card className="border border-gray-200 overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle>All Transactions</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{loading ? 'Loading...' : `${filtered.length} transactions`}</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Remarks</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="text-right font-semibold">Money Out (₹)</TableHead>
                    <TableHead className="text-right font-semibold">Money In (₹)</TableHead>
                    <TableHead className="text-right font-semibold">Balance (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No entries for selected date range</TableCell></TableRow>
                  ) : (
                    <>
                      {filtered.map((e, idx) => (
                        <TableRow key={idx} className={getTypeColor(e.type)}>
                          <TableCell className="font-medium">{new Date(e.date + 'T00:00:00').toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="font-semibold text-sm">{e.type}</TableCell>
                          <TableCell className="text-gray-700">{e.party}</TableCell>
                          <TableCell className="text-gray-600 text-sm max-w-[150px] truncate" title={e.remarks}>{e.remarks || '-'}</TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">{e.reference}</TableCell>
                          <TableCell className="text-right font-medium text-orange-600">{e.debit > 0 ? `₹${e.debit.toLocaleString('en-IN')}` : '–'}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{e.credit > 0 ? `₹${e.credit.toLocaleString('en-IN')}` : '–'}</TableCell>
                          <TableCell className={`text-right font-bold ${e.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>₹{Math.abs(e.balance).toLocaleString('en-IN')} {e.balance > 0 ? '(Dr)' : e.balance < 0 ? '(Cr)' : ''}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-300">
                        <TableCell colSpan={5} className="text-right">TOTALS</TableCell>
                        <TableCell className="text-right text-orange-600">₹{totals.debit.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-green-600">₹{totals.credit.toLocaleString('en-IN')}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default CompanyLedgerReportPage
