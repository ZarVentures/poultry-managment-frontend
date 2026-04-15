'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingDown,
  AlertTriangle,
  Download,
  Printer,
  Calendar,
  Search,
} from 'lucide-react';

interface PendingPurchase {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  dueDate?: string;
  totalAmount: number;
  netAmount?: number;
  purchasePaymentStatus?: 'paid' | 'pending' | 'partial';
  advancePaid?: number;
  balanceAmount?: number;
  outstandingPayment?: number;
  farmerMobile?: string;
  birdType?: string;
}

const PendingPurchasesPage = () => {
  const [purchases] = useState<PendingPurchase[]>([
    {
      id: '1',
      orderNumber: 'PO-2024-001',
      supplierName: 'Sharma Poultry Farm',
      orderDate: '2024-04-01',
      dueDate: '2024-04-15',
      totalAmount: 50000,
      netAmount: 48000,
      purchasePaymentStatus: 'pending',
      advancePaid: 0,
      balanceAmount: 48000,
      outstandingPayment: 48000,
      farmerMobile: '9876543210',
      birdType: 'Broiler',
    },
    {
      id: '2',
      orderNumber: 'PO-2024-002',
      supplierName: 'Patel Farms',
      orderDate: '2024-04-05',
      dueDate: '2024-04-20',
      totalAmount: 75000,
      netAmount: 72000,
      purchasePaymentStatus: 'partial',
      advancePaid: 30000,
      balanceAmount: 42000,
      outstandingPayment: 42000,
      farmerMobile: '9988776655',
      birdType: 'Layer',
    },
    {
      id: '3',
      orderNumber: 'PO-2024-003',
      supplierName: 'Delhi Bird Suppliers',
      orderDate: '2024-04-08',
      dueDate: '2024-04-22',
      totalAmount: 60000,
      netAmount: 58500,
      purchasePaymentStatus: 'pending',
      advancePaid: 0,
      balanceAmount: 58500,
      outstandingPayment: 58500,
      farmerMobile: '9876654433',
      birdType: 'Broiler',
    },
    {
      id: '4',
      orderNumber: 'PO-2024-004',
      supplierName: 'Rajesh Trading Co',
      orderDate: '2024-04-10',
      dueDate: '2024-04-25',
      totalAmount: 45000,
      netAmount: 43200,
      purchasePaymentStatus: 'partial',
      advancePaid: 20000,
      balanceAmount: 23200,
      outstandingPayment: 23200,
      farmerMobile: '9988665544',
      birdType: 'Broiler',
    },
    {
      id: '5',
      orderNumber: 'PO-2024-005',
      supplierName: 'Mehta Poultry Hub',
      orderDate: '2024-04-12',
      dueDate: '2024-04-28',
      totalAmount: 80000,
      netAmount: 77600,
      purchasePaymentStatus: 'pending',
      advancePaid: 0,
      balanceAmount: 77600,
      outstandingPayment: 77600,
      farmerMobile: '9877443322',
      birdType: 'Layer',
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredPurchases = purchases
    .filter(purchase => {
      const matchesSearch = searchQuery === '' ||
        purchase.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (purchase.farmerMobile && purchase.farmerMobile.includes(searchQuery))

      const matchesStatus = statusFilter === 'all' || purchase.purchasePaymentStatus === statusFilter

      return matchesSearch && matchesStatus
    })

  const stats = {
    totalPendingPurchases: filteredPurchases.length,
    totalOutstandingAmount: filteredPurchases.reduce((sum, p) => sum + (p.balanceAmount || 0), 0),
    totalAdvancePaid: filteredPurchases.reduce((sum, p) => sum + (p.advancePaid || 0), 0),
    pendingCount: filteredPurchases.filter(p => p.purchasePaymentStatus === 'pending').length,
    partialCount: filteredPurchases.filter(p => p.purchasePaymentStatus === 'partial').length,
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))
          ? `"${val.replace(/"/g, '""')}"`
          : val
      ).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (!filteredPurchases || filteredPurchases.length === 0) {
      alert('No data available to export.');
      return;
    }
    try {
      const exportData = filteredPurchases.map(item => ({
        Order_Number: item.orderNumber,
        Supplier_Name: item.supplierName,
        Order_Date: item.orderDate,
        Due_Date: item.dueDate || '',
        Total_Amount: item.totalAmount,
        Net_Amount: item.netAmount || '',
        Payment_Status: item.purchasePaymentStatus || '',
        Advance_Paid: item.advancePaid || 0,
        Balance_Amount: item.balanceAmount || 0,
        Outstanding_Payment: item.outstandingPayment || 0,
        Farmer_Mobile: item.farmerMobile || '',
        Bird_Type: item.birdType || '',
      }));
      downloadCSV(exportData, 'pending_purchases_report');
      alert('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handlePrint = () => {
    if (!filteredPurchases || filteredPurchases.length === 0) {
      alert('No data available to print.');
      return;
    }
    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pending Purchases Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              .header { margin-bottom: 20px; }
              .stats { display: flex; justify-content: space-around; margin-bottom: 20px; flex-wrap: wrap; }
              .stat { text-align: center; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .pending { background-color: #fef2f2; }
              .partial { background-color: #fffbeb; }
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <h1>Pending Purchases Report</h1>
            <div class="header">
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Filter:</strong> ${statusFilter === 'all' ? 'All Status' : statusFilter}</p>
              <p><strong>Search:</strong> ${searchQuery || 'None'}</p>
            </div>
            <div class="stats">
              <div class="stat">
                <strong>Total Pending Purchases</strong><br>${stats.totalPendingPurchases}
              </div>
              <div class="stat">
                <strong>Total Outstanding Amount</strong><br>₹${stats.totalOutstandingAmount.toLocaleString('en-IN')}
              </div>
              <div class="stat">
                <strong>Total Advance Paid</strong><br>₹${stats.totalAdvancePaid.toLocaleString('en-IN')}
              </div>
              <div class="stat">
                <strong>Fully Pending</strong><br>${stats.pendingCount}
              </div>
              <div class="stat">
                <strong>Partially Paid</strong><br>${stats.partialCount}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Net Amount</th>
                  <th>Advance Paid</th>
                  <th>Balance Amount</th>
                  <th>Status</th>
                  <th>Bird Type</th>
                </tr>
              </thead>
              <tbody>
                ${filteredPurchases.map(item => `
                  <tr class="${item.purchasePaymentStatus?.toLowerCase()}">
                    <td>${item.orderNumber}</td>
                    <td>${item.supplierName}</td>
                    <td>${new Date(item.orderDate).toLocaleDateString('en-IN')}</td>
                    <td>${item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td>₹${item.totalAmount.toLocaleString('en-IN')}</td>
                    <td>₹${(item.netAmount || 0).toLocaleString('en-IN')}</td>
                    <td>₹${(item.advancePaid || 0).toLocaleString('en-IN')}</td>
                    <td>₹${(item.balanceAmount || 0).toLocaleString('en-IN')}</td>
                    <td>${item.purchasePaymentStatus || 'Unknown'}</td>
                    <td>${item.birdType || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        alert('Please allow popups for this website to use the print function.');
      }
    } catch (error) {
      console.error('Print failed:', error);
      alert('Print failed. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pending Purchases</h1>
            <p className="text-muted-foreground mt-2">
              View purchases with outstanding payments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={handleExport}
              type="button"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
              onClick={handlePrint}
              type="button"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by order number, supplier, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Total Pending Purchases</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.totalPendingPurchases}
            </p>
          </Card>

          <Card className="border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Outstanding Amount</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              ₹{stats.totalOutstandingAmount.toLocaleString('en-IN')}
            </p>
          </Card>

          <Card className="border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Advance Paid</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ₹{stats.totalAdvancePaid.toLocaleString('en-IN')}
            </p>
          </Card>

          <Card className="border border-purple-200 bg-purple-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Fully Pending</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.pendingCount}
            </p>
          </Card>

          <Card className="border border-yellow-200 bg-yellow-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Partially Paid</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.partialCount}
            </p>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending purchases found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Advance Paid</TableHead>
                    <TableHead>Balance Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bird Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.orderNumber}</TableCell>
                      <TableCell>{purchase.supplierName}</TableCell>
                      <TableCell>{new Date(purchase.orderDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{purchase.dueDate ? new Date(purchase.dueDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                      <TableCell>₹{purchase.totalAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{(purchase.advancePaid || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        ₹{(purchase.balanceAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.purchasePaymentStatus)}`}>
                          {purchase.purchasePaymentStatus || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>{purchase.birdType || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default PendingPurchasesPage