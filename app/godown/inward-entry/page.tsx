"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X, Printer, Eye, PackagePlus, Bird, Scale, IndianRupee, Calendar, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { godownApi, vehiclesApi, farmersApi, purchasesApi, type GodownInward, type GodownCage, type Vehicle } from "@/lib/api"
import { usePermissions } from "@/lib/permissions"
import { toast } from "sonner"

type ActiveFarmer = { id: string; name: string; phone: string; address?: string }

const emptyCage = (): GodownCage => ({ cageId: "", birdType: "", numberOfBirds: 0, cageWeight: 0 })

export default function GodownInwardPage() {
  const router = useRouter()
  const { canUpdate, canDelete } = usePermissions()
  const [entries, setEntries] = useState<GodownInward[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [farmers, setFarmers] = useState<ActiveFarmer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingEntry, setViewingEntry] = useState<GodownInward | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [allowEditInwardNo, setAllowEditInwardNo] = useState(false)
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    inwardNo: "",
    purchaseInvoiceNo: "",
    purchaseBillNo: "",
    purchaseBillId: "",
    supplierName: "",
    selectedFarmerId: "",
    vehicleId: "",
    numberOfBirds: "",
    averageWeight: "",
    totalWeight: "",
    ratePerKg: "",
    totalAmount: "",
    notes: "",
  })
  const [cages, setCages] = useState<GodownCage[]>([emptyCage()])
  const [purchaseBills, setPurchaseBills] = useState<Array<{ id: string; orderNumber: string; supplierName: string }>>([])
  const [purchaseCages, setPurchaseCages] = useState<Array<{ id: string; cageId?: string; numberOfBirds: number; purchaseWeight: number; godownWeight: string }>>([])
  const [selectedCageIds, setSelectedCageIds] = useState<Set<string>>(new Set())
  const [loadingCages, setLoadingCages] = useState(false)

  const fetchNextInwardNumber = async () => {
    try {
      const data = await godownApi.inward.getNextInwardNumber()
      return data?.nextInwardNumber || ""
    } catch (error) {
      console.error('Failed to fetch next inward number:', error)
    }
    return ""
  }

  useEffect(() => {
    setMounted(true)
    fetchEntries()
    fetchVehicles()
    fetchFarmers()
    fetchPurchaseBills()
  }, [])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const data = await godownApi.inward.getAll()
      setEntries(data)
    } catch (error: any) {
      console.error("Failed to fetch entries:", error)
      toast.error("Failed to load inward entries")
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const data = await vehiclesApi.getAll()
      setVehicles(data.filter((v: any) => v.status === "active"))
    } catch (error) {
      console.error("Failed to fetch vehicles:", error)
    }
  }

  const fetchFarmers = async () => {
    try {
      // getActive() returns a plain array of active farmers
      const data = await farmersApi.getActive()
      setFarmers(data)
    } catch (error) {
      console.error("Failed to fetch farmers:", error)
    }
  }

  const fetchPurchaseBills = async () => {
    try {
      const data = await purchasesApi.getInvoiceList()
      setPurchaseBills(Array.isArray(data) ? data : [])
    } catch { setPurchaseBills([]) }
  }

  const handlePurchaseBillChange = async (billId: string) => {
    if (!billId || billId === "__none__") {
      setFormData((f) => ({
        ...f,
        purchaseBillId: "",
        purchaseBillNo: "",
        purchaseInvoiceNo: "",
        supplierName: "",
      }))
      setPurchaseCages([])
      setSelectedCageIds(new Set())
      return
    }

    const bill = purchaseBills.find((b) => b.id === billId)
    if (bill) {
      const orderNumber = bill.orderNumber
      setFormData((f) => ({
        ...f,
        purchaseBillId: billId,
        purchaseBillNo: orderNumber,
        purchaseInvoiceNo: orderNumber,
        supplierName: bill.supplierName,
      }))
      setPurchaseCages([])
      setSelectedCageIds(new Set())

      try {
        setLoadingCages(true)
        // Fetch full purchase order to get farmer, vehicle, rate
        const fullOrder = await purchasesApi.getOne(bill.id)
        setFormData((f) => ({
          ...f,
          purchaseBillId: billId,
          purchaseBillNo: orderNumber,
          purchaseInvoiceNo: orderNumber,
          supplierName: fullOrder.supplierName || bill.supplierName,
          selectedFarmerId: fullOrder.farmerId || f.selectedFarmerId,
          vehicleId: fullOrder.vehicleId || f.vehicleId,
          ratePerKg: fullOrder.ratePerKg ? String(fullOrder.ratePerKg) : f.ratePerKg,
        }))

        // Load cages
        const cageData = await purchasesApi.getCagesByOrderNumber(orderNumber, "pending")
        setPurchaseCages(
          Array.isArray(cageData)
            ? cageData.map((c) => ({
                ...c,
                id: c.id ?? "",
                purchaseWeight: Number(c.purchaseWeight ?? c.cageWeight ?? 0),
                godownWeight: "",
              }))
            : [],
        )
      } catch (error) {
        console.error("Failed to load bill details:", error)
        toast.error("Failed to load details for this purchase bill")
      } finally {
        setLoadingCages(false)
      }
    }
  }

  const toggleCage = (id: string) => {
    setSelectedCageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      // Auto-fill birds from selected cages; weight comes from godownWeight entries
      const selected = purchaseCages.filter(c => next.has(c.id))
      const totalBirds = selected.reduce((s, c) => s + Number(c.numberOfBirds ?? 0), 0)
      const totalGodownWt = selected.reduce((s, c) => s + (Number(c.godownWeight) || 0), 0)
      setFormData(f => ({
        ...f,
        numberOfBirds: totalBirds > 0 ? String(totalBirds) : f.numberOfBirds,
        totalWeight: totalGodownWt > 0 ? totalGodownWt.toFixed(2) : f.totalWeight,
      }))
      return next
    })
  }

  const toggleAllCages = () => {
    if (selectedCageIds.size === purchaseCages.length) {
      setSelectedCageIds(new Set())
      setFormData(f => ({ ...f, numberOfBirds: '', totalWeight: '' }))
    } else {
      const allIds = new Set(purchaseCages.map(c => c.id))
      const totalBirds = purchaseCages.reduce((s, c) => s + Number(c.numberOfBirds ?? 0), 0)
      const totalGodownWt = purchaseCages.reduce((s, c) => s + (Number(c.godownWeight) || 0), 0)
      setSelectedCageIds(allIds)
      setFormData(f => ({
        ...f,
        numberOfBirds: String(totalBirds),
        totalWeight: totalGodownWt.toFixed(2),
      }))
    }
  }

  const resetForm = async () => {
    const nextNumber = editingId ? "" : await fetchNextInwardNumber()
    setFormData({
      entryDate: new Date().toISOString().split("T")[0],
      inwardNo: nextNumber,
      purchaseInvoiceNo: "",
      purchaseBillNo: "",
      purchaseBillId: "",
      supplierName: "",
      selectedFarmerId: "",
      vehicleId: "",
      numberOfBirds: "",
      averageWeight: "",
      totalWeight: "",
      ratePerKg: "",
      totalAmount: "",
      notes: "",
    })
    setCages([emptyCage()])
    setPurchaseCages([])
    setSelectedCageIds(new Set())
    setEditingId(null)
    setAllowEditInwardNo(false)
  }

  const handleView = (entry: GodownInward) => {
    setViewingEntry(entry)
    setShowViewDialog(true)
  }

  const handleEdit = async (entry: GodownInward) => {
    setEditingId(entry.id)
    setAllowEditInwardNo(false)
    setShowDialog(true)
    setPurchaseCages([])
    setSelectedCageIds(new Set())
    setCages([emptyCage()])

    try {
      setLoadingCages(true)
      const fullEntry = await godownApi.inward.getOne(entry.id).catch(() => entry)
      const sourceEntry = fullEntry || entry

      setFormData({
        entryDate: sourceEntry.entryDate,
        inwardNo: sourceEntry.inwardNo || "",
        purchaseInvoiceNo: sourceEntry.purchaseInvoiceNo || "",
        purchaseBillNo: sourceEntry.purchaseInvoiceNo || "",
        purchaseBillId: purchaseBills.find((b) => b.orderNumber === sourceEntry.purchaseInvoiceNo)?.id || "",
        supplierName: sourceEntry.supplierName || "",
        selectedFarmerId: "",
        vehicleId: sourceEntry.vehicleId || "",
        numberOfBirds: String(sourceEntry.numberOfBirds || ""),
        averageWeight: String(sourceEntry.averageWeight || ""),
        totalWeight: String(sourceEntry.totalWeight || ""),
        ratePerKg: String(sourceEntry.ratePerKg || ""),
        totalAmount: String(sourceEntry.totalAmount || ""),
        notes: sourceEntry.notes || "",
      })

      let linkedCages = sourceEntry.cages
      if (!linkedCages || linkedCages.length === 0) {
        linkedCages = await purchasesApi.getCagesByInwardId(entry.id)
      }
      if (Array.isArray(linkedCages) && linkedCages.length > 0) {
        const mapped = linkedCages.map((c: any) => ({
          ...c,
          id: String(c.id ?? ""),
          cageId: c.cageId || "",
          numberOfBirds: Number(c.numberOfBirds ?? 0),
          purchaseWeight: Number(c.purchaseWeight ?? c.cageWeight ?? 0),
          godownWeight: String(
            c.godownInwardWeight ?? c.cageWeight ?? c.godownWeight ?? c.purchaseWeight ?? "",
          ),
        }))
        setPurchaseCages(mapped)
        setSelectedCageIds(new Set(mapped.map((c) => c.id).filter(Boolean)))
        setCages(
          mapped.map((c) => ({
            id: c.id,
            cageId: c.cageId,
            birdType: "",
            numberOfBirds: c.numberOfBirds,
            cageWeight: Number(c.godownWeight) || 0,
          })),
        )
      }
    } catch (error) {
      console.error("Failed to load cage details for edit:", error)
      toast.error("Failed to load cage details")
    } finally {
      setLoadingCages(false)
    }
  }

  const calculateTotal = () => {
    const totalWeight = parseFloat(formData.totalWeight) || 0
    const ratePerKg = parseFloat(formData.ratePerKg) || 0
    return (totalWeight * ratePerKg).toFixed(2)
  }

  const calculateTotalWeight = () => {
    const numberOfBirds = parseFloat(formData.numberOfBirds) || 0
    const averageWeight = parseFloat(formData.averageWeight) || 0
    const total = (numberOfBirds * averageWeight).toFixed(2)
    setFormData({ ...formData, totalWeight: total })
  }

  const handleSave = async () => {
    if (!formData.supplierName || !formData.numberOfBirds || !formData.ratePerKg) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const numberOfBirds = parseInt(formData.numberOfBirds)
      const averageWeight = parseFloat(formData.averageWeight) || 0
      const totalWeight = parseFloat(formData.totalWeight) || 0
      const ratePerKg = parseFloat(formData.ratePerKg)
      const totalAmount = totalWeight * ratePerKg

      const entryData = {
        entryDate: formData.entryDate,
        inwardNo: formData.inwardNo || undefined,
        purchaseInvoiceNo: formData.purchaseInvoiceNo || undefined,
        supplierName: formData.supplierName,
        vehicleId: formData.vehicleId || undefined,
        numberOfBirds,
        averageWeight: averageWeight || undefined,
        totalWeight: totalWeight || undefined,
        ratePerKg,
        totalAmount,
        notes: formData.notes || undefined,
        cageIds: Array.from(selectedCageIds),
        cages: (selectedCageIds.size > 0
          ? purchaseCages.filter((c) => selectedCageIds.has(c.id))
          : cages
        )
          .filter((c: any) => Number(c.numberOfBirds ?? 0) > 0 || Number(c.godownWeight ?? c.cageWeight ?? 0) > 0 || c.id)
          .map((c: any) => ({
            id: c.id || undefined,
            cageId: c.cageId || undefined,
            birdType: c.birdType || undefined,
            numberOfBirds: Number(c.numberOfBirds ?? 0) || 0,
            cageWeight: Number(c.godownWeight ?? c.cageWeight ?? 0) || 0,
            godownInwardWeight: Number(c.godownWeight ?? c.cageWeight ?? 0) || 0,
          })),
      }

      let savedId = editingId
      if (editingId) {
        await godownApi.inward.update(editingId, entryData)
        toast.success("Entry updated successfully")
      } else {
        const created = await godownApi.inward.create(entryData)
        savedId = (created as any)?.id || null
        toast.success("Entry created successfully")
      }

      // Ensure cages are linked to this inward with per-cage godown weights
      if (selectedCageIds.size > 0 && savedId) {
        try {
          const selectedCages = purchaseCages.filter(c => selectedCageIds.has(c.id))
          for (const cage of selectedCages) {
            const godownWeight = Number(cage.godownWeight) || undefined
            await purchasesApi.markCagesInGodown([cage.id], savedId, godownWeight)
          }
        } catch { toast.error("Entry saved but failed to update cage status") }
      }

      await fetchEntries()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save entry:", error)
      toast.error(error.message || "Failed to save entry")
    } finally {
      setLoading(false)
    }
  }

  const handlePrintInward = (entry: GodownInward) => {
    const vehicle = vehicles.find(v => v.id === entry.vehicleId)
    const totalAmount = Number(entry.totalAmount || 0)
    const rate = Number(entry.ratePerKg || 0)
    const weight = Number(entry.totalWeight || 0)
    const birds = Number(entry.numberOfBirds || 0)
    const entryDate = new Date(entry.entryDate).toLocaleDateString('en-GB')

    const invoiceHtml = `
      <div class="invoice-shell">
        <div class="header-row">
          <div class="brand-block">
            <div class="logo-mark">AF</div>
            <div>
              <div class="brand-name">Poultry Sathi</div>
              <div class="brand-sub">Premium Poultry ERP • Godown Inward Receipt</div>
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">Inward Receipt</div>
            <div class="meta-row"><span>Inward No</span><strong>${entry.inwardNo || "-"}</strong></div>
            <div class="meta-row"><span>Entry Date</span><strong>${entryDate}</strong></div>
            <div class="meta-row"><span>Reference</span><strong>${entry.purchaseInvoiceNo || "-"}</strong></div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="info-grid">
          <div class="card">
            <div class="card-title">Supplier Information</div>
            <div class="customer-name">${entry.supplierName || "N/A"}</div>
            <div class="info-list">
              <div class="info-item"><span class="label">Vehicle</span><span class="value">${vehicle ? `${vehicle.vehicleNumber} - ${vehicle.driverName}` : "—"}</span></div>
              <div class="info-item"><span class="label">Notes</span><span class="value">${entry.notes || "—"}</span></div>
            </div>
          </div>

          <div class="card summary-card">
            <div class="card-title">Receipt Summary</div>
            <div class="summary-row"><span>Number of Birds</span><strong>${birds}</strong></div>
            <div class="summary-row"><span>Total Weight</span><strong>${weight.toFixed(2)} kg</strong></div>
            <div class="summary-row"><span>Rate per Kg</span><strong>₹${rate.toFixed(2)}</strong></div>
            <div class="summary-row grand"><span>Total Amount</span><strong>₹${totalAmount.toFixed(2)}</strong></div>
          </div>
        </div>

        <div class="section">
          <div class="card-title">Cage Details</div>
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Cage ID</th>
                <th>Bird Type</th>
                <th style="text-align:right">Birds</th>
                <th style="text-align:right">Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              ${(entry.cages && entry.cages.length > 0 ? entry.cages : []).map((cage: any) => `
                <tr>
                  <td>${cage.cageId || "-"}</td>
                  <td>${cage.birdType || "-"}</td>
                  <td style="text-align:right">${cage.numberOfBirds || 0}</td>
                  <td style="text-align:right">${(cage.cageWeight || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
              ${(!entry.cages || entry.cages.length === 0) ? `
                <tr>
                  <td colspan="4" style="text-align:center;color:#6b7280;">No cage details available</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="2"><strong>Total</strong></td>
                <td style="text-align:right"><strong>${birds}</strong></td>
                <td style="text-align:right"><strong>${weight.toFixed(2)} kg</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bottom-grid">
          <div class="card notes-card">
            <div class="card-title">Notes</div>
            <div class="terms">${entry.notes ? entry.notes.replace(/\n/g, '<br/>') : 'No additional notes'}</div>
          </div>
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;">
            <div class="signature-row">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="label">Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-row">
          <div class="thank-you">Godown Stock Receipt</div>
        </div>
      </div>
    `

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Inward Receipt - ${entry.inwardNo || "Inward"}</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #f4f4f5; }
            @page { size: A4 portrait; margin: 8mm; }
            .invoice-shell { position: relative; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px 20px 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
            .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
            .brand-block { display: flex; align-items: center; gap: 10px; }
            .logo-mark { width: 44px; height: 44px; border-radius: 12px; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; letter-spacing: 0.08em; }
            .brand-name { font-size: 17px; font-weight: 700; color: #111; }
            .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
            .invoice-meta { text-align: right; min-width: 210px; }
            .invoice-title { font-size: 20px; font-weight: 700; margin-bottom: 6px; color: #111; }
            .meta-row { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: #4b5563; margin-top: 3px; }
            .meta-row strong { color: #111; }
            .divider { height: 1px; background: #e5e7eb; margin: 12px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 0.8fr; gap: 12px; }
            .card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
            .card-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #111827; margin-bottom: 8px; }
            .customer-name { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 8px; }
            .info-list { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
            .info-item { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: #4b5563; }
            .info-item .label { color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; min-width: 70px; }
            .info-item .value { font-weight: 700; color: #111827; text-align: right; }
            .summary-card { background: #f8fafc; color: #111827; border-color: #e5e7eb; }
            .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin-top: 7px; align-items: center; font-weight: 600; }
            .summary-row.grand { font-size: 12px; font-weight: 700; padding: 6px 8px; border-top: 1px solid rgba(17,24,39,0.12); margin-top: 8px; background: #e2e8f0; border-radius: 8px; }
            .section { margin-top: 12px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-top: 6px; border: 1px solid #e5e7eb; }
            .invoice-table th, .invoice-table td { border-bottom: 1px solid #e5e7eb; padding: 8px 8px; text-align: left; font-size: 11px; }
            .invoice-table th { background: #f4f4f5; font-weight: 700; color: #111; }
            .invoice-table .total-row td { border-top: 2px solid #111; background: #f4f4f5; }
            .bottom-grid { display: grid; grid-template-columns: 0.95fr 1.05fr; gap: 12px; margin-top: 12px; }
            .terms { font-size: 10px; line-height: 1.5; color: #4b5563; }
            .signature-row { display: flex; justify-content: space-between; gap: 10px; margin-top: 12px; }
            .signature-block { flex: 1; }
            .signature-line { height: 28px; border-bottom: 1px solid #111; margin-bottom: 6px; }
            .label { font-size: 9px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.08em; }
            .footer-row { display: flex; justify-content: center; align-items: center; margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
            .thank-you { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #111; }
            @media (max-width: 640px) {
              .header-row { flex-direction: column; align-items: stretch; }
              .invoice-meta { text-align: left; min-width: 0; }
              .info-grid, .bottom-grid { grid-template-columns: 1fr; }
              .signature-row { flex-direction: column; }
            }
            @media print { body { background: #fff; } .invoice-shell { box-shadow: none; border: 1px solid #ddd; } }
          </style>
        </head>
        <body><div class="invoice-shell">${invoiceHtml}</div></body>
      </html>
    `

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.setAttribute('aria-hidden', 'true')
    document.body.appendChild(iframe)

    const cleanup = () => {
      window.setTimeout(() => iframe.remove(), 100)
    }

    iframe.onload = () => {
      const win = iframe.contentWindow
      if (!win) return cleanup()
      win.focus()
      win.addEventListener('afterprint', cleanup)
      try {
        win.print()
      } catch {
        cleanup()
      }
    }

    const iframeDoc = iframe.contentDocument
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(printContent)
      iframeDoc.close()
    }
    window.setTimeout(cleanup, 30000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      setLoading(true)
      await godownApi.inward.delete(id)
      toast.success("Entry deleted successfully")
      await fetchEntries()
    } catch (error: any) {
      console.error("Failed to delete entry:", error)
      toast.error("Failed to delete entry")
    } finally {
      setLoading(false)
    }
  }

  const handleFarmerChange = (farmerId: string) => {
    const farmer = farmers.find(f => f.id === farmerId)
    if (farmer) {
      setFormData({
        ...formData,
        selectedFarmerId: farmerId,
        supplierName: farmer.name,
      })
    }
  }

  const handleVehicleChange = (vehicleId: string) => {
    setFormData({
      ...formData,
      vehicleId: vehicleId,
    })
  }

  // Auto-calculate total weight when birds or average weight changes
  useEffect(() => {
    if (formData.numberOfBirds && formData.averageWeight) {
      const numberOfBirds = parseFloat(formData.numberOfBirds) || 0
      const averageWeight = parseFloat(formData.averageWeight) || 0
      const total = (numberOfBirds * averageWeight).toFixed(2)
      if (formData.totalWeight !== total) {
        setFormData(prev => ({ ...prev, totalWeight: total }))
      }
    }
  }, [formData.numberOfBirds, formData.averageWeight])

  const filteredEntries = useMemo(() => {
    let f = [...entries]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      f = f.filter(e =>
        (e.purchaseInvoiceNo || '').toLowerCase().includes(q) ||
        (e.supplierName || '').toLowerCase().includes(q)
      )
    }
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart); start.setHours(0,0,0,0)
      const end = new Date(dateRangeEnd); end.setHours(23,59,59,999)
      f = f.filter(e => {
        if (!e.entryDate) return false
        const d = new Date(e.entryDate); d.setHours(0,0,0,0)
        return d >= start && d <= end
      })
    }
    return f
  }, [entries, searchQuery, dateRangeStart, dateRangeEnd])

  const inwardStats = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        acc.totalBirds += Number(entry.numberOfBirds || 0)
        acc.totalWeight += Number(entry.totalWeight || 0)
        acc.totalAmount += Number(entry.totalAmount || 0)
        return acc
      },
      { totalBirds: 0, totalWeight: 0, totalAmount: 0 },
    )
  }, [filteredEntries])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
  Godown Inward Entry
</h1>

<p className="mt-0 text-sm leading-tight text-muted-foreground">
  Record stock received into godown
</p>  </div>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="shrink-0 self-start sm:self-auto">
                <Plus className="mr-0" size={20} />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-sm:max-w-[calc(100%-2rem)] sm:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col rounded-2xl" aria-describedby="dialog-description">
              <DialogHeader className="pb-1">
                <DialogTitle className="text-xl">{editingId ? "Edit Entry" : "New Entry"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit godown inward entry details" : "Create a new godown inward entry"}
                </p>
              </DialogHeader>
              <div className="flex-1 space-y-5 overflow-y-auto pr-1 pb-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Entry Date *</Label>
                    <DatePicker
                      value={formData.entryDate}
                      onChange={(date) => setFormData({ ...formData, entryDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Godown Inward No</Label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowEditInwardNo}
                          onChange={(e) => setAllowEditInwardNo(e.target.checked)}
                          className="cursor-pointer"
                        />
                        <span>Edit manually</span>
                      </label>
                    </div>
                    <Input
                      value={formData.inwardNo}
                      onChange={(e) => setFormData({ ...formData, inwardNo: e.target.value })}
                      placeholder="Auto-generated on save"
                      disabled={loading}
                      readOnly={!allowEditInwardNo}
                      className={!allowEditInwardNo ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Purchase Bill No (Auto-filled from Purchase Bill)</Label>
                  <Input
                    value={formData.purchaseInvoiceNo}
                    readOnly
                    placeholder="None"
                    className={formData.purchaseInvoiceNo ? "bg-green-50 border-green-300 text-green-800" : "bg-gray-50"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link to Purchase Bill (loads remaining cages)</Label>
                  <Select value={formData.purchaseBillId || "__none__"} onValueChange={handlePurchaseBillChange} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purchase bill (optional)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="__none__">None</SelectItem>
                      {purchaseBills.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.orderNumber} — {b.supplierName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Remaining cages from purchase bill / linked cages when editing */}
                {(formData.purchaseBillId || (editingId && (purchaseCages.length > 0 || loadingCages))) && (
                  <div className="border rounded-lg p-3 bg-blue-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-blue-900 font-semibold">
                        {editingId && !formData.purchaseBillId
                          ? "Cage Details (editable)"
                          : `Remaining Cages from ${formData.purchaseBillNo}`}
                      </Label>
                      {loadingCages && <span className="text-xs text-muted-foreground">Loading...</span>}
                      {!loadingCages && purchaseCages.length > 0 && (
                        <button type="button" onClick={toggleAllCages} className="text-xs text-blue-700 underline">
                          {selectedCageIds.size === purchaseCages.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>
                    {!loadingCages && purchaseCages.length === 0 && (
                      <p className="text-xs text-muted-foreground">No remaining cages (all sold or already in godown).</p>
                    )}
                    {!loadingCages && purchaseCages.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b bg-blue-100">
                              <th className="p-1 w-8"></th>
                              <th className="text-left p-1">Cage ID</th>
                              <th className="text-right p-1">Birds</th>
                              <th className="text-right p-1">Purchase Wt (kg)</th>
                              <th className="text-right p-1">Godown Wt (kg) *</th>
                              <th className="text-right p-1 text-orange-700">Wt Loss (Kg)</th>
                              <th className="text-right p-1 text-orange-700">Wt Loss %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchaseCages.map(cage => {
                              const purchaseWt = Number(cage.purchaseWeight)
                              const godownWt = Number(cage.godownWeight) || 0
                              const lossKg = purchaseWt - godownWt
                              const lossPct = purchaseWt > 0 && godownWt > 0 ? (lossKg / purchaseWt) * 100 : null
                              return (
                              <tr key={cage.id} className={`border-b cursor-pointer hover:bg-blue-100 ${selectedCageIds.has(cage.id) ? 'bg-green-50' : ''}`}
                                onClick={() => toggleCage(cage.id)}>
                                <td className="p-1 text-center">
                                  <input type="checkbox" checked={selectedCageIds.has(cage.id)} onChange={() => toggleCage(cage.id)} onClick={e => e.stopPropagation()} />
                                </td>
                                <td className="p-1 font-medium">{cage.cageId || '-'}</td>
                                <td className="p-1 text-right">{cage.numberOfBirds}</td>
                                <td className="p-1 text-right">{purchaseWt.toFixed(2)}</td>
                                <td className="p-1 text-right" onClick={e => e.stopPropagation()}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={cage.godownWeight}
                                    onChange={e => {
                                      const val = e.target.value
                                      const enteredWt = parseFloat(val) || 0
                                      if (enteredWt > purchaseWt && purchaseWt > 0) {
                                        toast.error(`Godown weight (${enteredWt} kg) cannot exceed purchase weight (${purchaseWt.toFixed(2)} kg) for cage ${cage.cageId || cage.id}`)
                                        return
                                      }
                                      const updatedCages = purchaseCages.map(c => c.id === cage.id ? { ...c, godownWeight: val } : c)
                                      setPurchaseCages(updatedCages)
                                      if (val) {
                                        setSelectedCageIds(prev => {
                                          const next = new Set([...prev, cage.id])
                                          const selected = updatedCages.filter(c => next.has(c.id))
                                          const totalBirds = selected.reduce((s, c) => s + Number(c.numberOfBirds ?? 0), 0)
                                          const totalGodownWt = selected.reduce((s, c) => s + (Number(c.godownWeight) || 0), 0)
                                          setFormData(f => ({
                                            ...f,
                                            numberOfBirds: String(totalBirds),
                                            totalWeight: totalGodownWt.toFixed(2),
                                          }))
                                          return next
                                        })
                                      }
                                    }}
                                    className="w-20 text-right border rounded px-1 py-0.5 text-xs"
                                  />
                                </td>
                                <td className="p-1 text-right">
                                  {purchaseWt > 0 && godownWt > 0 ? (
                                    <span className={`font-medium ${lossPct !== null && lossPct > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                      {lossKg.toFixed(2)} kg
                                    </span>
                                  ) : <span className="text-muted-foreground">-</span>}
                                </td>
                                <td className="p-1 text-right">
                                  {lossPct !== null ? (
                                    <span className={`font-medium ${lossPct > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                      {lossPct.toFixed(1)}%
                                    </span>
                                  ) : <span className="text-muted-foreground">-</span>}
                                </td>
                              </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            {(() => {
                              const selCages = purchaseCages.filter(c => selectedCageIds.has(c.id))
                              const totalPurchaseWt = selCages.reduce((s, c) => s + Number(c.purchaseWeight), 0)
                              const totalGodownWt = selCages.reduce((s, c) => s + (Number(c.godownWeight) || 0), 0)
                              const totalLossKg = totalPurchaseWt - totalGodownWt
                              const totalLossPct = totalPurchaseWt > 0 && totalGodownWt > 0
                                ? (totalLossKg / totalPurchaseWt) * 100
                                : null
                              return (
                                <tr className="border-t font-semibold bg-blue-100">
                                  <td colSpan={2} className="p-1">{selectedCageIds.size} selected / {purchaseCages.length} total</td>
                                  <td className="p-1 text-right">{selCages.reduce((s, c) => s + Number(c.numberOfBirds ?? 0), 0)}</td>
                                  <td className="p-1 text-right">{totalPurchaseWt.toFixed(2)}</td>
                                  <td className="p-1 text-right">{totalGodownWt.toFixed(2)}</td>
                                  <td className="p-1 text-right">
                                    {totalPurchaseWt > 0 && totalGodownWt > 0 ? (
                                      <span className={totalLossPct !== null && totalLossPct > 5 ? 'text-red-600' : 'text-green-600'}>
                                        {totalLossKg.toFixed(2)} kg
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="p-1 text-right">
                                    {totalLossPct !== null ? (
                                      <span className={totalLossPct > 5 ? 'text-red-600' : 'text-green-600'}>
                                        {totalLossPct.toFixed(1)}%
                                      </span>
                                    ) : '-'}
                                  </td>
                                </tr>
                              )
                            })()}
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Select Farmer (Optional)</Label>
                    <Select value={formData.selectedFarmerId || undefined} onValueChange={handleFarmerChange} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select farmer" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {farmers.map((farmer) => (
                          <SelectItem key={farmer.id} value={farmer.id}>
                            {farmer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier Name *</Label>
                    <Input
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      placeholder="Supplier name"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select
                    value={formData.vehicleId || undefined}
                    onValueChange={handleVehicleChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicleNumber} - {vehicle.driverName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Number of Birds *</Label>
                    <Input
                      type="number"
                      value={formData.numberOfBirds}
                      onChange={(e) => setFormData({ ...formData, numberOfBirds: e.target.value })}
                      placeholder="1000"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Weight (Kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalWeight}
                      onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
                      placeholder="Auto-calculated"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Rate per Kg *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.ratePerKg}
                      onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                      placeholder="125.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Amount</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                      <span className="text-lg font-semibold">₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1" disabled={loading}>
                    {loading ? "Saving..." : editingId ? "Update" : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                    <X size={20} />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 [&>*]:break-words">
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Total Birds</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                <Bird size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{inwardStats.totalBirds.toLocaleString("en-IN")}</div>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">Birds received</p>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Total Weight</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Scale size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{inwardStats.totalWeight.toFixed(2)} kg</div>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">Total weight received</p>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <IndianRupee size={17} />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">₹{inwardStats.totalAmount.toFixed(2)}</div>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">Total inward value</p>
          </div>
        </div>

        

        <Card className="rounded-2xl p-4 print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div className="md:w-[320px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search by bill no or supplier..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-10 rounded-full w-full pl-9 sm:w-[280px] md:w-[320px]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> From
              </label>
              <Input type="date" className="w-full sm:w-[160px] h-10 rounded-full" value={dateRangeStart ? `${dateRangeStart.getFullYear()}-${String(dateRangeStart.getMonth() + 1).padStart(2, "0")}-${String(dateRangeStart.getDate()).padStart(2, "0")}` : ""} onChange={(e) => { const v = e.target.value; if (v) { const [y, m, d] = v.split("-").map(Number); setDateRangeStart(new Date(y, m - 1, d)) } else { setDateRangeStart(undefined) } }} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> To
              </label>
              <Input type="date" className="w-full sm:w-[160px] h-10 rounded-full" value={dateRangeEnd ? `${dateRangeEnd.getFullYear()}-${String(dateRangeEnd.getMonth() + 1).padStart(2, "0")}-${String(dateRangeEnd.getDate()).padStart(2, "0")}` : ""} onChange={(e) => { const v = e.target.value; if (v) { const [y, m, d] = v.split("-").map(Number); setDateRangeEnd(new Date(y, m - 1, d)) } else { setDateRangeEnd(undefined) } }} />
            </div>
          </div>
        </Card>

        <Card>
          <CardContent>
            {loading && entries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredEntries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {entries.length === 0 ? 'No entries found' : 'No entries match your filters'}
              </p>
            ) : (
              <Table className="[&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-3">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entry Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inward No</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference No</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Birds</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weight (Kg)</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rate/Kg</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    const isIsolation = entry.notes?.toLowerCase().includes("isolation") || entry.notes?.toLowerCase().includes("quarantine");
                    return (
                      <TableRow 
                        key={entry.id}
                        className={
                          isIsolation
                            ? "bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
                            : ""
                        }
                      >
                        <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          <div className="flex flex-col gap-1">
                            <span>{entry.inwardNo || "-"}</span>
                            {isIsolation && (
                              <span className="inline-flex items-center w-max px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800">
                                ⚠️ Isolation Pen
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{entry.purchaseInvoiceNo || "-"}</TableCell>
                        <TableCell>{entry.supplierName}</TableCell>
                        <TableCell className="text-right">{entry.numberOfBirds}</TableCell>
                        <TableCell className="text-right">{entry.totalWeight ? Number(entry.totalWeight).toFixed(2) : "-"}</TableCell>
                        <TableCell className="text-right">₹{entry.ratePerKg ? Number(entry.ratePerKg).toFixed(2) : "0.00"}</TableCell>
                        <TableCell className="text-right font-semibold">₹{entry.totalAmount ? Number(entry.totalAmount).toFixed(2) : "0.00"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" title="View" onClick={() => handleView(entry)}>
                            <Eye size={16} />
                          </Button>
                          {canUpdate('godown') && (
                            <>
                              <Button variant="ghost" size="sm" title="Print" onClick={() => handlePrintInward(entry)}>
                                <Printer size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" title="Edit" onClick={() => handleEdit(entry)}>
                                <Edit2 size={16} />
                              </Button>
                            </>
                          )}
                          {canDelete('godown') && (
                            <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDelete(entry.id)}>
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-sm:max-w-[calc(100%-2rem)] sm:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col rounded-2xl">
            <DialogHeader className="pb-1">
              <DialogTitle className="text-xl">Godown Inward Details</DialogTitle>
              <DialogDescription>View complete inward entry information</DialogDescription>
            </DialogHeader>
            {viewingEntry && (
              <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Entry Date</Label>
                    <div className="text-sm font-medium">{new Date(viewingEntry.entryDate).toLocaleDateString()}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Inward No</Label>
                    <div className="text-sm font-medium">{viewingEntry.inwardNo || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Purchase / Reference No</Label>
                    <div className="text-sm font-medium">{viewingEntry.purchaseInvoiceNo || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Source / Supplier</Label>
                    <div className="text-sm font-medium">{viewingEntry.supplierName || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Number of Birds</Label>
                    <div className="text-sm font-medium">{viewingEntry.numberOfBirds ?? 0}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Average Weight</Label>
                    <div className="text-sm font-medium">
                      {viewingEntry.averageWeight != null ? Number(viewingEntry.averageWeight).toFixed(2) : "N/A"} kg
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Total Weight</Label>
                    <div className="text-sm font-medium">
                      {viewingEntry.totalWeight != null ? Number(viewingEntry.totalWeight).toFixed(2) : "N/A"} kg
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Rate per Kg</Label>
                    <div className="text-sm font-medium">
                      ₹{viewingEntry.ratePerKg != null ? Number(viewingEntry.ratePerKg).toFixed(2) : "0.00"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <div className="text-sm font-medium">
                      ₹{viewingEntry.totalAmount != null ? Number(viewingEntry.totalAmount).toFixed(2) : "0.00"}
                    </div>
                  </div>
                  {viewingEntry.notes && (
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-muted-foreground">Notes</Label>
                      <div className="text-sm font-medium">{viewingEntry.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
