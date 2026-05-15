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
  
  const detailedStatement: StatementSection[] = data ? [
    { section: 'REVENUE', items: [
      ...(data.partyWiseSales || []).map((p: any) => ({ label: `Sales - ${p.party}`, amount: p.amount })),
      { label: 'TOTAL REVENUE', amount: data.summary.totalRevenue, bold: true, highlight: true, positive: true },
    ]},
    { section: 'COST OF GOODS SOLD', items: [
      { label: 'Opening Stock', amount: data.summary.openingStock || 0 },
      { label: 'Purchases', amount: data.summary.totalPurchases || 0 },
      { label: 'Direct Expenses', amount: data.summary.totalDirectExpenses || 0 },
      { label: 'Closing Stock (Less)', amount: -(data.summary.closingStock || 0), negative: true },
      { label: 'TOTAL COGS', amount: data.summary.costOfGoodsSold || 0, bold: true },
      { label: 'GROSS PROFIT', amount: data.summary.grossProfit || 0, bold: true, highlight: true, positive: data.summary.grossProfit >= 0, negative: data.summary.grossProfit < 0 },
    ]},
    { section: 'OPERATING EXPENSES', items: [
      ...(data.expenseBreakdown || []).map((e: any) => ({ label: e.category.toUpperCase(), amount: e.amount })),
      { label: 'TOTAL EXPENSES', amount: data.summary.operatingExpenses || 0, bold: true },
    ]},
    { section: '', items: [
      { label: data.summary.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS', amount: data.summary.netProfit || 0, bold: true, highlight: true, dark: true, negative: data.summary.netProfit < 0 },
    ]},
  ] : []

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
    <h1 className="text-4xl md:text-5xl font-extrabold text-black">
      Performance Overview
    </h1>

    <p className="text-gray-500 text-lg mt-3">
      Consolidated Profit & Loss statement for the current fiscal year.
    </p>
  </div>

  {/* Right Toggle */}
  <div className="bg-gray-100 p-2 rounded-2xl flex items-center gap-2 w-fit">
    
    <button className="bg-white shadow-sm px-6 py-3 rounded-xl text-lg font-semibold text-black">
      YTD 2024
    </button>

    <button className="px-6 py-3 rounded-xl text-lg font-semibold text-gray-500 hover:bg-white transition">
      Q1 2024
    </button>
  </div>
</div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-gray-200 p-5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">TOTAL REVENUE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}</span>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
              <div className="text-xs text-green-600 mt-1">↑ 12.5% Increase</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 p-5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">GROSS PROFIT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">₹{(summary.grossProfit || 0).toLocaleString('en-IN')}</span>
                <ArrowUpRight className="w-8 h-8 text-blue-200" />
              </div>
              <div className="text-xs text-gray-500 mt-1">63.3% Gross Margin</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 p-5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">OP. EXPENSES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">₹{(summary.operatingExpenses || 0).toLocaleString('en-IN')}</span>
                <TrendingDown className="w-8 h-8 text-orange-200" />
              </div>
              <div className="text-xs text-gray-500 mt-1">Managed Efficiently</div>
            </CardContent>
          </Card>
          <Card className="border border-green-600 bg-green-900/90 p-5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-white">NET PROFIT (YTD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">₹{(summary.netProfit || 0).toLocaleString('en-IN')}</span>
                <DollarSign className="w-8 h-8 text-green-300" />
              </div>
              <div className="text-xs text-green-200 mt-1">+ TARGET ACHIEVED</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Statement Table */}
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
                    {detailedStatement.map((section, idx) => (
                      <React.Fragment key={idx}>
                        {section.section && (
                          <tr className="bg-gray-50">
                            <td colSpan={2} className="py-2 font-semibold text-gray-700 uppercase tracking-wider">{section.section}</td>
                          </tr>
                        )}
                        {section.items.map((item, j) => (
                          <tr key={j} className={item.highlight ? (item.positive ? 'bg-green-50' : item.dark ? 'bg-gray-900 text-white' : 'bg-gray-100') : ''}>
                            <td className={
                              'py-1 px-2 ' +
                              (item.bold ? 'font-bold ' : '') +
                              (item.negative ? 'text-red-500 ' : '')
                            }>{item.label}</td>
                            <td className={
                              'py-1 px-2 text-right ' +
                              (item.bold ? 'font-bold ' : '') +
                              (item.negative ? 'text-red-500 ' : '') +
                              (item.positive ? 'text-green-600 ' : '') +
                              (item.dark ? 'text-white ' : '')
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
            <Card className="border border-gray-200 p-5 shadow-sm">
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
            <Card className="border border-gray-200 p-5 shadow-sm">
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
                    <span className="font-medium text-gray-900">{log.label}</span>
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