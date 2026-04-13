'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RootState, AppDispatch } from '@/app/redux/store'
import { updateParty } from '@/app/redux/slices/billingSlice'
import { Party } from '@/lib/billing-types'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditPartyPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const id = params.id as string

  const party = useSelector((state: RootState) =>
    state.billing.parties.find((p) => p.id === id)
  )

  const [formData, setFormData] = useState({
    name: '',
    type: 'Retailer' as 'Retailer' | 'Farm' | 'Trader' | 'Distributor',
    phone: '',
    address: '',
    openingBalance: '',
    creditLimit: '',
    paymentTerms: '',
  })

  useEffect(() => {
    if (party) {
      setFormData({
        name: party.name,
        type: party.type,
        phone: party.phone,
        address: party.address,
        openingBalance: party.openingBalance.toString(),
        creditLimit: party.creditLimit.toString(),
        paymentTerms: party.paymentTerms.toString(),
      })
    }
  }, [party])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!party) return

    const updatedParty: Party = {
      ...party,
      name: formData.name,
      type: formData.type,
      phone: formData.phone,
      address: formData.address,
      openingBalance: parseFloat(formData.openingBalance) || 0,
      creditLimit: parseFloat(formData.creditLimit) || 0,
      paymentTerms: parseInt(formData.paymentTerms) || 30,
      updatedAt: new Date().toISOString(),
    }

    dispatch(updateParty(updatedParty))
    router.push('/billing/party-master')
  }

  if (!party) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Party not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/billing/party-master')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Parties
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Party</h1>
            <p className="text-gray-600 mt-2">Update party details</p>
          </div>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Party Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Party Name *
                  </label>
                  <Input
                    placeholder="Enter party name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Type *
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: 'Retailer' | 'Farm' | 'Trader' | 'Distributor') =>
                      setFormData({ ...formData, type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
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
                    Phone Number *
                  </label>
                  <Input
                    placeholder="Enter phone number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Payment Terms (Days)
                  </label>
                  <Input
                    type="number"
                    placeholder="30"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Address *
                </label>
                <Textarea
                  placeholder="Enter full address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Opening Balance (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    name="openingBalance"
                    value={formData.openingBalance}
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Credit Limit (₹) *
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Update Party
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/billing/party-master')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}