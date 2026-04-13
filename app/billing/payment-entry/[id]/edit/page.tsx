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
import { updatePayment } from '@/app/redux/slices/billingSlice'
import { Payment } from '@/lib/billing-types'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const id = params.id as string

  const payment = useSelector((state: RootState) =>
    state.billing.payments.find((p) => p.id === id)
  )
  const parties = useSelector((state: RootState) => state.billing.parties)

  const [formData, setFormData] = useState({
    date: '',
    partyId: '',
    mode: 'Cash' as 'Cash' | 'Bank' | 'UPI' | 'Cheque',
    amount: '',
    reference: '',
    remarks: '',
    status: 'Completed' as 'Completed' | 'Pending' | 'Failed',
  })

  useEffect(() => {
    if (payment) {
      setFormData({
        date: payment.date,
        partyId: payment.partyId,
        mode: payment.mode,
        amount: payment.amount.toString(),
        reference: payment.reference || '',
        remarks: payment.remarks || '',
        status: payment.status,
      })
    }
  }, [payment])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!payment) return

    const updatedPayment: Payment = {
      ...payment,
      date: formData.date,
      partyId: formData.partyId,
      mode: formData.mode,
      amount: parseFloat(formData.amount),
      reference: formData.reference,
      remarks: formData.remarks,
      status: formData.status,
      updatedAt: new Date().toISOString(),
    }

    dispatch(updatePayment(updatedPayment))
    router.push('/billing/payment-entry')
  }

  if (!payment) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Payment not found</p>
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
            onClick={() => router.push('/billing/payment-entry')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payments
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Payment Entry</h1>
            <p className="text-gray-600 mt-2">Update payment details</p>
          </div>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Select
                    value={formData.partyId}
                    onValueChange={(val) => setFormData({ ...formData, partyId: val })}
                  >
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
                  <Select
                    value={formData.mode}
                    onValueChange={(val: 'Cash' | 'Bank' | 'UPI' | 'Cheque') =>
                      setFormData({ ...formData, mode: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
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
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Reference Number
                </label>
                <Input
                  placeholder="Transaction ID, Cheque No, etc."
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status *
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val: 'Completed' | 'Pending' | 'Failed') =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Remarks
                </label>
                <Textarea
                  placeholder="Additional notes..."
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Update Payment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/billing/payment-entry')}
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