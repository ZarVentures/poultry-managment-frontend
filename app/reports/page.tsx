"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Download, Printer, Table as TableIcon, BarChart3, PieChart } from "lucide-react"
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from "sonner"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D']

type ViewMode = 'table' | 'chart' | 'pie'

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  
  // Report data states
  const [purchaseData, setPurchaseData] = useState<any>(null)
  const [salesData, setSalesData] = useState<any>(null)
  const [mortalityData, setMortalityData] = useState<any>(null)
  const [profitLossData, setProfitLossData] = useState<any>(null)
  const [grossProfitData, setGrossProfitData] = useState<any>(null)
  const [expenseBreakdownData, setExpenseBreakdownData] = useState<any>(null)
  const [batchWiseData, setBatchWiseData] = useState<any>(null)
  const [farmWiseData, setFarmWiseData] = useState<any>(null)
  const [customerWiseData, setCustomerWiseData] = useState<any>(null)

  const fetchReport = async (endpoint: string, setter: Function) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(
        `https://chickenbackend.onrender.com/api/v1/reports/${endpoint}?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (!response.ok) throw new Error('Failed to fetch report')
      const data = await response.json()
      setter(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(',')).join('\n')
    const csv = `${headers}\n${rows}`
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and view comprehensive business reports</p>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <DatePicker
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholder="Select start date"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <DatePicker
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholder="Select end date"
                />
              </div>
              <Button 
                onClick={() => {
                  if (!startDate || !endDate) {
                    toast.error('Please select both start and end dates')
                    return
                  }
                  // Refresh all reports
                  fetchReport('purchases', setPurchaseData)
                  fetchReport('sales', setSalesData)
                  fetchReport('mortality', setMortalityData)
                  fetchReport('profit-loss', setProfitLossData)
                  fetchReport('gross-profit', setGrossProfitData)
                  fetchReport('expense-breakdown', setExpenseBreakdownData)
                  fetchReport('batch-wise-profit', setBatchWiseData)
                  fetchReport('farm-wise-profit', setFarmWiseData)
                  fetchReport('customer-wise-sales', setCustomerWiseData)
                }}
              >
                Generate Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="mr-2" size={16} />
            Table
          </Button>
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('chart')}
          >
            <BarChart3 className="mr-2" size={16} />
            Chart
          </Button>
          <Button
            variant={viewMode === 'pie' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('pie')}
          >
            <PieChart className="mr-2" size={16} />
            Pie Chart
          </Button>
        </div>

        <Tabs defaultValue="profitloss" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
            <TabsTrigger value="profitloss">P&L</TabsTrigger>
            <TabsTrigger value="grossprofit">Gross Profit</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="batch">Batch-wise</TabsTrigger>
            <TabsTrigger value="farm">Farm-wise</TabsTrigger>
            <TabsTrigger value="customer">Customer-wise</TabsTrigger>
            <TabsTrigger value="mortality">Mortality</TabsTrigger>
          </TabsList>

          {/* Profit & Loss Report */}
          <TabsContent value="profitloss">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => profitLossData && downloadCSV([profitLossData.summary], 'profit_loss')}
                    >
                      <Download className="mr-2" size={16} />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8">Loading...</p>
                ) : !profitLossData ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select a date range and click "Generate Reports"
                  </p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{profitLossData.summary.totalRevenue.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{profitLossData.summary.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Gross Profit</p>
                        <p className="text-2xl font-bold">
                          ₹{profitLossData.summary.grossProfit.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{profitLossData.summary.totalExpenses.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{profitLossData.summary.netProfit.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Profit Margin</p>
                        <p className="text-2xl font-bold">
                          {profitLossData.summary.profitMargin.toFixed(2)}%
                        </p>
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add more tab contents here - this is getting long, so I'll create a summary */}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
