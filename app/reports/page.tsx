"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Table as TableIcon, BarChart3, PieChart as PieChartIcon, FileText } from "lucide-react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/api-base-url"
import { mortalityApi } from "@/lib/api"
import { formatDate, toDateOnlyString } from "@/lib/date-utils"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

type ViewMode = 'table' | 'chart' | 'pie'

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const [profitLossData, setProfitLossData] = useState<any>(null)
  const [expenseData, setExpenseData] = useState<any>(null)
  const [farmWiseData, setFarmWiseData] = useState<any>(null)
  const [customerWiseData, setCustomerWiseData] = useState<any>(null)
  const [purchaseData, setPurchaseData] = useState<any>(null)
  const [salesData, setSalesData] = useState<any>(null)
  const [godownSalesData, setGodownSalesData] = useState<any>(null)
  const [mortalityData, setMortalityData] = useState<any>(null)
  const [outstandingData, setOutstandingData] = useState<any>(null)
  const [stockData, setStockData] = useState<any>(null)

  const isInSelectedRange = (value?: string | Date | null) => {
    const d = toDateOnlyString(value)
    if (!d) return false
    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  }

  const filterMortalityRows = (rows: any[]) =>
    (rows || []).filter((record: any) =>
      isInSelectedRange(record.purchaseDate || record.mortalityDate || record.createdAt)
    )

  const fetchReport = async (endpoint: string, setter: Function) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`${getApiBaseUrl()}/reports/${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setter(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return toast.error('No data')
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(',')).join('\n')
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const downloadAllPDF = async () => {
    if (!profitLossData && !purchaseData && !salesData && !godownSalesData && !mortalityData && !expenseData && !farmWiseData && !customerWiseData && !outstandingData && !stockData) {
      return toast.error('Generate reports first')
    }
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const dateLabel = `${startDate} to ${endDate}`
    doc.setFontSize(16)
    doc.text('Business Reports', 14, 20)
    doc.setFontSize(10)
    doc.text(`Date Range: ${dateLabel}`, 14, 28)
    let y = 34

    const noData = (cols: number) => [[...(new Array(cols - 1).fill('')), 'No Data Available']]
    const sections: { title: string; headers: string[]; rows: (string | number)[][] }[] = []

    sections.push({
      title: 'Profit & Loss',
      headers: ['Metric', 'Value'],
      rows: profitLossData?.summary
        ? [
            ['Revenue', `Rs. ${profitLossData.summary.totalRevenue?.toFixed(2) || '0.00'}`],
            ['Cost', `Rs. ${profitLossData.summary.totalCost?.toFixed(2) || '0.00'}`],
            ['Gross Profit', `Rs. ${profitLossData.summary.grossProfit?.toFixed(2) || '0.00'}`],
            ['Expenses', `Rs. ${profitLossData.summary.totalExpenses?.toFixed(2) || '0.00'}`],
            ['Net Profit', `Rs. ${profitLossData.summary.netProfit?.toFixed(2) || '0.00'}`],
            ['Margin', `${profitLossData.summary.profitMargin?.toFixed(2) || '0.00'}%`],
          ]
        : noData(2),
    })

    sections.push({
      title: 'Purchases',
      headers: ['Order #', 'Date', 'Supplier', 'Birds', 'Weight', 'Amount', 'Status'],
      rows: purchaseData?.purchases?.length
        ? purchaseData.purchases.map((p: any) => [
            p.orderNumber || '', new Date(p.orderDate).toLocaleDateString('en-GB'), p.supplierName || '',
            String(p.numberOfBirds || p.totalBirds || 0),
            `${(parseFloat(p.totalWeight) || parseFloat(p.quantity) || 0).toFixed(2)} kg`,
            `Rs. ${parseFloat(p.netAmount || 0).toFixed(2)}`, p.purchasePaymentStatus || '',
          ])
        : noData(7),
    })

    sections.push({
      title: 'Sales',
      headers: ['Bill No', 'Date', 'Customer', 'Birds', 'Weight', 'Shortage (kg)', 'Deductions', 'Amount', 'Status'],
      rows: salesData?.sales?.length
        ? salesData.sales.map((s: any) => [
            s.invoiceNumber || '', new Date(s.saleDate).toLocaleDateString('en-GB'), s.customerName || '',
            String(s.totalBirds || s.numberOfBirds || 0),
            `${(parseFloat(s.totalWeight) || parseFloat(s.quantity) || 0).toFixed(2)} kg`,
            `${(() => { const kg = parseFloat(s.weightShortageKg || 0); if (kg > 0) return kg.toFixed(2); const amt = parseFloat(s.weightShortage || 0); const rate = parseFloat(s.unitPrice || 0); return (amt > 0 && rate > 0) ? (amt / rate).toFixed(2) : '0.00'; })()} kg`,
            `Rs. ${(parseFloat(s.weightShortage || 0) + parseFloat(s.mortalityDeduction || 0) + parseFloat(s.otherDeduction || 0)).toFixed(2)}`,
            `Rs. ${parseFloat(s.netAmount || 0).toFixed(2)}`, s.paymentStatus || '',
          ])
        : noData(9),
    })

    sections.push({
      title: 'Godown Sales',
      headers: ['Bill No', 'Date', 'Customer', 'Birds', 'Weight', 'Wt Shortage', 'Amount', 'Status'],
      rows: godownSalesData?.sales?.length
        ? godownSalesData.sales.map((s: any) => [
            s.invoiceNumber || s.saleNo || '', new Date(s.saleDate).toLocaleDateString('en-GB'), s.customerName || '',
            String(s.numberOfBirds || 0), `${parseFloat(s.totalWeight || 0).toFixed(2)} kg`,
            `${parseFloat(s.weightLoss || 0).toFixed(2)} kg`, `Rs. ${parseFloat(s.totalAmount || 0).toFixed(2)}`,
            s.paymentStatus || '',
          ])
        : noData(8),
    })

    const mortalityRowsForExport = filterMortalityRows(Array.isArray(mortalityData) ? mortalityData : mortalityData?.records || [])

    sections.push({
      title: 'Mortality',
      headers: ['Date', 'Birds Died', 'Weight (kg)', 'Amount'],
      rows: mortalityRowsForExport.length
        ? mortalityRowsForExport.map((record: any) => [
            formatDate(record.purchaseDate || record.mortalityDate || record.createdAt || ''),
            String(parseFloat(record.numberOfBirdsDied || record.mortalityBirds || 0).toFixed(0)),
            `${parseFloat(record.weightOfDeadBirds || record.mortalityWeight || 0).toFixed(2)} kg`,
            `Rs. ${parseFloat(record.amount || record.mortalityDeduction || 0).toFixed(2)}`,
          ])
        : noData(4),
    })

    sections.push({
      title: 'Available Stock',
      headers: ['Metric', 'Value'],
      rows: stockData
        ? [
            ['Birds in Godown', String(stockData.godown?.currentStock ?? 0)],
            ['Bird Weight', `${(stockData.godown?.currentWeight ?? 0).toFixed(2)} kg`],
            ['Bird Value', `Rs. ${(stockData.godown?.currentValue ?? 0).toFixed(2)}`],
          ]
        : noData(2),
    })

    if (stockData?.inventory?.length) {
      sections.push({
        title: 'Inventory Items',
        headers: ['Name', 'Type', 'Stock Level', 'Unit', 'Reorder Level'],
        rows: stockData.inventory.map((i: any) => [
          i.name || '', i.type || i.itemType || '-',
          String(i.currentStockLevel ?? 0), i.unit || 'kg',
          String(i.reorderLevel || '-'),
        ]),
      })
    }

    sections.push({
      title: 'Expenses',
      headers: ['Category', 'Amount', 'Percentage', 'Count'],
      rows: expenseData?.breakdown?.length
        ? expenseData.breakdown.map((e: any) => [
            e.category || '', `Rs. ${(e.amount || 0).toFixed(2)}`, `${(e.percentage || 0).toFixed(1)}%`, String(e.count || 0),
          ])
        : noData(4),
    })

    sections.push({
      title: 'Farm-wise Profit',
      headers: ['Farmer', 'Orders', 'Total Cost', 'Weight'],
      rows: farmWiseData?.farms?.length
        ? farmWiseData.farms.map((f: any) => [
            f.farmerName || '', String(f.totalOrders || 0), `Rs. ${(f.totalCost || 0).toFixed(2)}`, `${(f.totalWeight || 0).toFixed(2)} kg`,
          ])
        : noData(4),
    })

    sections.push({
      title: 'Customer-wise Sales',
      headers: ['Customer', 'Sales', 'Revenue', 'Quantity'],
      rows: customerWiseData?.customers?.length
        ? customerWiseData.customers.map((c: any) => [
            c.customerName || '', String(c.totalSales || 0), `Rs. ${(c.totalRevenue || 0).toFixed(2)}`, `${(c.totalQuantity || 0).toFixed(2)}`,
          ])
        : noData(4),
    })

    sections.push({
      title: 'Outstanding',
      headers: ['Retailer', 'Total Sales', 'Received', 'Outstanding'],
      rows: outstandingData?.data?.length
        ? outstandingData.data.slice(0, 50).map((r: any) => [
            r.name || '', `Rs. ${(r.totalSales || 0).toLocaleString('en-IN')}`, `Rs. ${(r.totalReceived || 0).toLocaleString('en-IN')}`, `Rs. ${(r.outstanding || 0).toLocaleString('en-IN')}`,
          ])
        : noData(4),
    })

    sections.forEach((sec, i) => {
      if (i > 0) y += 6
      doc.setFontSize(12)
      doc.text(sec.title, 14, y)
      y += 6
      autoTable(doc, {
        head: [sec.headers],
        body: sec.rows,
        startY: y,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [55, 65, 81], textColor: 255 },
        margin: { left: 14, right: 14 },
      })
      y = (doc as any).lastAutoTable.finalY + 4
    })

    doc.save(`reports_${startDate}_${endDate}.pdf`)
  }

  const fetchMortalityReport = async () => {
    try {
      setLoading(true)
      const data = await mortalityApi.getAll(startDate, endDate)
      const rows = Array.isArray(data) ? data : []
      setMortalityData(filterMortalityRows(rows))
    } catch (error: any) {
      console.error('Error fetching mortality report:', error)
      toast.error(error.message || 'Failed to load mortality report')
    } finally {
      setLoading(false)
    }
  }

  const generateAllReports = () => {
    if (!startDate || !endDate) return toast.error('Select date range')
    fetchReport('profit-loss', setProfitLossData)
    fetchReport('expense-breakdown', setExpenseData)
    fetchReport('farm-wise-profit', setFarmWiseData)
    fetchReport('customer-wise-sales', setCustomerWiseData)
    fetchReport('purchases', setPurchaseData)
    fetchReport('sales', setSalesData)
    fetchReport('godown-sales', setGodownSalesData)
    fetchMortalityReport()
    fetchReport('outstanding', setOutstandingData)
    fetchStockReport()
  }

  const fetchStockReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const [godownRes, inventoryRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/godown/summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/inventory`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!godownRes.ok) throw new Error('Failed to fetch godown summary')
      if (!inventoryRes.ok) throw new Error('Failed to fetch inventory')
      const godownData = await godownRes.json()
      const inventoryData = await inventoryRes.json()
      setStockData({ godown: godownData, inventory: inventoryData })
    } catch (error: any) {
      toast.error(error.message || 'Failed to load stock data')
    }
  }

  const salesRows = salesData?.sales || []
  const n = (v: any) => {
    const x = Number(v)
    return Number.isFinite(x) ? x : 0
  }
  const normalizeStatus = (value: any) => String(value || '').trim().toLowerCase()
  const salesSummaryDerived = {
    totalSales: salesRows.length,
    totalBirds: salesRows.reduce((sum: number, s: any) => sum + n(s.totalBirds || s.numberOfBirds || s.birds || s.quantity), 0),
    totalWeight: salesRows.reduce((sum: number, s: any) => sum + n(s.totalWeight || s.weight || s.quantity || s.totalQuantity), 0),
    totalRevenue: salesRows.reduce((sum: number, s: any) => sum + n(s.netAmount || s.totalAmount || s.amount || s.totalNetAmount), 0),
    totalWeightShortageKg: salesRows.reduce((sum: number, s: any) => {
      const kg = n(s.weightShortageKg)
      if (kg > 0) return sum + kg
      const shortageAmount = n(s.weightShortage)
      const rate = n(s.unitPrice)
      return sum + (shortageAmount > 0 && rate > 0 ? shortageAmount / rate : 0)
    }, 0),
    totalDeductions: salesRows.reduce((sum: number, s: any) => {
      const weightShortageAmount = n(s.weightShortage)
      const mortality = n(s.mortalityDeduction)
      const other = n(s.otherDeduction)
      return sum + weightShortageAmount + mortality + other
    }, 0),
    totalPaid: salesRows.filter((s: any) => normalizeStatus(s.paymentStatus || s.status) === 'paid').length,
    totalPending: salesRows.filter((s: any) => normalizeStatus(s.paymentStatus || s.status) === 'pending').length,
    totalPartial: salesRows.filter((s: any) => normalizeStatus(s.paymentStatus || s.status) === 'partial').length,
  }
  const salesSummary = {
    totalSales: n(salesData?.summary?.totalSales) > 0 ? n(salesData?.summary?.totalSales) : salesSummaryDerived.totalSales,
    totalBirds: n(salesData?.summary?.totalBirds || salesData?.summary?.numberOfBirds) > 0 ? n(salesData?.summary?.totalBirds || salesData?.summary?.numberOfBirds) : salesSummaryDerived.totalBirds,
    totalWeight: n(salesData?.summary?.totalWeight || salesData?.summary?.totalQuantity) > 0 ? n(salesData?.summary?.totalWeight || salesData?.summary?.totalQuantity) : salesSummaryDerived.totalWeight,
    totalRevenue: n(salesData?.summary?.totalNetAmount || salesData?.summary?.totalAmount || salesData?.summary?.revenue) > 0 ? n(salesData?.summary?.totalNetAmount || salesData?.summary?.totalAmount || salesData?.summary?.revenue) : salesSummaryDerived.totalRevenue,
    totalDeductions: n(salesData?.summary?.totalDeductions) > 0 ? n(salesData?.summary?.totalDeductions) : salesSummaryDerived.totalDeductions,
    totalWeightShortageKg: n(salesData?.summary?.totalWeightShortageKg) > 0 ? n(salesData?.summary?.totalWeightShortageKg) : salesSummaryDerived.totalWeightShortageKg,
    totalPaid: n(salesData?.summary?.totalPaid) > 0 ? n(salesData?.summary?.totalPaid) : salesSummaryDerived.totalPaid,
    totalPending: n(salesData?.summary?.totalPending) > 0 ? n(salesData?.summary?.totalPending) : salesSummaryDerived.totalPending,
  }

  const purchaseRows = purchaseData?.purchases || []
  const purchaseSummaryDerived = {
    totalOrders: purchaseRows.length,
    totalBirds: purchaseRows.reduce((sum: number, p: any) => sum + n(p.totalBirds || p.numberOfBirds || p.birds || p.quantity), 0),
    totalWeight: purchaseRows.reduce((sum: number, p: any) => sum + n(p.totalWeight || p.weight || p.quantity || p.totalQuantity), 0),
    totalAmount: purchaseRows.reduce((sum: number, p: any) => sum + n(p.netAmount || p.totalAmount || p.amount || p.totalNetAmount), 0),
    totalPaid: purchaseRows.filter((p: any) => normalizeStatus(p.purchasePaymentStatus || p.paymentStatus || p.status) === 'paid').length,
    totalPending: purchaseRows.filter((p: any) => normalizeStatus(p.purchasePaymentStatus || p.paymentStatus || p.status) === 'pending').length,
    totalPartial: purchaseRows.filter((p: any) => normalizeStatus(p.purchasePaymentStatus || p.paymentStatus || p.status) === 'partial').length,
  }

  const purchaseSummary = {
    totalOrders: n(purchaseData?.summary?.totalOrders) > 0 ? n(purchaseData?.summary?.totalOrders) : purchaseSummaryDerived.totalOrders,
    totalBirds: n(purchaseData?.summary?.totalBirds || purchaseData?.summary?.numberOfBirds) > 0 ? n(purchaseData?.summary?.totalBirds || purchaseData?.summary?.numberOfBirds) : purchaseSummaryDerived.totalBirds,
    totalWeight: n(purchaseData?.summary?.totalWeight || purchaseData?.summary?.totalQuantity) > 0 ? n(purchaseData?.summary?.totalWeight || purchaseData?.summary?.totalQuantity) : purchaseSummaryDerived.totalWeight,
    totalAmount: n(purchaseData?.summary?.totalNetAmount || purchaseData?.summary?.totalAmount || purchaseData?.summary?.amount) > 0 ? n(purchaseData?.summary?.totalNetAmount || purchaseData?.summary?.totalAmount || purchaseData?.summary?.amount) : purchaseSummaryDerived.totalAmount,
    totalPaid: n(purchaseData?.summary?.totalPaid) > 0 ? n(purchaseData?.summary?.totalPaid) : purchaseSummaryDerived.totalPaid,
    totalPending: n(purchaseData?.summary?.totalPending) > 0 ? n(purchaseData?.summary?.totalPending) : purchaseSummaryDerived.totalPending,
  }

  const godownSalesRows = godownSalesData?.sales || []
  const godownSalesSummary = {
    totalSales: n(godownSalesData?.summary?.totalSales) > 0 ? n(godownSalesData?.summary?.totalSales) : godownSalesRows.length,
    totalAmount: n(godownSalesData?.summary?.totalAmount) > 0 ? n(godownSalesData?.summary?.totalAmount) : godownSalesRows.reduce((sum: number, s: any) => sum + n(s.totalAmount || s.amount || s.netAmount), 0),
    totalBirds: n(godownSalesData?.summary?.totalBirds || godownSalesData?.summary?.numberOfBirds) > 0 ? n(godownSalesData?.summary?.totalBirds || godownSalesData?.summary?.numberOfBirds) : godownSalesRows.reduce((sum: number, s: any) => sum + n(s.numberOfBirds || s.totalBirds || s.birds || s.quantity), 0),
  }

  const mortalityRows = filterMortalityRows(Array.isArray(mortalityData) ? mortalityData : mortalityData?.records || [])
  const getMortalityFieldValue = (row: any, keys: string[]) => {
    for (const key of keys) {
      const value = row?.[key]
      if (value === null || value === undefined || value === '') continue
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
    return 0
  }
  const mortalitySummary = {
    totalOrders: mortalityRows.length,
    totalMortalityWeight: mortalityRows.reduce((sum: number, record: any) => sum + getMortalityFieldValue(record, ['weightOfDeadBirds', 'mortalityWeight', 'deadWeight', 'totalMortalityWeight']), 0),
    totalMortalityDeduction: mortalityRows.reduce((sum: number, record: any) => sum + getMortalityFieldValue(record, ['amount', 'mortalityDeduction', 'mortalityAmount', 'deductionAmount']), 0),
    averageMortalityPerOrder: mortalityRows.length > 0
      ? mortalityRows.reduce((sum: number, record: any) => sum + getMortalityFieldValue(record, ['amount', 'mortalityDeduction', 'mortalityAmount', 'deductionAmount']), 0) / mortalityRows.length
      : 0,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Comprehensive business analytics</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Date Range</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <DatePicker value={startDate} onChange={setStartDate} placeholder="Start" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <DatePicker value={endDate} onChange={setEndDate} placeholder="End" />
              </div>
              <Button onClick={generateAllReports} className="mt-7">Generate</Button>
              <Button variant="outline" onClick={downloadAllPDF} className="mt-7"><FileText className="mr-2" size={16} />PDF</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>
            <TableIcon className="mr-2" size={16} />Table
          </Button>
          <Button variant={viewMode === 'chart' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('chart')}>
            <BarChart3 className="mr-2" size={16} />Chart
          </Button>
          <Button variant={viewMode === 'pie' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('pie')}>
            <PieChartIcon className="mr-2" size={16} />Pie
          </Button>
        </div>

        <Tabs defaultValue="profitloss">
          <TabsList className="grid w-full grid-cols-5" style={{ height: 'auto' }}>
            <TabsTrigger value="profitloss">P&L</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="godownsales">Godown Sales</TabsTrigger>
            <TabsTrigger value="mortality">Mortality</TabsTrigger>
            <TabsTrigger value="stock">Stock Type</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="farm">Farm-wise</TabsTrigger>
            <TabsTrigger value="customer">Customer-wise</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
          </TabsList>

          {/* Profit & Loss */}
          <TabsContent value="profitloss">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => profitLossData && downloadCSV([profitLossData.summary], 'pl')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? <p className="text-center py-8">Loading...</p> : !profitLossData ? (
                  <p className="text-center py-8 text-muted-foreground">Select dates and generate</p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold text-green-600">₹{profitLossData.summary.totalRevenue.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="text-2xl font-bold text-red-600">₹{profitLossData.summary.totalCost.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Gross Profit</p>
                        <p className="text-2xl font-bold">₹{profitLossData.summary.grossProfit.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Expenses</p>
                        <p className="text-2xl font-bold text-orange-600">₹{profitLossData.summary.totalExpenses.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className="text-2xl font-bold text-blue-600">₹{profitLossData.summary.netProfit.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Margin</p>
                        <p className="text-2xl font-bold">{profitLossData.summary.profitMargin.toFixed(2)}%</p>
                      </div>
                    </div>
                    {viewMode === 'chart' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { name: 'Revenue', value: profitLossData.summary.totalRevenue },
                          { name: 'Cost', value: profitLossData.summary.totalCost },
                          { name: 'Expenses', value: profitLossData.summary.totalExpenses },
                          { name: 'Net Profit', value: profitLossData.summary.netProfit },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {viewMode === 'pie' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={[
                            { name: 'Revenue', value: profitLossData.summary.totalRevenue },
                            { name: 'Cost', value: profitLossData.summary.totalCost },
                            { name: 'Expenses', value: profitLossData.summary.totalExpenses },
                          ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {[0, 1, 2].map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchases Report */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Purchase Report</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => purchaseData && downloadCSV(purchaseData.purchases, 'purchases')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!purchaseData ? <p className="text-center py-8 text-muted-foreground">Generate report</p> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{purchaseSummary.totalOrders}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Birds</p>
                        <p className="text-2xl font-bold">{purchaseSummary.totalBirds}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Weight</p>
                        <p className="text-2xl font-bold">{purchaseSummary.totalWeight.toFixed(2)} kg</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold">₹{purchaseSummary.totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Paid Orders</p>
                        <p className="text-2xl font-bold text-green-600">{purchaseSummary.totalPaid}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-right">Birds</TableHead>
                            <TableHead className="text-right">Weight</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchaseData.purchases.map((purchase: any) => (
                            <TableRow key={purchase.id}>
                              <TableCell>{purchase.orderNumber}</TableCell>
                              <TableCell>{new Date(purchase.orderDate).toLocaleDateString()}</TableCell>
                              <TableCell>{purchase.supplierName}</TableCell>
                              <TableCell className="text-right">{purchase.numberOfBirds || purchase.totalBirds || 0}</TableCell>
                              <TableCell className="text-right">{((parseFloat(purchase.totalWeight) || parseFloat(purchase.quantity) || 0)).toFixed(2)} kg</TableCell>
                              <TableCell className="text-right">₹{parseFloat(purchase.netAmount || purchase.totalAmount || 0).toFixed(2)}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${purchase.purchasePaymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                    purchase.purchasePaymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                  }`}>
                                  {purchase.purchasePaymentStatus}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {viewMode === 'chart' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { name: 'Paid', value: purchaseData.summary.totalPaid },
                          { name: 'Partial', value: purchaseData.summary.totalPartial },
                          { name: 'Pending', value: purchaseData.summary.totalPending },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {viewMode === 'pie' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={[
                            { name: 'Paid', value: purchaseData.summary.totalPaid },
                            { name: 'Partial', value: purchaseData.summary.totalPartial },
                            { name: 'Pending', value: purchaseData.summary.totalPending },
                          ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {[0, 1, 2].map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Report */}
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Sales Report</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => salesData && downloadCSV(salesData.sales, 'sales')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!salesData ? <p className="text-center py-8 text-muted-foreground">Generate report</p> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-8 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="text-2xl font-bold">{salesSummary.totalSales}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Birds</p>
                        <p className="text-2xl font-bold">
                          {salesSummary.totalBirds}
                        </p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Weight</p>
                        <p className="text-2xl font-bold">
                          {salesSummary.totalWeight.toFixed(2)} kg
                        </p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold">₹{salesSummary.totalRevenue.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Deductions</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{salesSummary.totalDeductions.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Wt Shortage (kg)</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {salesSummary.totalWeightShortageKg.toFixed(2)} kg
                        </p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Paid Orders</p>
                        <p className="text-2xl font-bold text-green-600">{salesSummary.totalPaid}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Pending Orders</p>
                        <p className="text-2xl font-bold text-red-600">{salesSummary.totalPending}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bill No</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Birds</TableHead>
                            <TableHead className="text-right">Weight</TableHead>
                            <TableHead>Wt Shortage</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesData.sales.map((sale: any) => (
                            <TableRow key={sale.id}>
                              <TableCell>{sale.invoiceNumber}</TableCell>
                              <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                              <TableCell>{sale.customerName}</TableCell>
                              <TableCell className="text-right">{sale.totalBirds || sale.numberOfBirds || 0}</TableCell>
                              <TableCell className="text-right">{((parseFloat(sale.totalWeight) || parseFloat(sale.quantity) || 0)).toFixed(2)} kg</TableCell>
                              <TableCell className="text-orange-600">{(() => { const kg = parseFloat(sale.weightShortageKg || 0); if (kg > 0) return kg.toFixed(2); const amt = parseFloat(sale.weightShortage || 0); const rate = parseFloat(sale.unitPrice || 0); return (amt > 0 && rate > 0) ? (amt / rate).toFixed(2) : '0.00'; })()} kg</TableCell>
                              <TableCell className="text-right">₹{parseFloat(sale.netAmount).toFixed(2)}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                    sale.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                  }`}>
                                  {sale.paymentStatus}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {viewMode === 'chart' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { name: 'Paid', value: salesData.summary.totalPaid },
                          { name: 'Partial', value: salesData.summary.totalPartial },
                          { name: 'Pending', value: salesData.summary.totalPending },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {viewMode === 'pie' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={[
                            { name: 'Paid', value: salesData.summary.totalPaid },
                            { name: 'Partial', value: salesData.summary.totalPartial },
                            { name: 'Pending', value: salesData.summary.totalPending },
                          ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {[0, 1, 2].map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Godown Sales Report */}
          <TabsContent value="godownsales">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Godown Sales Report</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => godownSalesData && downloadCSV(godownSalesData.sales, 'godown-sales')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!godownSalesData ? <p className="text-center py-8 text-muted-foreground">Generate report</p> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="text-2xl font-bold">{godownSalesSummary.totalSales}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold">₹{godownSalesSummary.totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Birds</p>
                        <p className="text-2xl font-bold">{godownSalesSummary.totalBirds}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bill No</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Birds</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Wt Shortage</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {godownSalesData.sales.map((sale: any) => (
                            <TableRow key={sale.id}>
                              <TableCell className="font-mono">{sale.invoiceNumber || sale.saleNo || '-'}</TableCell>
                              <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                              <TableCell>{sale.customerName || '-'}</TableCell>
                              <TableCell className="text-right">{sale.numberOfBirds || 0}</TableCell>
                              <TableCell className="text-right">{parseFloat(sale.totalWeight || 0).toFixed(2)} kg</TableCell>
                              <TableCell className="text-right text-orange-600">{parseFloat(sale.weightLoss || 0).toFixed(2)} kg</TableCell>
                              <TableCell className="text-right">₹{parseFloat(sale.totalAmount || 0).toFixed(2)}</TableCell>
                              <TableCell><span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : sale.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{sale.paymentStatus || '-'}</span></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {viewMode === 'chart' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={godownSalesData.sales.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="saleNo" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="weightLoss" fill="#FF8042" name="Weight Loss (kg)" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mortality Report */}
          <TabsContent value="mortality">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Mortality Report</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => mortalityRows.length && downloadCSV(mortalityRows, 'mortality')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!mortalityData ? <p className="text-center py-8 text-muted-foreground">Generate report</p> : (
                  <div className="space-y-6">
                      <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Orders with Mortality</p>
                        <p className="text-2xl font-bold">{mortalitySummary.totalOrders}</p>
                      </div>
                        <div className="p-4 border rounded">
                          <p className="text-sm text-muted-foreground">Total Mortality Weight</p>
                          <p className="text-2xl font-bold text-orange-600">{mortalitySummary.totalMortalityWeight.toFixed(2)} kg</p>
                        </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Deduction</p>
                        <p className="text-2xl font-bold text-red-600">₹{mortalitySummary.totalMortalityDeduction.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Average per Order</p>
                        <p className="text-2xl font-bold">₹{mortalitySummary.averageMortalityPerOrder.toFixed(2)}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && mortalityRows.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Birds Died</TableHead>
                            <TableHead className="text-right">Weight (kg)</TableHead>
                            <TableHead>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mortalityRows.map((record: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{formatDate(record.purchaseDate || record.mortalityDate || record.createdAt || '')}</TableCell>
                              <TableCell className="text-right">{getMortalityFieldValue(record, ['numberOfBirdsDied', 'mortalityBirds', 'birdsDied', 'deadBirds', 'totalBirdsDied'])}</TableCell>
                              <TableCell className="text-right">{getMortalityFieldValue(record, ['weightOfDeadBirds', 'mortalityWeight', 'deadWeight', 'totalMortalityWeight']).toFixed(2)} kg</TableCell>
                              <TableCell className="text-red-600">₹{getMortalityFieldValue(record, ['amount', 'mortalityDeduction', 'mortalityAmount', 'deductionAmount']).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {mortalityRows.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">No mortality data in selected period</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Stock */}
          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Available Stock in Godown</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => {
                    if (!stockData) return
                    const summary = [
                      { Metric: 'Birds in Godown', Value: stockData.godown?.currentStock ?? 0 },
                      { Metric: 'Bird Weight (kg)', Value: (stockData.godown?.currentWeight ?? 0).toFixed(2) },
                      { Metric: 'Bird Value (Rs)', Value: (stockData.godown?.currentValue ?? 0).toFixed(2) },
                    ]
                    downloadCSV([...summary, ...(stockData.inventory || []).map((i: any) => ({ Metric: i.name || i.itemName, Value: `${i.currentStockLevel ?? 0} ${i.unit || 'pcs'}` }))], 'stock')
                  }}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!stockData ? <p className="text-center py-8 text-muted-foreground">Generate stock report</p> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded bg-blue-50">
                        <p className="text-sm text-muted-foreground">Birds in Godown</p>
                        <p className="text-2xl font-bold text-blue-600">{stockData.godown?.currentStock ?? 0}</p>
                      </div>
                      <div className="p-4 border rounded bg-indigo-50">
                        <p className="text-sm text-muted-foreground">Bird Weight</p>
                        <p className="text-2xl font-bold text-indigo-600">{(stockData.godown?.currentWeight ?? 0).toFixed(2)} kg</p>
                      </div>
                      <div className="p-4 border rounded bg-teal-50">
                        <p className="text-sm text-muted-foreground">Bird Value</p>
                        <p className="text-2xl font-bold text-teal-600">₹{(stockData.godown?.currentValue ?? 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {(() => {
                      const filtered = stockData.inventory || []
                      return filtered.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Stock Level</TableHead>
                              <TableHead className="text-right">Unit</TableHead>
                              <TableHead className="text-right">Reorder Level</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filtered.map((item: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="capitalize">{item.type || item.itemType || '-'}</TableCell>
                                <TableCell className={`text-right ${item.currentStockLevel <= (item.reorderLevel || 0) ? 'text-red-600 font-bold' : ''}`}>
                                  {item.currentStockLevel ?? 0}
                                </TableCell>
                                <TableCell className="text-right">{item.unit || 'kg'}</TableCell>
                                <TableCell className="text-right">{item.reorderLevel || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center py-4 text-muted-foreground">No items match filters</p>
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Breakdown */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Expense Breakdown</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => expenseData && downloadCSV(expenseData.breakdown, 'expenses')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!expenseData ? <p className="text-center py-8 text-muted-foreground">Generate report</p> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold">₹{expenseData.summary.totalExpenses.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Categories</p>
                        <p className="text-2xl font-bold">{expenseData.summary.categoryCount}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenseData.breakdown.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>₹{item.amount.toFixed(2)}</TableCell>
                              <TableCell>{item.percentage.toFixed(1)}%</TableCell>
                              <TableCell>{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {viewMode === 'chart' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={expenseData.breakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="amount" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {viewMode === 'pie' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={expenseData.breakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                            {expenseData.breakdown.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Farm-wise */}
          <TabsContent value="farm">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Farm-wise Profit</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => farmWiseData && downloadCSV(farmWiseData.farms, 'farms')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!farmWiseData ? <p className="text-center py-8 text-muted-foreground">Generate report</p> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Farms</p>
                        <p className="text-2xl font-bold">{farmWiseData.summary.totalFarms}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold">₹{farmWiseData.summary.totalCost.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{farmWiseData.summary.totalOrders}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Farmer</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Weight</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {farmWiseData.farms.map((farm: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{farm.farmerName}</TableCell>
                              <TableCell>{farm.totalOrders}</TableCell>
                              <TableCell>₹{farm.totalCost.toFixed(2)}</TableCell>
                              <TableCell>{farm.totalWeight.toFixed(2)} kg</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {viewMode === 'chart' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={farmWiseData.farms.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="farmerName" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="totalCost" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer-wise */}
          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Customer-wise Sales</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => customerWiseData && downloadCSV(customerWiseData.customers, 'customers')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!customerWiseData ? <p className="text-center py-8 text-muted-foreground">Generate report</p> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Customers</p>
                        <p className="text-2xl font-bold">{customerWiseData.summary.totalCustomers}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">₹{customerWiseData.summary.totalRevenue.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="text-2xl font-bold">{customerWiseData.summary.totalSales}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Sales</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Quantity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerWiseData.customers.map((customer: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{customer.customerName}</TableCell>
                              <TableCell>{customer.totalSales}</TableCell>
                              <TableCell>₹{customer.totalRevenue.toFixed(2)}</TableCell>
                              <TableCell>{customer.totalQuantity.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {viewMode === 'chart' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={customerWiseData.customers.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="customerName" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="totalRevenue" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {viewMode === 'pie' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={customerWiseData.customers.slice(0, 6)} dataKey="totalRevenue" nameKey="customerName" cx="50%" cy="50%" outerRadius={100} label>
                            {customerWiseData.customers.slice(0, 6).map((_: any, index: number) => <Cell key={index} fill={COLORS[index]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outstanding */}
          <TabsContent value="outstanding">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Retailer Outstanding</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => outstandingData && downloadCSV(outstandingData.data, 'outstanding')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!outstandingData ? <p className="text-center py-8 text-muted-foreground">Generate report</p> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded bg-red-50">
                        <p className="text-sm text-muted-foreground">Total Outstanding</p>
                        <p className="text-2xl font-bold text-red-600">₹{outstandingData.summary.totalOutstanding.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 border rounded bg-blue-50">
                        <p className="text-sm text-muted-foreground">Overpaid</p>
                        <p className="text-2xl font-bold text-blue-600">₹{outstandingData.summary.totalOverpaid.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 border rounded bg-green-50">
                        <p className="text-sm text-muted-foreground">Total Retailers</p>
                        <p className="text-2xl font-bold text-green-600">{outstandingData.summary.totalRetailers}</p>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Retailer</TableHead>
                          <TableHead className="text-right">Total Sales</TableHead>
                          <TableHead className="text-right">Received</TableHead>
                          <TableHead className="text-right font-bold">Outstanding</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outstandingData.data.slice(0, 20).map((r: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell className="text-right">₹{r.totalSales.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right text-green-600">₹{r.totalReceived.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right font-bold text-red-600">₹{r.outstanding.toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {outstandingData.total > 20 && (
                      <p className="text-center text-sm text-muted-foreground py-2 border-t">
                        Showing top 20 retailers. View full report in Billing {'>'} Reports {'>'} Outstanding.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
