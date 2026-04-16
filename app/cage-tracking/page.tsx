"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { purchasesApi } from "@/lib/api"
import { toast } from "sonner"
import { TrendingDown } from "lucide-react"

interface CageJourneyRow {
  id: string
  cageId?: string
  numberOfBirds: number
  status: string
  purchaseWeight: number
  saleWeight: number | null
  godownInwardWeight: number | null
  godownSaleWeight: number | null
  lossPurchaseToSale: number | null
  lossSaleToGodown: number | null
  lossGodownToSale: number | null
  totalLoss: number | null
}

export default function CageTrackingPage() {
  const [purchaseBills, setPurchaseBills] = useState<Array<{ id: string; orderNumber: string; supplierName: string }>>([])
  const [selectedBill, setSelectedBill] = useState("")
  const [journey, setJourney] = useState<CageJourneyRow[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    purchasesApi.getInvoiceList()
      .then(d => setPurchaseBills(Array.isArray(d) ? d : []))
      .catch(() => setPurchaseBills([]))
  }, [])

  const handleBillChange = async (orderNumber: string) => {
    setSelectedBill(orderNumber)
    setJourney([])
    if (!orderNumber || orderNumber === '__none__') return
    try {
      setLoading(true)
      const data = await purchasesApi.getCageJourney(orderNumber)
      setJourney(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load cage journey')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (v: number | null) => v !== null ? v.toFixed(2) : '-'
  const lossClass = (v: number | null) => v !== null && v > 0 ? 'text-red-600 font-medium' : v !== null && v < 0 ? 'text-green-600' : ''

  const totals = journey.reduce((acc, r) => ({
    purchaseWeight: acc.purchaseWeight + r.purchaseWeight,
    saleWeight: acc.saleWeight + (r.saleWeight ?? 0),
    godownInwardWeight: acc.godownInwardWeight + (r.godownInwardWeight ?? 0),
    godownSaleWeight: acc.godownSaleWeight + (r.godownSaleWeight ?? 0),
    totalLoss: acc.totalLoss + (r.totalLoss ?? 0),
  }), { purchaseWeight: 0, saleWeight: 0, godownInwardWeight: 0, godownSaleWeight: 0, totalLoss: 0 })

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingDown className="text-red-500" size={28} />
            Cage Weight Loss Tracking
          </h1>
          <p className="text-muted-foreground">Track weight loss per cage from Purchase → Sale → Godown → Godown Sale</p>
        </div>

        {/* Bill selector */}
        <Card>
          <CardContent className="pt-4">
            <div className="max-w-md space-y-2">
              <Label>Select Purchase Bill</Label>
              <Select value={selectedBill || '__none__'} onValueChange={handleBillChange}>
                <SelectTrigger><SelectValue placeholder="Select a purchase bill..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select a purchase bill...</SelectItem>
                  {purchaseBills.map(b => (
                    <SelectItem key={b.id} value={b.orderNumber}>
                      {b.orderNumber} — {b.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        {journey.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Cages</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{journey.length}</div></CardContent></Card>
            <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Purchase Wt (kg)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totals.purchaseWeight.toFixed(2)}</div></CardContent></Card>
            <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Sale Wt (kg)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totals.saleWeight.toFixed(2)}</div></CardContent></Card>
            <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Godown In Wt (kg)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totals.godownInwardWeight.toFixed(2)}</div></CardContent></Card>
            <Card className="border-red-200"><CardHeader className="pb-1"><CardTitle className="text-xs text-red-600">Total Loss (kg)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{totals.totalLoss.toFixed(2)}</div></CardContent></Card>
          </div>
        )}

        {/* Journey table */}
        {loading && <p className="text-center py-8 text-muted-foreground">Loading cage journey...</p>}

        {!loading && journey.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cage Journey — {selectedBill}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="text-left p-2 border">Cage ID</th>
                      <th className="text-center p-2 border">Birds</th>
                      <th className="text-center p-2 border">Status</th>
                      <th className="text-right p-2 border bg-blue-50">Purchase Wt</th>
                      <th className="text-right p-2 border bg-yellow-50">Sale Wt</th>
                      <th className="text-right p-2 border text-red-600 bg-red-50">Loss P→S</th>
                      <th className="text-right p-2 border bg-green-50">Godown In Wt</th>
                      <th className="text-right p-2 border text-red-600 bg-red-50">Loss S→G</th>
                      <th className="text-right p-2 border bg-purple-50">Godown Sale Wt</th>
                      <th className="text-right p-2 border text-red-600 bg-red-50">Loss G→GS</th>
                      <th className="text-right p-2 border font-bold text-red-700 bg-red-100">Total Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journey.map((row, i) => (
                      <tr key={row.id} className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                        <td className="p-2 border font-medium">{row.cageId || '-'}</td>
                        <td className="p-2 border text-center">{row.numberOfBirds}</td>
                        <td className="p-2 border text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            row.status === 'sold' ? 'bg-green-100 text-green-800' :
                            row.status === 'in_godown' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>{row.status}</span>
                        </td>
                        <td className="p-2 border text-right bg-blue-50/30">{fmt(row.purchaseWeight)}</td>
                        <td className="p-2 border text-right bg-yellow-50/30">{fmt(row.saleWeight)}</td>
                        <td className={`p-2 border text-right bg-red-50/30 ${lossClass(row.lossPurchaseToSale)}`}>{fmt(row.lossPurchaseToSale)}</td>
                        <td className="p-2 border text-right bg-green-50/30">{fmt(row.godownInwardWeight)}</td>
                        <td className={`p-2 border text-right bg-red-50/30 ${lossClass(row.lossSaleToGodown)}`}>{fmt(row.lossSaleToGodown)}</td>
                        <td className="p-2 border text-right bg-purple-50/30">{fmt(row.godownSaleWeight)}</td>
                        <td className={`p-2 border text-right bg-red-50/30 ${lossClass(row.lossGodownToSale)}`}>{fmt(row.lossGodownToSale)}</td>
                        <td className={`p-2 border text-right font-bold bg-red-100/50 ${lossClass(row.totalLoss)}`}>{fmt(row.totalLoss)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-200 font-bold border-t-2">
                      <td className="p-2 border" colSpan={3}>TOTAL</td>
                      <td className="p-2 border text-right">{totals.purchaseWeight.toFixed(2)}</td>
                      <td className="p-2 border text-right">{totals.saleWeight.toFixed(2)}</td>
                      <td className="p-2 border text-right text-red-700">{(totals.purchaseWeight - totals.saleWeight).toFixed(2)}</td>
                      <td className="p-2 border text-right">{totals.godownInwardWeight.toFixed(2)}</td>
                      <td className="p-2 border text-right text-red-700">{(totals.saleWeight - totals.godownInwardWeight).toFixed(2)}</td>
                      <td className="p-2 border text-right">{totals.godownSaleWeight.toFixed(2)}</td>
                      <td className="p-2 border text-right text-red-700">{(totals.godownInwardWeight - totals.godownSaleWeight).toFixed(2)}</td>
                      <td className="p-2 border text-right text-red-700">{totals.totalLoss.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && selectedBill && selectedBill !== '__none__' && journey.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">No cage data found for this purchase bill.</p>
        )}
      </div>
    </DashboardLayout>
  )
}
