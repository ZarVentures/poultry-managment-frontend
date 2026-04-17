'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Download, Printer } from 'lucide-react'
import { billingApi } from '@/lib/api'

interface OutstandingParty {
  id: string
  name: string
  type: string
  phone: string
  openingBalance: number
  currentBalance: number
  creditLimit: number
}

const OutstandingReportPage = () => {
  const [parties, setParties] = useState<OutstandingParty[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('balance')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    billingApi.getParties()
      .then((data) => setParties(data))
      .catch((err) => console.error('Failed to load parties:', err))
      .finally(() => setLoading(false))
  }, [])

  const filteredAndSorted = parties
    .filter((p) => typeFilter === 'all' || p.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'balance') return b.currentBalance - a.currentBalance
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  const stats = {
    totalOutstanding: parties.reduce((sum, p) => sum + (p.currentBalance > 0 ? p.currentBalance : 0), 0),
    totalOverpaid: parties.reduce((sum, p) => sum + (p.currentBalance < 0 ? Math.abs(p.currentBalance) : 0), 0),
    exceededLimitCount: parties.filter((p) => p.currentBalance > p.creditLimit).length,
  }

  const getStatusColor = (balance: number, creditLimit: number) => {
    if (balance < 0) return 'bg-blue-100 text-blue-800'
    if (balance > creditLimit) return 'bg-red-100 text-red-800'
    if (balance > creditLimit * 0.8) return 'bg-orange-100 text-orange-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (balance: number, creditLimit: number) => {
    if (balance < 0) return 'Overpaid'
    if (balance > creditLimit) return 'Exceeds Limit'
    if (balance > creditLimit * 0.8) return 'High Balance'
    return 'Good'
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' && (val.includes(',') || val.includes('"'))
          ? `"${val.replace(/"/g, '""')}"` : val
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
    if (!filteredAndSorted.length) { alert('No data to export.'); return }
    downloadCSV(filteredAndSorted.map(p => ({
      Name: p.name, Type: p.type, Phone: p.phone,
      Opening_Balance: p.openingBalance, Current_Balance: p.currentBalance,
      Credit_Limit: p.creditLimit, Status: getStatusText(p.currentBalance, p.creditLimit),
    })), 'outstanding_report')
  }

  const handlePrint = () => window.print()

  const partyTypes = [...new Set(parties.map(p => p.type))].filter(Boolean)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Outstanding Report</h1>
            <p className="text-muted-foreground mt-2">Pending balance and credit limit status for all parties</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} type="button">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button variant="outline" onClick={handlePrint} type="button">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Outstanding</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              ₹{stats.totalOutstanding.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              From {parties.filter(p => p.currentBalance > 0).length} parties
            </p>
          </Card>
          <Card className="border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Overpaid Amount</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ₹{stats.totalOverpaid.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              From {parties.filter(p => p.currentBalance < 0).length} parties
            </p>
          </Card>
          <Card className="border border-purple-200 bg-purple-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Limit Exceeded</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.exceededLimitCount}</p>
            <p className="text-xs text-gray-600 mt-2">Parties exceeding credit limit</p>
          </Card>
        </div>

        {stats.exceededLimitCount > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>⚠️ Action Required:</strong> {stats.exceededLimitCount} parties have exceeded their credit limit.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Party Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {partyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Balance (Highest)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Party Name</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="text-right font-semibold">Opening Bal</TableHead>
                  <TableHead className="text-right font-semibold">Current Balance</TableHead>
                  <TableHead className="text-right font-semibold">Credit Limit</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading...</TableCell>
                  </TableRow>
                ) : filteredAndSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">No parties found</TableCell>
                  </TableRow>
                ) : filteredAndSorted.map((party) => (
                  <TableRow key={party.id} className="border-b border-gray-200">
                    <TableCell className="font-semibold">
                      <Link href={`/billing/ledger/retailers?partyId=${party.id}`} className="text-blue-600 hover:underline">
                        {party.name}
                      </Link>
                    </TableCell>
                    <TableCell>{party.type}</TableCell>
                    <TableCell>{party.phone}</TableCell>
                    <TableCell className="text-right">₹{Number(party.openingBalance).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-bold">₹{Number(party.currentBalance).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">₹{Number(party.creditLimit).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(party.currentBalance, party.creditLimit)}`}>
                        {getStatusText(party.currentBalance, party.creditLimit)}
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

export default OutstandingReportPage
