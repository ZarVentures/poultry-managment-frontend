'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, BookOpen, Tractor, Users } from 'lucide-react'

export default function LedgerHomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Ledger Reports</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Separate pages for company ledger, farm ledger, and retailer ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/billing/ledger/company-report">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700 rounded-2xl min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Company Ledger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Full company account with all consolidated transactions.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="ghost" size="sm">
                    Open <ArrowUpRight className="ml-2 h-3 w-3" />
                  </Button>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/billing/ledger/farms">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700 rounded-2xl min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Farm Ledger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Farm ledger page with only farm transactions.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="ghost" size="sm">
                    Open <ArrowUpRight className="ml-2 h-3 w-3" />
                  </Button>
                  <Tractor className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/billing/ledger/retailers">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700 rounded-2xl min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Retailer Ledger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Retailer ledger page with only retailer transactions.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="ghost" size="sm">
                    Open <ArrowUpRight className="ml-2 h-3 w-3" />
                  </Button>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
