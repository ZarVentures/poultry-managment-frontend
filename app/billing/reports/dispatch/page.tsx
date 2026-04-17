'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Printer, Calendar } from 'lucide-react'
import { billingApi } from '@/lib/api'

interface DispatchEntry {
  id: string
  partyId: string
  partyName?: string
  date: string
  birds: number
  netWeight: number
  rate: number
  discount: number
  totalAmount: number
  vehicleNo?: string
}

const DailyDispatchReportPage = () => {
  const [allSales, setAllSales] = useState<DispatchEntry[]>([])
  const [parties, setParties] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    Promise.all([billingApi.getSales(), billingApi.getParties()])
      .then(([sales, partyList]) => {
        const partyMap: Record<string, string> = {}
        partyList.forEach((p: any) => { partyMap[p.id] = p.name })
        setParties(partyMap)
        setAllSales(sales)
      })
      .catch((err) => console.error('Failed to load dispatch data:', err))
      .finally(() => setLoading(false))
  }, [])

  const filteredData = allSales.filter((s) => s.date && s.date.startsWith(dateFilter))

  const totals = filteredData.reduce(
    (acc, item) => ({
      birds: acc.birds + Number(item.birds || 0),
      weight: acc.weight + Number(item.netWeight || 0),
      amount: acc.amount + Number(item.totalAmount || 0),
      discount: acc.discount + Number(item.discount || 0),
    }),
    { birds: 0, weight: 0, amount: 0, discount: 0 }
  )

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
    if (!filteredData.length) { alert('No data to export.'); return }
    downloadCSV(filteredData.map(item => ({
      Date: item.date,
      Party: parties[item.partyId] || item.partyId,
      Vehicle: item.vehicleNo || '',
      Birds: item.birds,
      Net_Weight_kg: item.netWeight,
      Rate: item.rate,
      Discount: item.discount,
      Total_Amount: item.totalAmount,
    })), 'daily_dispatch_report')
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Dispatch Report</h1>
            <p className="text-muted-foreground mt-2">Sales summary for the selected date</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} type="button">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button variant="outline" onClick={() => window.print()} type="button">
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* Date Filter */}
        <Card className="border border-gray-200 p-6">
          <div className="max-w-xs">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Dispatch</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredData.length}</p>
            <p className="text-xs text-gray-600 mt-2">{new Date(dateFilter).toLocaleDateString('en-IN')}</p>
          </Card>
          <Card className="border border-green-200 bg-green-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Birds</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totals.birds.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Weight</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totals.weight.toLocaleString('en-IN')} kg</p>
          </Card>
          <Card className="border border-purple-200 bg-purple-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">₹{totals.amount.toLocaleString('en-IN')}</p>
          </Card>
        </div>

        {/* Table */}
        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Party Name</TableHead>
                  <TableHead className="font-semibold">Vehicle</TableHead>
                  <TableHead className="text-right font-semibold">Birds</TableHead>
                  <TableHead className="text-right font-semibold">Net Wt (kg)</TableHead>
                  <TableHead className="text-right font-semibold">Rate/kg</TableHead>
                  <TableHead className="text-right font-semibold">Discount</TableHead>
                  <TableHead className="text-right font-semibold">Final Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No dispatch found for {new Date(dateFilter).toLocaleDateString('en-IN')}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredData.map((item) => (
                      <TableRow key={item.id} className="border-b border-gray-200">
                        <TableCell className="font-semibold">{parties[item.partyId] || item.partyId}</TableCell>
                        <TableCell className="font-mono text-sm">{item.vehicleNo || '—'}</TableCell>
                        <TableCell className="text-right">{Number(item.birds).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">{Number(item.netWeight).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">₹{Number(item.rate).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right text-orange-600">
                          {Number(item.discount) > 0 ? `₹${Number(item.discount).toLocaleString('en-IN')}` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-bold">₹{Number(item.totalAmount).toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                      <TableCell colSpan={2} className="font-bold">TOTAL</TableCell>
                      <TableCell className="text-right font-bold">{totals.birds.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-bold">{totals.weight.toLocaleString('en-IN')}</TableCell>
                      <TableCell />
                      <TableCell className="text-right font-bold text-orange-600">₹{totals.discount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-bold">₹{totals.amount.toLocaleString('en-IN')}</TableCell>
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
