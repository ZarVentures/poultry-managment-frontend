'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Printer, Calendar } from 'lucide-react';

interface DispatchEntry {
  date: string;
  partyName: string;
  vehicle: string;
  birds: number;
  netWeight: number;
  avgWeight: number;
  rate: number;
  amount: number;
  discount: number;
  finalAmount: number;
}

const DailyDispatchReportPage = () => {
  const [dateFilter, setDateFilter] = useState('2024-04-09');

  const dispatchData: DispatchEntry[] = [
    {
      date: '2024-04-09',
      partyName: 'Sharma Poultry Shop',
      vehicle: 'DL-01-AB-1234',
      birds: 500,
      netWeight: 2500,
      avgWeight: 5.0,
      rate: 210,
      amount: 525000,
      discount: 1000,
      finalAmount: 524000,
    },
    {
      date: '2024-04-09',
      partyName: 'Patel Farms',
      vehicle: 'GJ-02-CD-5678',
      birds: 1000,
      netWeight: 4800,
      avgWeight: 4.8,
      rate: 205,
      amount: 984000,
      discount: 0,
      finalAmount: 984000,
    },
    {
      date: '2024-04-08',
      partyName: 'Delhi Bird Distributor',
      vehicle: 'DL-01-XY-9876',
      birds: 750,
      netWeight: 3375,
      avgWeight: 4.5,
      rate: 215,
      amount: 725625,
      discount: 500,
      finalAmount: 725125,
    },
  ];

  const filteredData = dispatchData.filter((d) => d.date === dateFilter);

  const totals = filteredData.reduce(
    (acc, item) => ({
      birds: acc.birds + item.birds,
      weight: acc.weight + item.netWeight,
      amount: acc.amount + item.finalAmount,
      discount: acc.discount + item.discount,
    }),
    { birds: 0, weight: 0, amount: 0, discount: 0 }
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Dispatch Report</h1>
            <p className="text-muted-foreground mt-2">
              Sales summary for the selected date
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="border border-gray-200 p-6">
        <div className="max-w-xs">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Select Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Dispatch</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {filteredData.length}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {new Date(dateFilter).toLocaleDateString('en-IN')}
          </p>
        </Card>

        <Card className="border border-green-200 bg-green-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Birds</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {totals.birds.toLocaleString('en-IN')}
          </p>
        </Card>

        <Card className="border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Weight</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {totals.weight.toLocaleString('en-IN')} kg
          </p>
        </Card>

        <Card className="border border-purple-200 bg-purple-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ₹{totals.amount.toLocaleString('en-IN')}
          </p>
          {totals.discount > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              Discount: ₹{totals.discount.toLocaleString('en-IN')}
            </p>
          )}
        </Card>
      </div>

      {/* Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="text-gray-900 font-semibold">
                  Party Name
                </TableHead>
                <TableHead className="text-gray-900 font-semibold">
                  Vehicle
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Birds
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Net Wt (kg)
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Avg Wt (kg)
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Rate/kg
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Gross
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Discount
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Final Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                <>
                  {filteredData.map((item, idx) => (
                    <TableRow key={idx} className="border-b border-gray-200">
                      <TableCell className="text-gray-900 font-semibold">
                        {item.partyName}
                      </TableCell>
                      <TableCell className="text-gray-700 font-mono text-sm">
                        {item.vehicle}
                      </TableCell>
                      <TableCell className="text-right text-gray-900 font-semibold">
                        {item.birds.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right text-gray-900">
                        {item.netWeight.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right text-gray-900">
                        {item.avgWeight.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-gray-900">
                        ₹{item.rate.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right text-gray-900">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right text-orange-600 font-semibold">
                        {item.discount > 0
                          ? `₹${item.discount.toLocaleString('en-IN')}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right text-gray-900 font-bold">
                        ₹{item.finalAmount.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                    <TableCell colSpan={2} className="font-bold text-gray-900">
                      TOTAL
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {totals.birds.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {totals.weight.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right font-bold text-gray-900">
                      ₹{(totals.amount + totals.discount).toLocaleString(
                        'en-IN'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-orange-600">
                      ₹{totals.discount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      ₹{totals.amount.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p className="text-gray-500">No dispatch found for this date</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Key Metrics</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              <strong>Average Birds per Dispatch:</strong>
              {' '}
              {filteredData.length > 0
                ? Math.round(totals.birds / filteredData.length)
                : 0}
            </p>
            <p className="text-gray-700">
              <strong>Average Weight per Bird:</strong>
              {' '}
              {filteredData.length > 0
                ? (totals.weight / totals.birds).toFixed(2)
                : 0}
              {' '}
              kg
            </p>
            <p className="text-gray-700">
              <strong>Average Sale Value:</strong>
              {' '}
              ₹
              {filteredData.length > 0
                ? Math.round(totals.amount / filteredData.length).toLocaleString(
                  'en-IN'
                )
                : 0}
            </p>
          </div>
        </Card>

        <Card className="border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Discount Analysis
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              <strong>Total Discount Given:</strong>
              {' '}
              ₹{totals.discount.toLocaleString('en-IN')}
            </p>
            <p className="text-gray-700">
              <strong>Discount Percentage:</strong>
              {' '}
              {totals.amount > 0
                ? ((totals.discount / (totals.amount + totals.discount)) * 100).toFixed(2)
                : 0}
              %
            </p>
            <p className="text-gray-700">
              <strong>Dispatches with Discount:</strong>
              {' '}
              {filteredData.filter((d) => d.discount > 0).length}
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DailyDispatchReportPage;
