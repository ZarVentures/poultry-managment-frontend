'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  ShoppingCart,
  CreditCard,
  BookOpen,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { billingApi } from '@/lib/api'

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  )
}

export default function BillingDashboard() {
  const [stats, setStats] = useState({
    totalParties: 0,
    totalSales: 0,
    pendingPayments: 0,
    totalLedgers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    billingApi.getSummary()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load billing summary:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Live Bird Retailer Ledger System
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Parties"
            value={loading ? '...' : stats.totalParties}
            icon={Users}
          />
          <StatCard
            title="Total Sales"
            value={loading ? '...' : `₹${(stats.totalSales / 1000).toFixed(0)}K`}
            icon={ShoppingCart}
          />
          <StatCard
            title="Outstanding"
            value={loading ? '...' : `₹${(stats.pendingPayments / 1000).toFixed(0)}K`}
            icon={TrendingUp}
          />
          <StatCard
            title="Ledgers"
            value={loading ? '...' : stats.totalLedgers}
            icon={BookOpen}
          />
        </div>

        {/* Reports */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Reports</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/billing/reports/outstanding">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Outstanding Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View pending balance for all retailers
                  </p>
                  <Button variant="outline" size="sm">View</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/billing/reports/dispatch">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Daily Dispatch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sales summary by date
                  </p>
                  <Button variant="outline" size="sm">View</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/billing/reports/collection">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Collection Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Payment received analysis
                  </p>
                  <Button variant="outline" size="sm">View</Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/billing/reports/pending-purchases">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Pending Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View purchases with outstanding payments
                  </p>
                  <Button variant="outline" size="sm">View</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
