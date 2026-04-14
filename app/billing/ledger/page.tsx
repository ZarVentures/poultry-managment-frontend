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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface LedgerEntry {
  date: string;
  remarks: string;
  referenceType: 'Opening' | 'Sale' | 'Payment';
  referenceId: string;
  debit: number;
  credit: number;
  balance: number;
}

interface Party {
  id: string;
  name: string;
  phone: string;
  openingBalance: number;
  currentBalance: number;
  creditLimit: number;
}

const LedgerReportPage = () => {
  const [selectedParty, setSelectedParty] = useState('1');
  const [dateFrom, setDateFrom] = useState('2024-04-01');
  const [dateTo, setDateTo] = useState('2024-04-09');

  const parties: Party[] = [
    {
      id: '1',
      name: 'Sharma Poultry Shop',
      phone: '9876543210',
      openingBalance: 50000,
      currentBalance: 12500,
      creditLimit: 100000,
    },
    {
      id: '2',
      name: 'Patel Farms',
      phone: '9987654321',
      openingBalance: 100000,
      currentBalance: 85000,
      creditLimit: 200000,
    },
    {
      id: '3',
      name: 'Delhi Bird Distributor',
      phone: '9876789012',
      openingBalance: 75000,
      currentBalance: -5000,
      creditLimit: 150000,
    },
  ];

  const currentParty = parties.find((p) => p.id === selectedParty);

  // Sample ledger data
  const ledgerEntries: LedgerEntry[] = [
    {
      date: '2024-04-01',
      remarks: 'Opening Balance',
      referenceType: 'Opening',
      referenceId: 'OPN001',
      debit: 0,
      credit: 0,
      balance: 50000,
    },
    {
      date: '2024-04-02',
      remarks: 'Sale - Birds Dispatch (500 birds)',
      referenceType: 'Sale',
      referenceId: 'SAL001',
      debit: 105000,
      credit: 0,
      balance: 155000,
    },
    {
      date: '2024-04-03',
      remarks: 'Payment Received - Cash',
      referenceType: 'Payment',
      referenceId: 'PAY001',
      debit: 0,
      credit: 100000,
      balance: 55000,
    },
    {
      date: '2024-04-04',
      remarks: 'Sale - Birds Dispatch (300 birds)',
      referenceType: 'Sale',
      referenceId: 'SAL002',
      debit: 63000,
      credit: 0,
      balance: 118000,
    },
    {
      date: '2024-04-05',
      remarks: 'Payment Received - Bank Transfer',
      referenceType: 'Payment',
      referenceId: 'PAY002',
      debit: 0,
      credit: 105500,
      balance: 12500,
    },
  ];

  const totals = ledgerEntries.reduce(
    (acc, entry) => ({
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit,
    }),
    { debit: 0, credit: 0 }
  );

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'Sale':
        return 'bg-red-50';
      case 'Payment':
        return 'bg-green-50';
      default:
        return 'bg-gray-50';
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
        Reference_Type: item.referenceType,
        Reference_ID: item.referenceId,
        Debit: item.debit,
        Credit: item.credit,
        Balance: item.balance,
      }));
      downloadCSV(exportData, 'ledger_report');
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
            <title>Ledger Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              .header { margin-bottom: 20px; }
              .party-info { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
              .stats { display: flex; justify-content: space-around; margin-bottom: 20px; flex-wrap: wrap; }
              .stat { text-align: center; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .debit { color: #dc2626; }
              .credit { color: #16a34a; }
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <h1>Ledger Report</h1>
            <div class="header">
              <p><strong>Period:</strong> ${new Date(dateFrom).toLocaleDateString('en-IN')} to ${new Date(dateTo).toLocaleDateString('en-IN')}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            ${currentParty ? `
            <div class="party-info">
              <h3>Party Information</h3>
              <p><strong>Name:</strong> ${currentParty.name}</p>
              <p><strong>Phone:</strong> ${currentParty.phone}</p>
              <p><strong>Opening Balance:</strong> ₹${currentParty.openingBalance.toLocaleString('en-IN')}</p>
              <p><strong>Current Balance:</strong> ₹${currentParty.currentBalance.toLocaleString('en-IN')}</p>
              <p><strong>Credit Limit:</strong> ₹${currentParty.creditLimit.toLocaleString('en-IN')}</p>
            </div>
            ` : ''}
            <div class="stats">
              <div class="stat">
                <strong>Total Debit</strong><br>₹${totals.debit.toLocaleString('en-IN')}
              </div>
              <div class="stat">
                <strong>Total Credit</strong><br>₹${totals.credit.toLocaleString('en-IN')}
              </div>
              <div class="stat">
                <strong>Net Balance</strong><br>₹${(totals.debit - totals.credit).toLocaleString('en-IN')}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Remarks</th>
                  <th>Reference Type</th>
                  <th>Reference ID</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                ${ledgerEntries.map(item => `
                  <tr>
                    <td>${new Date(item.date).toLocaleDateString('en-IN')}</td>
                    <td>${item.remarks}</td>
                    <td>${item.referenceType}</td>
                    <td>${item.referenceId}</td>
                    <td class="debit">${item.debit > 0 ? '₹' + item.debit.toLocaleString('en-IN') : ''}</td>
                    <td class="credit">${item.credit > 0 ? '₹' + item.credit.toLocaleString('en-IN') : ''}</td>
                    <td>₹${item.balance.toLocaleString('en-IN')}</td>
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

  const getBalanceTextColor = (balance: number) => {
    if (balance < 0) return 'text-red-600';
    if (balance > currentParty!.creditLimit) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ledger Report</h1>
        <p className="text-gray-600 mt-2">
          Running ledger with debit/credit entries and balance tracking
        </p>
      </div>

      {/* Party Selection */}
      <Card className="border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Party *
            </label>
            <Select value={selectedParty} onValueChange={setSelectedParty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parties.map((party) => (
                  <SelectItem key={party.id} value={party.id}>
                    {party.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

      {/* Party Info */}
      {currentParty && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Party Name</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {currentParty.name}
            </p>
            <p className="text-xs text-gray-600 mt-2">📱 {currentParty.phone}</p>
          </Card>

          <Card className="border border-green-200 bg-green-50 p-6">
            <p className="text-sm text-gray-600 font-medium">
              Opening Balance
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ₹{currentParty.openingBalance.toLocaleString('en-IN')}
            </p>
          </Card>

          <Card className="border border-purple-200 bg-purple-50 p-6">
            <p className="text-sm text-gray-600 font-medium">Credit Limit</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ₹{currentParty.creditLimit.toLocaleString('en-IN')}
            </p>
          </Card>

          <Card
            className={`border-2 p-6 ${
              currentParty.currentBalance < 0
                ? 'border-red-300 bg-red-50'
                : currentParty.currentBalance > currentParty.creditLimit
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-green-300 bg-green-50'
            }`}
          >
            <p className="text-sm text-gray-600 font-medium">Current Balance</p>
            <p
              className={`text-2xl font-bold mt-2 ${getBalanceTextColor(
                currentParty.currentBalance
              )}`}
            >
              ₹{currentParty.currentBalance.toLocaleString('en-IN')}
            </p>
            {currentParty.currentBalance < 0 && (
              <p className="text-xs text-red-600 mt-1">Overpaid</p>
            )}
            {currentParty.currentBalance > currentParty.creditLimit && (
              <p className="text-xs text-orange-600 mt-1">Exceeds Limit</p>
            )}
          </Card>
        </div>
      )}

      {/* Alert for Credit Limit */}
      {currentParty && currentParty.currentBalance > currentParty.creditLimit && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>⚠️ Credit Limit Exceeded:</strong> Outstanding balance
            exceeds credit limit by ₹
            {(currentParty.currentBalance - currentParty.creditLimit).toLocaleString(
              'en-IN'
            )}.
            Review and collect payment.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="border-blue-300 text-blue-600 hover:bg-blue-50"
          onClick={handleExport}
          type="button"
        >
          <Download className="w-4 h-4 mr-2" />
          Export PDF
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

      {/* Ledger Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="text-gray-900 font-semibold">
                  Date
                </TableHead>
                <TableHead className="text-gray-900 font-semibold">
                  Remarks
                </TableHead>
                <TableHead className="text-gray-900 font-semibold">
                  Type
                </TableHead>
                <TableHead className="text-gray-900 font-semibold">
                  Reference
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Debit (₹)
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Credit (₹)
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Balance (₹)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.map((entry, idx) => (
                <TableRow
                  key={idx}
                  className={`border-b border-gray-200 ${getEntryColor(
                    entry.referenceType
                  )}`}
                >
                  <TableCell className="text-gray-900 font-medium">
                    {new Date(entry.date).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {entry.remarks}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        entry.referenceType === 'Sale'
                          ? 'bg-red-100 text-red-800'
                          : entry.referenceType === 'Payment'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {entry.referenceType}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 font-mono text-sm">
                    {entry.referenceId}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.debit > 0 ? (
                      <span className="text-red-600 font-bold">
                        ₹{entry.debit.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.credit > 0 ? (
                      <span className="text-green-600 font-bold">
                        ₹{entry.credit.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-gray-900">
                      ₹{entry.balance.toLocaleString('en-IN')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals Row */}
              <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                <TableCell colSpan={4} className="text-right font-bold text-gray-900">
                  Total:
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-red-600 font-bold">
                    ₹{totals.debit.toLocaleString('en-IN')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-green-600 font-bold">
                    ₹{totals.credit.toLocaleString('en-IN')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-gray-900 font-bold">
                    ₹{currentParty?.currentBalance.toLocaleString('en-IN')}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-red-200 bg-red-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Debits</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                ₹{totals.debit.toLocaleString('en-IN')}
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-red-600 opacity-30" />
          </div>
        </Card>

        <Card className="border border-green-200 bg-green-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Credits</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ₹{totals.credit.toLocaleString('en-IN')}
              </p>
            </div>
            <TrendingDown className="w-5 h-5 text-green-600 opacity-30" />
          </div>
        </Card>

        <Card className="border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Net Balance</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                ₹{(totals.debit - totals.credit).toLocaleString('en-IN')}
              </p>
            </div>
            <AlertCircle className="w-5 h-5 text-blue-600 opacity-30" />
          </div>
        </Card>
      </div>

      {/* Info Section */}
      {/* <Card className="border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Ledger System Explanation</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">📋</span>
              <span>
                <strong>Opening Balance:</strong> Initial balance when party was
                created
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold mt-0.5">↑</span>
              <span>
                <strong>Debit (Sale):</strong> Amount added to outstanding (birds
                dispatched)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">↓</span>
              <span>
                <strong>Credit (Payment):</strong> Amount subtracted from
                outstanding (payment received)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-0.5">💰</span>
              <span>
                <strong>Balance:</strong> Running balance = Previous Balance +
                Debit - Credit
              </span>
            </li>
          </ul>
        </div>
      </Card> */}
      </div>
    </DashboardLayout>
  );
};

export default LedgerReportPage;
