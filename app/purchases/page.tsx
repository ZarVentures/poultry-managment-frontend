"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Download, Printer, Eye, Paperclip, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { purchasesApi, farmersApi, vehiclesApi, type PurchaseOrder as ApiPurchaseOrder, type Farmer } from "@/lib/api"
import { toast } from "sonner"

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer"] as const
type PaymentMode = typeof PAYMENT_MODES[number]

interface PaymentRow { mode: PaymentMode; amount: string; isAdvance: boolean }
const emptyPayment = (): PaymentRow => ({ mode: "cash", amount: "", isAdvance: false })
const emptyCage = () => ({ cageId: "", numberOfBirds: "", cageWeight: "" })

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<ApiPurchaseOrder[]>([])
  const [invoiceList, setInvoiceList] = useState<Array<{ id: string; orderNumber: string; orderDate: string; supplierName: string }>>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>()
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("")
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>()
  const [viewingPurchase, setViewingPurchase] = useState<ApiPurchaseOrder | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    orderNumber: "",
    supplierName: "",
    orderDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "pending" as "pending" | "received" | "cancelled",
    branch: "",
    farmerId: "",
    farmerMobile: "",
    farmLocation: "",
    vehicleId: "",
    purchasePaymentStatus: "pending" as "paid" | "pending" | "partial",
    ratePerKg: "",
    transportCharges: "",
    otherCharges: "",
    notes: "",
  })
  const [cages, setCages] = useState([emptyCage()])
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()])

  useEffect(() => {
    setMounted(true)
    fetchPurchases()
    fetchInvoiceList()
    fetchFarmers()
    fetchVehicles()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const data = await purchasesApi.getAll()
      setPurchases(Array.isArray(data) ? data : [])
    } catch { toast.error("Failed to load purchases") }
    finally { setLoading(false) }
  }

  const fetchInvoiceList = async () => {
    try { setInvoiceList(Array.isArray(await purchasesApi.getInvoiceList()) ? await purchasesApi.getInvoiceList() : []) }
    catch { setInvoiceList([]) }
  }

  const fetchFarmers = async () => {
    try { setFarmers(Array.isArray(await farmersApi.getActive()) ? await farmersApi.getActive() as Farmer[] : []) }
    catch { setFarmers([]) }
  }

  const fetchVehicles = async () => {
    try { setVehicles(Array.isArray(await vehiclesApi.getAll()) ? await vehiclesApi.getAll() : []) }
    catch { setVehicles([]) }
  }

  const resetForm = () => {
    setFormData({
      orderNumber: "", supplierName: "",
      orderDate: new Date().toISOString().split("T")[0],
      dueDate: "", status: "pending", branch: "",
      farmerId: "", farmerMobile: "", farmLocation: "", vehicleId: "",
      purchasePaymentStatus: "pending", ratePerKg: "",
      transportCharges: "", otherCharges: "", notes: "",
    })
    setCages([emptyCage()])
    setPayments([emptyPayment()])
    setEditingId(null)
    setInvoiceFile(null)
  }

  const handleFarmerChange = (farmerId: string) => {
    const f = farmers.find(f => f.id === farmerId)
    if (f) setFormData(prev => ({ ...prev, farmerId, supplierName: f.name, farmerMobile: f.phone || "", farmLocation: f.address || "" }))
  }

  const handleEdit = async (purchase: ApiPurchaseOrder) => {
    // Fetch full detail to get cages and payments
    let full: ApiPurchaseOrder = purchase
    try {
      full = await purchasesApi.getOne(purchase.id)
    } catch { /* fallback to list data */ }

    setFormData({
      orderNumber: full.orderNumber,
      supplierName: full.supplierName,
      orderDate: full.orderDate,
      dueDate: full.dueDate || "",
      status: full.status,
      branch: (full as any).branch || "",
      farmerId: full.farmerId || "",
      farmerMobile: full.farmerMobile || "",
      farmLocation: full.farmLocation || "",
      vehicleId: full.vehicleId || "",
      purchasePaymentStatus: full.purchasePaymentStatus || "pending",
      ratePerKg: String(full.ratePerKg || ""),
      transportCharges: String(full.transportCharges || ""),
      otherCharges: String((full as any).otherCharges || ""),
      notes: full.notes || "",
    })
    setCages(full.cages && full.cages.length > 0
      ? full.cages.map(c => ({ cageId: c.cageId || "", numberOfBirds: String(c.numberOfBirds), cageWeight: String((c as any).purchaseWeight || c.cageWeight || "") }))
      : [emptyCage()])
    setPayments((full as any).payments && (full as any).payments.length > 0
      ? (full as any).payments.map((p: any) => ({ mode: p.paymentMode as PaymentMode, amount: String(p.amount), isAdvance: p.isAdvance ?? false }))
      : [emptyPayment()])
    setEditingId(full.id)
    setInvoiceFile(null)
    setShowDialog(true)
  }

  // Cage helpers
  const addCage = () => setCages(prev => [...prev, emptyCage()])
  const removeCage = (i: number) => setCages(prev => prev.filter((_, idx) => idx !== i))
  const updateCage = (i: number, field: string, value: string) => setCages(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))

  // Payment helpers
  const addPayment = () => setPayments(prev => [...prev, emptyPayment()])
  const removePayment = (i: number) => setPayments(prev => prev.filter((_, idx) => idx !== i))
  const updatePayment = (i: number, field: keyof PaymentRow, value: string | boolean) => setPayments(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))

  // Calculations
  const totalWeight = cages.reduce((s, c) => s + (parseFloat(c.cageWeight) || 0), 0)
  const totalAmount = totalWeight * (parseFloat(formData.ratePerKg) || 0)
  const transportCharges = parseFloat(formData.transportCharges) || 0
  const otherCharges = parseFloat(formData.otherCharges) || 0
  const grossAmount = totalAmount + transportCharges + otherCharges
  const netAmount = grossAmount
  const totalPaymentMade = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceAmount = Math.max(0, netAmount - totalPaymentMade)

  const handleSave = async () => {
    if (!formData.orderNumber || !formData.supplierName) {
      toast.error("Purchase Bill No and Supplier are required")
      return
    }
    try {
      setLoading(true)
      const validCages = cages.filter(c => c.numberOfBirds && c.cageWeight)
        .map(c => ({ cageId: c.cageId || undefined, numberOfBirds: parseInt(c.numberOfBirds) || 0, cageWeight: parseFloat(c.cageWeight) || 0 }))
      const validPayments = payments.filter(p => p.amount && parseFloat(p.amount) > 0)
        .map(p => ({ paymentMode: p.mode, amount: p.amount, isAdvance: p.isAdvance }))

      const payload: any = {
        orderNumber: formData.orderNumber,
        supplierName: formData.supplierName,
        orderDate: formData.orderDate,
        dueDate: formData.dueDate || undefined,
        status: formData.status,
        branch: formData.branch || undefined,
        farmerId: formData.farmerId || undefined,
        farmerMobile: formData.farmerMobile || undefined,
        farmLocation: formData.farmLocation || undefined,
        vehicleId: formData.vehicleId || undefined,
        totalWeight: String(totalWeight),
        ratePerKg: formData.ratePerKg || undefined,
        transportCharges: formData.transportCharges || undefined,
        otherCharges: formData.otherCharges || undefined,
        purchasePaymentStatus: formData.purchasePaymentStatus,
        notes: formData.notes || undefined,
        cages: validCages,
        payments: validPayments,
      }

      let saved: ApiPurchaseOrder
      if (editingId) {
        saved = await purchasesApi.update(editingId, payload)
        toast.success("Purchase order updated")
      } else {
        saved = await purchasesApi.create(payload)
        toast.success("Purchase order created")
      }

      if (invoiceFile && saved?.id) {
        try {
          setUploadingFile(true)
          await purchasesApi.uploadInvoice(saved.id, invoiceFile)
          toast.success("Invoice attachment uploaded")
        } catch { toast.error("Order saved but file upload failed") }
        finally { setUploadingFile(false) }
      }

      await fetchPurchases()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save purchase order")
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this purchase order?")) return
    try {
      setLoading(true)
      await purchasesApi.delete(id)
      toast.success("Deleted")
      await fetchPurchases()
    } catch { toast.error("Failed to delete") }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    let list = [...purchases]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => p.orderNumber.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q))
    }

    if (filterPaymentStatus) {
      list = list.filter(p => p.purchasePaymentStatus === filterPaymentStatus)
    }
    if (dateRangeStart && dateRangeEnd) {
      const s = new Date(dateRangeStart); s.setHours(0,0,0,0)
      const e = new Date(dateRangeEnd); e.setHours(23,59,59,999)
      list = list.filter(p => { const d = new Date(p.orderDate); return d >= s && d <= e })
    }
    return list
  }, [purchases, searchQuery, dateRangeStart,filterPaymentStatus, dateRangeEnd])


  const stats = useMemo(() => ({
    total: filtered.length,
    totalBirds: filtered.reduce((s, p) => s + (p.cages || []).reduce((cs, c) => cs + Number(c.numberOfBirds || 0), 0), 0),
    totalValue: filtered.reduce((s, p) => s + Number(p.netAmount || p.totalAmount || 0), 0),
    totalPaid: filtered.reduce((s, p) => s + Number(p.totalPaymentMade || 0), 0),
  }), [filtered])

