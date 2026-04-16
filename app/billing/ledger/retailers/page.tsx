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
import { Download, Printer, ArrowLeft, ShoppingCart, AlertCircle } from 'lucide-react'

interface LedgerEntry {
  date: string
  remarks: string
  referenceType: 'Opening' | 'Sale' | 'Receipt'
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

const retailers: Party[] = [
  {
    id: '1',
    name: 'Sharma Poultry Shop',
    phone: '9876543210',
    openingBalance: 50000,
    currentBalance: 12500,
    creditLimit: 100000,
  },
  {
    id: '3',
    name: 'Delhi Bird Distributor',
    phone: '9876789012',
    openingBalance: 75000,
    currentBalance: -5000,
    creditLimit: 150000,
  },
]

const allLedgerEntries: LedgerEntry[] = [
  {
    date: '2024-04-01',
    remarks: 'previous Balance',
    referenceType: 'Opening',
    referenceId: 'OPN001',
    debit: 0,
    credit: 0,
    balance: 50000,
    partyId: '1',
  },
  {
    date: '2024-04-02',
    remarks: 'Sale',
    referenceType: 'Sale',
    referenceId: 'SAL001',
    debit: 105000,
    credit: 0,
    balance: 155000,
    partyId: '1',
  },
  {
    date: '2024-04-03',
    remarks: 'Receipt - Cash Received',
    referenceType: 'Receipt',
    referenceId: 'REC001',
    debit: 0,
    credit: 100000,
    balance: 55000,
    partyId: '1',
  },
  {
    date: '2024-04-04',
    remarks: 'Sale',
    referenceType: 'Sale',
    referenceId: 'SAL002',
    debit: 63000,
    credit: 0,
    balance: 118000,
    partyId: '1',
  },
  {
    date: '2024-04-05',
    remarks: 'Receipt - Bank Transfer',
    referenceType: 'Receipt',
    referenceId: 'REC002',
    debit: 0,
    credit: 105500,
    balance: 12500,
    partyId: '1',
  },
  {
    date: '2024-04-01',
    remarks: 'Opening Balance',
    referenceType: 'Opening',
    referenceId: 'OPN003',
    debit: 0,
    credit: 0,
    balance: 75000,
    partyId: '3',
  },
  {
    date: '2024-04-03',
    remarks: 'Sale - Birds Dispatch (700 birds)',
    referenceType: 'Sale',
    referenceId: 'SAL003',
    debit: 147000,
    credit: 0,
    balance: 222000,
    partyId: '3',
  },
  {
    date: '2024-04-06',
    remarks: 'Receipt - Bank Transfer',
    referenceType: 'Receipt',
    referenceId: 'REC003',
    debit: 0,
    credit: 125000,
    balance: 97000,
    partyId: '3',
  },
  {
    date: '2024-04-09',
    remarks: 'Sale - Birds Dispatch (400 birds)',
    referenceType: 'Sale',
    referenceId: 'SAL004',
    debit: 84000,
    credit: 0,
    balance: 181000,
    partyId: '3',
  },
  {
    date: '2024-04-10',
    remarks: 'Receipt - Cash',
    referenceType: 'Receipt',
    referenceId: 'REC004',
    debit: 0,
    credit: 186000,
    balance: -5000,
    partyId: '3',
  },
]

const RetailerLedgerPage = () => {
  const [selectedRetailer, setSelectedRetailer] = useState('1')
  const retailer = retailers.find((item) => item.id === selectedRetailer) || retailers[0]
  const entries = allLedgerEntries.filter((entry) => entry.partyId === selectedRetailer)

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
      'retailer_ledger'
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
          <title>Retailer Ledger Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f7fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Retailer Ledger Report</h1>
          <p><strong>Retailer:</strong> ${retailer.name}</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Retailer Ledger</h1>
            <p className="text-gray-600 mt-2">
              Separate ledger page for retailer transactions only.
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
                Select Retailer
              </label>
              <Select value={selectedRetailer} onValueChange={setSelectedRetailer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {retailers.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{retailer.currentBalance.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Credit Limit</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{retailer.creditLimit.toLocaleString('en-IN')}
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
                  <TableHead className="text-right">Paid (₹)</TableHead>
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
                    ₹{retailer.currentBalance.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default RetailerLedgerPage
