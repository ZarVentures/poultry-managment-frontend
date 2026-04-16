'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Building2,
  Users,
} from 'lucide-react';
import Link from 'next/link';

interface CompanyLedgerEntry {
  date: string;
  remarks: string;
  transactionType: 'Opening' | 'Purchase' | 'Sale' | 'Expense' | 'Payment' | 'Receipt';
  referenceId: string;
  debit: number;
  credit: number;
  balance: number;
  party?: string;
}

const CompanyLedgerReportPage = () => {
  const [dateFrom, setDateFrom] = useState('2024-04-01');
  const [dateTo, setDateTo] = useState('2024-04-30');

  // Company-level ledger entries showing all transactions
  const ledgerEntries: CompanyLedgerEntry[] = [
    {
      date: '2024-04-01',
      remarks: 'Opening Balance - Company Capital',
      transactionType: 'Opening',
      referenceId: 'OPN001',
      debit: 0,
      credit: 0,
      balance: 500000,
      party: 'Company',
    },
    {
      date: '2024-04-02',
      remarks: 'Purchase from Patel Farms - 1000 birds',
      transactionType: 'Purchase',
      referenceId: 'PUR001',
      debit: 210000,
      credit: 0,
      balance: 710000,
      party: 'Patel Farms',
    },
    {
      date: '2024-04-03',
      remarks: 'Sale to Sharma Poultry Shop - 500 birds',
      transactionType: 'Sale',
      referenceId: 'SAL001',
      debit: 0,
      credit: 105000,
      balance: 605000,
      party: 'Sharma Poultry Shop',
    },
    {
      date: '2024-04-04',
      remarks: 'Payment to Patel Farms - Bank Transfer',
      transactionType: 'Payment',
      referenceId: 'PAY001',
      debit: 100000,
      credit: 0,
      balance: 705000,
      party: 'Patel Farms',
    },
    {
      date: '2024-04-05',
      remarks: 'Purchase from Delhi Bird Farms - 800 birds',
      transactionType: 'Purchase',
      referenceId: 'PUR002',
      debit: 168000,
      credit: 0,
      balance: 873000,
      party: 'Delhi Bird Farms',
    },
    {
      date: '2024-04-06',
      remarks: 'Sale to Delhi Bird Distributor - 600 birds',
      transactionType: 'Sale',
      referenceId: 'SAL002',
      debit: 0,
      credit: 126000,
      balance: 747000,
      party: 'Delhi Bird Distributor',
    },
    {
      date: '2024-04-07',
      remarks: 'Operating Expense - Feed Cost',
      transactionType: 'Expense',
      referenceId: 'EXP001',
      debit: 45000,
      credit: 0,
      balance: 792000,
      party: 'Feed Supplier',
    },
    {
      date: '2024-04-08',
      remarks: 'Receipt from Sharma Poultry - Cash',
      transactionType: 'Receipt',
      referenceId: 'REC001',
      debit: 0,
      credit: 50000,
      balance: 742000,
      party: 'Sharma Poultry Shop',
    },
    {
      date: '2024-04-09',
      remarks: 'Sale to Sharma Poultry Shop - 400 birds',
      transactionType: 'Sale',
      referenceId: 'SAL003',
      debit: 0,
      credit: 84000,
      balance: 658000,
      party: 'Sharma Poultry Shop',
    },
    {
      date: '2024-04-10',
      remarks: 'Purchase from Patel Farms - 700 birds',
      transactionType: 'Purchase',
      referenceId: 'PUR003',
      debit: 147000,
      credit: 0,
      balance: 805000,
      party: 'Patel Farms',
    },
    {
      date: '2024-04-11',
      remarks: 'Operating Expense - Labor Cost',
      transactionType: 'Expense',
      referenceId: 'EXP002',
      debit: 25000,
      credit: 0,
      balance: 830000,
      party: 'Staff',
    },
    {
      date: '2024-04-12',
      remarks: 'Receipt from Delhi Bird Distributor - Bank',
      transactionType: 'Receipt',
      referenceId: 'REC002',
      debit: 0,
      credit: 125000,
      balance: 705000,
      party: 'Delhi Bird Distributor',
    },
  ];

  const totals = ledgerEntries.reduce(
    (acc, entry) => ({
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit,
    }),
    { debit: 0, credit: 0 }
  );

  const currentBalance = ledgerEntries.length > 0 
    ? ledgerEntries[ledgerEntries.length - 1].balance 
    : 0;

  const getEntryBackgroundColor = (type: string) => {
    switch (type) {
      case 'Purchase':
        return 'bg-red-50';
      case 'Sale':
        return 'bg-green-50';
      case 'Expense':
        return 'bg-orange-50';
      case 'Payment':
        return 'bg-blue-50';
      case 'Receipt':
        return 'bg-emerald-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getEntryBorderColor = (type: string) => {
    switch (type) {
      case 'Purchase':
        return 'border-l-red-500';
      case 'Sale':
        return 'border-l-green-500';
      case 'Expense':
        return 'border-l-orange-500';
      case 'Payment':
        return 'border-l-blue-500';
      case 'Receipt':
        return 'border-l-emerald-500';
      default:
        return 'border-l-gray-500';
    }
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
    if (!ledgerEntries || ledgerEntries.length === 0) {
      alert('No data available to export.');
      return;
    }
    try {
      const exportData = ledgerEntries.map(item => ({
        Date: new Date(item.date).toLocaleDateString('en-IN'),
        Remarks: item.remarks,
        Transaction_Type: item.transactionType,
        Reference_ID: item.referenceId,
        Party: item.party || 'Company',
        Debit: item.debit,
        Credit: item.credit,
        Balance: item.balance,
      }));
      downloadCSV(exportData, 'company_ledger_report');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handlePrint = () => {
    if (!ledgerEntries || ledgerEntries.length === 0) {
      alert('No data available to print.');
      return;
    }
    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Company Ledger Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; margin-bottom: 20px; color: #1f2937; }
              .header { margin-bottom: 20px; }
              .company-info { margin-bottom: 20px; padding: 15px; background-color: #f3f4f6; border: 2px solid #1f2937; border-radius: 5px; }
              .stats { display: flex; justify-content: space-around; margin-bottom: 20px; flex-wrap: wrap; }
              .stat { text-align: center; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9fafb; }
              .stat-label { font-size: 12px; color: #6b7280; font-weight: bold; }
              .stat-value { font-size: 20px; font-weight: bold; color: #1f2937; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .debit { color: #dc2626; font-weight: 500; }
              .credit { color: #16a34a; font-weight: 500; }
              .balance { font-weight: 600; }
              .purchase { background-color: #fef2f2; }
              .sale { background-color: #f0fdf4; }
              .expense { background-color: #fffbeb; }
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <h1>Company Ledger Report</h1>
            <div class="header">
              <p><strong>Period:</strong> ${new Date(dateFrom).toLocaleDateString('en-IN')} to ${new Date(dateTo).toLocaleDateString('en-IN')}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString('en-IN')}</p>
            </div>
            <div class="company-info">
              <h3>Company Account Summary</h3>
              <p><strong>Report Type:</strong> Full Company Ledger</p>
              <p><strong>Opening Balance (from 1st Apr 2024):</strong> ₹500,000</p>
              <p><strong>Current Balance:</strong> ₹${currentBalance.toLocaleString('en-IN')}</p>
            </div>
            <div class="stats">
              <div class="stat">
                <div class="stat-label">Total Debit (Money Out)</div>
                <div class="stat-value">₹${totals.debit.toLocaleString('en-IN')}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Total Credit (Money In)</div>
                <div class="stat-value">₹${totals.credit.toLocaleString('en-IN')}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Net Position</div>
                <div class="stat-value">₹${(totals.credit - totals.debit).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction Type</th>
                  <th>Remarks</th>
                  <th>Party</th>
                  <th>Reference ID</th>
                  <th>Debit (₹)</th>
                  <th>Credit (₹)</th>
                  <th>Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${ledgerEntries.map(item => `
                  <tr class="${item.transactionType.toLowerCase()}">
                    <td>${new Date(item.date).toLocaleDateString('en-IN')}</td>
                    <td><strong>${item.transactionType}</strong></td>
                    <td>${item.remarks}</td>
                    <td>${item.party || '-'}</td>
                    <td>${item.referenceId}</td>
                    <td class="debit">${item.debit > 0 ? '₹' + item.debit.toLocaleString('en-IN') : '-'}</td>
                    <td class="credit">${item.credit > 0 ? '₹' + item.credit.toLocaleString('en-IN') : '-'}</td>
                    <td class="balance">₹${item.balance.toLocaleString('en-IN')}</td>
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

  const allTransactionTypes = [
    { type: 'Purchase', label: 'Purchases', count: ledgerEntries.filter(e => e.transactionType === 'Purchase').length },
    { type: 'Sale', label: 'Sales', count: ledgerEntries.filter(e => e.transactionType === 'Sale').length },
    { type: 'Expense', label: 'Expenses', count: ledgerEntries.filter(e => e.transactionType === 'Expense').length },
    { type: 'Payment', label: 'Payments', count: ledgerEntries.filter(e => e.transactionType === 'Payment').length },
    { type: 'Receipt', label: 'Receipts', count: ledgerEntries.filter(e => e.transactionType === 'Receipt').length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Company Ledger Report</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Complete account ledger showing all purchases, sales, expenses, payments and receipts
          </p>
        </div>

        {/* Ledger Type Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/billing/ledger">
            <Card className="border-2 border-blue-300 bg-blue-50 p-6 cursor-pointer hover:shadow-lg transition-shadow h-full">
              <div className="flex items-start gap-3">
                <Users className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Party Ledger</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    View individual ledger accounts for farms and retailers
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/billing/ledger/company-report">
            <Card className="border-2 border-purple-300 bg-purple-50 p-6 cursor-pointer hover:shadow-lg transition-shadow h-full">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Company Ledger</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    View complete company account with all transactions
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Date Filter */}
        <Card className="border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
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
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Opening Balance</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ₹500,000
            </p>
            <p className="text-xs text-gray-500 mt-2">1 Apr 2024</p>
          </Card>

          <Card className="border border-red-200 bg-red-50 p-6">
            <TrendingDown className="w-5 h-5 text-red-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Debit</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              ₹{totals.debit.toLocaleString('en-IN')}
            </p>
          </Card>

          <Card className="border border-green-200 bg-green-50 p-6">
            <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total Credit</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ₹{totals.credit.toLocaleString('en-IN')}
            </p>
          </Card>

          <Card className="border-2 border-purple-300 bg-purple-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Current Balance</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              ₹{currentBalance.toLocaleString('en-IN')}
            </p>
          </Card>

          <Card className="border border-gray-300 bg-gray-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Net Change</p>
            <p className={`text-2xl font-bold mt-2 ${(totals.credit - totals.debit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(totals.credit - totals.debit).toLocaleString('en-IN')}
            </p>
          </Card>
        </div>

        {/* Transaction Type Summary */}
        <Card className="border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {allTransactionTypes.map((item) => (
              <div key={item.type} className="p-4 border border-gray-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-sm text-gray-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Export and Print Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export as CSV
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>

        {/* Ledger Table */}
        <Card className="border border-gray-200 overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle>Complete Ledger Entries</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Showing {ledgerEntries.length} transactions
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Remarks</TableHead>
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="text-right font-semibold">Debit (₹)</TableHead>
                    <TableHead className="text-right font-semibold">Credit (₹)</TableHead>
                    <TableHead className="text-right font-semibold">Balance (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry, index) => (
                    <TableRow
                      key={index}
                      className={`border-l-4 ${getEntryBorderColor(
                        entry.transactionType
                      )} ${getEntryBackgroundColor(entry.transactionType)} hover:bg-opacity-75`}
                    >
                      <TableCell className="font-medium">
                        {new Date(entry.date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {entry.transactionType}
                      </TableCell>
                      <TableCell className="text-gray-700">{entry.remarks}</TableCell>
                      <TableCell className="text-gray-600">
                        {entry.party || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">{entry.referenceId}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900">
                        ₹{entry.balance.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-gray-100 font-bold border-t-2 border-b-2 border-gray-300">
                    <TableCell colSpan={5} className="text-right">
                      TOTALS
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      ₹{totals.debit.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ₹{totals.credit.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right text-gray-900">
                      ₹{currentBalance.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="border-blue-300 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Note:</strong> This is the company's complete ledger showing all transactions including:
            purchases from farms (Debits), sales to retailers (Credits), operating expenses, payments made, and
            receipts received. Use this for internal accounting and financial tracking.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
};

export default CompanyLedgerReportPage;
