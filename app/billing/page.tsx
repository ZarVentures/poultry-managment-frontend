'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ShoppingCart, TrendingUp, BookOpen, BarChart3, CreditCard } from 'lucide-react'
import { salesApi, retailersApi, purchasesApi } from '@/lib/api'

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export default function BillingDashboard() {
  const [stats, setStats] = useState({ totalParties: 0, totalSales: 0, outstanding: 0, totalPurchases: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([retailersApi.getAll(), salesApi.getAll(), purchasesApi.getAll()])
      .then(([retailers, sales, purchases]: [any[], any[], any[]]) => {
        const totalSales = sales.reduce((s: number, x: any) => s + Number(x.netAmount || x.totalAmount || 0), 0)
        const outstanding = sales.reduce((s: number, x: any) => s + Math.max(0, Number(x.netAmount || x.totalAmount || 0) - Number(x.amountReceived || 0)), 0)
        const pendingPurchases = purchases.filter((p: any) => p.purchasePaymentStatus === 'pending' || p.purchasePaymentStatus === 'partial')
          .reduce((s: number, p: any) => s + Number(p.balanceAmount || 0), 0)
        setStats({
          totalParties: retailers.length,
          totalSales,
          outstanding,
          totalPurchases: pendingPurchases,
        })
      })
      .catch(err => console.error('Billing summary error:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Dashboard</h1>
          <p className="text-muted-foreground mt-2">Live Bird Retailer Ledger System</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Retailers" value={loading ? '...' : stats.totalParties} icon={Users} />
          <StatCard title="Total Sales" value={loading ? '...' : `₹${(stats.totalSales / 1000).toFixed(0)}K`} icon={ShoppingCart} />
          <StatCard title="Outstanding" value={loading ? '...' : `₹${(stats.outstanding / 1000).toFixed(0)}K`} icon={TrendingUp} />
          <StatCard title="Pending Purchases" value={loading ? '...' : `₹${(stats.totalPurchases / 1000).toFixed(0)}K`} icon={BookOpen} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Reports</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/billing/reports/outstanding">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Outstanding Report</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground mb-4">Pending balance per retailer</p><Button variant="outline" size="sm">View</Button></CardContent>
              </Card>
            </Link>
            <Link href="/billing/reports/dispatch">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Daily Dispatch</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground mb-4">Sales summary by date</p><Button variant="outline" size="sm">View</Button></CardContent>
              </Card>
            </Link>
            <Link href="/billing/reports/collection">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Collection Report</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground mb-4">Payment received analysis</p><Button variant="outline" size="sm">View</Button></CardContent>
              </Card>
            </Link>
            <Link href="/billing/reports/pending-purchases">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Pending Purchases</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground mb-4">Purchases with outstanding payments</p><Button variant="outline" size="sm">View</Button></CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Ledgers</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/billing/ledger/retailers">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Retailer Ledger</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground mb-4">Sales & payment ledger per retailer</p><Button variant="outline" size="sm">View</Button></CardContent>
              </Card>
            </Link>
            <Link href="/billing/ledger/company-report">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Company Ledger</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground mb-4">All transactions across all parties</p><Button variant="outline" size="sm">View</Button></CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
