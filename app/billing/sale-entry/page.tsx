'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { RootState, AppDispatch } from '@/app/redux/store'
import { addSale, deleteSale } from '@/app/redux/slices/billingSlice'
import { Sale } from '@/lib/billing-types'

const SaleEntryPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const sales = useSelector((state: RootState) => state.billing.sales)
  const parties = useSelector((state: RootState) => state.billing.parties)

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [searchParty, setSearchParty] = useState('');

  const filteredSales = sales.filter((sale) => {
    const party = parties.find(p => p.id === sale.partyId)
    const matchesDate = !searchDate || sale.date === searchDate;
    const matchesParty = !searchParty ||
      (party && party.name.toLowerCase().includes(searchParty.toLowerCase()));
    return matchesDate && matchesParty;
  });

  const stats = {
    totalSales: sales.length,
    totalBirds: sales.reduce((sum, s) => sum + s.birds, 0),
    totalAmount: sales.reduce((sum, s) => sum + s.totalAmount, 0),
    totalWeight: sales.reduce((sum, s) => sum + s.netWeight, 0),
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this sale entry?')) {
      dispatch(deleteSale(id));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sale Entry</h1>
          <p className="text-gray-600 mt-2">
            Record bird dispatch and sales to retailers
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-5 h-5 mr-2" />
              New Sale Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sale Entry</DialogTitle>
              <DialogDescription>
                Record bird dispatch with weight and calculation details
              </DialogDescription>
            </DialogHeader>
            <SaleForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Sales</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalSales}
          </p>
        </Card>
        <Card className="border border-green-200 bg-green-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Birds</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalBirds.toLocaleString('en-IN')}
          </p>
        </Card>
        <Card className="border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Weight</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalWeight.toLocaleString('en-IN')} kg
          </p>
        </Card>
        <Card className="border border-purple-200 bg-purple-50 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ₹{stats.totalAmount.toLocaleString('en-IN')}
          </p>
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

      {/* Alert for Stock Control */}
      <Alert className="border-blue-200 bg-blue-50">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Note:</strong> Each sale entry automatically updates inventory
          and creates a ledger entry (debit) for the retailer
        </AlertDescription>
      </Alert>

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
                  Amount
                </TableHead>
                <TableHead className="text-right text-gray-900 font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="border-b border-gray-200">
                    <TableCell className="text-gray-900 font-medium">
                      {new Date(sale.date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="text-gray-900 font-semibold">
                      {parties.find(p => p.id === sale.partyId)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-900">
                        <Truck className="w-4 h-4 text-gray-400" />
                        {sale.vehicleNo}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-gray-900 font-semibold">
                      {sale.birds.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right text-gray-900">
                      {sale.netWeight.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right text-gray-900">
                      {sale.avgWeight.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-gray-900">
                      ₹{sale.rate.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right text-gray-900 font-bold">
                      ₹{sale.totalAmount.toLocaleString('en-IN')}
                      {sale.discount > 0 && (
                        <p className="text-xs text-gray-500">
                          Discount: ₹{sale.discount.toLocaleString('en-IN')}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/billing/sale-entry/${sale.id}/edit`}>
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
                          onClick={() => handleDelete(sale.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p className="text-gray-500">No sales found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Calculation Info */}
      <Card className="border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Sale Calculation Formula
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Average Weight:</strong> Net Weight ÷ Birds =
              {' '}
              <span className="text-blue-600">{filteredSales[0]?.avgWeight || 5.0}</span>
              {' '}
              kg/bird
            </p>
            <p>
              <strong>Gross Amount:</strong> Net Weight × Rate/kg
            </p>
            <p>
              <strong>Final Amount:</strong> Gross Amount - Discount
            </p>
            <p className="text-blue-600 font-semibold pt-2">
              → This amount is added as DEBIT in the party ledger
            </p>
          </div>
        </div>
      </Card>
        </div>
      </DashboardLayout>
    );
};

interface SaleFormProps {
  onSuccess?: () => void;
}

const SaleForm = ({ onSuccess }: SaleFormProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const parties = useSelector((state: RootState) => state.billing.parties)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyId: '',
    vehicleNo: '',
    birds: '',
    netWeight: '',
    rate: '',
    discount: '0',
    remarks: '',
  });

  const [calculations, setCalculations] = useState({
    avgWeight: 0,
    grossAmount: 0,
    finalAmount: 0,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);

    // Recalculate on relevant changes
    if (name === 'birds' || name === 'netWeight' || name === 'rate') {
      calculateAmounts(newData);
    }
  };

  const calculateAmounts = (data: typeof formData) => {
    const birds = parseFloat(data.birds) || 0;
    const weight = parseFloat(data.netWeight) || 0;
    const rate = parseFloat(data.rate) || 0;
    const discount = parseFloat(data.discount) || 0;

    const avgWeight = birds > 0 ? weight / birds : 0;
    const grossAmount = weight * rate;
    const finalAmount = grossAmount - discount;

    setCalculations({
      avgWeight: parseFloat(avgWeight.toFixed(2)),
      grossAmount: parseFloat(grossAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSale: Sale = {
      id: `SALE${Date.now()}`,
      partyId: formData.partyId,
      date: formData.date,
      birds: parseInt(formData.birds),
      netWeight: parseFloat(formData.netWeight),
      avgWeight: calculations.avgWeight,
      rate: parseFloat(formData.rate),
      discount: parseFloat(formData.discount),
      totalAmount: calculations.finalAmount,
      vehicleNo: formData.vehicleNo,
      remarks: formData.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch(addSale(newSale));
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Date *
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

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Vehicle Number *
        </label>
        <Input
          placeholder="e.g., DL-01-AB-1234"
          name="vehicleNo"
          value={formData.vehicleNo}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Number of Birds *
          </label>
          <Input
            type="number"
            placeholder="0"
            name="birds"
            value={formData.birds}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Net Weight (kg) *
          </label>
          <Input
            type="number"
            placeholder="0"
            name="netWeight"
            value={formData.netWeight}
            onChange={handleInputChange}
            step="0.1"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Avg Weight (kg) [Auto]
          </label>
          <Input
            type="text"
            value={calculations.avgWeight.toFixed(2)}
            disabled
            className="bg-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Rate per kg (₹) *
          </label>
          <Input
            type="number"
            placeholder="0"
            name="rate"
            value={formData.rate}
            onChange={handleInputChange}
            step="0.1"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Discount (₹)
          </label>
          <Input
            type="number"
            placeholder="0"
            name="discount"
            value={formData.discount}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Calculations Display */}
      <Card className="border border-blue-200 bg-blue-50 p-4">
        <div className="space-y-2 text-sm">
          <p className="text-gray-700">
            <strong>Gross Amount:</strong>
            {' '}
            ₹{calculations.grossAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-gray-700">
            <strong>Discount:</strong>
            {' '}
            ₹{(parseFloat(formData.discount) || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-lg font-bold text-green-600">
            <strong>Final Amount:</strong>
            {' '}
            ₹{calculations.finalAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </Card>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Remarks
        </label>
        <textarea
          placeholder="Add any remarks..."
          name="remarks"
          value={formData.remarks}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 flex-1"
        >
          Create Sale Entry
        </Button>
      </div>
    </form>
  );
};

export default SaleEntryPage;
