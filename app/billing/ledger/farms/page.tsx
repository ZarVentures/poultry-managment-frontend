'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Download, Printer, ArrowLeft, Tractor, AlertCircle } from 'lucide-react'

interface LedgerEntry {
  date: string
  remarks: string
  referenceType: 'Opening' | 'Purchase' | 'Payment'
  referenceId: string
  debit: number
  credit: number
  balance: number
  partyId: string
}

interface Party {
  id: string
  name: string
  phone: string
  openingBalance: number
  currentBalance: number
  creditLimit: number
}

const farms: Party[] = [
  {
    id: '2',
    name: 'Patel Farms',
    phone: '9987654321',
    openingBalance: 100000,
    currentBalance: 85000,
    creditLimit: 200000,
  },
  {
    id: '4',
    name: 'Siddharth Farms',
    phone: '9876512340',
    openingBalance: 120000,
    currentBalance: 95000,
    creditLimit: 220000,
  },
]

const allLedgerEntries: LedgerEntry[] = [
  {
    date: '2024-04-01',
    remarks: 'Previous Balance',
    referenceType: 'Opening',
    referenceId: 'OPN002',
    debit: 0,
    credit: 0,
    balance: 100000,
    partyId: '2',
  },
  {
    date: '2024-04-02',
    remarks: 'Purchase - Birds Received (1000 birds)',
    referenceType: 'Purchase',
    referenceId: 'PUR001',
    debit: 210000,
    credit: 0,
    balance: 310000,
    partyId: '2',
  },
  {
    date: '2024-04-04',
    remarks: 'Payment Made - Bank Transfer',
    referenceType: 'Payment',
    referenceId: 'PAY001',
    debit: 0,
    credit: 100000,
    balance: 210000,
    partyId: '2',
  },
  {
    date: '2024-04-06',
    remarks: 'Purchase - Birds Received (500 birds)',
    referenceType: 'Purchase',
    referenceId: 'PUR002',
    debit: 105000,
    credit: 0,
    balance: 315000,
    partyId: '2',
  },
  {
    date: '2024-04-08',
    remarks: 'Payment Made - Cash',
    referenceType: 'Payment',
    referenceId: 'PAY002',
    debit: 0,
    credit: 230000,
    balance: 85000,
    partyId: '2',
  },
  {
    date: '2024-04-01',
    remarks: 'Opening Balance',
    referenceType: 'Opening',
    referenceId: 'OPN005',
    debit: 0,
    credit: 0,
    balance: 120000,
    partyId: '4',
  },
  {
    date: '2024-04-03',
    remarks: 'Purchase - Birds Received (800 birds)',
    referenceType: 'Purchase',
    referenceId: 'PUR005',
    debit: 168000,
    credit: 0,
    balance: 288000,
    partyId: '4',
  },
  {
    date: '2024-04-06',
    remarks: 'Payment Made - Cash',
    referenceType: 'Payment',
    referenceId: 'PAY005',
    debit: 0,
    credit: 193000,
    balance: 95000,
    partyId: '4',
  },
]

const FarmLedgerPage = () => {
  const [selectedFarm, setSelectedFarm] = useState('2')
  const farm = farms.find((item) => item.id === selectedFarm) || farms[0]
  const entries = allLedgerEntries.filter((entry) => entry.partyId === selectedFarm)

  const totals = entries.reduce(
    (acc, entry) => ({
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit,
    }),
    { debit: 0, credit: 0 }
  )

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data
      .map((row) =>
        Object.values(row)
          .map((val) =>
            typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))
              ? `"${val.replace(/"/g, '""')}"`
              : val
          )
          .join(',')
      )
      .join('\n')
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    if (entries.length === 0) {
      alert('No data available to export.')
      return
    }
    downloadCSV(
      entries.map((entry) => ({
        Date: new Date(entry.date).toLocaleDateString('en-IN'),
        Remarks: entry.remarks,
        Reference_Type: entry.referenceType,
        Reference_ID: entry.referenceId,
        Debit: entry.debit,
        Credit: entry.credit,
        Balance: entry.balance,
      })),
      'farm_ledger'
    )
  }

  const handlePrint = () => {
    if (entries.length === 0) {
      alert('No data available to print.')
      return
    }
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Farm Ledger Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f7fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Farm Ledger Report</h1>
          <p><strong>Farm:</strong> ${farm.name}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Remarks</th>
                <th>Reference</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              ${entries
                .map(
                  (entry) => `
                    <tr>
                      <td>${new Date(entry.date).toLocaleDateString('en-IN')}</td>
                      <td>${entry.remarks}</td>
                      <td>${entry.referenceId}</td>
                      <td>${entry.debit > 0 ? '₹' + entry.debit.toLocaleString('en-IN') : '-'}</td>
                      <td>${entry.credit > 0 ? '₹' + entry.credit.toLocaleString('en-IN') : '-'}</td>
                      <td>₹${entry.balance.toLocaleString('en-IN')}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    } else {
      alert('Please allow popups for this website to use the print function.')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farm Ledger</h1>
            <p className="text-gray-600 mt-2">
              Separate ledger page for farm transactions only.
            </p>
          </div>
          <Link href="/billing/ledger" className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ledger Home
          </Link>
        </div>

        <Card className="border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Farm
              </label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farmItem) => (
                    <SelectItem key={farmItem.id} value={farmItem.id}>
                      {farmItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{farm.currentBalance.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Credit Limit</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{farm.creditLimit.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} type="button">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} type="button">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>

        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead>Date</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Unpaid (₹)</TableHead>
                  <TableHead className="text-right">paid (₹)</TableHead>
                  <TableHead className="text-right">Balance (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, idx) => (
                  <TableRow key={idx} className="border-b border-gray-200">
                    <TableCell>{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{entry.remarks}</TableCell>
                    <TableCell>{entry.referenceType}</TableCell>
                    <TableCell>{entry.referenceId}</TableCell>
                    <TableCell className="text-right">
                      {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '–'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '–'}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{entry.balance.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                  <TableCell colSpan={4} className="text-right font-bold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    ₹{totals.debit.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    ₹{totals.credit.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ₹{farm.currentBalance.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* <Alert className="border border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-700" />
          <AlertDescription>
            This page is dedicated to farm ledger entries only. Do not mix farms with retailer ledger data.
          </AlertDescription>
        </Alert> */}
      </div>
    </DashboardLayout>
  )
}

export default FarmLedgerPage
