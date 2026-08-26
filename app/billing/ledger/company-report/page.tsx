'use client'

import React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, BookOpen, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Building2, Calendar, FileText } from 'lucide-react'
import { billingApi } from '@/lib/api'

interface StatementItem {
  label: string
  amount: number
  bold?: boolean
  highlight?: boolean
  negative?: boolean
  positive?: boolean
  dark?: boolean
}

interface StatementSection {
  section?: string
  items: StatementItem[]
}

const CompanyLedgerReportPage = () => {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    billingApi.getCompanyReport().then((res) => {
      setData(res)
      setLoading(false)
    }).catch((err) => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const summary = data?.summary || { totalRevenue: 0, grossProfit: 0, operatingExpenses: 0, netProfit: 0 }

  const detailedStatement: StatementSection[] = data?.detailedStatement?.length
    ? (() => {
        const rows = data.detailedStatement as Array<{ label: string; value: number; type: string }>
        const toItem = (row: { label: string; value: number; type: string }): StatementItem => ({
          label: row.label,
          amount: row.label === 'Closing Stock (Less)' ? -Math.abs(Number(row.value || 0)) : Number(row.value || 0),
          bold: ['Total Sales Revenue', 'Cost of Goods Sold', 'Gross Profit', 'Total Operating Expenses', 'Net Profit / Loss'].includes(row.label),
          highlight: ['Total Sales Revenue', 'Gross Profit', 'Net Profit / Loss'].includes(row.label),
          positive: row.type === 'income' || (row.type === 'profit' && Number(row.value) >= 0),
          negative: row.label === 'Closing Stock (Less)' || (row.type === 'profit' && Number(row.value) < 0),
          dark: row.label === 'Net Profit / Loss',
        })

        const revenueEnd = rows.findIndex(r => r.label === 'Total Sales Revenue')
        const grossIdx = rows.findIndex(r => r.label === 'Gross Profit')
        const opExpStart = grossIdx >= 0 ? grossIdx + 1 : -1
        const opExpEnd = rows.findIndex(r => r.label === 'Total Operating Expenses')
        const netIdx = rows.findIndex(r => r.label === 'Net Profit / Loss')

        const sections: StatementSection[] = []
        if (revenueEnd >= 0) {
          sections.push({ section: 'REVENUE', items: rows.slice(0, revenueEnd + 1).map(toItem) })
        }
        if (grossIdx >= 0) {
          sections.push({ section: 'COST OF GOODS SOLD', items: rows.slice(revenueEnd + 1, grossIdx + 1).map(toItem) })
        }
        if (opExpStart >= 0 && opExpEnd >= opExpStart) {
          sections.push({ section: 'OPERATING EXPENSES', items: rows.slice(opExpStart, opExpEnd + 1).map(toItem) })
        }
        if (netIdx >= 0) {
          sections.push({ section: '', items: rows.slice(netIdx).map(toItem) })
        }
        return sections.length ? sections : [{ items: rows.map(toItem) }]
      })()
    : []

  const keyInsight = {
    title: data?.keyInsights?.map((k: any) => k.message).join('. ') || 'Loading insights...',
    netProfitMargin: data?.summary?.totalRevenue ? ((data.summary.netProfit / data.summary.totalRevenue) * 100).toFixed(1) : 0,
    expenseRatio: data?.summary?.totalRevenue ? ((data.summary.operatingExpenses / data.summary.totalRevenue) * 100).toFixed(1) : 0,
  }

  const auditLog = data?.auditLog ? [
    { status: 'success', label: `Data Processed (${data.auditLog.dataSources.salesCount} Sales, ${data.auditLog.dataSources.purchasesCount} Purchases)`, user: 'System', time: new Date(data.auditLog.generatedAt).toLocaleString() }
  ] : []

  if (loading) return <DashboardLayout><div className="p-8 text-center text-gray-500">Loading Report Data...</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
  
  {/* Left Content */}
  <div>
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black dark:text-slate-100">
      Performance Overview
    </h1>

    <p className="text-gray-500 text-sm sm:text-md mt-3">
      Consolidated Profit & Loss statement for the current fiscal year.
    </p>
  </div>

  {/* Right Toggle */}
  <div className="bg-gray-100 p-2 rounded-2xl flex items-center gap-2 w-fit">
    
    <button className="bg-white shadow-sm px-6 py-3 rounded-xl text-lg font-semibold text-black dark:bg-slate-700 dark:text-slate-100">
      YTD 2024
    </button>

    <button className="px-6 py-3 rounded-xl text-lg font-semibold text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition">
      Q1 2024
    </button>
  </div>
</div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">TOTAL REVENUE</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><TrendingUp size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-green-600 dark:text-green-400 min-w-0 truncate">₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1.5 truncate">↑ 12.5% Increase</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">GROSS PROFIT</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><ArrowUpRight size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-green-600 dark:text-green-400 min-w-0 truncate">₹{(summary.grossProfit || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1.5 truncate">63.3% Gross Margin</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">OP. EXPENSES</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><TrendingDown size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400 min-w-0 truncate">₹{(summary.operatingExpenses || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1.5 truncate">Managed Efficiently</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl transition-shadow hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground min-w-0 leading-tight">NET PROFIT (YTD)</CardTitle>
              <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><DollarSign size={16} className="lg:h-[18px] lg:w-[18px]" /></span>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-lg lg:text-2xl font-bold tracking-tight text-green-600 dark:text-green-400 min-w-0 truncate">₹{(summary.netProfit || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground mt-1.5 truncate">+ TARGET ACHIEVED</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Statement Table */}
          <div className="col-span-2">
            <Card className="rounded-2xl border border-gray-200 dark:border-slate-700 p-0 shadow-sm">
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Detailed Statement</h3>
                <Button variant="ghost" size="sm"><FileText className="w-4 h-4 mr-2" />Export PDF</Button>
              </div>
              <div className="overflow-x-auto px-6 pb-6">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 dark:text-slate-400 border-b dark:border-slate-700">
                      <th className="py-2 text-left font-medium">PARTICULARS</th>
                      <th className="py-2 text-right font-medium">AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedStatement.map((section, idx) => (
                      <React.Fragment key={idx}>
                        {section.section && (
                          <tr className="bg-gray-50 dark:bg-slate-800">
                            <td colSpan={2} className="py-2 font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">{section.section}</td>
                          </tr>
                        )}
                        {section.items.map((item, j) => (
                          <tr key={j} className={item.highlight ? (item.positive ? 'bg-green-50 dark:bg-emerald-500/10' : item.dark ? 'bg-gray-900 dark:bg-emerald-500/15 text-white dark:text-emerald-300' : 'bg-gray-100 dark:bg-slate-800') : ''}>
                            <td className={
                              'py-1 px-2 ' +
                              (item.bold ? 'font-bold ' : '') +
                              (item.negative ? 'text-red-500 ' : '')
                            }>{item.label}</td>
                            <td className={
                              'py-1 px-2 text-right ' +
                              (item.bold ? 'font-bold ' : '') +
                              (item.negative ? 'text-red-500 ' : '') +
                              (item.positive ? 'text-green-600 dark:text-green-400 ' : '') +
                              (item.dark ? 'text-white dark:text-emerald-300 ' : '')
                            }>
                              ₹{Math.abs(item.amount || 0).toLocaleString('en-IN')}
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
          {/* Side Panel */}
          <div className="flex flex-col gap-6">
            {/* Key Insight */}
            <Card className="rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="mb-2 font-semibold text-gray-800 flex items-center gap-2">
                <span>Key Insight</span>
              </div>
              <div className="text-gray-600 text-sm mb-4">{keyInsight.title}</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">NET PROFIT MARGIN</span>
                  <span className="font-bold text-green-700">{keyInsight.netProfitMargin}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">EXPENSE RATIO</span>
                  <span className="font-bold text-blue-700">{keyInsight.expenseRatio}%</span>
                </div>
              </div>
            </Card>
            {/* Activity Audit Log */}
            <Card className="rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="mb-2 font-semibold text-gray-800 flex items-center gap-2">
                <span>Activity Audit Log</span>
              </div>
              <div className="flex flex-col gap-3">
                {auditLog.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className={
                      'w-2 h-2 rounded-full ' +
                      (log.status === 'success' ? 'bg-green-500' : log.status === 'warning' ? 'bg-orange-400' : 'bg-blue-400')
                    }></span>
                    <span className="font-medium text-gray-900 dark:text-slate-100">{log.label}</span>
                    <span className="text-gray-400 ml-auto">{log.user} • {log.time}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full">Full Activity Trail</Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CompanyLedgerReportPage