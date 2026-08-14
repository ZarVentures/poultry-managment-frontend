'use client'

import React from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpRight, TrendingUp, TrendingDown, DollarSign, Calendar, FileText } from 'lucide-react'
import { billingApi } from '@/lib/api'

interface StatementRow {
  label: string
  value: number
  type: string
  section?: string
}

interface StatementItem {
  label: string
  amount: number
  bold?: boolean
  highlight?: boolean
  negative?: boolean
  positive?: boolean
  dark?: boolean
  indent?: boolean
}

interface StatementSection {
  section: string
  items: StatementItem[]
}

const fmtCurrency = (amount: number) => {
  const n = Number(amount) || 0
  const formatted = Math.abs(n).toLocaleString('en-IN')
  if (n < 0) return `-₹${formatted}`
  return `₹${formatted}`
}

const CompanyLedgerReportPage = () => {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')

  const fetchReport = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await billingApi.getCompanyReport(
        dateFrom || undefined,
        dateTo || undefined,
      )
      setData(res)
    } catch (err) {
      console.error(err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  React.useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const summary = data?.summary || { totalRevenue: 0, grossProfit: 0, operatingExpenses: 0, netProfit: 0 }

  const detailedStatement: StatementSection[] = data?.detailedStatement?.length
    ? (() => {
        const rows = data.detailedStatement as StatementRow[]
        const sectionLabels: Record<string, string> = {
          REVENUE: 'REVENUE',
          COGS: 'COST OF GOODS SOLD',
          OPERATING: 'OPERATING EXPENSES',
          PROFIT: '',
        }

        const toItem = (row: StatementRow): StatementItem => {
          const value = Number(row.value) || 0
          const isDeduction = row.type === 'deduction' || row.label === 'Closing Stock (Less)'
          const displayAmount = isDeduction ? -Math.abs(value) : value
          const isLoss = row.type === 'profit' && value < 0

          return {
            label: row.label,
            amount: displayAmount,
            indent: row.label.startsWith('  '),
            bold: ['Total Sales Revenue', 'Cost of Goods Sold', 'Gross Profit', 'Total Operating Expenses', 'Net Profit / Loss'].includes(row.label),
            highlight: ['Total Sales Revenue', 'Gross Profit', 'Net Profit / Loss'].includes(row.label),
            positive: (row.type === 'income' || (row.type === 'profit' && value >= 0)) && !isDeduction,
            negative: isDeduction || isLoss,
            dark: row.label === 'Net Profit / Loss',
          }
        }

        const sections: StatementSection[] = []
        let currentSection = ''
        let currentItems: StatementItem[] = []

        const flush = () => {
          if (currentItems.length) {
            sections.push({
              section: sectionLabels[currentSection] ?? currentSection,
              items: currentItems,
            })
            currentItems = []
          }
        }

        for (const row of rows) {
          const section = row.section || 'OTHER'
          if (section !== currentSection) {
            flush()
            currentSection = section
          }
          currentItems.push(toItem(row))
        }
        flush()

        return sections
      })()
    : []

  const keyInsight = {
    title: data?.keyInsights?.map((k: any) => k.message).join('. ') || 'No insights for selected period.',
    netProfitMargin: data?.summary?.totalRevenue ? ((data.summary.netProfit / data.summary.totalRevenue) * 100).toFixed(1) : 0,
    expenseRatio: data?.summary?.totalRevenue ? ((data.summary.operatingExpenses / data.summary.totalRevenue) * 100).toFixed(1) : 0,
  }

  const grossMargin = summary.totalRevenue
    ? ((summary.grossProfit / summary.totalRevenue) * 100).toFixed(1)
    : '0.0'

  const dateRangeLabel = dateFrom && dateTo
    ? `${dateFrom} to ${dateTo}`
    : dateFrom
      ? `From ${dateFrom}`
      : dateTo
        ? `Up to ${dateTo}`
        : 'All time'

  const auditLog = data?.auditLog ? [
    {
      status: 'success',
      label: `Data Processed (${data.auditLog.dataSources.salesCount} Sales, ${data.auditLog.dataSources.godownSalesCount || 0} Godown Sales, ${data.auditLog.dataSources.purchasesCount} Purchases, ${data.auditLog.dataSources.expensesCount + (data.auditLog.dataSources.godownExpensesCount || 0)} Expenses)`,
      user: 'System',
      time: new Date(data.auditLog.generatedAt).toLocaleString(),
    },
  ] : []

  if (loading && !data) {
    return <DashboardLayout><div className="p-8 text-center text-gray-500">Loading Report Data...</div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Consolidated Profit & Loss statement{dateRangeLabel !== 'All time' ? ` for ${dateRangeLabel}` : ''}.
          </p>
        </div>

        <Card className="border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo('') }} disabled={!dateFrom && !dateTo}>
                Clear Dates
              </Button>
            </div>
          </div>
        </Card>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
          <Card className="border border-gray-200 p-5 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500">TOTAL REVENUE</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{fmtCurrency(summary.totalRevenue || 0)}</span>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 p-5 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500">GROSS PROFIT</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${summary.grossProfit < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {fmtCurrency(summary.grossProfit || 0)}
                </span>
                <ArrowUpRight className="w-8 h-8 text-blue-200" />
              </div>
              <div className={`text-xs mt-1 ${summary.grossProfit < 0 ? 'text-red-500' : 'text-gray-500'}`}>{grossMargin}% Gross Margin</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 p-5 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-gray-500">OP. EXPENSES</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{fmtCurrency(summary.operatingExpenses || 0)}</span>
                <TrendingDown className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          <Card className={`border p-5 shadow-sm ${summary.netProfit >= 0 ? 'border-green-600 bg-green-900/90' : 'border-red-600 bg-red-900/90'}`}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-white">NET PROFIT</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">{fmtCurrency(summary.netProfit || 0)}</span>
                <DollarSign className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="col-span-2">
            <Card className="border border-gray-200 p-0 shadow-sm">
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Statement</h3>
                <Button variant="ghost" size="sm"><FileText className="w-4 h-4 mr-2" />Export PDF</Button>
              </div>
              <div className="overflow-x-auto px-6 pb-6">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-2 text-left font-medium">PARTICULARS</th>
                      <th className="py-2 text-right font-medium">AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedStatement.length === 0 ? (
                      <tr><td colSpan={2} className="py-8 text-center text-gray-500">No data for selected period</td></tr>
                    ) : detailedStatement.map((section, idx) => (
                      <React.Fragment key={idx}>
                        {section.section && (
                          <tr className="bg-gray-50">
                            <td colSpan={2} className="py-2 font-semibold text-gray-700 uppercase tracking-wider">{section.section}</td>
                          </tr>
                        )}
                        {section.items.map((item, j) => (
                          <tr key={j} className={
                            item.highlight
                              ? item.negative && item.dark
                                ? 'bg-red-900 text-white'
                                : item.negative
                                  ? 'bg-red-50'
                                  : item.dark
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-green-50'
                              : ''
                          }>
                            <td className={`py-1 px-2 ${item.indent ? 'pl-6 text-gray-600' : ''} ${item.bold ? 'font-bold' : ''} ${item.negative ? 'text-red-600' : ''}`}>
                              {item.label}
                            </td>
                            <td className={`py-1 px-2 text-right ${item.bold ? 'font-bold' : ''} ${item.negative ? 'text-red-600' : ''} ${item.positive ? 'text-green-600' : ''} ${item.dark ? 'text-white' : ''}`}>
                              {fmtCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <div className="flex flex-col gap-6">
            <Card className="border border-gray-200 p-5 shadow-sm">
              <div className="mb-2 font-semibold text-gray-800">Key Insight</div>
              <div className="text-gray-600 text-sm mb-4">{keyInsight.title}</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">NET PROFIT MARGIN</span>
                  <span className={`font-bold ${Number(keyInsight.netProfitMargin) < 0 ? 'text-red-600' : 'text-green-700'}`}>{keyInsight.netProfitMargin}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">EXPENSE RATIO</span>
                  <span className="font-bold text-blue-700">{keyInsight.expenseRatio}%</span>
                </div>
              </div>
            </Card>
            <Card className="border border-gray-200 p-5 shadow-sm">
              <div className="mb-2 font-semibold text-gray-800">Activity Audit Log</div>
              <div className="flex flex-col gap-3">
                {auditLog.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium text-gray-900">{log.label}</span>
                    <span className="text-gray-400 ml-auto text-xs">{log.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CompanyLedgerReportPage
