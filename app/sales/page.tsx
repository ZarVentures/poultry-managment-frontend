"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X, Paperclip, Wallet, TrendingUp, ShoppingCart, Clock, Eye, MoreHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { salesApi, retailersApi, vehiclesApi, purchasesApi, type Sale as ApiSale } from "@/lib/api"
import { toast } from "sonner"

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer", "advance"] as const
type PaymentMode = typeof PAYMENT_MODES[number]
interface PaymentRow { mode: PaymentMode; amount: string }
const emptyPayment = (): PaymentRow => ({ mode: "cash", amount: "" })

interface CustomerRow { id: string; customerName: string; cageId: string; numBirds: string; weight: string; amount: number }

export default function SalesPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")
  const [sales, setSales] = useState<ApiSale[]>([])
  const [retailers, setRetailers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [purchaseBills, setPurchaseBills] = useState<Array<{ id: string; orderNumber: string; supplierName: string }>>([])
  const [purchaseCages, setPurchaseCages] = useState<Array<{ id: string; cageId?: string; numberOfBirds: number; purchaseWeight: number; status?: string; saleId?: string }>>([])
  const [billSearch, setBillSearch] = useState("");
  const [selectedCageIds, setSelectedCageIds] = useState<Set<string>>(new Set())
  const [loadingCages, setLoadingCages] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>()
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>()
  const [filterRetailer, setFilterRetailer] = useState("")
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("")
  const [filterSaleMode, setFilterSaleMode] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  const [saleFile, setSaleFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const saleFileRef = useRef<HTMLInputElement>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [serverStats, setServerStats] = useState<any>(null)

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    saleNo: "",
    purchaseBillNo: "",
    cageNo: "",
    numBirds: "",
    totalWeight: "",
    saleDate: new Date().toISOString().split("T")[0],
    retailerId: "",
    customerName: "",
    ownerName: "",
    phone: "",
    address: "",
    saleMode: "from_vehicle" as "from_vehicle" | "from_godown",
    vehicleId: "",
    productType: "meat" as "meat" | "eggs" | "chicks" | "other",
    ratePerKg: "",
    transportCharges: "",
    loadingCharges: "",
    commission: "",
    otherCharges: "",
    deductions: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial",
    amountReceived: "",
    notes: "",
  })
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()])

  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role || "")
      } catch { }
    }
    fetchRetailers(); fetchVehicles(); fetchPurchaseBills()
  }, [])

  useEffect(() => {
    fetchSales()
  }, [currentPage, pageSize, searchQuery, dateRangeStart, dateRangeEnd, filterPaymentStatus])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const res = await salesApi.getAll({
        page: currentPage,
        limit: pageSize,
        customer: searchQuery || undefined,
        startDate: dateRangeStart?.toISOString().split('T')[0],
        endDate: dateRangeEnd?.toISOString().split('T')[0],
        paymentStatus: filterPaymentStatus || undefined,
      })

      if (res && res.data) {
        setSales(res.data)
        setTotalRecords(res.total)
        setServerStats(res.summary)
      } else {
        setSales(Array.isArray(res) ? res : [])
        setTotalRecords(Array.isArray(res) ? res.length : 0)
        setServerStats(null)
      }
    }
    catch { setSales([]); toast.error("Failed to load sales") }
    finally { setLoading(false) }
  }
  const fetchRetailers = async () => {
    try {
      const d = await retailersApi.getActive()
      const data = Array.isArray(d) ? d : []
      // Ensure uniqueness by name to prevent duplicates in the UI
      const uniqueData = data.filter((v, i, a) =>
        a.findIndex(t => t.name === v.name) === i
      )
      setRetailers(uniqueData)
    }
    catch { setRetailers([]) }
  }
  const fetchVehicles = async () => {
    try { const d = await vehiclesApi.getAll(); setVehicles(Array.isArray(d) ? d : []) }
    catch { setVehicles([]) }
  }
  const fetchPurchaseBills = async () => {
    try { const d = await purchasesApi.getInvoiceList(); setPurchaseBills(Array.isArray(d) ? d : []) }
    catch { setPurchaseBills([]) }
  }

  const handlePurchaseBillChange = async (orderNumber: string) => {
    const billNo = orderNumber === '__none__' ? '' : orderNumber
    setFormData(f => ({ ...f, purchaseBillNo: billNo }))
    setPurchaseCages([])
    setSelectedCageIds(new Set())
    if (!billNo) return

    try {
      setLoadingCages(true)
      // Always load ALL cages for this purchase bill (no status filter)
      // In edit mode: pre-select only the ones belonging to this sale
      // In create mode: pre-select only pending ones
      console.log('handlePurchaseBillChange - Loading cages for:', billNo, 'isEditMode:', isEditMode, 'editingId:', editingId)
      const allCages = await purchasesApi.getCagesByOrderNumber(billNo)
      console.log('Cages received:', allCages)
      const mapped = Array.isArray(allCages)
        ? allCages.map(c => ({ ...c, id: c.id ?? '', purchaseWeight: Number(c.purchaseWeight ?? c.cageWeight ?? 0) }))
        : []

      if (isEditMode && editingId) {
        // Edit mode: 
        // - Keep ALL cages (sold + pending) in state for Section 2
        // - Section 1 will filter to show only pending cages
        // - Section 2 shows all selected cages (sold + newly selected pending)
        const cagesForThisSale = mapped.filter(c =>
          String(c.saleId) === String(editingId) ||
          (c.status === 'sold' && !c.saleId)
        )
        const pendingCages = mapped.filter(c => !c.status || c.status === 'pending')
        console.log('Edit mode - Cages for this sale:', cagesForThisSale.length, 'Pending:', pendingCages.length)

        // Keep ALL cages (sold + pending) in state
        const combinedCages = [...cagesForThisSale, ...pendingCages]
        setPurchaseCages(combinedCages)

        // Pre-select the sold cages (they will appear in Section 2)
        setSelectedCageIds(new Set(cagesForThisSale.map(c => c.id)))
      } else {
        // Create mode: only show pending cages, no auto-select
        const pendingOnly = mapped.filter(c => !c.status || c.status === 'pending')
        console.log('Create mode - Pending cages:', pendingOnly.length)
        setPurchaseCages(pendingOnly)
        setSelectedCageIds(new Set())
      }
    } catch (error) {
      console.error('Failed to load cages:', error)
      toast.error('Failed to load cages for this purchase bill')
    } finally {
      setLoadingCages(false)
    }
  }

  const toggleCage = (id: string) => {
    setSelectedCageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      syncFormFromCages(next)
      return next
    })
  }

  const toggleAllCages = () => {
    if (selectedCageIds.size === purchaseCages.length) {
      const empty = new Set<string>()
      setSelectedCageIds(empty)
      syncFormFromCages(empty)
    } else {
      const allIds = new Set(purchaseCages.map(c => c.id!))
      setSelectedCageIds(allIds)
      syncFormFromCages(allIds)
    }
  }

  const syncFormFromCages = (ids: Set<string>) => {
    const selected = purchaseCages.filter(c => ids.has(c.id!))
    const totalBirds = selected.reduce((s, c) => s + c.numberOfBirds, 0)
    const totalWt = selected.reduce((s, c) => s + Number(c.purchaseWeight), 0)
    const cageIds = selected.map(c => c.cageId).filter(Boolean).join(', ')
    setFormData(f => ({
      ...f,
      cageNo: cageIds,
      numBirds: totalBirds > 0 ? String(totalBirds) : f.numBirds,
      totalWeight: totalWt > 0 ? totalWt.toFixed(2) : f.totalWeight,
    }))
  }

  const rate = parseFloat(formData.ratePerKg) || 0
  const selectedCageList = purchaseCages.filter(c => selectedCageIds.has(c.id!))
  const totalBirds = selectedCageList.length > 0
    ? selectedCageList.reduce((s, c) => s + c.numberOfBirds, 0)
    : (parseInt(formData.numBirds) || 0)
  const totalWeight = selectedCageList.length > 0
    ? selectedCageList.reduce((s, c) => s + Number(c.purchaseWeight), 0)
    : (parseFloat(formData.totalWeight) || 0)
  const totalAmount = totalWeight * rate
  const avgWeight = totalBirds > 0 ? totalWeight / totalBirds : 0

  const addPayment = () => setPayments(p => [...p, emptyPayment()])
  const removePayment = (i: number) => setPayments(p => p.filter((_, idx) => idx !== i))
  const updatePayment = (i: number, field: keyof PaymentRow, value: string) =>
    setPayments(p => p.map((x, idx) => idx === i ? { ...x, [field]: value } : x))
  const charges = (parseFloat(formData.transportCharges) || 0) + (parseFloat(formData.loadingCharges) || 0) + (parseFloat(formData.commission) || 0) + (parseFloat(formData.otherCharges) || 0)
  const deductions = parseFloat(formData.deductions) || 0
  const grossAmount = totalAmount + charges
  const netAmount = grossAmount - deductions
  const totalPaymentMade = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balance = Math.max(0, netAmount - totalPaymentMade)

  const resetForm = () => {
    setFormData({
      invoiceNumber: "", saleNo: "", purchaseBillNo: "", cageNo: "",
      numBirds: "", totalWeight: "",
      saleDate: new Date().toISOString().split("T")[0],
      retailerId: "", customerName: "", ownerName: "", phone: "", address: "",
      saleMode: "from_vehicle", vehicleId: "", productType: "meat",
      ratePerKg: "", transportCharges: "", loadingCharges: "", commission: "",
      otherCharges: "", deductions: "", paymentStatus: "pending", amountReceived: "", notes: "",
    })
    setPayments([emptyPayment()])
    setPurchaseCages([])
    setSelectedCageIds(new Set())
    setIsEditMode(false)
    setEditingId(null); setSaleFile(null)
  }

  const handleRetailerChange = (id: string) => {
    const r = retailers.find(x => x.id === id)
    if (r) {
      setFormData(f => ({ ...f, retailerId: id, customerName: r.name, ownerName: r.ownerName || "", phone: r.phone || "", address: r.address || "" }))
    } else {
      setFormData(f => ({ ...f, retailerId: "", customerName: "", ownerName: "", phone: "", address: "" }))
    }
  }

  const handleEdit = async (sale: ApiSale) => {
    setEditingId(sale.id)
    setIsEditMode(true)
    setShowDialog(true)
    // Clear any stale cage data immediately so wrong cages never show
    setPurchaseCages([])
    setSelectedCageIds(new Set())

    // Always fetch full detail to get payments and all fields
    let full: ApiSale = sale
    try {
      full = await salesApi.getOne(sale.id)
    } catch { /* fallback to list data */ }

    const retailer = retailers.find(r => r.id === full.retailerId)

    // Restore numBirds from notes JSON if available, otherwise leave blank
    let numBirds = ""
    let totalWeightVal = String(full.quantity || "")
    try {
      const parsed = JSON.parse(full.notes || "")
      if (parsed?.customerRows?.[0]) {
        numBirds = String(parsed.customerRows[0].numBirds || "")
        if (parsed.customerRows[0].weight) totalWeightVal = String(parsed.customerRows[0].weight)
      }
    } catch { }

    const purchaseBillNo = (full as any).purchaseBillNo || ""

    setFormData({
      invoiceNumber: full.invoiceNumber,
      saleNo: (full as any).saleNo || "",
      purchaseBillNo,
      cageNo: (full as any).cageNo || "",
      numBirds,
      totalWeight: totalWeightVal,
      saleDate: full.saleDate,
      retailerId: full.retailerId || "",
      customerName: full.customerName,
      ownerName: retailer?.ownerName || "",
      phone: retailer?.phone || "",
      address: retailer?.address || "",
      saleMode: full.saleMode || "from_vehicle",
      vehicleId: "",
      productType: (full.productType as any) || "meat",
      ratePerKg: String(full.unitPrice || 0),
      transportCharges: String(full.transportCharges || 0),
      loadingCharges: String(full.loadingCharges || 0),
      commission: String(full.commission || 0),
      otherCharges: String(full.otherCharges || 0),
      deductions: String(full.mortalityDeduction || 0),
      paymentStatus: full.paymentStatus,
      amountReceived: String(full.amountReceived || ""),
      notes: "",
    })

    const salePayments = (full as any).payments
    if (salePayments && salePayments.length > 0) {
      setPayments(salePayments.map((p: any) => ({ mode: (p.paymentMode || "cash") as PaymentMode, amount: String(p.amount) })))
    } else {
      setPayments([emptyPayment()])
    }

    setSaleFile(null)

    // Load cages for this purchase bill: show cages for THIS sale + pending cages only
    if (purchaseBillNo) {
      try {
        setLoadingCages(true)
        console.log('Loading cages for purchase bill:', purchaseBillNo, 'sale ID:', full.id)
        const allCages = await purchasesApi.getCagesByOrderNumber(purchaseBillNo)
        console.log('All cages received:', allCages)
        const mapped = Array.isArray(allCages)
          ? allCages.map(c => ({ ...c, id: c.id ?? '', purchaseWeight: Number(c.purchaseWeight ?? c.cageWeight ?? 0) }))
          : []

        // Filter: 
        // - Keep ALL cages (sold + pending) in state for Section 2
        // - Section 1 will filter to show only pending cages
        // - Section 2 shows all selected cages (sold + newly selected pending)
        // For backward compatibility: if cage is sold but has no saleId, assume it belongs to this sale
        const cagesForThisSale = mapped.filter(c =>
          String(c.saleId) === String(full.id) ||
          (c.status === 'sold' && !c.saleId)
        )
        const pendingCages = mapped.filter(c => !c.status || c.status === 'pending')
        console.log('Cages for this sale:', cagesForThisSale.length, 'Pending cages:', pendingCages.length)

        // Keep ALL cages (sold + pending) in state
        const combinedCages = [...cagesForThisSale, ...pendingCages]
        setPurchaseCages(combinedCages)

        // Pre-select the sold cages (they will appear in Section 2)
        setSelectedCageIds(new Set(cagesForThisSale.map(c => c.id)))
      } catch (error) {
        console.error('Failed to load cages:', error)
        // non-critical — form still works without cage list
      } finally {
        setLoadingCages(false)
      }
    } else {
      console.log('No purchase bill number for this sale')
      setPurchaseCages([])
      setSelectedCageIds(new Set())
    }
  }

  const handleView = async (sale: ApiSale) => {
    try {
      const full = await salesApi.getOne(sale.id)
      setEditingId(full.id)
      setIsEditMode(false)
      setShowDialog(true)

      const retailer = retailers.find(r => r.id === full.retailerId)
      setFormData({
        invoiceNumber: full.invoiceNumber || "",
        saleNo: (full as any).saleNo || "",
        purchaseBillNo: (full as any).purchaseBillNo || "",
        cageNo: (full as any).cageNo || "",
        numBirds: String(full.quantity || 0),
        totalWeight: String(full.quantity || 0),
        saleDate: full.saleDate,
        retailerId: full.retailerId || "",
        customerName: full.customerName || "",
        ownerName: retailer?.ownerName || "",
        phone: retailer?.phone || "",
        address: retailer?.address || "",
        saleMode: full.saleMode || "from_vehicle",
        vehicleId: "",
        productType: (full.productType as any) || "meat",
        ratePerKg: String(full.unitPrice || 0),
        transportCharges: String(full.transportCharges || 0),
        loadingCharges: String(full.loadingCharges || 0),
        commission: String(full.commission || 0),
        otherCharges: String(full.otherCharges || 0),
        deductions: String(full.mortalityDeduction || 0),
        paymentStatus: full.paymentStatus,
        amountReceived: String(full.amountReceived || ""),
        notes: full.notes || "",
      })

      setPayments(full.payments && full.payments.length > 0
        ? full.payments.map((p: any) => ({ ...p, id: p.id || crypto.randomUUID() }))
        : [emptyPayment()])
      setShowDialog(true)
    } catch (error) {
      toast.error("Failed to load sale details")
    }
  }

  const handleSave = async () => {
    // invoiceNumber is now optional - backend will auto-generate if not provided
    if (!formData.customerName) {
      toast.error("Customer name is required"); return
    }
    if (totalWeight <= 0) {
      toast.error("Enter total weight"); return
    }
    try {
      setLoading(true)
      const validPayments = payments.filter(p => parseFloat(p.amount) > 0).map(p => ({ paymentMode: p.mode, amount: p.amount }))
      const payload: any = {
        invoiceNumber: formData.invoiceNumber,
        saleNo: formData.saleNo || undefined,
        purchaseBillNo: formData.purchaseBillNo || undefined,
        cageNo: formData.cageNo || undefined,
        customerName: formData.customerName,
        saleDate: formData.saleDate,
        saleMode: formData.saleMode,
        productType: formData.productType,
        quantity: String(totalWeight),
        unit: "kg",
        unitPrice: formData.ratePerKg || "0",
        transportCharges: formData.transportCharges || "0",
        loadingCharges: formData.loadingCharges || "0",
        commission: formData.commission || "0",
        otherCharges: formData.otherCharges || "0",
        weightShortage: "0",
        mortalityDeduction: formData.deductions || "0",
        otherDeduction: "0",
        paymentStatus: formData.paymentStatus,
        amountReceived: String(totalPaymentMade),
        notes: formData.notes || undefined,
        retailerId: formData.retailerId || undefined,
        payments: validPayments,
      }
      let saved: ApiSale
      if (editingId) { 
        saved = await salesApi.update(editingId, payload)
        toast.success("Sale updated")
      } else { 
        saved = await salesApi.create(payload)
        // Update form with auto-generated invoice number if it was empty
        if (saved?.invoiceNumber && !formData.invoiceNumber) {
          setFormData(prev => ({ ...prev, invoiceNumber: saved.invoiceNumber, saleNo: saved.invoiceNumber }))
          toast.success(`Sale created - Bill No: ${saved.invoiceNumber}`)
        } else {
          toast.success("Sale created")
        }
      }
      
      if (saleFile && saved?.id) {
        try { setUploadingFile(true); await salesApi.uploadAttachment(saved.id, saleFile); toast.success("Attachment uploaded") }
        catch { toast.error("Sale saved but file upload failed") }
        finally { setUploadingFile(false) }
      }
      if (selectedCageIds.size > 0) {
        try { await purchasesApi.markCagesSold(Array.from(selectedCageIds)) }
        catch { toast.error("Sale saved but failed to update cage status") }
      }
      await fetchSales()
      // Don't reset form immediately for new sales so user can see the generated number
      if (editingId) {
        resetForm()
        setShowDialog(false)
      }
    } catch (e: any) { toast.error(e.message || "Failed to save sale") }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sale?")) return
    try { setLoading(true); await salesApi.delete(id); toast.success("Deleted"); await fetchSales() }
    catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  const stats = useMemo(() => {
    if (serverStats) {
      return {
        count: totalRecords,
        totalBirds: serverStats.totalBirds,
        totalRevenue: serverStats.totalRevenue,
        totalReceived: serverStats.totalReceived,
        totalPending: serverStats.totalPending,
      }
    }
    return {
      count: sales.length,
      totalBirds: sales.reduce((s, x) => s + (parseFloat(String(x.quantity || 0))), 0),
      totalRevenue: sales.reduce((s, x) => s + (parseFloat(String(x.netAmount || x.totalAmount || 0))), 0),
      totalReceived: sales.reduce((s, x) => s + (parseFloat(String(x.amountReceived || 0))), 0),
      totalPending: sales.reduce((s, x) => s + Math.max(0, parseFloat(String(x.netAmount || x.totalAmount || 0)) - parseFloat(String(x.amountReceived || 0))), 0),
    }
  }, [sales, serverStats, totalRecords])

  const filtered = useMemo(() => {
    return sales
  }, [sales])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales Tracking</h1>
            <p className="text-muted-foreground">Manage your sales records</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="mr-2" size={20} />Add New Sale</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col" aria-describedby="sale-dialog-desc">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Sale" : "Add New Sale"}</DialogTitle>
                <p id="sale-dialog-desc" className="sr-only">Sale form</p>
              </DialogHeader>
              <div className="space-y-5 overflow-y-auto flex-1 pr-1 pb-2">

                {/* Section 1: Header */}
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50 border-b border-blue-100 py-3">
                    <CardTitle className="text-blue-900 text-base">Section 1: Header Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {/* Purchase Bill No — full width */}
                    <div className="space-y-2">
                      <Label>Purchase Bill No *</Label>
                      <Select value={formData.purchaseBillNo || '__none__'} onValueChange={handlePurchaseBillChange} disabled={loading}>
                        <SelectTrigger><SelectValue placeholder="Select purchase bill" /></SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {/* Search box inside dropdown */}
                          <div className="px-2 py-1 sticky top-0 bg-white z-10">
                            <Input
                              placeholder="Search bill no or supplier..."
                              value={billSearch}
                              onChange={e => setBillSearch(e.target.value)}
                              className="h-8 text-xs"
                              autoFocus
                            />
                          </div>
                          <SelectItem value="__none__">Select purchase bill...</SelectItem>
                          {(billSearch.trim() ? purchaseBills.filter(b =>
                            b.orderNumber.toLowerCase().includes(billSearch.toLowerCase()) ||
                            b.supplierName.toLowerCase().includes(billSearch.toLowerCase())
                          ) : purchaseBills).map(b => (
                            <SelectItem key={b.id} value={b.orderNumber}>
                              {b.orderNumber} — {b.supplierName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Sale No + Sale Date — 2 col */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sale No. (Auto-generated if empty)</Label>
                        <Input value={formData.saleNo} onChange={e => setFormData(f => ({ ...f, saleNo: e.target.value, invoiceNumber: e.target.value }))} placeholder="Leave empty for auto-generation" disabled={loading} />
                      </div>
                      <div className="space-y-2">
                        <Label>Sale Date *</Label>
                        <DatePicker value={formData.saleDate} onChange={d => setFormData(f => ({ ...f, saleDate: d }))} disabled={loading} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cage No (auto)</Label>
                      <Input value={formData.cageNo} readOnly placeholder="Auto-filled from cage selection" className={formData.cageNo ? "bg-green-50 border-green-300 text-sm" : "bg-gray-50 text-sm"} />
                    </div>


                    {/* Cage panel — pending cages (create mode) or sold cages for this sale (edit mode) */}
                    {formData.purchaseBillNo && formData.purchaseBillNo !== '__none__' && (
                      <div className="border rounded-lg p-3 bg-blue-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-blue-900 font-semibold">
                              Cages from {formData.purchaseBillNo}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isEditMode
                                ? <span className="text-blue-700 font-medium">Select additional pending cages to add to this sale</span>
                                : <>Checked cages will be marked as <span className="text-green-700 font-medium">SOLD</span> when you create the sale</>
                              }
                            </p>
                          </div>
                          {loadingCages && <span className="text-xs text-muted-foreground">Loading cages...</span>}
                          {!loadingCages && purchaseCages.length > 0 && (
                            <button type="button" onClick={toggleAllCages} className="text-xs text-blue-700 underline">
                              {selectedCageIds.size === purchaseCages.length ? 'Deselect All' : 'Select All'}
                            </button>
                          )}
                        </div>
                        {!loadingCages && purchaseCages.length === 0 && (
                          <p className="text-xs text-muted-foreground">No cages found for this purchase bill.</p>
                        )}
                        {!loadingCages && purchaseCages.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b bg-blue-100">
                                  <th className="p-1 w-8"></th>
                                  <th className="text-left p-1">Cage ID</th>
                                  <th className="text-right p-1">Birds</th>
                                  <th className="text-right p-1">Weight (kg)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {purchaseCages
                                  .filter(cage => !cage.status || cage.status === 'pending') // Section 1: Show ONLY pending cages
                                  .map(cage => {
                                    const isDisabled = false // Pending cages are never disabled

                                    return (
                                      <tr
                                        key={cage.id}
                                        className={`border-b cursor-pointer hover:bg-blue-100 ${selectedCageIds.has(cage.id!) ? 'bg-green-50' : ''}`}
                                        onClick={() => toggleCage(cage.id!)}
                                      >
                                        <td className="p-1 text-center">
                                          <input
                                            type="checkbox"
                                            checked={selectedCageIds.has(cage.id!)}
                                            onChange={() => toggleCage(cage.id!)}
                                            onClick={e => e.stopPropagation()}
                                          />
                                        </td>
                                        <td className="p-1 font-medium">{cage.cageId || '-'}</td>
                                        <td className="p-1 text-right">{cage.numberOfBirds}</td>
                                        <td className="p-1 text-right">{Number(cage.purchaseWeight).toFixed(2)}</td>
                                      </tr>
                                    )
                                  })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t font-semibold bg-blue-100">
                                  <td colSpan={2} className="p-1">{selectedCageIds.size} selected / {purchaseCages.filter(c => !c.status || c.status === 'pending').length} pending</td>
                                  <td className="p-1 text-right">{purchaseCages.filter(c => selectedCageIds.has(c.id!)).reduce((s, c) => s + c.numberOfBirds, 0)}</td>
                                  <td className="p-1 text-right">{purchaseCages.filter(c => selectedCageIds.has(c.id!)).reduce((s, c) => s + Number(c.purchaseWeight), 0).toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label>Shop / Retailer *</Label>
                        <Select value={formData.retailerId || '__none__'} onValueChange={v => handleRetailerChange(v === '__none__' ? '' : v)} disabled={loading}>
                          <SelectTrigger><SelectValue placeholder="Select shop" /></SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="__none__">Select shop / retailer...</SelectItem>
                            {retailers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Owner Name</Label>
                        <Input value={formData.ownerName} disabled className="bg-gray-50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sale Mode</Label>
                        <Select value={formData.saleMode} onValueChange={(v: any) => setFormData(f => ({ ...f, saleMode: v }))} disabled={loading}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="from_vehicle">From Vehicle</SelectItem>
                            <SelectItem value="from_godown">From Godown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle</Label>
                        <Select value={formData.vehicleId || '__none__'} onValueChange={v => setFormData(f => ({ ...f, vehicleId: v === '__none__' ? '' : v }))} disabled={loading}>
                          <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="__none__">Select vehicle...</SelectItem>
                            {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Attach Sales Sheet (PDF/JPG/PNG)</Label>
                      <div className="flex items-center gap-3">
                        <input ref={saleFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setSaleFile(e.target.files?.[0] || null)} />
                        <Button type="button" variant="outline" size="sm" onClick={() => saleFileRef.current?.click()} disabled={loading}><Paperclip size={14} className="mr-1" /> Choose File</Button>
                        {saleFile && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded"><span>{saleFile.name}</span><button onClick={() => setSaleFile(null)}><X size={12} /></button></div>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" disabled={loading} />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Customer Details */}
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50 border-b border-green-100 py-3">
                    <CardTitle className="text-green-900 text-base">Section 2: Customer Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Customer Name *</Label>
                        <Input value={formData.customerName} onChange={e => setFormData(f => ({ ...f, customerName: e.target.value }))} placeholder="Customer name" disabled={loading} />
                      </div>
                      <div className="space-y-1">
                        <Label>Rate per KG *</Label>
                        <Input type="number" step="0.01" value={formData.ratePerKg} onChange={e => setFormData(f => ({ ...f, ratePerKg: e.target.value }))} placeholder="e.g. 146" disabled={loading} onWheel={(e) => e.currentTarget.blur()} />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-2 w-24">Cage ID</th>
                            <th className="text-left p-2 w-20">Birds</th>
                            <th className="text-left p-2 w-28">Weight (kg)</th>
                            <th className="text-right p-2 w-28">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCageIds.size > 0 ? (
                            purchaseCages.filter(c => selectedCageIds.has(c.id!)).map((cage) => {
                              const wt = Number(cage.purchaseWeight)
                              const amt = wt * rate
                              return (
                                <tr key={cage.id} className="border-b hover:bg-gray-50">
                                  <td className="p-1 font-medium text-xs">{cage.cageId || '-'}</td>
                                  <td className="p-1">
                                    <Input
                                      type="number"
                                      defaultValue={cage.numberOfBirds}
                                      onChange={e => {
                                        // Update the cage's bird count in the state
                                        const newBirds = parseInt(e.target.value) || 0
                                        setPurchaseCages(prev => prev.map(c =>
                                          c.id === cage.id ? { ...c, numberOfBirds: newBirds } : c
                                        ))
                                      }}
                                      className="h-8 text-sm text-center"
                                      disabled={loading}
                                      onWheel={(e) => e.currentTarget.blur()}
                                    />
                                  </td>
                                  <td className="p-1">
                                    <Input type="number" step="0.001" defaultValue={wt.toFixed(3)}
                                      onChange={e => {
                                        const newWt = parseFloat(e.target.value) || 0
                                        // Update the cage's weight in the state
                                        setPurchaseCages(prev => prev.map(c =>
                                          c.id === cage.id ? { ...c, purchaseWeight: newWt } : c
                                        ))
                                        const others = purchaseCages.filter(c => selectedCageIds.has(c.id!) && c.id !== cage.id).reduce((s, c) => s + Number(c.purchaseWeight), 0)
                                        setFormData(f => ({ ...f, totalWeight: (others + newWt).toFixed(3) }))
                                      }}
                                      className="h-8 text-sm" disabled={loading} onWheel={(e) => e.currentTarget.blur()} />
                                  </td>
                                  <td className="p-1 text-right font-medium">{amt > 0 ? `₹${amt.toFixed(0)}` : '-'}</td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr className="border-b">
                              <td className="p-1 text-xs text-muted-foreground">-</td>
                              <td className="p-1">
                                <Input type="number" value={formData.numBirds} onChange={e => setFormData(f => ({ ...f, numBirds: e.target.value }))} placeholder="0" className="h-8 text-sm" disabled={loading} onWheel={(e) => e.currentTarget.blur()} />
                              </td>
                              <td className="p-1">
                                <Input type="number" step="0.001" value={formData.totalWeight} onChange={e => setFormData(f => ({ ...f, totalWeight: e.target.value }))} placeholder="0.000" className="h-8 text-sm" disabled={loading} onWheel={(e) => e.currentTarget.blur()} />
                              </td>
                              <td className="p-1 text-right font-medium">{totalAmount > 0 ? `₹${totalAmount.toFixed(0)}` : '-'}</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 bg-green-50 font-semibold">
                            <td className="p-2">TOTAL</td>
                            <td className="p-2">{totalBirds}</td>
                            <td className="p-2">{totalWeight.toFixed(3)}</td>
                            <td className="p-2 text-right">{totalAmount.toFixed(0)}</td>
                          </tr>
                          <tr className="bg-gray-50 text-xs text-muted-foreground">
                            <td className="p-2" colSpan={4}>Avg Weight/Bird: {avgWeight > 0 ? avgWeight.toFixed(3) + ' kg' : '-'}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {/* Total Amount display */}
                    <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded p-3">
                      <span className="font-semibold text-green-900">Total Amount</span>
                      <span className="text-xl font-bold text-green-700">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Payment */}
                <Card className="border-purple-200">
                  <CardHeader className="bg-purple-50 border-b border-purple-100 py-3">
                    <CardTitle className="text-purple-900 text-base">Section 3: Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Payment Status</Label>
                      <Select value={formData.paymentStatus} onValueChange={(v: any) => setFormData(f => ({ ...f, paymentStatus: v }))} disabled={loading}>
                        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <Label className="text-sm font-medium">Payment Mode</Label>
                        <Label className="text-sm font-medium">Amount (₹)</Label>
                      </div>
                      {payments.map((p, i) => (
                        <div key={i} className="grid grid-cols-2 gap-4">
                          <Select value={p.mode} onValueChange={v => updatePayment(i, "mode", v)} disabled={loading}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="advance">Advance</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1">
                            <Input type="number" step="0.01" placeholder="0.00" value={p.amount} onChange={e => updatePayment(i, "amount", e.target.value)} disabled={loading} onWheel={(e) => e.currentTarget.blur()} />
                            {payments.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removePayment(i)} className="px-2 text-red-500"><X size={14} /></Button>}
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addPayment} disabled={loading}><Plus size={14} className="mr-1" /> Add Payment Mode</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-2"><Label>Total Received (₹)</Label><Input value={`₹${totalPaymentMade.toFixed(2)}`} disabled className="bg-gray-50 font-semibold text-green-700" /></div>
                      <div className="space-y-2"><Label>Balance (₹)</Label><Input value={`₹${balance.toFixed(2)}`} disabled className="bg-gray-50 font-semibold text-red-600" /></div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  {!editingId && formData.invoiceNumber ? (
                    <Button variant="outline" onClick={() => { resetForm(); setShowDialog(false) }} disabled={loading}>Close</Button>
                  ) : (
                    <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>Cancel</Button>
                  )}
                  <Button onClick={handleSave} disabled={loading || uploadingFile} className="bg-green-600 hover:bg-green-700">
                    {loading || uploadingFile ? "Saving..." : editingId ? "Update Sale" : "Create Sale"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mini Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <ShoppingCart size={14} className="text-blue-600" />
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.count}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Birds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalBirds.toFixed(0)} kg
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp size={14} className="text-orange-600" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ₹{stats.totalRevenue.toFixed(0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Wallet size={14} className="text-green-600" />
                Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{stats.totalReceived.toFixed(0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock size={14} className="text-red-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{stats.totalPending.toFixed(0)}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-3">
              {/* <div>
                <CardTitle>Sales List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all sales</p>
              </div> */}
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter startDate={dateRangeStart} endDate={dateRangeEnd} onDateRangeChange={(s, e) => { setDateRangeStart(s); setDateRangeEnd(e) }} />
                <Input placeholder="Search bill no, customer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[180px]" />
                {/* <Input placeholder="Filter by location..." value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="w-[160px]" /> */}
                {/* <Select value={filterRetailer || '__all__'} onValueChange={v => setFilterRetailer(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Retailers" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Retailers</SelectItem>
                    {retailers.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select> */}
                <Select value={filterPaymentStatus || '__all__'} onValueChange={v => setFilterPaymentStatus(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
                {/* <Select value={filterSaleMode || '__all__'} onValueChange={v => setFilterSaleMode(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Modes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Modes</SelectItem>
                    <SelectItem value="from_vehicle">From Vehicle</SelectItem>
                    <SelectItem value="from_godown">From Godown</SelectItem>
                  </SelectContent>
                </Select> */}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && sales.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No sales found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>

                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Sale No</TableHead>
                      <TableHead className="font-bold">Bill No</TableHead>
                      <TableHead className="font-bold">Purchase Bill</TableHead>
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold">Customer</TableHead>
                      <TableHead className="font-bold">Mode</TableHead>
                      <TableHead className="font-bold">Weight</TableHead>
                      <TableHead className="font-bold">Net Amount</TableHead>
                      <TableHead className="font-bold">Payment</TableHead>
                      <TableHead className="font-bold">Balance</TableHead>
                      <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{(s as any).saleNo || '-'}</TableCell>
                        <TableCell>{s.invoiceNumber}</TableCell>
                        <TableCell>{(s as any).purchaseBillNo || '-'}</TableCell>
                        <TableCell>{new Date(s.saleDate).toLocaleDateString()}</TableCell>
                        <TableCell>{s.customerName}</TableCell>
                        <TableCell><span className="text-xs px-2 py-0.5 rounded bg-gray-100">{s.saleMode === 'from_vehicle' ? 'Vehicle' : 'Godown'}</span></TableCell>
                        <TableCell>{Number(s.quantity || 0).toFixed(2)} kg</TableCell>
                        <TableCell>₹{Number(s.netAmount || s.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : s.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {s.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell>₹{Math.max(0, Number(s.netAmount || s.totalAmount || 0) - Number(s.amountReceived || 0)).toFixed(2)}</TableCell>
                        <TableCell>
                          {userRole !== 'staff' && userRole !== 'Staff' ? (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Edit2 size={14} /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 size={14} /></Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleView(s)}><Eye size={14} /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination UI */}
            {totalRecords > 0 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.ceil(totalRecords / pageSize))].map((_, i) => {
                      const pageNum = i + 1;
                      // Only show first, last, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === Math.ceil(totalRecords / pageSize) ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-8"
                            onClick={() => {
                              setCurrentPage(pageNum)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        (pageNum === 2 && currentPage > 3) ||
                        (pageNum === Math.ceil(totalRecords / pageSize) - 1 && currentPage < Math.ceil(totalRecords / pageSize) - 2)
                      ) {
                        return <span key={pageNum} className="px-1 text-muted-foreground text-sm">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(p => Math.min(Math.ceil(totalRecords / pageSize), p + 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={currentPage === Math.ceil(totalRecords / pageSize) || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
