"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { billingApi } from "@/lib/api"
import { Plus, Pencil, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface BillingParty {
  id: string
  name: string
  type: 'Retailer' | 'Farm' | 'Trader' | 'Distributor'
  phone?: string
  address?: string
  openingBalance: number
  currentBalance: number
  creditLimit: number
  paymentTerms: number
}

const defaultForm = {
  name: '',
  type: 'Retailer' as BillingParty['type'],
  phone: '',
  address: '',
  openingBalance: 0,
  creditLimit: 0,
  paymentTerms: 30,
}

export default function PartiesPage() {
  const [parties, setParties] = useState<BillingParty[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const fetchParties = async () => {
    setLoading(true)
    try {
      const data = await billingApi.getParties()
      setParties(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load parties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchParties() }, [])

  const openCreate = () => {
    setEditId(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (party: BillingParty) => {
    setEditId(party.id)
    setForm({
      name: party.name,
      type: party.type,
      phone: party.phone || '',
      address: party.address || '',
      openingBalance: party.openingBalance,
      creditLimit: party.creditLimit,
      paymentTerms: party.paymentTerms,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Party name is required')
      return
    }
    setSaving(true)
    try {
      if (editId) {
        await billingApi.updateParty(editId, form)
        toast.success('Party updated')
      } else {
        await billingApi.createParty(form)
        toast.success('Party created')
      }
      setDialogOpen(false)
      fetchParties()
    } catch {
      toast.error('Failed to save party')
    } finally {
      setSaving(false)
    }
  }

  const formatBalance = (val: number) => {
    const n = Number(val) || 0
    return n < 0 ? `-₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Farm: 'bg-blue-100 text-blue-800',
      Retailer: 'bg-orange-100 text-orange-800',
      Trader: 'bg-purple-100 text-purple-800',
      Distributor: 'bg-green-100 text-green-800',
    }
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing Parties</h1>
            <p className="text-muted-foreground mt-1">Manage all billing parties and opening balances</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchParties} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Add Party
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Parties</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead className="text-right">Credit Limit</TableHead>
                  <TableHead className="text-right w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : parties.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No parties found. Click "Add Party" to create one.</TableCell></TableRow>
                ) : parties.map((party) => (
                  <TableRow key={party.id}>
                    <TableCell>{typeBadge(party.type)}</TableCell>
                    <TableCell className="font-medium">{party.name}</TableCell>
                    <TableCell className="text-muted-foreground">{party.phone || '-'}</TableCell>
                    <TableCell className="text-right">{formatBalance(party.openingBalance)}</TableCell>
                    <TableCell className={`text-right font-semibold ${Number(party.currentBalance) > 0 ? 'text-green-600' : Number(party.currentBalance) < 0 ? 'text-red-600' : ''}`}>
                      {formatBalance(party.currentBalance)}
                    </TableCell>
                    <TableCell className="text-right">{formatBalance(party.creditLimit)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(party)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Party' : 'Create Party'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Party Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter party name" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as BillingParty['type'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Farm">Farm</SelectItem>
                    <SelectItem value="Retailer">Retailer</SelectItem>
                    <SelectItem value="Trader">Trader</SelectItem>
                    <SelectItem value="Distributor">Distributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms (days)</Label>
                <Input type="number" min={0} value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opening Balance (₹)</Label>
                <Input type="number" step="0.01" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: parseFloat(e.target.value) || 0 })} />
                <p className="text-xs text-muted-foreground">Positive = they owe you | Negative = you owe them</p>
              </div>
              <div className="space-y-2">
                <Label>Credit Limit (₹)</Label>
                <Input type="number" step="0.01" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
