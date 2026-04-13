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
import { updateSale } from '@/app/redux/slices/billingSlice'
import { Sale } from '@/lib/billing-types'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditSalePage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const id = params.id as string

  const sale = useSelector((state: RootState) =>
    state.billing.sales.find((s) => s.id === id)
  )
  const parties = useSelector((state: RootState) => state.billing.parties)

  const [formData, setFormData] = useState({
    date: '',
    partyId: '',
    vehicleNo: '',
    birds: '',
    netWeight: '',
    rate: '',
    discount: '0',
    remarks: '',
  })

  const [calculations, setCalculations] = useState({
    avgWeight: 0,
    grossAmount: 0,
    finalAmount: 0,
  })

  useEffect(() => {
    if (sale) {
      setFormData({
        date: sale.date,
        partyId: sale.partyId,
        vehicleNo: sale.vehicleNo,
        birds: sale.birds.toString(),
        netWeight: sale.netWeight.toString(),
        rate: sale.rate.toString(),
        discount: sale.discount.toString(),
        remarks: sale.remarks || '',
      })
      calculateAmounts({
        birds: sale.birds.toString(),
        netWeight: sale.netWeight.toString(),
        rate: sale.rate.toString(),
        discount: sale.discount.toString(),
      })
    }
  }, [sale])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    const newData = { ...formData, [name]: value }
    setFormData(newData)

    if (name === 'birds' || name === 'netWeight' || name === 'rate' || name === 'discount') {
      calculateAmounts(newData)
    }
  }

  const calculateAmounts = (data: typeof formData) => {
    const birds = parseFloat(data.birds) || 0
    const weight = parseFloat(data.netWeight) || 0
    const rate = parseFloat(data.rate) || 0
    const discount = parseFloat(data.discount) || 0

    const avgWeight = birds > 0 ? weight / birds : 0
    const grossAmount = weight * rate
    const finalAmount = grossAmount - discount

    setCalculations({
      avgWeight: parseFloat(avgWeight.toFixed(2)),
      grossAmount: parseFloat(grossAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sale) return

    const updatedSale: Sale = {
      ...sale,
      date: formData.date,
      partyId: formData.partyId,
      vehicleNo: formData.vehicleNo,
      birds: parseInt(formData.birds),
      netWeight: parseFloat(formData.netWeight),
      rate: parseFloat(formData.rate),
      discount: parseFloat(formData.discount),
      totalAmount: calculations.finalAmount,
      remarks: formData.remarks,
      updatedAt: new Date().toISOString(),
    }

    dispatch(updateSale(updatedSale))
    router.push('/billing/sale-entry')
  }

  if (!sale) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Sale not found</p>
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
            onClick={() => router.push('/billing/sale-entry')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sales
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Sale Entry</h1>
            <p className="text-gray-600 mt-2">Update sale details</p>
          </div>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Sale Information</CardTitle>
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
                    Rate/kg *
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
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Gross Amount
                  </label>
                  <Input
                    type="text"
                    value={`₹${calculations.grossAmount.toLocaleString('en-IN')}`}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Final Amount
                  </label>
                  <Input
                    type="text"
                    value={`₹${calculations.finalAmount.toLocaleString('en-IN')}`}
                    disabled
                    className="bg-gray-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Discount Applied
                  </label>
                  <Input
                    type="text"
                    value={`₹${(calculations.grossAmount - calculations.finalAmount).toLocaleString('en-IN')}`}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
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
                  Update Sale
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/billing/sale-entry')}
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