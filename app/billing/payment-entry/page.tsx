'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import { RootState, AppDispatch } from '@/app/redux/store'
import { addPayment, deletePayment } from '@/app/redux/slices/billingSlice'
import { Payment } from '@/lib/billing-types'

const PaymentEntryPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const payments = useSelector((state: RootState) => state.billing.payments)
  const parties = useSelector((state: RootState) => state.billing.parties)

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [searchParty, setSearchParty] = useState('');

  const filteredPayments = payments.filter((payment) => {
    const party = parties.find(p => p.id === payment.partyId)
    const matchesDate = !searchDate || payment.date === searchDate;
    const matchesParty = !searchParty ||
      (party && party.name.toLowerCase().includes(searchParty.toLowerCase()));
    return matchesDate && matchesParty;
  });

  const stats = {
    totalPayments: payments.filter((p) => p.status === 'Completed').length,
    totalAmount: payments
      .filter((p) => p.status === 'Completed')
      .reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments
      .filter((p) => p.status === 'Pending')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this payment entry?')) {
      dispatch(deletePayment(id));
    }
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Completed: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Entry</h1>
          <p className="text-gray-600 mt-2">
            Record payments received from retailers and partners
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-5 h-5 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Payment Entry</DialogTitle>
              <DialogDescription>
                Add a new payment received from retailer or partner
              </DialogDescription>
            </DialogHeader>
            <PaymentForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-green-200 bg-green-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Completed Payments</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalPayments}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            ₹{stats.totalAmount.toLocaleString('en-IN')}
          </p>
        </Card>
        <Card className="border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Pending Clearance</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            ₹{stats.pendingAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {payments.filter((p) => p.status === 'Pending').length} payments
          </p>
        </Card>
        <Card className="border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Payment Methods</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-700">
              Cash: {payments.filter((p) => p.mode === 'Cash').length}
            </p>
            <p className="text-sm text-gray-700">
              Bank: {payments.filter((p) => p.mode === 'Bank').length}
            </p>
            <p className="text-sm text-gray-700">
              UPI: {payments.filter((p) => p.mode === 'UPI').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filter by Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Search Party Name
            </label>
            <Input
              placeholder="Search party..."
              value={searchParty}
              onChange={(e) => setSearchParty(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Alert for Pending Payments */}
      {stats.pendingAmount > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <checkpoint className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>⚠️ Pending Payments:</strong> ₹
            {stats.pendingAmount.toLocaleString('en-IN')} is awaiting clearance.
            Update status when confirmed.
          </AlertDescription>
        </Alert>
      )}

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
                <TableHead className="text-gray-900 font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="border-b border-gray-200">
                    <TableCell className="text-gray-900 font-medium">
                      {new Date(payment.date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="text-gray-900 font-semibold">
                      {parties.find(p => p.id === payment.partyId)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getModeColor(
                          payment.mode
                        )}`}
                      >
                        {getModeIcon(payment.mode)}
                        {payment.mode}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-gray-900 font-bold">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {payment.reference ? (
                        <div>
                          <p className="text-sm font-mono text-blue-600">
                            {payment.reference}
                          </p>
                          {payment.remarks && (
                            <p className="text-xs text-gray-500 mt-1">
                              {payment.remarks}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/billing/payment-entry/${payment.id}/edit`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(payment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-gray-500">No payments found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Info Section */}
      <Card className="border border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Processing</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-0.5">1.</span>
              <span>
                <strong>Record Payment:</strong> Enter payment details and mode
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-0.5">2.</span>
              <span>
                <strong>Create Ledger Entry:</strong> System automatically
                creates a CREDIT entry for the retailer
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-0.5">3.</span>
              <span>
                <strong>Update Balance:</strong> Party outstanding balance is
                reduced
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold mt-0.5">4.</span>
              <span>
                <strong>Confirm Status:</strong> Mark as Completed once payment
                is verified
              </span>
            </li>
          </ul>
        </div>
      </Card>
        </div>
      </DashboardLayout>
    )
};

interface PaymentFormProps {
  onSuccess?: () => void;
}

const PaymentForm = ({ onSuccess }: PaymentFormProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const parties = useSelector((state: RootState) => state.billing.parties)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyId: '',
    mode: 'Cash' as 'Cash' | 'Bank' | 'UPI' | 'Cheque',
    amount: '',
    reference: '',
    remarks: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPayment: Payment = {
      id: `PAY${Date.now()}`,
      partyId: formData.partyId,
      date: formData.date,
      mode: formData.mode,
      amount: parseFloat(formData.amount),
      reference: formData.reference,
      remarks: formData.remarks,
      status: 'Completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch(addPayment(newPayment));
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Payment Date *
          </label>
          <Input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Party Name *
          </label>
          <Select value={formData.partyId} onValueChange={(val) =>
            setFormData({ ...formData, partyId: val })
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select party" />
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Payment Mode *
          </label>
          <Select value={formData.mode} onValueChange={(val) =>
            setFormData({ ...formData, mode: val })
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">
                <span className="flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Cash
                </span>
              </SelectItem>
              <SelectItem value="Bank">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Bank Transfer
                </span>
              </SelectItem>
              <SelectItem value="UPI">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  UPI
                </span>
              </SelectItem>
              <SelectItem value="Cheque">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Cheque
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Amount (₹) *
          </label>
          <Input
            type="number"
            placeholder="0"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      {(formData.mode === 'Bank' || formData.mode === 'UPI' ||
        formData.mode === 'Cheque') && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Reference / Transaction ID
          </label>
          <Input
            placeholder={`e.g., ${
              formData.mode === 'Bank'
                ? 'TXN123456'
                : formData.mode === 'UPI'
                  ? 'UPI123456'
                  : 'CHQ789456'
            }`}
            name="reference"
            value={formData.reference}
            onChange={handleInputChange}
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Remarks
        </label>
        <textarea
          placeholder="Add any notes about this payment..."
          name="remarks"
          value={formData.remarks}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          rows={3}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This payment will create a CREDIT entry in the
          party ledger and reduce outstanding balance.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 flex-1"
        >
          Record Payment
        </Button>
      </div>
    </form>
  );
};

export default PaymentEntryPage;
