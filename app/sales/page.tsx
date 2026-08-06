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
import { Plus, Edit2, Trash2, X, Paperclip, Wallet, TrendingUp, ShoppingCart, Clock, Eye, MoreHorizontal, Layers, Printer } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { salesApi, retailersApi, vehiclesApi, purchasesApi, settingsApi, type Sale as ApiSale } from "@/lib/api"
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/api-base-url"

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
  const [purchaseCages, setPurchaseCages] = useState<any[]>([])
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
  const [allowEditBillNo, setAllowEditBillNo] = useState(false)
  const [bearableLossType, setBearableLossType] = useState<'percentage' | 'weight'>('percentage')
  const [bearableLossValue, setBearableLossValue] = useState<number>(2.0)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [serverStats, setServerStats] = useState<any>(null)
  const [summaryTotals, setSummaryTotals] = useState<{ totalBirds: number }>({ totalBirds: 0 })

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
    
    // Load bearable loss settings
    settingsApi.getAll().then(list => {
      if (Array.isArray(list)) {
        const typeSetting = list.find(s => s.key === 'bearableLossType' || s.key === 'bearable_loss_type')
        const valSetting = list.find(s => s.key === 'bearableLossValue' || s.key === 'bearable_loss_value')
        if (typeSetting) setBearableLossType(typeSetting.value as any)
        if (valSetting) setBearableLossValue(parseFloat(valSetting.value) || 2.0)
      }
    }).catch(() => { })
  }, [])

  useEffect(() => {
    fetchSales()
  }, [currentPage, pageSize, searchQuery, dateRangeStart, dateRangeEnd, filterPaymentStatus])

  useEffect(() => {
    fetchSummaryTotals()
  }, [searchQuery, dateRangeStart, dateRangeEnd, filterPaymentStatus])

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

  const fetchSummaryTotals = async () => {
    try {
      const res = await salesApi.getAll({
        page: 1,
        limit: 1,
        customer: searchQuery || undefined,
        startDate: dateRangeStart?.toISOString().split('T')[0],
        endDate: dateRangeEnd?.toISOString().split('T')[0],
        paymentStatus: filterPaymentStatus || undefined,
      })
      if (res?.summary) {
        setSummaryTotals({
          totalBirds: Number((res.summary as any).totalBirds ?? 0),
        })
      }
    } catch { /* non-critical */ }
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

  const fetchNextInvoiceNumber = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiBaseUrl()}/sales/generate/next-invoice-number`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        return data.nextInvoiceNumber || ""
      }
    } catch (error) {
      console.error('Failed to fetch next invoice number:', error)
    }
    return ""
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
        ? (allCages as any[]).map((c: any) => {
            const availBirds = Number(c.numberOfBirds ?? 0)
            const availWt = Number(c.purchaseWeight ?? c.cageWeight ?? 0)
            return {
              ...c,
              id: c.id ?? '',
              purchaseWeight: availWt,
              initialBirds: availBirds,
              initialWeight: availWt,
              soldBirds: String(c.soldBirds ?? availBirds),
              soldWeight: String(c.purchaseWeight ?? availWt),
              weightLoss: '0',
            }
          })
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

  const syncFormFromCagesList = (ids: Set<string>, updatedList: any[]) => {
    const selected = updatedList.filter(c => ids.has(c.id!))
    const totalBirds = selected.reduce((s, c) => s + (parseInt(c.soldBirds) || 0), 0)
    const totalWt = selected.reduce((s, c) => s + (parseFloat(c.soldWeight) || 0), 0)
    const cageIds = selected.map(c => c.cageId).filter(Boolean).join(', ')
    setFormData(f => ({
      ...f,
      cageNo: cageIds,
      numBirds: totalBirds > 0 ? String(totalBirds) : f.numBirds,
      totalWeight: totalWt > 0 ? totalWt.toFixed(2) : f.totalWeight,
    }))
  }

  const toggleCage = (id: string) => {
    setSelectedCageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      syncFormFromCagesList(next, purchaseCages)
      return next
    })
  }

  const toggleAllCages = () => {
    const visible = purchaseCages.filter(cage => {
      if (isEditMode && editingId) {
        return String(cage.saleId) === String(editingId) || !cage.status || cage.status === 'pending'
      }
      return !cage.status || cage.status === 'pending'
    })
    
    if (selectedCageIds.size === visible.length) {
      const empty = new Set<string>()
      setSelectedCageIds(empty)
      syncFormFromCagesList(empty, purchaseCages)
    } else {
      const allIds = new Set(visible.map(c => c.id!))
      setSelectedCageIds(allIds)
      syncFormFromCagesList(allIds, purchaseCages)
    }
  }

  const parseWeightLossDetails = (notesStr: string) => {
    try {
      const parsed = JSON.parse(notesStr)
      if (parsed && parsed.weightLoss) {
        return parsed.weightLoss
      }
    } catch {}
    return null
  }

  const rate = parseFloat(formData.ratePerKg) || 0
  const selectedCageList = purchaseCages.filter(c => selectedCageIds.has(c.id!))
  const totalBirds = selectedCageList.length > 0
    ? selectedCageList.reduce((s, c) => s + (parseInt(c.soldBirds) || 0), 0)
    : (parseInt(formData.numBirds) || 0)
  const totalWeight = selectedCageList.length > 0
    ? selectedCageList.reduce((s, c) => s + (parseFloat(c.soldWeight) || 0), 0)
    : (parseFloat(formData.totalWeight) || 0)
  const totalAmount = totalWeight * rate
  const avgWeight = totalBirds > 0 ? totalWeight / totalBirds : 0

  const isReadOnly = !isEditMode && !!editingId

  const totalWeightLoss = useMemo(() => {
    if (selectedCageList.length === 0) return 0
    return selectedCageList.reduce((s, c) => s + (parseFloat(c.weightLoss) || 0), 0)
  }, [selectedCageList])

  const totalWeightLossAmount = useMemo(() => {
    return totalWeightLoss * rate
  }, [totalWeightLoss, rate])

  const totalBearableLoss = useMemo(() => {
    if (selectedCageList.length === 0) return 0
    return selectedCageList.reduce((sum, cage) => {
      const availBirds = cage.initialBirds || cage.numberOfBirds
      const availWt = cage.initialWeight || cage.purchaseWeight
      const avgWt = availBirds > 0 ? availWt / availBirds : 0
      const enteredBirdsCount = parseInt(cage.soldBirds) || 0
      const expectedSoldWt = avgWt * enteredBirdsCount
      
      let maxAllowed = 0
      if (bearableLossType === 'percentage') {
        maxAllowed = expectedSoldWt * (bearableLossValue / 100)
      } else {
        maxAllowed = bearableLossValue
      }
      return sum + maxAllowed
    }, 0)
  }, [selectedCageList, bearableLossType, bearableLossValue])

  const totalBearableLossAmount = useMemo(() => {
    return totalBearableLoss * rate
  }, [totalBearableLoss, rate])

  const netExcessLoss = useMemo(() => {
    return Math.max(0, totalWeightLoss - totalBearableLoss)
  }, [totalWeightLoss, totalBearableLoss])

  const netExcessLossAmount = useMemo(() => {
    return netExcessLoss * rate
  }, [netExcessLoss, rate])

  const loadCagesForSale = async (purchaseBillNo: string, saleId: string) => {
    if (!purchaseBillNo) {
      setPurchaseCages([])
      setSelectedCageIds(new Set())
      return
    }
    try {
      setLoadingCages(true)
      console.log('Loading cages for:', purchaseBillNo, 'sale ID:', saleId)
      const allCages = await purchasesApi.getCagesByOrderNumber(purchaseBillNo)
      console.log('All cages received:', allCages)
      const mapped = Array.isArray(allCages)
        ? (allCages as any[]).map((c: any) => {
            const isThisSale = String(c.saleId) === String(saleId) || (c.status === 'sold' && !c.saleId)
            const availBirds = Number(c.numberOfBirds ?? 0)
            const availWt = Number(c.purchaseWeight ?? c.cageWeight ?? 0)
            return {
              ...c,
              id: c.id ?? '',
              purchaseWeight: availWt,
              initialBirds: availBirds,
              initialWeight: availWt,
              soldBirds: String(isThisSale ? (c.numberOfBirds ?? availBirds) : availBirds),
              soldWeight: String(isThisSale ? (c.saleWeight ?? c.purchaseWeight ?? availWt) : availWt),
              weightLoss: String(isThisSale ? (Number(c.purchaseWeight || 0) - Number(c.saleWeight || c.purchaseWeight || 0)).toFixed(2) : '0.00'),
            }
          })
        : []

      const cagesForThisSale = mapped.filter(c =>
        String(c.saleId) === String(saleId) ||
        (c.status === 'sold' && !c.saleId)
      )
      const pendingCages = mapped.filter(c => !c.status || c.status === 'pending')
      console.log('Cages for this sale:', cagesForThisSale.length, 'Pending cages:', pendingCages.length)

      const combinedCages = [...cagesForThisSale, ...pendingCages]
      setPurchaseCages(combinedCages)
      setSelectedCageIds(new Set(cagesForThisSale.map(c => c.id)))
    } catch (error) {
      console.error('Failed to load cages:', error)
    } finally {
      setLoadingCages(false)
    }
  }

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

  const resetForm = async () => {
    const nextNumber = editingId ? "" : await fetchNextInvoiceNumber()
    setFormData({
      invoiceNumber: nextNumber, saleNo: nextNumber, purchaseBillNo: "", cageNo: "",
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
    setAllowEditBillNo(false)
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
      notes: (() => {
        try {
          const parsed = JSON.parse(full.notes || "")
          if (parsed && typeof parsed.text === 'string') return parsed.text
        } catch {}
        return full.notes || ""
      })(),
    })

    const salePayments = (full as any).payments
    if (salePayments && salePayments.length > 0) {
      setPayments(salePayments.map((p: any) => ({ mode: (p.paymentMode || "cash") as PaymentMode, amount: String(p.amount) })))
    } else {
      setPayments([emptyPayment()])
    }

    setSaleFile(null)

    if (purchaseBillNo) {
      await loadCagesForSale(purchaseBillNo, full.id)
    } else {
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
        notes: (() => {
          try {
            const parsed = JSON.parse(full.notes || "")
            if (parsed && typeof parsed.text === 'string') return parsed.text
          } catch {}
          return full.notes || ""
        })(),
      })

      setPayments(full.payments && full.payments.length > 0
        ? full.payments.map((p: any) => ({ ...p, id: p.id || crypto.randomUUID() }))
        : [emptyPayment()])

      const purchaseBillNo = (full as any).purchaseBillNo || ""
      if (purchaseBillNo) {
        await loadCagesForSale(purchaseBillNo, full.id)
      } else {
        setPurchaseCages([])
        setSelectedCageIds(new Set())
      }
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
      
      const selectedCages = purchaseCages.filter(c => selectedCageIds.has(c.id!))
      const cageMapping = selectedCages.map(c => ({
        cageId: c.id,
        soldBirds: parseInt(String(c.soldBirds)) || 0,
        soldWeight: parseFloat(String(c.soldWeight)) || 0,
        weightLoss: parseFloat(String(c.weightLoss)) || 0,
      }))

      let finalNotesString = formData.notes || ""
      if (selectedCages.length > 0) {
        finalNotesString = JSON.stringify({
          text: formData.notes || "",
          weightLoss: {
            totalWeightLoss,
            totalBearableLoss,
            netExcessLoss,
            netExcessLossAmount,
            totalBirds,
            totalWeight,
          }
        })
      }

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
        weightShortage: String(netExcessLossAmount),
        weightShortageKg: String(netExcessLoss),
        mortalityDeduction: formData.deductions || "0",
        otherDeduction: "0",
        paymentStatus: formData.paymentStatus,
        amountReceived: String(totalPaymentMade),
        totalBirds: totalBirds,
        numberOfBirds: totalBirds,
        notes: finalNotesString || undefined,
        retailerId: formData.retailerId || undefined,
        payments: validPayments,
        cages: cageMapping,
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
      await fetchSales()
      // Don't reset form immediately for new sales so user can see the generated number
      if (editingId) {
        resetForm()
        setShowDialog(false)
      }
    } catch (e: any) { toast.error(e.message || "Failed to save sale") }
    finally { setLoading(false) }
  }

  const getInvoiceNotesText = (notes: string | undefined) => {
    if (!notes) return ""
    try {
      const parsed = JSON.parse(notes)
      if (parsed && typeof parsed.text === "string") return parsed.text
    } catch {
      // ignore invalid JSON
    }
    return notes
  }

  const handlePrintSale = (sale: ApiSale) => {
    const invoiceNumber = (sale as any).saleNo || (sale as any).invoiceNumber || "INV-2026-000000"
    const invoiceDate = new Date(sale.saleDate).toLocaleDateString('en-GB')
    const dueDate = new Date(sale.saleDate)
    dueDate.setDate(dueDate.getDate() + 7)
    const subtotal = Number(sale.netAmount || sale.totalAmount || 0)
    const received = Number((sale as any).amountReceived || 0)
    const balance = Math.max(0, subtotal - received)
    const paymentStatus = String((sale as any).paymentStatus || "pending").toUpperCase()
    const modeLabel = sale.saleMode === "from_vehicle" ? "Vehicle Sale" : "Godown Sale"
    const birds = getSaleBirds(sale)
    const weight = Number(sale.quantity || 0)
    const rate = Number((sale as any).ratePerKg || (sale as any).unitPrice || 0)
    const matchedRetailer = retailers.find(r => String(r.id) === String((sale as any).retailerId || ""))
    const customerPhone = String((sale as any).phone || matchedRetailer?.phone || "").trim()
    const customerAddress = String((sale as any).address || matchedRetailer?.address || "").trim()
    const invoiceNotes = getInvoiceNotesText((sale as any).notes)
    const barcodeBars = Array.from({ length: 36 }, (_, i) => `<span style="height:${10 + (i % 5) * 3}px"></span>`).join("")

    const invoiceRows = (() => {
      try {
        const parsed = JSON.parse(sale.notes || "")
        if (parsed?.customerRows?.length) {
          return parsed.customerRows.map((row: any) => ({
            psc: row.numBirds || 0,
            wt: Number(row.weight || 0),
            rate: Number(row.rate || rate),
            amt: Number(row.amount || 0),
            paid: Number(row.amount || 0),
          }))
        }
      } catch {}
      return [{
        psc: birds,
        wt: weight,
        rate,
        amt: subtotal,
        paid: received,
      }]
    })()

    const invoiceHtml = `
      <div class="invoice-shell">
        <div class="form-header">
          <div class="form-title">Aziz Poultry FARM</div>
          <div class="form-meta">
            <div class="meta-row"><span>Bill No.</span><strong>${invoiceNumber}</strong></div>
            <div class="meta-row"><span>Date</span><strong>${invoiceDate}</strong></div>
          </div>
        </div>

        <div class="customer-line">
          <div class="customer-label">Name</div>
          <div class="customer-value">${sale.customerName || (sale as any).retailerName || "Customer Name"}</div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Sr.</th>
              <th>Psc.</th>
              <th>Wt.</th>
              <th>Rate</th>
              <th>Amt</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRows.map((row: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${row.psc}</td>
                <td>${row.wt.toFixed(3)}</td>
                <td>₹${row.rate.toFixed(0)}</td>
                <td>₹${row.amt.toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td><strong>Total</strong></td>
              <td><strong>${invoiceRows.reduce((sum: number, row: any) => sum + (row.psc || 0), 0)}</strong></td>
              <td><strong>${invoiceRows.reduce((sum: number, row: any) => sum + (row.wt || 0), 0).toFixed(3)}</strong></td>
              <td></td>
              <td><strong>₹${invoiceRows.reduce((sum: number, row: any) => sum + (row.amt || 0), 0).toFixed(0)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div style="display:flex; justify-content:flex-end; margin-top:8px;">
          <div class="total-summary-block" style="width:240px; border:1px solid #111; border-radius:6px; padding:8px; background:#fff;">
            <div style="display:flex; justify-content:space-between; padding:6px 0;"><div class="total-summary-label">Amount</div><div class="total-summary-value">₹${invoiceRows.reduce((sum: number, row: any) => sum + (row.amt || 0), 0).toFixed(0)}</div></div>
            <div style="display:flex; justify-content:space-between; padding:6px 0;"><div class="total-summary-label">Paid</div><div class="total-summary-value">₹${invoiceRows.reduce((sum: number, row: any) => sum + (row.paid || 0), 0).toFixed(0)}</div></div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-top:1px solid #111; margin-top:4px;"><div class="total-summary-label">Balance</div><div class="total-summary-value">₹${Math.max(0, invoiceRows.reduce((sum: number, row: any) => sum + (row.amt || 0), 0) - invoiceRows.reduce((sum: number, row: any) => sum + (row.paid || 0), 0)).toFixed(0)}</div></div>
          </div>
        </div>

        <div class="bottom-info">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="label">Authorized Signature</div>
          </div>
        </div>
      </div>
    `

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; }
            @page { size: A4 portrait; margin: 10mm; }
            .page { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
            .invoice-shell { position: relative; background: #fff; border: 1px solid #111; border-radius: 8px; padding: 16px; min-height: auto; }
            .form-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; border: 1px solid #111; padding: 10px; margin-bottom: 10px; }
            .form-title { font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
            .form-meta { text-align: right; min-width: 190px; }
            .meta-row { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; color: #111; margin-top: 6px; }
            .meta-row span { font-weight: 600; }
            .meta-row strong { font-weight: 700; }
            .customer-line { display: flex; align-items: center; gap: 10px; border: 1px solid #111; padding: 10px; margin-bottom: 10px; }
            .customer-label { min-width: 60px; font-size: 13px; font-weight: 700; }
            .customer-value { flex: 1; border-bottom: 1px solid #111; padding-bottom: 4px; font-size: 13px; font-weight: 600; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-top: 0; border: 1px solid #111; }
            .invoice-table th, .invoice-table td { border: 1px solid #111; padding: 8px 10px; text-align: center; font-size: 12px; }
            .invoice-table th { background: #fff; font-weight: 700; }
            .invoice-table td { font-size: 13px; }
            .totals-row td { border-top: 2px solid #111; font-weight: 700; }
            .bottom-info { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-top: 12px; padding: 0 2px; }
            .bottom-info .meta-row { justify-content: space-between; }
            .signature-block { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-top: 10px; }
            .signature-line { width: 160px; height: 1px; background: #111; }
            @media print { body { background: #fff; } .page { padding: 0; } .invoice-shell { box-shadow: none; border: 1px solid #111; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="invoice-shell">
              ${invoiceHtml}
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sale?")) return
    try { setLoading(true); await salesApi.delete(id); toast.success("Deleted"); await fetchSales() }
    catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  const getSaleBirds = (sale: any): number => {
    const direct = Number(sale?.numberOfBirds || 0)
    if (direct > 0) return direct
    try {
      if (!sale?.notes) return 0
      const parsed = typeof sale.notes === "string" ? JSON.parse(sale.notes) : sale.notes
      return Number(parsed?.weightLoss?.totalBirds) || 0
    } catch {
      return 0
    }
  }

  const stats = useMemo(() => {
    if (serverStats) {
      return {
        count: totalRecords,
        totalBirds: summaryTotals.totalBirds || sales.reduce((s, x) => s + getSaleBirds(x), 0),
        totalWeight: Number((serverStats as any).totalWeight ?? 0) || sales.reduce((s, x) => s + parseFloat(String(x.quantity || 0)), 0),
        totalRevenue: serverStats.totalRevenue,
        totalReceived: serverStats.totalReceived,
        totalPending: serverStats.totalPending,
      }
    }
    return {
      count: sales.length,
      totalBirds: sales.reduce((s, x) => s + getSaleBirds(x), 0),
      totalWeight: sales.reduce((s, x) => s + parseFloat(String(x.quantity || 0)), 0),
      totalRevenue: sales.reduce((s, x) => s + parseFloat(String(x.netAmount || x.totalAmount || 0)), 0),
      totalReceived: sales.reduce((s, x) => s + parseFloat(String(x.amountReceived || 0)), 0),
      totalPending: sales.reduce((s, x) => s + Math.max(0, parseFloat(String(x.netAmount || x.totalAmount || 0)) - parseFloat(String(x.amountReceived || 0))), 0),
    }
  }, [sales, serverStats, totalRecords, summaryTotals])

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
                      <Select value={formData.purchaseBillNo || '__none__'} onValueChange={handlePurchaseBillChange} disabled={loading || isReadOnly}>
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
                        <div className="flex items-center justify-between">
                          <Label>Sale No. (Auto-generated)</Label>
                          {!isReadOnly && (
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input type="checkbox" checked={allowEditBillNo} onChange={e => setAllowEditBillNo(e.target.checked)} className="cursor-pointer" />
                              <span>Edit manually</span>
                            </label>
                          )}
                        </div>
                        <Input value={formData.saleNo} onChange={e => setFormData(f => ({ ...f, saleNo: e.target.value, invoiceNumber: e.target.value }))} placeholder="Auto-generated on save" disabled={loading || isReadOnly} readOnly={!allowEditBillNo || isReadOnly} className={!allowEditBillNo || isReadOnly ? "bg-gray-50" : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label>Sale Date *</Label>
                        <DatePicker value={formData.saleDate} onChange={d => setFormData(f => ({ ...f, saleDate: d }))} disabled={loading || isReadOnly} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cage No (auto)</Label>
                      <Input value={formData.cageNo} readOnly placeholder="Auto-filled from cage selection" className={formData.cageNo ? "bg-green-50 border-green-300 text-sm" : "bg-gray-50 text-sm"} />
                    </div>

                    {/* Cage panel — pending cages (create mode) or sold cages for this sale (edit mode) */}
                    {formData.purchaseBillNo && formData.purchaseBillNo !== '__none__' && (() => {
                      const visibleCages = purchaseCages.filter(cage => {
                        if (isEditMode && editingId) {
                          return String(cage.saleId) === String(editingId) || !cage.status || cage.status === 'pending'
                        }
                        return !cage.status || cage.status === 'pending'
                      })

                      return (
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
                            {!loadingCages && visibleCages.length > 0 && !isReadOnly && (
                              <button type="button" onClick={toggleAllCages} className="text-xs text-blue-700 underline">
                                {selectedCageIds.size === visibleCages.length ? 'Deselect All' : 'Select All'}
                              </button>
                            )}
                          </div>
                          {!loadingCages && visibleCages.length === 0 && (
                            <p className="text-xs text-muted-foreground">No cages found for this purchase bill.</p>
                          )}
                          {!loadingCages && visibleCages.length > 0 && (
                            <div className="overflow-x-auto max-h-60 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b bg-blue-100 sticky top-0">
                                    <th className="p-1 w-8"></th>
                                    <th className="text-left p-1">Cage ID</th>
                                    <th className="text-right p-1">Avail. Birds</th>
                                    <th className="text-right p-1">Avail. Wt</th>
                                    <th className="text-right p-1 text-blue-900">Birds to Sell *</th>
                                    <th className="text-right p-1 text-blue-900">Wt to Sell (kg) *</th>
                                    <th className="text-right p-1 text-orange-700">Wt Loss (kg)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {visibleCages.map(cage => {
                                    const availBirds = cage.initialBirds || cage.numberOfBirds
                                    const availWt = cage.initialWeight || cage.purchaseWeight

                                    const avgWt = availBirds > 0 ? availWt / availBirds : 0
                                    const enteredBirdsCount = parseInt(cage.soldBirds) || 0
                                    const expectedSoldWt = avgWt * enteredBirdsCount
                                    const currentLoss = parseFloat(cage.weightLoss) || 0

                                    let isHighLoss = false
                                    let maxAllowed = 0
                                    if (currentLoss > 0.01) {
                                      if (bearableLossType === 'percentage') {
                                        maxAllowed = expectedSoldWt * (bearableLossValue / 100)
                                      } else {
                                        maxAllowed = bearableLossValue
                                      }
                                      isHighLoss = currentLoss > maxAllowed + 0.001
                                    }

                                    return (
                                      <tr
                                        key={cage.id}
                                        className={`border-b hover:bg-blue-100 ${selectedCageIds.has(cage.id!) ? (isHighLoss ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50') : ''} ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                        onClick={() => !isReadOnly && toggleCage(cage.id!)}
                                      >
                                        <td className="p-1 text-center">
                                          <input
                                            type="checkbox"
                                            checked={selectedCageIds.has(cage.id!)}
                                            onChange={() => !isReadOnly && toggleCage(cage.id!)}
                                            onClick={e => e.stopPropagation()}
                                            disabled={isReadOnly}
                                          />
                                        </td>
                                        <td className="p-1 font-medium">{cage.cageId || '-'}</td>
                                        <td className="p-1 text-right">{availBirds}</td>
                                        <td className="p-1 text-right">{Number(availWt).toFixed(2)}</td>
                                        <td className="p-1 text-right" onClick={e => e.stopPropagation()}>
                                          <input
                                            type="number"
                                            placeholder="0"
                                            value={cage.soldBirds}
                                             disabled={loading || isReadOnly}
                                            onChange={e => {
                                              const val = e.target.value
                                              const enteredBirds = parseInt(val) || 0
                                              if (enteredBirds > availBirds) {
                                                toast.error(`Cannot sell ${enteredBirds} birds. Only ${availBirds} available in cage ${cage.cageId}.`)
                                                return
                                              }
                                              // Auto-calculate proportional weight to sell
                                              const calculatedWt = enteredBirds === availBirds 
                                                ? availWt 
                                                : (avgWt * enteredBirds)
                                              
                                              const updatedList = purchaseCages.map(c => c.id === cage.id 
                                                ? { 
                                                    ...c, 
                                                    soldBirds: val, 
                                                    soldWeight: calculatedWt.toFixed(2),
                                                    weightLoss: '0.00' 
                                                  } 
                                                : c
                                              )
                                              setPurchaseCages(updatedList)
                                              if (selectedCageIds.has(cage.id)) {
                                                syncFormFromCagesList(selectedCageIds, updatedList)
                                              }
                                            }}
                                            className="w-16 text-right border rounded px-1 py-0.5 text-xs font-semibold disabled:bg-gray-50 disabled:border-gray-200"
                                          />
                                        </td>
                                        <td className="p-1 text-right" onClick={e => e.stopPropagation()}>
                                          <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={cage.soldWeight}
                                             disabled={loading || isReadOnly}
                                            onChange={e => {
                                              const val = e.target.value
                                              const enteredWt = parseFloat(val) || 0
                                              if (enteredWt > availWt) {
                                                toast.error(`Cannot sell ${enteredWt} kg. Only ${availWt.toFixed(2)} kg available in cage ${cage.cageId}.`)
                                                return
                                              }
                                              // Auto-calculate weight loss based on difference from expected weight
                                              const calculatedLoss = Math.max(0, expectedSoldWt - enteredWt)
                                              
                                              const updatedList = purchaseCages.map(c => c.id === cage.id 
                                                ? { 
                                                    ...c, 
                                                    soldWeight: val,
                                                    weightLoss: calculatedLoss.toFixed(2)
                                                  } 
                                                : c
                                              )
                                              setPurchaseCages(updatedList)
                                              if (selectedCageIds.has(cage.id)) {
                                                syncFormFromCagesList(selectedCageIds, updatedList)
                                              }
                                            }}
                                            className="w-20 text-right border rounded px-1 py-0.5 text-xs font-semibold disabled:bg-gray-50 disabled:border-gray-200"
                                          />
                                        </td>
                                        <td className="p-1 text-right" onClick={e => e.stopPropagation()}>
                                          <div className="flex flex-col items-end">
                                            <input
                                              type="number"
                                              step="0.01"
                                              placeholder="0.00"
                                              value={cage.weightLoss}
                                               disabled={loading || isReadOnly}
                                              onChange={e => {
                                                const val = e.target.value
                                                const updatedList = purchaseCages.map(c => c.id === cage.id ? { ...c, weightLoss: val } : c)
                                                setPurchaseCages(updatedList)
                                                if (selectedCageIds.has(cage.id)) {
                                                  syncFormFromCagesList(selectedCageIds, updatedList)
                                                }
                                              }}
                                              className={`w-16 text-right border rounded px-1 py-0.5 text-xs font-semibold disabled:bg-gray-50 disabled:border-gray-200 ${isHighLoss ? 'bg-red-100 border-red-400 text-red-700 animate-pulse' : ''}`}
                                            />
                                            {isHighLoss && (
                                              <span className="text-[9px] text-red-600 font-bold block mt-0.5" title={`Allowed loss: ${maxAllowed.toFixed(2)} kg`}>
                                                ⚠️ High Loss
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                                <tfoot>
                                  {(() => {
                                    const selCages = purchaseCages.filter(c => selectedCageIds.has(c.id!))
                                    const totalSoldBirds = selCages.reduce((s, c) => s + (parseInt(c.soldBirds) || 0), 0)
                                    const totalSoldWt = selCages.reduce((s, c) => s + (parseFloat(c.soldWeight) || 0), 0)
                                    const totalLossWt = selCages.reduce((s, c) => s + (parseFloat(c.weightLoss) || 0), 0)
                                    return (
                                      <tr className="border-t font-semibold bg-blue-100 sticky bottom-0">
                                        <td colSpan={2} className="p-1">{selectedCageIds.size} selected</td>
                                        <td colSpan={2} className="p-1 text-right">Totals:</td>
                                        <td className="p-1 text-right">{totalSoldBirds}</td>
                                        <td className="p-1 text-right">{totalSoldWt.toFixed(2)}</td>
                                        <td className="p-1 text-right">{totalLossWt.toFixed(2)}</td>
                                      </tr>
                                    )
                                  })()}
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label>Shop / Retailer *</Label>
                        <Select value={formData.retailerId || '__none__'} onValueChange={v => handleRetailerChange(v === '__none__' ? '' : v)} disabled={loading || isReadOnly}>
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
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={formData.phone} disabled className="bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={formData.address} disabled className="bg-gray-50" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sale Mode</Label>
                        <Select value={formData.saleMode} onValueChange={(v: any) => setFormData(f => ({ ...f, saleMode: v }))} disabled={loading || isReadOnly}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="from_vehicle">From Vehicle</SelectItem>
                            <SelectItem value="from_godown">From Godown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle</Label>
                        <Select value={formData.vehicleId || '__none__'} onValueChange={v => setFormData(f => ({ ...f, vehicleId: v === '__none__' ? '' : v }))} disabled={loading || isReadOnly}>
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
                        <Button type="button" variant="outline" size="sm" onClick={() => saleFileRef.current?.click()} disabled={loading || isReadOnly}><Paperclip size={14} className="mr-1" /> Choose File</Button>
                        {saleFile && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded"><span>{saleFile.name}</span>{!isReadOnly && <button onClick={() => setSaleFile(null)}><X size={12} /></button>}</div>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" disabled={loading || isReadOnly} />
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
                        <Input value={formData.customerName} onChange={e => setFormData(f => ({ ...f, customerName: e.target.value }))} placeholder="Customer name" disabled={loading || isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label>Rate per KG *</Label>
                        <Input type="number" step="0.01" value={formData.ratePerKg} onChange={e => setFormData(f => ({ ...f, ratePerKg: e.target.value }))} placeholder="e.g. 146" disabled={loading || isReadOnly} onWheel={(e) => e.currentTarget.blur()} />
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
                              const wt = parseFloat(cage.soldWeight) || 0
                              const amt = wt * rate
                              return (
                                <tr key={cage.id} className="border-b hover:bg-gray-50">
                                  <td className="p-1 font-medium text-xs">{cage.cageId || '-'}</td>
                                  <td className="p-1 text-center font-semibold">{cage.soldBirds}</td>
                                  <td className="p-1 text-center font-semibold">{wt.toFixed(2)}</td>
                                  <td className="p-1 text-right font-medium">{amt > 0 ? `₹${amt.toFixed(0)}` : '-'}</td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr className="border-b">
                              <td className="p-1 text-xs text-muted-foreground">-</td>
                              <td className="p-1">
                                <Input type="number" value={formData.numBirds} onChange={e => setFormData(f => ({ ...f, numBirds: e.target.value }))} placeholder="0" className="h-8 text-sm" disabled={loading || isReadOnly} onWheel={(e) => e.currentTarget.blur()} />
                              </td>
                              <td className="p-1">
                                <Input type="number" step="0.001" value={formData.totalWeight} onChange={e => setFormData(f => ({ ...f, totalWeight: e.target.value }))} placeholder="0.000" className="h-8 text-sm" disabled={loading || isReadOnly} onWheel={(e) => e.currentTarget.blur()} />
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
                    {/* Weight Loss & Bearable Limit Analysis Card */}
                    {selectedCageList.length > 0 && (
                      <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/50 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-orange-900 flex items-center gap-1.5">
                            ⚖️ Cage Weight Loss & Bearable Limit Analysis
                          </h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                            Limit: {bearableLossType === 'percentage' ? `${bearableLossValue}%` : `${bearableLossValue} kg`}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div className="space-y-1 bg-white p-2.5 rounded border border-orange-100 shadow-sm">
                            <span className="text-muted-foreground font-medium block">Total Weight Loss</span>
                            <span className="text-sm font-bold text-gray-900 block">{totalWeightLoss.toFixed(2)} kg</span>
                            <span className="text-[10px] text-gray-500 font-medium">Cost: ₹{totalWeightLossAmount.toFixed(2)}</span>
                          </div>
                          
                          <div className="space-y-1 bg-white p-2.5 rounded border border-orange-100 shadow-sm">
                            <span className="text-muted-foreground font-medium block">Bearable Limit</span>
                            <span className="text-sm font-bold text-green-700 block">{totalBearableLoss.toFixed(2)} kg</span>
                            <span className="text-[10px] text-green-600 font-medium">Cost: ₹{totalBearableLossAmount.toFixed(2)}</span>
                          </div>
                          
                          <div className={`space-y-1 p-2.5 rounded border shadow-sm ${netExcessLoss > 0.01 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-green-50 border-green-200 text-green-900'}`}>
                            <span className="text-muted-foreground font-medium block">Excess (Unbearable) Loss</span>
                            <span className={`text-sm font-bold block ${netExcessLoss > 0.01 ? 'text-red-700' : 'text-green-700'}`}>{netExcessLoss.toFixed(2)} kg</span>
                            <span className="text-[10px] font-medium">Cost: ₹{netExcessLossAmount.toFixed(2)}</span>
                          </div>
                        </div>

                        {netExcessLoss > 0.01 ? (
                          <div className="text-xs bg-red-100/80 border border-red-200 text-red-900 rounded p-2 flex items-start gap-1.5">
                            <span className="text-sm">⚠️</span>
                            <div>
                              <p className="font-bold">Excess weight loss detected!</p>
                              <p className="text-red-800 text-[11px] mt-0.5">
                                The cages have lost <strong className="font-semibold">{totalWeightLoss.toFixed(2)} kg</strong> which exceeds your bearable limit of <strong className="font-semibold">{totalBearableLoss.toFixed(2)} kg</strong> by <strong className="font-semibold">{netExcessLoss.toFixed(2)} kg</strong> (Value: <strong className="font-semibold">₹{netExcessLossAmount.toFixed(0)}</strong>). You should consider adjusting the bill or deducting this amount from the farmer/transporter.
                              </p>
                            </div>
                          </div>
                        ) : totalWeightLoss > 0.01 ? (
                          <div className="text-xs bg-green-100/80 border border-green-200 text-green-900 rounded p-2 flex items-start gap-1.5">
                            <span className="text-sm">✅</span>
                            <div>
                              <p className="font-bold">Weight loss is within bearable limit.</p>
                              <p className="text-green-800 text-[11px] mt-0.5">
                                Total weight loss of <strong className="font-semibold">{totalWeightLoss.toFixed(2)} kg</strong> is fully within your acceptable threshold of <strong className="font-semibold">{totalBearableLoss.toFixed(2)} kg</strong>.
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

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
                      <Select value={formData.paymentStatus} onValueChange={(v: any) => setFormData(f => ({ ...f, paymentStatus: v }))} disabled={loading || isReadOnly}>
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
                          <Select value={p.mode} onValueChange={v => updatePayment(i, "mode", v)} disabled={loading || isReadOnly}>
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
                            <Input type="number" step="0.01" placeholder="0.00" value={p.amount} onChange={e => updatePayment(i, "amount", e.target.value)} disabled={loading || isReadOnly} onWheel={(e) => e.currentTarget.blur()} />
                            {payments.length > 1 && !isReadOnly && <Button type="button" variant="ghost" size="sm" onClick={() => removePayment(i)} className="px-2 text-red-500"><X size={14} /></Button>}
                          </div>
                        </div>
                      ))}
                      {!isReadOnly && <Button type="button" variant="outline" size="sm" onClick={addPayment} disabled={loading}><Plus size={14} className="mr-1" /> Add Payment Mode</Button>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-2"><Label>Total Received (₹)</Label><Input value={`₹${totalPaymentMade.toFixed(2)}`} disabled className="bg-gray-50 font-semibold text-green-700" /></div>
                      <div className="space-y-2"><Label>Balance (₹)</Label><Input value={`₹${balance.toFixed(2)}`} disabled className="bg-gray-50 font-semibold text-red-600" /></div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  {isReadOnly ? (
                    <Button onClick={() => setShowDialog(false)} className="bg-blue-600 hover:bg-blue-700">Close</Button>
                  ) : (
                    <>
                      {!editingId && formData.invoiceNumber ? (
                        <Button variant="outline" onClick={() => { resetForm(); setShowDialog(false) }} disabled={loading}>Close</Button>
                      ) : (
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>Cancel</Button>
                      )}
                      <Button onClick={handleSave} disabled={loading || uploadingFile} className="bg-green-600 hover:bg-green-700">
                        {loading || uploadingFile ? "Saving..." : editingId ? "Update Sale" : "Create Sale"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mini Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">

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
                Total Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {Number((stats as any).totalWeight ?? 0).toFixed(0)} kg
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Layers size={14} className="text-cyan-600" />
                Total Birds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">
                {stats.totalBirds.toLocaleString("en-IN")}
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
                      <TableHead className="font-bold">Purchase Bill</TableHead>
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold">Customer</TableHead>
                      <TableHead className="font-bold">Mode</TableHead>
                      <TableHead className="font-bold">Birds</TableHead>
                      <TableHead className="font-bold">Weight</TableHead>
                      <TableHead className="font-bold text-orange-800">Loss / Adj</TableHead>
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
                        <TableCell>{(s as any).purchaseBillNo || '-'}</TableCell>
                        <TableCell>{new Date(s.saleDate).toLocaleDateString()}</TableCell>
                        <TableCell>{s.customerName}</TableCell>
                        <TableCell><span className="text-xs px-2 py-0.5 rounded bg-gray-100">{s.saleMode === 'from_vehicle' ? 'Vehicle' : 'Godown'}</span></TableCell>
                        <TableCell className="font-medium">
                          {(() => {
                            if ((s as any).numberOfBirds && Number((s as any).numberOfBirds) > 0) {
                              return (s as any).numberOfBirds
                            }
                            try {
                              const parsed = JSON.parse(s.notes || "")
                              if (parsed?.weightLoss?.totalBirds) {
                                return parsed.weightLoss.totalBirds
                              }
                              if (parsed?.customerRows?.[0]?.numBirds) {
                                return parsed.customerRows[0].numBirds
                              }
                            } catch {}
                            return '-'
                          })()}
                        </TableCell>
                        <TableCell>{Number(s.quantity || 0).toFixed(2)} kg</TableCell>
                        <TableCell>
                          {(() => {
                            const details = parseWeightLossDetails(s.notes || "")
                            if (!details || details.totalWeightLoss <= 0.01) {
                              return <span className="text-muted-foreground text-xs">-</span>
                            }
                            return (
                              <div className="text-xs space-y-0.5">
                                <div className="font-medium text-gray-700">Loss: {details.totalWeightLoss.toFixed(2)} kg</div>
                                {details.netExcessLoss > 0.01 ? (
                                  <div className="text-[10px] text-red-700 font-bold bg-red-50 border border-red-100 rounded px-1.5 py-0.2 w-fit">
                                    Adj: -₹{details.netExcessLossAmount.toFixed(0)} ({details.netExcessLoss.toFixed(2)} kg)
                                  </div>
                                ) : (
                                  <div className="text-[9px] text-green-700 font-semibold bg-green-50 px-1 py-0.2 rounded w-fit">Within Limit</div>
                                )}
                              </div>
                            )
                          })()}
                        </TableCell>
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
                              <Button variant="ghost" size="sm" onClick={() => handlePrintSale(s)}><Printer size={14} /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Edit2 size={14} /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 size={14} /></Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handlePrintSale(s)}><Printer size={14} /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleView(s)}><Eye size={14} /></Button>
                            </div>
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
