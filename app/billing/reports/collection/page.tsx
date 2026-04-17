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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Download,
  Printer,
  Calendar,
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle,
} from 'lucide-react'
import { billingApi } from '@/lib/api'

interface CollectionEntry {
  id: string
  partyId: string
  partyName?: string
  date: string
  mode: string
  amount: number
  reference?: string
  status: string
}

const CollectionReportPage = () => {
  const [allPayments, setAllPayments] = useState<CollectionEntry[]>([])
  const [parties, setParties] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [dateFromFilter, setDateFromFilter] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [dateToFilter, setDateToFilter] = useState(() => new Date().toISOString().split('T')[0])
  const [modeFilter, setModeFilter] = useState('all')

  useEffect(() => {
    Promise.all([billingApi.getPayments(), billingApi.getParties()])
      .then(([payments, partyList]) => {
        const partyMap: Record<string, string> = {}
        partyList.forEach((p: any) => { partyMap[p.id] = p.name })
        setParties(partyMap)
        setAllPayments(payments)
      })
      .catch((err) => console.error('Failed to load collection data:', err))
      .finally(() => setLoading(false))
  }, [])

  const filteredData = allPayments.filter((d) => {
    const inRange = new Date(d.date) >= new Date(dateFromFilter) && new Date(d.date) <= new Date(dateToFilter)
    const matchesMode = modeFilter === 'all' || d.mode === modeFilter
    return inRange && matchesMode
  })

  const completedData = filteredData.filter((d) => d.status === 'Completed')
  const pendingData = filteredData.filter((d) => d.status !== 'Completed')

  const stats = {
    totalCollected: completedData.reduce((sum, d) => sum + Number(d.amount), 0),
    totalPending: pendingData.reduce((sum, d) => sum + Number(d.amount), 0),
    cash: completedData.filter((d) => d.mode === 'Cash').reduce((sum, d) => sum + Number(d.amount), 0),
    bank: completedData.filter((d) => d.mode === 'Bank').reduce((sum, d) => sum + Number(d.amount), 0),
    upi: completedData.filter((d) => d.mode === 'UPI').reduce((sum, d) => sum + Number(d.amount), 0),
    cheque: completedData.filter((d) => d.mode === 'Cheque').reduce((sum, d) => sum + Number(d.amount), 0),
  }

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      Cash: 'bg-green-100 text-green-800',
      Bank: 'bg-blue-100 text-blue-800',
      UPI: 'bg-purple-100 text-purple-800',
      Cheque: 'bg-amber-100 text-amber-800',
    }
    return colors[mode] || 'bg-gray-100 text-gray-800'
  }

  const getModeIcon = (mode: string) => {
    const icons: Record<string, React.ReactNode> = {
      Cash: <Banknote className="w-4 h-4" />,
      Bank: <CreditCard className="w-4 h-4" />,
      UPI: <Smartphone className="w-4 h-4" />,
      Cheque: <CheckCircle className="w-4 h-4" />,
    }
    return icons[mode]
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
    if (!filteredData.length) { alert('No data to export.'); return }
    downloadCSV(filteredData.map(item => ({
      Date: item.date,
      Party: parties[item.partyId] || item.partyId,
      Mode: item.mode,
      Amount: item.amount,
      Reference: item.reference || '',
      Status: item.status,
    })), 'collection_report')
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collection Report</h1>
            <p className="text-muted-foreground mt-2">Payment received analysis and tracking</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} type="button">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" onClick={() => window.print()} type="button">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Mode</label>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger><SelectValue placeholder="All Modes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-green-200 bg-green-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-2">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-600 mt-2">{completedData.length} transactions</p>
          </Card>
          <Card className="border border-yellow-200 bg-yellow-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Pending Collection</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">₹{stats.totalPending.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-600 mt-2">{pendingData.length} transactions</p>
          </Card>
          <Card className="border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Collection Rate</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {filteredData.length > 0 ? ((completedData.length / filteredData.length) * 100).toFixed(1) : 0}%
            </p>
          </Card>
          <Card className="border border-purple-200 bg-purple-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Average Collection</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              ₹{completedData.length > 0 ? Math.round(stats.totalCollected / completedData.length).toLocaleString('en-IN') : 0}
            </p>
          </Card>
        </div>

        {/* Mode Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Cash', value: stats.cash, icon: <Banknote className="w-5 h-5 text-green-600 opacity-30" /> },
            { label: 'Bank Transfer', value: stats.bank, icon: <CreditCard className="w-5 h-5 text-blue-600 opacity-30" /> },
            { label: 'UPI', value: stats.upi, icon: <Smartphone className="w-5 h-5 text-purple-600 opacity-30" /> },
            { label: 'Cheque', value: stats.cheque, icon: <CheckCircle className="w-5 h-5 text-amber-600 opacity-30" /> },
          ].map(({ label, value, icon }) => (
            <Card key={label} className="border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-600 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">₹{value.toLocaleString('en-IN')}</p>
                </div>
                {icon}
              </div>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Party Name</TableHead>
                  <TableHead className="font-semibold">Mode</TableHead>
                  <TableHead className="text-right font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Reference</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">No collections found for the selected period</TableCell>
                  </TableRow>
                ) : filteredData.map((item) => (
                  <TableRow key={item.id} className="border-b border-gray-200">
                    <TableCell className="font-medium">{new Date(item.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="font-semibold">{parties[item.partyId] || item.partyId}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getModeColor(item.mode)}`}>
                        {getModeIcon(item.mode)}
                        {item.mode}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">₹{Number(item.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-mono text-xs">{item.reference || '—'}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.status}
                      </span>
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
