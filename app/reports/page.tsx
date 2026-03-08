"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Table as TableIcon, BarChart3, PieChart as PieChartIcon } from "lucide-react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from "sonner"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']
const API_URL = 'https://chickenbackend.onrender.com/api/v1'

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
  const [mortalityData, setMortalityData] = useState<any>(null)

  const fetchReport = async (endpoint: string, setter: Function) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(`${API_URL}/reports/${endpoint}?${params}`, {
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

  const generateAllReports = () => {
    if (!startDate || !endDate) return toast.error('Select date range')
    fetchReport('profit-loss', setProfitLossData)
    fetchReport('expense-breakdown', setExpenseData)
    fetchReport('farm-wise-profit', setFarmWiseData)
    fetchReport('customer-wise-sales', setCustomerWiseData)
    fetchReport('purchases', setPurchaseData)
    fetchReport('sales', setSalesData)
    fetchReport('mortality', setMortalityData)
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="profitloss">Profit & Loss</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="mortality">Mortality</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="farm">Farm-wise</TabsTrigger>
            <TabsTrigger value="customer">Customer-wise</TabsTrigger>
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
                            {[0,1,2].map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
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
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{purchaseData.summary.totalOrders}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold">₹{purchaseData.summary.totalNetAmount.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Paid</p>
                        <p className="text-2xl font-bold text-green-600">{purchaseData.summary.totalPaid}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-red-600">{purchaseData.summary.totalPending}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchaseData.purchases.map((purchase: any) => (
                            <TableRow key={purchase.id}>
                              <TableCell>{purchase.orderNumber}</TableCell>
                              <TableCell>{new Date(purchase.orderDate).toLocaleDateString()}</TableCell>
                              <TableCell>{purchase.supplierName}</TableCell>
                              <TableCell>₹{parseFloat(purchase.netAmount).toFixed(2)}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  purchase.purchasePaymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
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
                            {[0,1,2].map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
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
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="text-2xl font-bold">{salesData.summary.totalSales}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">₹{salesData.summary.totalNetAmount.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Paid</p>
                        <p className="text-2xl font-bold text-green-600">{salesData.summary.totalPaid}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-red-600">{salesData.summary.totalPending}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesData.sales.map((sale: any) => (
                            <TableRow key={sale.id}>
                              <TableCell>{sale.invoiceNumber}</TableCell>
                              <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                              <TableCell>{sale.customerName}</TableCell>
                              <TableCell>₹{parseFloat(sale.netAmount).toFixed(2)}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
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
                            {[0,1,2].map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
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

          {/* Mortality Report */}
          <TabsContent value="mortality">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Mortality Report</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => mortalityData && downloadCSV(mortalityData.purchases, 'mortality')}>
                    <Download className="mr-2" size={16} />CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!mortalityData ? <p className="text-center py-8 text-muted-foreground">Generate report</p> : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Orders with Mortality</p>
                        <p className="text-2xl font-bold">{mortalityData.summary.totalOrders}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Total Deduction</p>
                        <p className="text-2xl font-bold text-red-600">₹{mortalityData.summary.totalMortalityDeduction.toFixed(2)}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <p className="text-sm text-muted-foreground">Average per Order</p>
                        <p className="text-2xl font-bold">₹{mortalityData.summary.averageMortalityPerOrder.toFixed(2)}</p>
                      </div>
                    </div>
                    {viewMode === 'table' && mortalityData.purchases.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Mortality Deduction</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mortalityData.purchases.map((purchase: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{purchase.orderNumber}</TableCell>
                              <TableCell>{new Date(purchase.orderDate).toLocaleDateString()}</TableCell>
                              <TableCell>{purchase.supplierName}</TableCell>
                              <TableCell>{parseFloat(purchase.totalWeight).toFixed(2)} kg</TableCell>
                              <TableCell className="text-red-600">₹{parseFloat(purchase.mortalityDeduction).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {mortalityData.purchases.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">No mortality data in selected period</p>
                    )}
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
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
