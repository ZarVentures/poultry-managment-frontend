"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { Download, Printer, FileText } from "lucide-react"

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [loading, setLoading] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and view business reports</p>
        </div>

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
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="purchases" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="purchases">Purchase Report</TabsTrigger>
            <TabsTrigger value="sales">Sales Report</TabsTrigger>
            <TabsTrigger value="mortality">Mortality Report</TabsTrigger>
            <TabsTrigger value="profitloss">Profit & Loss</TabsTrigger>
          </TabsList>

          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Purchase Report</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2" size={16} />
                      Download PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="mr-2" size={16} />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Select a date range to generate purchase report
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Sales Report</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2" size={16} />
                      Download PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="mr-2" size={16} />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Select a date range to generate sales report
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mortality">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mortality Report</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2" size={16} />
                      Download PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="mr-2" size={16} />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Select a date range to generate mortality report
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profitloss">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2" size={16} />
                      Download PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="mr-2" size={16} />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Select a date range to generate profit & loss statement
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
