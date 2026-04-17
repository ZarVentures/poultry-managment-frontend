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
import { Download, Printer, ArrowLeft } from 'lucide-react'
import { billingApi } from '@/lib/api'

const RetailerLedgerPage = () => {
  const [parties, setParties] = useState<any[]>([])
  const [selectedPartyId, setSelectedPartyId] = useState('')
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([])
  const [loadingParties, setLoadingParties] = useState(true)
  const [loadingLedger, setLoadingLedger] = useState(false)

  useEffect(() => {
    billingApi.getParties()
      .then((data) => {
        // Show all parties (Retailer type or all if no type filter needed)
        const retailers = data.filter((p: any) => p.type === 'Retailer' || !p.type)
        setParties(retailers.length > 0 ? retailers : data)
        if (retailers.length > 0 || data.length > 0) {
          const first = retailers.length > 0 ? retailers[0] : data[0]
          setSelectedPartyId(first.id)
        }
      })
      .catch((err) => console.error('Failed to load parties:', err))
      .finally(() => setLoadingParties(false))
  }, [])

  useEffect(() => {
    if (!selectedPartyId) return
    setLoadingLedger(true)
    billingApi.getLedger(selectedPartyId)
      .then((data) => setLedgerEntries(data))
      .catch((err) => console.error('Failed to load ledger:', err))
      .finally(() => setLoadingLedger(false))
  }, [selectedPartyId])

  const selectedParty = parties.find((p) => p.id === selectedPartyId)

  const totals = ledgerEntries.reduce(
    (acc, entry) => ({
      debit: acc.debit + Number(entry.debit || 0),
      credit: acc.credit + Number(entry.credit || 0),
    }),
    { debit: 0, credit: 0 }
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
    if (!ledgerEntries.length) { alert('No data to export.'); return }
    downloadCSV(ledgerEntries.map(e => ({
      Date: e.date,
      Type: e.referenceType,
      Reference: e.referenceId,
      Debit: e.debit,
      Credit: e.credit,
      Balance: e.balance,
    })), 'retailer_ledger')
  }

  const handlePrint = () => {
    if (!ledgerEntries.length) { alert('No data to print.'); return }
    const printContent = `
      <!DOCTYPE html><html><head><title>Retailer Ledger</title>
      <style>body{font-family:Arial,sans-serif;margin:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f7fafc;font-weight:bold}</style>
      </head><body>
      <h1>Retailer Ledger Report</h1>
      <p><strong>Party:</strong> ${selectedParty?.name || ''}</p>
      <table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
      <tbody>${ledgerEntries.map(e => `<tr><td>${e.date}</td><td>${e.referenceType}</td><td>${e.referenceId}</td><td>${Number(e.debit) > 0 ? '₹' + Number(e.debit).toLocaleString('en-IN') : '-'}</td><td>${Number(e.credit) > 0 ? '₹' + Number(e.credit).toLocaleString('en-IN') : '-'}</td><td>₹${Number(e.balance).toLocaleString('en-IN')}</td></tr>`).join('')}
      </tbody></table></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(printContent); w.document.close(); w.print() }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Retailer Ledger</h1>
            <p className="text-gray-600 mt-2">Individual ledger for retailer transactions</p>
          </div>
          <Link href="/billing/ledger" className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </div>

        <Card className="border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Party</label>
              {loadingParties ? (
                <p className="text-sm text-gray-500">Loading parties...</p>
              ) : (
                <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {parties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{Number(selectedParty?.currentBalance || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Credit Limit</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{Number(selectedParty?.creditLimit || 0).toLocaleString('en-IN')}
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
                {loadingLedger ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell>
                  </TableRow>
                ) : ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">No ledger entries found</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {ledgerEntries.map((entry, idx) => (
                      <TableRow key={idx} className="border-b border-gray-200">
                        <TableCell>{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>{entry.referenceType}</TableCell>
                        <TableCell className="font-mono text-sm">{entry.referenceId}</TableCell>
                        <TableCell className="text-right text-red-600">
                          {Number(entry.debit) > 0 ? `₹${Number(entry.debit).toLocaleString('en-IN')}` : '–'}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {Number(entry.credit) > 0 ? `₹${Number(entry.credit).toLocaleString('en-IN')}` : '–'}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ₹{Number(entry.balance).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                      <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold text-red-600">₹{totals.debit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">₹{totals.credit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-bold">
                        ₹{Number(selectedParty?.currentBalance || 0).toLocaleString('en-IN')}
                      </TableCell>
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

export default RetailerLedgerPage
