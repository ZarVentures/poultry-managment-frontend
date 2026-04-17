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
import { Download, Printer, TrendingUp, TrendingDown, Calendar, Building2 } from 'lucide-react'
import { billingApi } from '@/lib/api'

interface CompanyEntry {
  date: string
  referenceType: string
  referenceId: string
  debit: number
  credit: number
  balance: number
  partyId: string
  partyName?: string
}

const CompanyLedgerReportPage = () => {
  const [entries, setEntries] = useState<CompanyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    Promise.all([billingApi.getParties()])
      .then(async ([partyList]) => {
        const partyMap: Record<string, string> = {}
        partyList.forEach((p: any) => { partyMap[p.id] = p.name })

        // Fetch ledger for all parties in parallel
        const ledgerResults = await Promise.all(
          partyList.map((p: any) =>
            billingApi.getLedger(p.id)
              .then((entries: any[]) => entries.map((e: any) => ({ ...e, partyName: p.name })))
              .catch(() => [])
          )
        )

        const allEntries: CompanyEntry[] = ledgerResults
          .flat()
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        setEntries(allEntries)
      })
      .catch((err) => console.error('Failed to load company ledger:', err))
      .finally(() => setLoading(false))
  }, [])

  const filteredEntries = entries.filter((e) => {
    const d = new Date(e.date)
    return d >= new Date(dateFrom) && d <= new Date(dateTo)
  })

  const totals = filteredEntries.reduce(
    (acc, e) => ({ debit: acc.debit + Number(e.debit || 0), credit: acc.credit + Number(e.credit || 0) }),
    { debit: 0, credit: 0 }
  )

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Sale': return 'border-l-green-500 bg-green-50'
      case 'Payment': return 'border-l-blue-500 bg-blue-50'
      case 'Opening': return 'border-l-gray-500 bg-gray-50'
      default: return 'border-l-gray-400 bg-white'
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
    if (!filteredEntries.length) { alert('No data to export.'); return }
    downloadCSV(filteredEntries.map(e => ({
      Date: e.date,
      Type: e.referenceType,
      Party: e.partyName || e.partyId,
      Reference: e.referenceId,
      Debit: e.debit,
      Credit: e.credit,
      Balance: e.balance,
    })), 'company_ledger_report')
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Company Ledger Report</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Complete account ledger showing all transactions across all parties
          </p>
        </div>

        {/* Date Filter */}
        <Card className="border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-red-200 bg-red-50 p-6">
            <TrendingDown className="w-5 h-5 text-red-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Debit</p>
            <p className="text-2xl font-bold text-red-600 mt-2">₹{totals.debit.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-green-200 bg-green-50 p-6">
            <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Credit</p>
            <p className="text-2xl font-bold text-green-600 mt-2">₹{totals.credit.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-gray-300 bg-gray-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Net Change</p>
            <p className={`text-2xl font-bold mt-2 ${(totals.credit - totals.debit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(totals.credit - totals.debit).toLocaleString('en-IN')}
            </p>
          </Card>
        </div>

        {/* Export */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} type="button">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()} type="button">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>

        {/* Ledger Table */}
        <Card className="border border-gray-200 overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle>All Ledger Entries</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {loading ? 'Loading...' : `Showing ${filteredEntries.length} transactions`}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="text-right font-semibold">Debit (₹)</TableHead>
                    <TableHead className="text-right font-semibold">Credit (₹)</TableHead>
                    <TableHead className="text-right font-semibold">Balance (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  ) : filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">No entries found for selected date range</TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredEntries.map((entry, idx) => (
                        <TableRow key={idx} className={`border-l-4 ${getTypeColor(entry.referenceType)}`}>
                          <TableCell className="font-medium">{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell className="font-semibold">{entry.referenceType}</TableCell>
                          <TableCell className="text-gray-700">{entry.partyName || entry.partyId}</TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">{entry.referenceId}</TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {Number(entry.debit) > 0 ? `₹${Number(entry.debit).toLocaleString('en-IN')}` : '–'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {Number(entry.credit) > 0 ? `₹${Number(entry.credit).toLocaleString('en-IN')}` : '–'}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ₹{Number(entry.balance).toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-300">
                        <TableCell colSpan={4} className="text-right">TOTALS</TableCell>
                        <TableCell className="text-right text-red-600">₹{totals.debit.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-green-600">₹{totals.credit.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">—</TableCell>
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
