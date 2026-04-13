'use client'

import { useState } from 'react'
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
  ArrowUpRight,
} from 'lucide-react'


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
  const [stats] = useState({
    totalParties: 24,
    totalSales: 156500,
    pendingPayments: 58300,
    totalLedgers: 24,
  })

  const modules = [
    {
      title: 'Party Master',
      desc: 'Manage retailers & partners',
      href: '/billing/party-master',
      icon: Users,
    },
    {
      title: 'Sale Entry',
      desc: 'Record bird dispatch',
      href: '/billing/sale-entry',
      icon: ShoppingCart,
    },
    {
      title: 'Payment Entry',
      desc: 'Track payments received',
      href: '/billing/payment-entry',
      icon: CreditCard,
    },
    {
      title: 'Ledger Report',
      desc: 'View running balance',
      href: '/billing/ledger',
      icon: BookOpen,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Module</h1>
          <p className="text-muted-foreground mt-2">
            Live Bird Trading & Retailer Ledger System
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Parties"
            value={stats.totalParties}
            icon={Users}
          />
          <StatCard
            title="Total Sales"
            value={`₹${(stats.totalSales / 1000).toFixed(0)}K`}
            icon={ShoppingCart}
          />
          <StatCard
            title="Outstanding"
            value={`₹${(stats.pendingPayments / 1000).toFixed(0)}K`}
            icon={TrendingUp}
          />
          <StatCard
            title="Ledgers"
            value={stats.totalLedgers}
            icon={BookOpen}
          />
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Modules</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {modules.map((mod) => {
              const Icon = mod.icon
              return (
                <Link key={mod.href} href={mod.href}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{mod.title}</CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{mod.desc}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 pl-0 h-auto"
                      >
                        Open <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Reports */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Reports</h2>
          <div className="grid gap-4 md:grid-cols-3">
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
                  <Button variant="outline" size="sm">
                    View
                  </Button>
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
                  <Button variant="outline" size="sm">
                    View
                  </Button>
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
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>About This Module</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Live Bird Trading:</strong> Manage bird dispatch and sales
              to retailers
            </p>
            <p>
              <strong>Running Ledger:</strong> Automatic balance calculation
              after each transaction
            </p>
            <p>
              <strong>No GST:</strong> Special billing system for live bird
              trading
            </p>
            <p>
              <strong>Credit Management:</strong> Track credit limits and
              outstanding balances
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
