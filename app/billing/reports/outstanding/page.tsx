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
} from 'lucide-react';

interface OutstandingParty {
  id: number;
  name: string;
  partyType: string;
  phone: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  currentBalance: number;
  creditLimit: number;
  daysOverdue: number;
  lastTransactionDate: string;
}

const OutstandingReportPage = () => {
  const [parties, setParties] = useState<OutstandingParty[]>([
    {
      id: 1,
      name: 'Sharma Poultry Shop',
      partyType: 'Retailer',
      phone: '9876543210',
      openingBalance: 50000,
      totalDebit: 268000,
      totalCredit: 305500,
      currentBalance: 12500,
      creditLimit: 100000,
      daysOverdue: 0,
      lastTransactionDate: '2024-04-05',
    },
    {
      id: 2,
      name: 'Patel Farms',
      partyType: 'Farm',
      phone: '9987654321',
      openingBalance: 100000,
      totalDebit: 0,
      totalCredit: 15000,
      currentBalance: 85000,
      creditLimit: 200000,
      daysOverdue: 0,
      lastTransactionDate: '2024-04-08',
    },
    {
      id: 3,
      name: 'Delhi Bird Distributor',
      partyType: 'Distributor',
      phone: '9876789012',
      openingBalance: 75000,
      totalDebit: 725125,
      totalCredit: 805125,
      currentBalance: -5000,
      creditLimit: 150000,
      daysOverdue: 0,
      lastTransactionDate: '2024-04-07',
    },
    {
      id: 4,
      name: 'Mehta Poultry Hub',
      partyType: 'Retailer',
      phone: '9988776655',
      openingBalance: 30000,
      totalDebit: 450000,
      totalCredit: 380000,
      currentBalance: 100000,
      creditLimit: 75000,
      daysOverdue: 15,
      lastTransactionDate: '2024-03-25',
    },
    {
      id: 5,
      name: 'Rajesh Trading Co',
      partyType: 'Trader',
      phone: '9877665544',
      openingBalance: 60000,
      totalDebit: 320000,
      totalCredit: 280000,
      currentBalance: 100000,
      creditLimit: 120000,
      daysOverdue: 8,
      lastTransactionDate: '2024-04-01',
    },
  ]);

  const [sortBy, setSortBy] = useState('balance');
  const [typeFilter, setTypeFilter] = useState('all')

  const filteredAndSorted = parties
    .filter((p) => typeFilter === 'all' || p.partyType === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'balance') return b.currentBalance - a.currentBalance;
      if (sortBy === 'overdue') return b.daysOverdue - a.daysOverdue;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const stats = {
    totalOutstanding: parties.reduce((sum, p) => sum + (p.currentBalance > 0 ? p.currentBalance : 0), 0),
    totalOverpaid: parties.reduce((sum, p) => sum + (p.currentBalance < 0 ? Math.abs(p.currentBalance) : 0), 0),
    overdueCount: parties.filter((p) => p.daysOverdue > 0).length,
    exceededLimitCount: parties.filter(
      (p) => p.currentBalance > p.creditLimit
    ).length,
  };

  const getStatusColor = (balance: number, creditLimit: number) => {
    if (balance < 0) return 'bg-blue-100 text-blue-800';
    if (balance > creditLimit) return 'bg-red-100 text-red-800';
    if (balance > creditLimit * 0.8) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (balance: number, creditLimit: number) => {
    if (balance < 0) return 'Overpaid';
    if (balance > creditLimit) return 'Exceeds Limit';
    if (balance > creditLimit * 0.8) return 'High Balance';
    return 'Good';
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
    if (!filteredAndSorted || filteredAndSorted.length === 0) {
      alert('No data available to export.');
      return;
    }
    try {
      const exportData = filteredAndSorted.map(item => ({
        ID: item.id,
        Name: item.name,
        Party_Type: item.partyType,
        Phone: item.phone,
        Opening_Balance: item.openingBalance,
        Total_Debit: item.totalDebit,
        Total_Credit: item.totalCredit,
        Current_Balance: item.currentBalance,
        Credit_Limit: item.creditLimit,
        Days_Overdue: item.daysOverdue,
        Last_Transaction_Date: item.lastTransactionDate,
        Status: getStatusText(item.currentBalance, item.creditLimit),
      }));
      downloadCSV(exportData, 'outstanding_report');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handlePrint = () => {
    if (!filteredAndSorted || filteredAndSorted.length === 0) {
      alert('No data available to print.');
      return;
    }
    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Outstanding Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              .header { margin-bottom: 20px; }
              .stats { display: flex; justify-content: space-around; margin-bottom: 20px; flex-wrap: wrap; }
              .stat { text-align: center; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .overdue { background-color: #fef2f2; }
              .high-balance { background-color: #fffbeb; }
              .exceeds-limit { background-color: #fef2f2; }
              .overpaid { background-color: #eff6ff; }
              .good { background-color: #f0fdf4; }
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <h1>Outstanding Report</h1>
            <div class="header">
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Filter:</strong> ${typeFilter === 'all' ? 'All Types' : typeFilter}</p>
              <p><strong>Sort By:</strong> ${sortBy === 'balance' ? 'Balance' : sortBy === 'overdue' ? 'Overdue Days' : 'Name'}</p>
            </div>
            <div class="stats">
              <div class="stat">
                <strong>Total Outstanding</strong><br>₹${stats.totalOutstanding.toLocaleString('en-IN')}
              </div>
              <div class="stat">
                <strong>Total Overpaid</strong><br>₹${stats.totalOverpaid.toLocaleString('en-IN')}
              </div>
              <div class="stat">
                <strong>Overdue Parties</strong><br>${stats.overdueCount}
              </div>
              <div class="stat">
                <strong>Exceeded Limit</strong><br>${stats.exceededLimitCount}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Opening Balance</th>
                  <th>Total Debit</th>
                  <th>Total Credit</th>
                  <th>Current Balance</th>
                  <th>Credit Limit</th>
                  <th>Days Overdue</th>
                  <th>Last Transaction</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAndSorted.map(item => `
                  <tr class="${getStatusText(item.currentBalance, item.creditLimit).toLowerCase().replace(' ', '-')}">
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.partyType}</td>
                    <td>${item.phone}</td>
                    <td>₹${item.openingBalance.toLocaleString('en-IN')}</td>
                    <td>₹${item.totalDebit.toLocaleString('en-IN')}</td>
                    <td>₹${item.totalCredit.toLocaleString('en-IN')}</td>
                    <td>₹${item.currentBalance.toLocaleString('en-IN')}</td>
                    <td>₹${item.creditLimit.toLocaleString('en-IN')}</td>
                    <td>${item.daysOverdue}</td>
                    <td>${new Date(item.lastTransactionDate).toLocaleDateString('en-IN')}</td>
                    <td>${getStatusText(item.currentBalance, item.creditLimit)}</td>
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
            <h1 className="text-3xl font-bold tracking-tight">Outstanding Report</h1>
            <p className="text-muted-foreground mt-2">
              View pending balance and credit limit status for all retailers
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Outstanding</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            ₹{stats.totalOutstanding.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            From {parties.filter((p) => p.currentBalance > 0).length} parties
          </p>
        </Card>

        <Card className="border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Overpaid Amount</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            ₹{stats.totalOverpaid.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            From {parties.filter((p) => p.currentBalance < 0).length} parties
          </p>
        </Card>

        <Card className="border border-orange-200 bg-orange-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Overdue Count</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {stats.overdueCount}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Parties with pending payments
          </p>
        </Card>

        <Card className="border border-purple-200 bg-purple-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Limit Exceeded</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {stats.exceededLimitCount}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Parties exceeding credit limit
          </p>
        </Card>
      </div>

      {/* Alert */}
      {stats.exceededLimitCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>⚠️ Action Required:</strong> {stats.exceededLimitCount} parties
            have exceeded their credit limit. Review and take necessary action.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filter by Party Type
            </label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Retailer">Retailer</SelectItem>
                <SelectItem value="Farm">Farm</SelectItem>
                <SelectItem value="Trader">Trader</SelectItem>
                <SelectItem value="Distributor">Distributor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Balance (Highest)</SelectItem>
                <SelectItem value="overdue">Days Overdue</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

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
                  Type
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Opening Bal
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Debit
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Credit
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Current Balance
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Credit Limit
                </TableHead>
                <TableHead className="text-center text-gray-900 font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Last Txn
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((party) => (
                <TableRow key={party.id} className="border-b border-gray-200">
                  <TableCell className="text-gray-900 font-semibold">
                    <Link href={`/billing/ledger?party=${party.id}`} className="text-blue-600 hover:underline">
                        {party.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-700">{party.partyType}</TableCell>
                  <TableCell className="text-right text-gray-900">
                    ₹{party.openingBalance.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-semibold">
                    ₹{party.totalDebit.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-semibold">
                    ₹{party.totalCredit.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-bold text-gray-900">
                    ₹{party.currentBalance.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right text-gray-900">
                    ₹{party.creditLimit.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        party.currentBalance,
                        party.creditLimit
                      )}`}
                    >
                      {getStatusText(party.currentBalance, party.creditLimit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-gray-700">
                    {new Date(party.lastTransactionDate).toLocaleDateString(
                      'en-IN'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary Card */}
      {/* <Card className="border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Summary & Analysis
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Total Parties:</strong> {parties.length}
            </p>
            <p>
              <strong>Total Outstanding:</strong> ₹
              {stats.totalOutstanding.toLocaleString('en-IN')}
            </p>
            <p>
              <strong>Average Per Party:</strong> ₹
              {Math.round(stats.totalOutstanding / parties.length).toLocaleString(
                'en-IN'
              )}
            </p>
            <p className="text-red-600 font-semibold">
              <strong>Parties Exceeding Limit:</strong> {stats.exceededLimitCount}
            </p>
          </div>
        </div>
      </Card> */}
      </div>
    </DashboardLayout>
  );
};

export default OutstandingReportPage;
