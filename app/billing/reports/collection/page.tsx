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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Printer,
  Calendar,
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

interface CollectionEntry {
  date: string;
  partyName: string;
  mode: 'Cash' | 'Bank' | 'UPI' | 'Cheque';
  amount: number;
  reference?: string;
  status: 'Completed' | 'Pending';
}

const CollectionReportPage = () => {
  const [dateFromFilter, setDateFromFilter] = useState('2024-04-01');
  const [dateToFilter, setDateToFilter] = useState('2024-04-09');
  const [modeFilter, setModeFilter] = useState('all')

  const collectionData: CollectionEntry[] = [
    {
      date: '2024-04-08',
      partyName: 'Sharma Poultry Shop',
      mode: 'Cash',
      amount: 100000,
      status: 'Completed',
    },
    {
      date: '2024-04-07',
      partyName: 'Patel Farms',
      mode: 'Bank',
      amount: 250000,
      reference: 'TXN123456',
      status: 'Completed',
    },
    {
      date: '2024-04-06',
      partyName: 'Delhi Bird Distributor',
      mode: 'UPI',
      amount: 75000,
      reference: 'UPI12345678',
      status: 'Completed',
    },
    {
      date: '2024-04-05',
      partyName: 'Sharma Poultry Shop',
      mode: 'Cheque',
      amount: 50000,
      reference: 'CHQ789456',
      status: 'Pending',
    },
    {
      date: '2024-04-04',
      partyName: 'Mehta Poultry Hub',
      mode: 'Cash',
      amount: 80000,
      status: 'Completed',
    },
    {
      date: '2024-04-03',
      partyName: 'Rajesh Trading Co',
      mode: 'Bank',
      amount: 120000,
      reference: 'TXN789012',
      status: 'Completed',
    },
    {
      date: '2024-04-02',
      partyName: 'Delhi Bird Distributor',
      mode: 'Cash',
      amount: 50000,
      status: 'Completed',
    },
  ];

  const filteredData = collectionData.filter((d) => {
    const isInDateRange =
      new Date(d.date) >= new Date(dateFromFilter) &&
      new Date(d.date) <= new Date(dateToFilter);
    const matchesMode = modeFilter === 'all' || d.mode === modeFilter
    return isInDateRange && matchesMode;
  });

  const completedData = filteredData.filter((d) => d.status === 'Completed');
  const pendingData = filteredData.filter((d) => d.status === 'Pending');

  const stats = {
    totalCollected: completedData.reduce((sum, d) => sum + d.amount, 0),
    totalPending: pendingData.reduce((sum, d) => sum + d.amount, 0),
    cash: completedData.filter((d) => d.mode === 'Cash').reduce((sum, d) => sum + d.amount, 0),
    bank: completedData.filter((d) => d.mode === 'Bank').reduce((sum, d) => sum + d.amount, 0),
    upi: completedData.filter((d) => d.mode === 'UPI').reduce((sum, d) => sum + d.amount, 0),
    cheque: completedData.filter((d) => d.mode === 'Cheque').reduce((sum, d) => sum + d.amount, 0),
  };

  const getModeIcon = (mode: string) => {
    const icons: Record<string, React.ReactNode> = {
      Cash: <Banknote className="w-4 h-4" />,
      Bank: <CreditCard className="w-4 h-4" />,
      UPI: <Smartphone className="w-4 h-4" />,
      Cheque: <CheckCircle className="w-4 h-4" />,
    };
    return icons[mode];
  };

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      Cash: 'bg-green-100 text-green-800',
      Bank: 'bg-blue-100 text-blue-800',
      UPI: 'bg-purple-100 text-purple-800',
      Cheque: 'bg-amber-100 text-amber-800',
    };
    return colors[mode] || 'bg-gray-100 text-gray-800';
  };

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
    console.log('Export button clicked');
    console.log('filteredData:', filteredData);
    if (!filteredData || filteredData.length === 0) {
      alert('No data available to export.');
      return;
    }
    try {
      const exportData = filteredData.map(item => ({
        Date: new Date(item.date).toLocaleDateString('en-IN'),
        Party_Name: item.partyName,
        Mode: item.mode,
        Amount: item.amount,
        Reference: item.reference || '',
        Status: item.status,
      }));
      console.log('exportData:', exportData);
      downloadCSV(exportData, 'collection_report');
      console.log('CSV download initiated');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handlePrint = () => {
    console.log('Print button clicked');
    console.log('filteredData:', filteredData);
    if (!filteredData || filteredData.length === 0) {
      alert('No data available to print.');
      return;
    }
    try {
      // Create a print-friendly HTML content
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Collection Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              .header { margin-bottom: 20px; }
              .stats { display: flex; justify-content: space-around; margin-bottom: 20px; flex-wrap: wrap; }
              .stat { text-align: center; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <h1>Collection Report</h1>
            <div class="header">
              <p><strong>Period:</strong> ${new Date(dateFromFilter).toLocaleDateString('en-IN')} to ${new Date(dateToFilter).toLocaleDateString('en-IN')}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div class="stats">
              <div class="stat">
                <strong>Total Collected</strong><br>₹${stats.totalCollected.toLocaleString('en-IN')}
              </div>
              <div class="stat">
                <strong>Pending Collection</strong><br>₹${stats.totalPending.toLocaleString('en-IN')}
              </div>
              <div class="stat">
                <strong>Collection Rate</strong><br>${completedData.length > 0 ? ((completedData.length / (completedData.length + pendingData.length)) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map(item => `
                  <tr>
                    <td>${new Date(item.date).toLocaleDateString('en-IN')}</td>
                    <td>${item.partyName}</td>
                    <td>${item.mode}</td>
                    <td>₹${item.amount.toLocaleString('en-IN')}</td>
                    <td>${item.reference || '—'}</td>
                    <td>${item.status}</td>
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
        printWindow.print();
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
            <h1 className="text-3xl font-bold tracking-tight">Collection Report</h1>
            <p className="text-muted-foreground mt-2">
              Payment received analysis and tracking
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
      <Card className="border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Payment Mode
            </label>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank">Bank Transfer</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-green-200 bg-green-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Collected</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ₹{stats.totalCollected.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {completedData.length} transactions
          </p>
        </Card>

        <Card className="border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Pending Collection</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            ₹{stats.totalPending.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {pendingData.length} transactions
          </p>
        </Card>

        <Card className="border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Collection Rate</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {completedData.length > 0
              ? (
                (completedData.length /
                  (completedData.length + pendingData.length)) *
                100
              ).toFixed(1)
              : 0}
            %
          </p>
          <p className="text-xs text-gray-600 mt-2">Completion Rate</p>
        </Card>

        <Card className="border border-purple-200 bg-purple-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Average Collection</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            ₹
            {completedData.length > 0
              ? Math.round(stats.totalCollected / completedData.length).toLocaleString(
                'en-IN'
              )
              : 0}
          </p>
          <p className="text-xs text-gray-600 mt-2">Per Transaction</p>
        </Card>
      </div>

      {/* Payment Mode Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-600 font-medium">Cash</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{stats.cash.toLocaleString('en-IN')}
              </p>
            </div>
            <Banknote className="w-5 h-5 text-green-600 opacity-30" />
          </div>
          <p className="text-xs text-gray-500">
            {completedData.filter((d) => d.mode === 'Cash').length} transactions
          </p>
        </Card>

        <Card className="border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-600 font-medium">Bank Transfer</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{stats.bank.toLocaleString('en-IN')}
              </p>
            </div>
            <CreditCard className="w-5 h-5 text-blue-600 opacity-30" />
          </div>
          <p className="text-xs text-gray-500">
            {completedData.filter((d) => d.mode === 'Bank').length} transactions
          </p>
        </Card>

        <Card className="border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-600 font-medium">UPI</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{stats.upi.toLocaleString('en-IN')}
              </p>
            </div>
            <Smartphone className="w-5 h-5 text-purple-600 opacity-30" />
          </div>
          <p className="text-xs text-gray-500">
            {completedData.filter((d) => d.mode === 'UPI').length} transactions
          </p>
        </Card>

        <Card className="border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-600 font-medium">Cheque</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₹{stats.cheque.toLocaleString('en-IN')}
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-amber-600 opacity-30" />
          </div>
          <p className="text-xs text-gray-500">
            {completedData.filter((d) => d.mode === 'Cheque').length} transactions
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="text-gray-900 font-semibold">
                  Date
                </TableHead>
                <TableHead className="text-gray-900 font-semibold">
                  Party Name
                </TableHead>
                <TableHead className="text-gray-900 font-semibold">
                  Mode
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Amount
                </TableHead>
                <TableHead className="text-gray-900 font-semibold">
                  Reference
                </TableHead>
                <TableHead className="text-center text-gray-900 font-semibold">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-gray-200">
                    <TableCell className="text-gray-900 font-medium">
                      {new Date(item.date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="text-gray-900 font-semibold">
                      {item.partyName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getModeColor(
                          item.mode
                        )}`}
                      >
                        {getModeIcon(item.mode)}
                        {item.mode}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-gray-900 font-bold">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-gray-700 font-mono text-xs">
                      {item.reference || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-gray-500">No collections found for the selected period</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary */}
      {/* <Card className="border border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Collection Analysis
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Period:</strong>
              {' '}
              {new Date(dateFromFilter).toLocaleDateString('en-IN')}
              {' '}
              to
              {' '}
              {new Date(dateToFilter).toLocaleDateString('en-IN')}
            </p>
            <p>
              <strong>Total Amount Collected:</strong> ₹
              {stats.totalCollected.toLocaleString('en-IN')}
            </p>
            <p>
              <strong>Most Used Payment Mode:</strong>
              {' '}
              {stats.cash >= stats.bank && stats.cash >= stats.upi
                ? 'Cash'
                : stats.bank >= stats.upi
                  ? 'Bank Transfer'
                  : 'UPI'}
            </p>
            <p>
              <strong>Pending Clearance:</strong> ₹
              {stats.totalPending.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </Card> */}
      </div>
    </DashboardLayout>
  );
};

export default CollectionReportPage;
