'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Phone,
  MapPin,
  TrendingDown,
  Users,
  ShoppingCart,
} from 'lucide-react'
import { RootState, AppDispatch } from '@/app/redux/store'
import { addParty, deleteParty } from '@/app/redux/slices/billingSlice'
import { Party } from '@/lib/billing-types'

const PartyMasterPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const parties = useSelector((state: RootState) => state.billing.parties)

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredParties = parties.filter((party) => {
    const matchesSearch =
      party.name.toLowerCase().includes(search.toLowerCase()) ||
      party.phone.includes(search)
    const matchesType = typeFilter === 'all' || party.type === typeFilter
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this party?')) {
      dispatch(deleteParty(id));
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return 'text-red-600'
    if (balance > 50000) return 'text-green-600'
    return 'text-orange-600'
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Party Master</h1>
            <p className="text-muted-foreground mt-2">
              Manage retailers, farms, and trading partners
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Party
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Party</DialogTitle>
                <DialogDescription>
                  Add a new retailer, farm, or trading partner
                </DialogDescription>
              </DialogHeader>
              <PartyForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Search by Name or Phone
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Filter by Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
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
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Total Parties</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parties.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Retailers</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {parties.filter((p) => p.type === 'Retailer').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Overpayments</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {parties.filter((p) => p.currentBalance < 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Parties List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParties.length > 0 ? (
                    filteredParties.map((party) => (
                      <TableRow key={party.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{party.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {party.address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                            {party.type}
                          </span>
                        </TableCell>
                        <TableCell>{party.phone}</TableCell>
                        <TableCell>
                          <span className={party.currentBalance < 0 ? 'text-red-600 font-semibold' : ''}>
                            ₹{Math.abs(party.currentBalance).toLocaleString('en-IN')}
                            {party.currentBalance < 0 && ' (Overpaid)'}
                          </span>
                        </TableCell>
                        <TableCell>₹{party.creditLimit.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/billing/party-master/${party.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(party.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">No parties found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
};

interface PartyFormProps {
  onSuccess?: () => void;
}

const PartyForm = ({ onSuccess }: PartyFormProps) => {
  const dispatch = useDispatch<AppDispatch>()

  const [formData, setFormData] = useState({
    name: '',
    type: 'Retailer' as 'Retailer' | 'Farm' | 'Trader' | 'Distributor',
    phone: '',
    address: '',
    openingBalance: '',
    creditLimit: '',
    paymentTerms: '30',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParty: Party = {
      id: `PARTY${Date.now()}`,
      name: formData.name,
      type: formData.type,
      phone: formData.phone,
      address: formData.address,
      openingBalance: parseFloat(formData.openingBalance) || 0,
      currentBalance: parseFloat(formData.openingBalance) || 0,
      creditLimit: parseFloat(formData.creditLimit) || 0,
      paymentTerms: parseInt(formData.paymentTerms) || 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch(addParty(newParty));
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Party Name *
          </label>
          <Input
            placeholder="Enter party name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Party Type *
          </label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Retailer">Retailer</SelectItem>
              <SelectItem value="Farm">Farm</SelectItem>
              <SelectItem value="Trader">Trader</SelectItem>
              <SelectItem value="Distributor">Distributor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Mobile Number *
          </label>
          <Input
            placeholder="10-digit mobile number"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Address *
          </label>
          <Input
            placeholder="Complete address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Opening Balance (₹) *
          </label>
          <Input
            type="number"
            placeholder="0"
            value={formData.openingBalance}
            onChange={(e) =>
              setFormData({ ...formData, openingBalance: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Credit Limit (₹) *
          </label>
          <Input
            type="number"
            placeholder="0"
            value={formData.creditLimit}
            onChange={(e) =>
              setFormData({ ...formData, creditLimit: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Payment Terms (Days) *
        </label>
        <Input
          type="number"
          placeholder="30"
          value={formData.paymentTerms}
          onChange={(e) =>
            setFormData({ ...formData, paymentTerms: e.target.value })
          }
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 flex-1"
        >
          Save Party
        </Button>
      </div>
    </form>
  );
};

export default PartyMasterPage;
