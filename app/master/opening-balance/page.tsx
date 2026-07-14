"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { farmersApi, retailersApi, openingBalanceApi } from "@/lib/api"
import { Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface PartyBalance {
  id: string
  name: string
  type: 'farmer' | 'retailer'
  openingBalance: number
  originalBalance: number
  saving: boolean
}

export default function OpeningBalancePage() {
  const [parties, setParties] = useState<PartyBalance[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [farmersRes, retailersRes] = await Promise.all([
        farmersApi.getAll(1, 1000),
        retailersApi.getAll(1, 1000),
      ])
      const farmerList = Array.isArray(farmersRes) ? farmersRes : farmersRes?.data || []
      const retailerList = Array.isArray(retailersRes) ? retailersRes : retailersRes?.data || []
      const combined: PartyBalance[] = [
        ...farmerList.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: 'farmer' as const,
          openingBalance: Number(f.openingBalance) || 0,
          originalBalance: Number(f.openingBalance) || 0,
          saving: false,
        })),
        ...retailerList.map((r: any) => ({
          id: r.id,
          name: r.name,
          type: 'retailer' as const,
          openingBalance: Number(r.openingBalance) || 0,
          originalBalance: Number(r.openingBalance) || 0,
          saving: false,
        })),
      ]
      combined.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
      setParties(combined)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleChange = (id: string, value: string) => {
    setParties(prev => prev.map(p => p.id === id ? { ...p, openingBalance: parseFloat(value) || 0 } : p))
  }

  const handleSave = async (party: PartyBalance) => {
    if (party.openingBalance === party.originalBalance) {
      toast.info('No change detected')
      return
    }
    setParties(prev => prev.map(p => p.id === party.id ? { ...p, saving: true } : p))
    try {
      await openingBalanceApi.update(party.type, party.id, party.openingBalance)
      setParties(prev => prev.map(p => p.id === party.id ? { ...p, originalBalance: party.openingBalance, saving: false } : p))
      toast.success(`${party.type === 'farmer' ? 'Farmer' : 'Retailer'} "${party.name}" opening balance updated`)
    } catch (err) {
      toast.error('Failed to update opening balance')
      setParties(prev => prev.map(p => p.id === party.id ? { ...p, saving: false } : p))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Opening Balances</h1>
            <p className="text-muted-foreground mt-1">Manage opening balances for farmers and retailers</p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Parties</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-48">Opening Balance (₹)</TableHead>
                  <TableHead className="w-28 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : parties.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No parties found</TableCell></TableRow>
                ) : parties.map((party) => (
                  <TableRow key={`${party.type}-${party.id}`}>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${party.type === 'farmer' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                        {party.type === 'farmer' ? 'Farmer' : 'Retailer'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{party.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={party.openingBalance}
                        onChange={(e) => handleChange(party.id, e.target.value)}
                        className="h-9 text-right"
                        disabled={party.saving}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleSave(party)}
                        disabled={party.saving || party.openingBalance === party.originalBalance}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {party.saving ? 'Saving...' : 'Save'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
