'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Download, Printer, ArrowLeft, Calendar, FileText } from 'lucide-react'
import { purchasesApi, farmersApi, billingApi, settingsApi } from '@/lib/api'

const FarmLedgerPage = () => {
  const [farmers, setFarmers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([])
  const [loadingFarmers, setLoadingFarmers] = useState(true)
  const [loadingLedger, setLoadingLedger] = useState(false)
  const [purchaseLookup, setPurchaseLookup] = useState<Record<string, { totalWeight: number; totalBirds: number }>>({})
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
    farmersApi.getAll()
      .then((farmerList: any) => {
        const safeFarmers = Array.isArray(farmerList) ? farmerList : farmerList?.data || []
        setFarmers(safeFarmers)
        if (safeFarmers.length > 0) {
          setSelectedId(String(safeFarmers[0].id))
        }
      })
      .catch(err => console.error('Farmers load error:', err))
      .finally(() => setLoadingFarmers(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return

    setLoadingLedger(true)
    billingApi.getLedgerByFarmerId(selectedId)
      .then(entries => {
        const arr = Array.isArray(entries) ? entries : []
        setLedgerEntries(arr)
      })
      .catch(err => {
        console.error('Ledger load error:', err)
        setLedgerEntries([])
      })
      .finally(() => setLoadingLedger(false))

    // Fetch purchase orders to build weight/birds lookup by order number
    purchasesApi.getAll()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || []
        const map: Record<string, { totalWeight: number; totalBirds: number }> = {}
        list.forEach((p: any) => {
          const birds = (p.cages || []).reduce((s: number, c: any) => s + (parseInt(c.numberOfBirds) || 0), 0)
          map[p.orderNumber] = {
            totalWeight: parseFloat(p.totalWeight) || 0,
            totalBirds: birds
          }
        })
        setPurchaseLookup(map)
      })
      .catch(() => {})
  }, [selectedId])

  const selectedFarmer = farmers.find(f => f.id === selectedId)

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
    if (e.referenceType === 'Purchase' || e.referenceType === 'Payment') {
      const orderNo = e.referenceId?.replace(/-P$/, '')
      const po = purchaseLookup[orderNo]
      if (po) return po
    }
    return { totalBirds: 0, totalWeight: 0 }
  }

  const downloadCSV = () => {
    if (!filteredEntries.length) { alert('No data to export.'); return }
    const headers = 'Date,Type,Reference,Birds,Weight,Debit,Credit,Balance'
    const rows = filteredEntries.map(e => {
      const m = getEntryMeta(e)
      return `${e.date},${e.referenceType},${e.referenceId || ''},${m.totalBirds || ''},${m.totalWeight || ''},${e.debit},${e.credit},${e.balance}`
    }).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `farm_ledger_${selectedFarmer?.name || selectedId}_${new Date().toISOString().split('T')[0]}.csv`
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
    doc.text('Farm Ledger Report', pageW / 2, titleY, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Farmer: ${selectedFarmer?.name || '-'}`, pageW / 2, titleY + 8, { align: 'center' })
    doc.setFontSize(9)
    doc.text(`Period: ${new Date(dateFrom).toLocaleDateString('en-GB')} - ${new Date(dateTo).toLocaleDateString('en-GB')}`, pageW / 2, titleY + 14, { align: 'center' })

    const lineY = titleY + 17
    doc.setDrawColor(200, 200, 200)
    doc.line(14, lineY, pageW - 14, lineY)

    const startTableY = lineY + 4

    const rows = filteredEntries.map(e => {
      const m = getEntryMeta(e)
      return [
        new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB'),
        e.referenceType || '',
        e.referenceId || '-',
        m.totalBirds || '-',
        m.totalWeight ? `${m.totalWeight.toFixed(2)} kg` : '-',
        Number(e.debit) > 0 ? `Rs. ${Number(e.debit).toLocaleString('en-IN')}` : '-',
        Number(e.credit) > 0 ? `Rs. ${Number(e.credit).toLocaleString('en-IN')}` : '-',
        `Rs. ${Number(e.balance).toLocaleString('en-IN')}`,
      ]
    })
    rows.unshift([
      { content: 'Opening Balance', colSpan: 7, styles: { fontStyle: 'bold', halign: 'right' } },
      `Rs. ${openingBalance.toLocaleString('en-IN')}`
    ])
    rows.push([
      { content: 'TOTAL FOR PERIOD', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
      `Rs. ${totalDebit.toLocaleString('en-IN')}`,
      `Rs. ${totalCredit.toLocaleString('en-IN')}`,
      '',
    ])
    rows.push([
      { content: 'Closing Balance', colSpan: 7, styles: { fontStyle: 'bold', halign: 'right' } },
      `Rs. ${closingBalance.toLocaleString('en-IN')}`
    ])

    autoTable(doc, {
      head: [['Date', 'Type', 'Reference', 'Birds', 'Weight', 'Debit (Rs.)', 'Credit (Rs.)', 'Balance (Rs.)']],
      body: rows,
      startY: startTableY,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [41, 65, 86], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
      foot: [['Generated on ' + new Date().toLocaleString('en-GB'), '', '', '', '', '', '', '']],
      footStyles: { fillColor: [241, 243, 245], textColor: [100, 100, 100], fontSize: 7, fontStyle: 'italic' },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.5,
    })

    doc.save(`farm_ledger_${selectedFarmer?.name || selectedId}_${new Date().toISOString().split('T')[0]}.pdf`)
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
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right">${m.totalWeight ? m.totalWeight.toFixed(2) + ' kg' : '-'}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right">${Number(e.debit) > 0 ? '₹' + Number(e.debit).toLocaleString('en-IN') : '-'}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right">${Number(e.credit) > 0 ? '₹' + Number(e.credit).toLocaleString('en-IN') : '-'}</td>
<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:right;font-weight:bold">₹${Number(e.balance).toLocaleString('en-IN')}</td>
</tr>`
    }).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Farm Ledger</title>
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
<h3>Farm Ledger Report</h3>
<h3 style="font-weight:normal;color:#555;margin-bottom:2px">Farmer: ${selectedFarmer?.name || '-'}</h3>
<div class="period">Period: ${new Date(dateFrom).toLocaleDateString('en-GB')} - ${new Date(dateTo).toLocaleDateString('en-GB')}</div>
<table>
<thead><tr><th style="width:12%">Date</th><th style="width:9%">Type</th><th style="width:11%">Reference</th><th style="width:8%;text-align:right">Birds</th><th style="width:10%;text-align:right">Weight</th><th style="width:17%;text-align:right">Debit (₹)</th><th style="width:17%;text-align:right">Credit (₹)</th><th style="width:16%;text-align:right">Balance (₹)</th></tr></thead>
<tbody>
<tr class="opening"><td colspan="7" style="text-align:right">Opening Balance</td><td style="text-align:right;font-weight:bold">₹${openingBalance.toLocaleString('en-IN')}</td></tr>
${rowsHtml}
<tr class="summary-row"><td colspan="5" style="text-align:right">TOTAL FOR PERIOD</td><td style="text-align:right;color:#dc2626">₹${totalDebit.toLocaleString('en-IN')}</td><td style="text-align:right;color:#16a34a">₹${totalCredit.toLocaleString('en-IN')}</td><td></td></tr>
<tr class="closing"><td colspan="7" style="text-align:right">Closing Balance</td><td style="text-align:right">₹${closingBalance.toLocaleString('en-IN')}</td></tr>
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farm Ledger</h1>
            <p className="text-gray-600 mt-2">Complete ledger including purchases, payments, and vouchers</p>
          </div>
          <Link href="/billing" className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </div>

        <Card className="border border-gray-200 p-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Farmer</label>
              {loadingFarmers ? <p className="text-sm text-gray-500">Loading...</p> : farmers.length === 0 ? (
                <p className="text-sm text-gray-500">No farmers with purchase orders found</p>
              ) : (
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {farmers.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
          <Card className="p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Opening Balance</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">₹{openingBalance.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="p-4 border border-red-200 bg-red-50">
            <p className="text-sm font-medium text-red-800">Total Paid (Debit) (₹)</p>
            <p className="text-2xl font-bold text-red-600 mt-2">₹{totalDebit.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="p-4 border border-green-200 bg-green-50">
            <p className="text-sm font-medium text-green-800">Total Purchases (Credit) (₹)</p>
            <p className="text-2xl font-bold text-green-600 mt-2">₹{totalCredit.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="p-4 border border-blue-200 bg-blue-50">
            <p className="text-sm font-medium text-blue-900">Closing Balance</p>
            <p className="text-2xl font-bold text-blue-700 mt-2">₹{closingBalance.toLocaleString('en-IN')}</p>
          </Card>
        </div>

        <div className="flex gap-3 print:hidden">
          <Button variant="outline" onClick={downloadCSV} type="button"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button variant="outline" onClick={downloadPDF} type="button"><FileText className="w-4 h-4 mr-2" />Download PDF</Button>
          <Button variant="outline" onClick={handlePrint} type="button"><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>

        <Card className="border border-gray-200 overflow-hidden print:overflow-visible print:border-none print:shadow-none">
          <div className="overflow-x-auto print:overflow-visible">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Birds</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Debit (₹)</TableHead>
                  <TableHead className="text-right">Credit (₹)</TableHead>
                  <TableHead className="text-right">Balance (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLedger ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
                ) : (
                  <>
                    <TableRow className="bg-gray-100 font-medium">
                      <TableCell colSpan={8} className="text-right">Opening Balance </TableCell>
                      <TableCell className="text-right font-bold">₹{openingBalance.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    {filteredEntries.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">No transactions found in this date range</TableCell></TableRow>
                    ) : filteredEntries.map((e, idx) => {
                      const typeLabel = e.referenceType || 'Unknown';
                      const typeColor = 
                        typeLabel === 'Sale' ? 'bg-orange-100 text-orange-800' :
                        typeLabel === 'Purchase' ? 'bg-blue-100 text-blue-800' :
                        typeLabel === 'Payment' ? 'bg-green-100 text-green-800' :
                        typeLabel === 'Voucher' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800';

                      return (
                        <TableRow key={idx} className={`border-b border-gray-200 ${typeLabel === 'Payment' ? 'bg-green-50' : typeLabel === 'Voucher' ? 'bg-purple-50' : typeLabel === 'Purchase' ? 'bg-blue-50/30' : ''}`}>
                          <TableCell>{new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB')}</TableCell>
                          <TableCell>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${typeColor}`}>{typeLabel}</span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{e.referenceId || '-'}</TableCell>
                          <TableCell className="text-right">{(() => { const m = getEntryMeta(e); return m.totalBirds || '-' })()}</TableCell>
                          <TableCell className="text-right">{(() => { const m = getEntryMeta(e); return m.totalWeight ? `${m.totalWeight.toFixed(2)}` : '-' })()}</TableCell>
                          <TableCell className="text-gray-600 text-sm max-w-[150px] truncate">-</TableCell>
                          <TableCell className="text-right text-red-600">{Number(e.debit) > 0 ? `₹${Number(e.debit).toLocaleString('en-IN')}` : '–'}</TableCell>
                          <TableCell className="text-right text-green-600">{Number(e.credit) > 0 ? `₹${Number(e.credit).toLocaleString('en-IN')}` : '–'}</TableCell>
                          <TableCell className="text-right font-bold">₹{Number(e.balance).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-50 border-t border-gray-300 font-bold">
                      <TableCell colSpan={6} className="text-right">TOTAL FOR PERIOD</TableCell>
                      <TableCell className="text-right text-red-600">₹{totalDebit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600">₹{totalCredit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right"></TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-bold text-blue-900">
                      <TableCell colSpan={8} className="text-right">Closing Balance </TableCell>
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

export default FarmLedgerPage
