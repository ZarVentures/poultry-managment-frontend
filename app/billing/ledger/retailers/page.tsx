'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Download, Printer, ArrowLeft, Calendar, FileText, Wallet, TrendingDown, TrendingUp, CircleDollarSign } from 'lucide-react'
import { salesApi, retailersApi, godownApi, billingApi, settingsApi } from '@/lib/api'

const RetailerLedgerContent = () => {
  const searchParams = useSearchParams()
  const [retailers, setRetailers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([])
  const [loadingRetailers, setLoadingRetailers] = useState(true)
  const [loadingLedger, setLoadingLedger] = useState(false)
  const [saleLookup, setSaleLookup] = useState<Record<string, { quantity: number; totalBirds: number; rate: number }>>({})
  const [orgInfo, setOrgInfo] = useState<{ name: string; location: string; phone: string }>({ name: '', location: '', phone: '' })
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().split('T')[0] })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    settingsApi.getAll()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : []
        const map = Object.fromEntries(list.map((s: any) => [s.key, s.value]))
        setOrgInfo({
          name: map['farmName'] || map['company_name'] || '',
          location: map['farmLocation'] || map['company_address'] || '',
          phone: map['farmPhone'] || map['company_phone'] || '',
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fetchRetailers = async () => {
      try {
        const data = await retailersApi.getActive()
        console.log('Retailers API response:', data?.[0])
        setRetailers(Array.isArray(data) ? data : [])
        const fromQuery = searchParams.get('retailerId')
        const first = fromQuery || (data.length > 0 ? data[0].id : '')
        setSelectedId(first)
      } catch (err) {
        console.error('Retailers load error:', err)
      } finally {
        setLoadingRetailers(false)
      }
    }
    fetchRetailers()
  }, [])

  useEffect(() => {
    if (!selectedId) return

    setLoadingLedger(true)
    billingApi.getLedgerByRetailerId(selectedId)
      .then(entries => {
        console.log('Ledger API response type:', typeof entries, Array.isArray(entries))
        const arr = Array.isArray(entries) ? entries : []
        console.log('Ledger entries count:', arr.length, 'selectedId:', selectedId)
        if (arr.length > 0) {
          console.log('First ledger entry:', arr[0])
        }
        setLedgerEntries(arr)
      })
      .catch(err => {
        console.error('Ledger load error:', err)
        setLedgerEntries([])
      })
      .finally(() => setLoadingLedger(false))

    // Fetch sales and godown sales to build weight/birds lookup by invoice number
    Promise.all([
      salesApi.getAll().catch(() => ({ data: [] })),
      godownApi.sales.getAll().catch(() => []),
    ]).then(([salesRes, godownList]: [any, any]) => {
        const list = Array.isArray(salesRes) ? salesRes : salesRes?.data || []
        const godownSales = Array.isArray(godownList) ? godownList : []
        const map: Record<string, { quantity: number; totalBirds: number; rate: number }> = {}
        list.forEach((s: any) => {
          const val = { quantity: parseFloat(s.quantity) || 0, totalBirds: parseInt(s.numberOfBirds) || parseInt(s.totalBirds) || 0, rate: parseFloat(s.unitPrice) || 0 }
          map[s.invoiceNumber] = val
          if (s.saleNo) map[s.saleNo] = val
          if (s.id) map[s.id] = val
        })
        godownSales.forEach((s: any) => {
          const val = {
            quantity: parseFloat(s.totalWeight) || 0,
            totalBirds: parseInt(s.numberOfBirds) || 0,
            rate: parseFloat(s.ratePerKg) || 0,
          }
          const ref = s.invoiceNumber || s.saleNo || `GDS-${s.id}`
          map[ref] = val
          if (s.id) map[String(s.id)] = val
        })
        setSaleLookup(map)
      })
      .catch((err: any) => console.error('Sale lookup fetch error:', err))
  }, [selectedId])

  const selectedRetailer = retailers.find(r => r.id === selectedId)

  // Filter ledger entries by date range
  const fromDateObj = new Date(dateFrom); fromDateObj.setHours(0,0,0,0);
  const toDateObj = new Date(dateTo); toDateObj.setHours(23,59,59,999);

  const filteredEntries = ledgerEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0,0,0,0);
    return entryDate >= fromDateObj && entryDate <= toDateObj;
  });

  // Calculate opening balance (all entries before start date)
  const openingBalance = ledgerEntries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0,0,0,0);
      return entryDate < fromDateObj;
    })
    .reduce((acc, entry) => acc + Number(entry.debit || 0) - Number(entry.credit || 0), 0);

  // Calculate totals for the period
  const totalDebit = filteredEntries.reduce((s, e) => s + Number(e.debit || 0), 0)
  const totalCredit = filteredEntries.reduce((s, e) => s + Number(e.credit || 0), 0)
  
  // Closing balance is the last entry's balance, or opening balance if no entries
  const closingBalance = filteredEntries.length > 0 
    ? Number(filteredEntries[filteredEntries.length - 1].balance || 0)
    : openingBalance

  const getEntryMeta = (e: any) => {
    if (e.referenceType === 'Sale' || e.referenceType === 'Payment' || e.referenceType === 'GodownSale') {
      const invNo = e.referenceId?.replace(/-P$/, '')
      const so = saleLookup[invNo]
      if (so) return so
    }
    return { quantity: 0, totalBirds: 0, rate: 0 }
  }

  const downloadCSV = () => {
    if (!filteredEntries.length) { alert('No data to export.'); return }
    const headers = 'Date,Type,Reference,Birds,Weight,Rate,Debit,Credit,Balance'
    const rows = filteredEntries.map(e => {
      const m = getEntryMeta(e)
      return `${e.date},${e.referenceType},${e.referenceId || ''},${m.totalBirds || ''},${m.quantity || ''},${m.rate || ''},${e.debit},${e.credit},${e.balance}`
    }).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `retailer_ledger_${selectedRetailer?.name || selectedId}_${new Date().toISOString().split('T')[0]}.csv`
    a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    if (!filteredEntries.length) { alert('No data to export.'); return }
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const pageW = doc.internal.pageSize.getWidth()
    let titleY = 20
    if (orgInfo.name) {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(orgInfo.name, 14, 16)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      let iy = 22
      if (orgInfo.location) { doc.text(orgInfo.location, 14, iy); iy += 4 }
      if (orgInfo.phone) { doc.text(`Phone: ${orgInfo.phone}`, 14, iy); iy += 4 }
      titleY = iy + 4
    }
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Customer Ledger', pageW / 2, titleY, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Customer: ${selectedRetailer?.name || '-'}`, pageW / 2, titleY + 8, { align: 'center' })
    doc.setFontSize(9)
    doc.text(`Period: ${new Date(dateFrom).toLocaleDateString('en-GB')} - ${new Date(dateTo).toLocaleDateString('en-GB')}`, pageW / 2, titleY + 14, { align: 'center' })

    const lineY = titleY + 17
    doc.setDrawColor(200, 200, 200)
    doc.line(14, lineY, pageW - 14, lineY)

    const rows = filteredEntries.map(e => {
      const m = getEntryMeta(e)
      return [
        new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB'),
        e.referenceType || '',
        e.referenceId || '-',
        m.totalBirds || '-',
        m.quantity ? `${m.quantity.toFixed(2)} kg` : '-',
        m.rate ? `₹${Number(m.rate).toFixed(2)}` : '-',
        Number(e.debit) > 0 ? `₹${Number(e.debit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
        Number(e.credit) > 0 ? `₹${Number(e.credit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
        `₹${Number(e.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ]
    })
    rows.unshift([
      { content: 'Opening Balance', colSpan: 8, styles: { fontStyle: 'bold', halign: 'right' } },
      `₹${openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ])
    rows.push([
      { content: 'TOTAL FOR PERIOD', colSpan: 6, styles: { fontStyle: 'bold', halign: 'right' } },
      `₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      '',
    ])
    rows.push([
      { content: 'Closing Balance', colSpan: 8, styles: { fontStyle: 'bold', halign: 'right' } },
      `₹${closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ])

    autoTable(doc, {
      head: [['Date', 'Type', 'Reference', 'Birds', 'Weight', 'Rate (₹/kg)', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)']],
      body: rows,
      startY: lineY + 4,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [41, 65, 86], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' } },
      foot: [['Generated on ' + new Date().toLocaleString('en-GB'), '', '', '', '', '', '', '']],
      footStyles: { fillColor: [241, 243, 245], textColor: [100, 100, 100], fontSize: 7, fontStyle: 'italic' },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.5,
    })

    doc.save(`retailer_ledger_${selectedRetailer?.name || selectedId}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handlePrint = () => {
    if (!filteredEntries.length) { alert('No data to print.'); return }
    const rowsHtml = filteredEntries.map((e, i) => {
      const m = getEntryMeta(e)
      return `<tr${i % 2 === 0 ? ' style="background:#f9fafb"' : ''}>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px">${new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB')}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px">${e.referenceType || ''}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px">${e.referenceId || '-'}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right">${m.totalBirds || '-'}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right">${m.quantity ? m.quantity.toFixed(2) + ' kg' : '-'}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right">${m.rate ? '₹' + m.rate.toFixed(2) : '-'}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right">${Number(e.debit) > 0 ? '₹' + Number(e.debit).toLocaleString('en-IN') : '-'}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right">${Number(e.credit) > 0 ? '₹' + Number(e.credit).toLocaleString('en-IN') : '-'}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right;font-weight:bold">₹${Number(e.balance).toLocaleString('en-IN')}</td>
</tr>`
    }).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Customer Ledger</title>
<style>
@page{size:landscape;margin:8mm}body{font-family:Arial,sans-serif;margin:0;padding:10px}
h2{text-align:center;margin:0 0 4px}h3{text-align:center;margin:0 0 4px;font-weight:normal;color:#555}
.period{text-align:center;font-size:12px;color:#777;margin-bottom:10px}
table{width:100%;border-collapse:collapse;table-layout:fixed}th{background:#293e56;color:#fff;padding:8px;font-size:12px;text-align:left}
td{padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;white-space:nowrap}
.summary-row td{font-weight:bold;background:#f3f4f6}.opening td{background:#f3f4f6;font-weight:bold}
.closing td{background:#eff6ff;font-weight:bold;color:#1e40af}
@media print{body{padding:0}.no-print{display:none}}
</style></head><body>
${orgInfo.name ? '<h2>' + orgInfo.name + '</h2>' : ''}
<h3>Customer Ledger</h3>
<h3 style="font-weight:normal;color:#555;margin-bottom:2px">Customer: ${selectedRetailer?.name || '-'}</h3>
<div class="period">Period: ${new Date(dateFrom).toLocaleDateString('en-GB')} - ${new Date(dateTo).toLocaleDateString('en-GB')}</div>
<table>
<thead><tr><th style="width:11%">Date</th><th style="width:8%">Type</th><th style="width:10%">Reference</th><th style="width:7%;text-align:right">Birds</th><th style="width:9%;text-align:right">Weight</th><th style="width:8%;text-align:right">Rate (₹/kg)</th><th style="width:15%;text-align:right">Debit (₹)</th><th style="width:15%;text-align:right">Credit (₹)</th><th style="width:16%;text-align:right">Balance (₹)</th></tr></thead>
<tbody>
<tr class="opening"><td colspan="8" style="text-align:right">Opening Balance</td><td style="text-align:right;font-weight:bold">₹${openingBalance.toLocaleString('en-IN')}</td></tr>
${rowsHtml}
<tr class="summary-row"><td colspan="6" style="text-align:right">TOTAL FOR PERIOD</td><td style="text-align:right;color:#dc2626">₹${totalDebit.toLocaleString('en-IN')}</td><td style="text-align:right;color:#16a34a">₹${totalCredit.toLocaleString('en-IN')}</td><td></td></tr>
<tr class="closing"><td colspan="8" style="text-align:right">Closing Balance</td><td style="text-align:right">₹${closingBalance.toLocaleString('en-IN')}</td></tr>
</tbody></table>
<div style="text-align:center;font-size:10px;color:#999;margin-top:8px">Generated on ${new Date().toLocaleString('en-GB')}</div>
<div class="no-print" style="text-align:center;margin-top:12px"><button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer">Print</button></div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Retailer Ledger</h1>
            <p className="text-gray-600 mt-2">Complete ledger including sales, payments, and vouchers</p>
          </div>
          <Link href="/billing/balance-sheet" className="inline-flex items-center rounded-full h-10 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </div>

        <Card className="rounded-2xl p-4 print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div className="md:w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Retailer</label>
              {loadingRetailers ? <p className="text-sm text-gray-500">Loading...</p> : (
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="!h-10 rounded-full"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {retailers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-10 rounded-full pl-10 w-full sm:w-[160px]" /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" /><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-10 rounded-full pl-10 w-full sm:w-[160px]" /></div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 print:hidden">
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Opening Balance</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600"><Wallet size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 min-w-0 truncate">₹{openingBalance.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Net Amount</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600"><TrendingDown size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-red-600 min-w-0 truncate">₹{totalDebit.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Total Payment Received</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><TrendingUp size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-green-600 min-w-0 truncate">₹{totalCredit.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">Closing Balance</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><CircleDollarSign size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-blue-700 min-w-0 truncate">₹{closingBalance.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 print:hidden">
          <Button variant="outline" onClick={downloadCSV} type="button" className="rounded-full h-10"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button variant="outline" onClick={downloadPDF} type="button" className="rounded-full h-10"><FileText className="w-4 h-4 mr-2" />Download PDF</Button>
          <Button variant="outline" onClick={handlePrint} type="button" className="rounded-full h-10"><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>

        <Card className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden print:overflow-visible print:border-none print:shadow-none">
          <div className="overflow-x-auto print:overflow-visible">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Birds</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead className="text-right">Rate (₹/kg)</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Debit (₹)</TableHead>
                  <TableHead className="text-right">Credit (₹)</TableHead>
                  <TableHead className="text-right">Balance (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {loadingLedger ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-500 dark:text-slate-400">Loading...</TableCell></TableRow>
                ) : (
                  <>
                    <TableRow className="bg-gray-100 dark:bg-slate-800 font-medium">
                      <TableCell colSpan={9} className="text-right">Opening Balance</TableCell>
                      <TableCell className="text-right font-bold">₹{openingBalance.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                      {filteredEntries.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-500 dark:text-slate-400">No transactions found in this date range</TableCell></TableRow>
                    ) : filteredEntries.map((e, idx) => {
                      const typeLabel = e.referenceType || 'Unknown';
                      const typeColor = 
                        typeLabel === 'Sale' ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300' :
                        typeLabel === 'Payment' ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300' :
                        typeLabel === 'Voucher' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300' :
                        'bg-gray-100 text-gray-800 dark:bg-slate-500/15 dark:text-slate-300';

                      return (
                        <TableRow key={idx} className={`border-b border-gray-200 dark:border-slate-700 ${typeLabel === 'Payment' ? 'bg-green-50 dark:bg-emerald-500/10' : typeLabel === 'Voucher' ? 'bg-purple-50 dark:bg-purple-500/10' : ''}`}>
                          <TableCell>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB')}</TableCell>
                          <TableCell>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${typeColor}`}>{typeLabel}</span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{e.referenceId || '-'}</TableCell>
                          <TableCell className="text-right">{(() => { const m = getEntryMeta(e); return m.totalBirds || '-' })()}</TableCell>
                          <TableCell className="text-right">{(() => { const m = getEntryMeta(e); return m.quantity ? `${m.quantity.toFixed(2)}` : '-' })()}</TableCell>
                          <TableCell className="text-right">{(() => { const m = getEntryMeta(e); return m.rate ? `₹${m.rate.toFixed(2)}` : '-' })()}</TableCell>
                          <TableCell className="text-gray-600 dark:text-slate-500 text-sm max-w-[150px] truncate">-</TableCell>
                          <TableCell className="text-right text-red-600 dark:text-red-400">{Number(e.debit) > 0 ? `₹${Number(e.debit).toLocaleString('en-IN')}` : '–'}</TableCell>
                          <TableCell className="text-right text-green-600 dark:text-green-400">{Number(e.credit) > 0 ? `₹${Number(e.credit).toLocaleString('en-IN')}` : '–'}</TableCell>
                          <TableCell className="text-right font-bold">₹{Number(e.balance).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-50 dark:bg-slate-800 border-t border-gray-300 dark:border-slate-600 font-bold">
                      <TableCell colSpan={7} className="text-right">TOTAL FOR PERIOD</TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400">₹{totalDebit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400">₹{totalCredit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 dark:bg-blue-500/10 border-t-2 border-blue-200 dark:border-blue-500/30 font-bold text-blue-900 dark:text-blue-300">
                      <TableCell colSpan={9} className="text-right">Closing Balance</TableCell>
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

export default function RetailerLedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <RetailerLedgerContent />
    </Suspense>
  )
}
