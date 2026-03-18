"use client"

// Payment status update fix deployed - 2026-03-04
import { useState, useEffect, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Download, Printer, Eye, Columns, Paperclip, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { purchasesApi, farmersApi, vehiclesApi, type PurchaseOrder as ApiPurchaseOrder, type Farmer, type Vehicle } from "@/lib/api"
import { toast } from "sonner"

// All available columns definition
const ALL_COLUMNS = [
  { key: "orderNumber", label: "Order #" },
  { key: "supplierName", label: "Supplier" },
  { key: "orderDate", label: "Order Date" },
  { key: "dueDate", label: "Due Date" },
  { key: "branch", label: "Branch/Unit" },
  { key: "farmerMobile", label: "Farmer Mobile" },
  { key: "vehicleId", label: "Vehicle No" },
  { key: "birdType", label: "Bird Type" },
  { key: "totalWeight", label: "Total Weight" },
  { key: "ratePerKg", label: "Rate/Kg" },
  { key: "totalAmount", label: "Bird Amount" },
  { key: "transportCharges", label: "Transport Charges" },
  { key: "loadingCharges", label: "Loading Charges" },
  { key: "commission", label: "Commission" },
  { key: "grossAmount", label: "Gross Amount" },
  { key: "netAmount", label: "Net Amount" },
  { key: "purchasePaymentStatus", label: "Payment Status" },
  { key: "advancePaid", label: "Advance Paid" },
  { key: "balanceAmount", label: "Balance Amount" },
  { key: "actions", label: "Actions" },
]

const DEFAULT_VISIBLE = ["orderNumber", "supplierName", "orderDate", "dueDate", "totalAmount", "grossAmount", "netAmount", "purchasePaymentStatus", "actions"]

const STORAGE_KEY = "purchases_visible_columns"

function getVisibleColumns(): string[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULT_VISIBLE
}


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
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  // Invoice view modal
  const [viewingPurchase, setViewingPurchase] = useState<ApiPurchaseOrder | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const columnPickerRef = useRef<HTMLDivElement>(null)
  // File upload
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
    unit: "",
    gstin: "",
    liftingTime: "",
    partyCode: "",
    prNumber: "",
    hsnCode: "0105",
    farmerId: "",
    farmerMobile: "",
    farmLocation: "",
    vehicleId: "",
    purchasePaymentStatus: "pending" as "paid" | "pending" | "partial",
    birdType: "",
    cages: [{ cageId: "", numberOfBirds: "", cageWeight: "" }],
    ratePerKg: "",
    transportCharges: "",
    loadingCharges: "",
    commission: "",
    otherCharges: "",
    weightShortage: "",
    mortalityDeduction: "",
    otherDeduction: "",
    advancePaid: "",
    paymentMode: "",
    totalPaymentMade: "",
    notes: "",
    items: [{ itemName: "", quantity: "", unit: "", unitPrice: "" }],
  })


  useEffect(() => {
    setMounted(true)
    setVisibleColumns(getVisibleColumns())
    fetchPurchases()
    fetchInvoiceList()
    fetchFarmers()
    fetchVehicles()
  }, [])

  // Close column picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const data = await purchasesApi.getAll()
      if (Array.isArray(data)) setPurchases(data)
      else { setPurchases([]); toast.error("Invalid data format received") }
    } catch (error: any) {
      console.error("Failed to fetch purchases:", error)
      setPurchases([])
      toast.error("Failed to load purchases")
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoiceList = async () => {
    try {
      const data = await purchasesApi.getInvoiceList()
      setInvoiceList(Array.isArray(data) ? data : [])
    } catch { setInvoiceList([]) }
  }

  const fetchFarmers = async () => {
    try {
      const data = await farmersApi.getActive()
      setFarmers(Array.isArray(data) ? (data as Farmer[]) : [])
    } catch { setFarmers([]) }
  }

  const fetchVehicles = async () => {
    try {
      const data = await vehiclesApi.getAll()
      setVehicles(Array.isArray(data) ? data : [])
    } catch { setVehicles([]) }
  }

  const resetForm = () => {
    setFormData({
      orderNumber: "", supplierName: "",
      orderDate: new Date().toISOString().split("T")[0],
      dueDate: "", status: "pending",
      branch: "", unit: "", gstin: "", liftingTime: "", partyCode: "", prNumber: "", hsnCode: "0105",
      farmerId: "", farmerMobile: "", farmLocation: "", vehicleId: "",
      purchasePaymentStatus: "pending", birdType: "",
      cages: [{ cageId: "", numberOfBirds: "", cageWeight: "" }],
      ratePerKg: "", transportCharges: "", loadingCharges: "", commission: "", otherCharges: "",
      weightShortage: "", mortalityDeduction: "", otherDeduction: "",
      advancePaid: "", paymentMode: "", totalPaymentMade: "", notes: "",
      items: [{ itemName: "", quantity: "", unit: "", unitPrice: "" }],
    })
    setEditingId(null)
    setInvoiceFile(null)
  }

  const handleFarmerChange = (farmerId: string) => {
    const selectedFarmer = farmers.find(f => f.id === farmerId)
    if (selectedFarmer) {
      setFormData({ ...formData, farmerId, supplierName: selectedFarmer.name, farmerMobile: selectedFarmer.phone || "", farmLocation: selectedFarmer.address || "" })
    }
  }

  const handleInvoiceSelect = async (invoiceId: string) => {
    if (!invoiceId) return
    try {
      setLoading(true)
      const purchase = await purchasesApi.getOne(invoiceId)
      handleEdit(purchase)
    } catch { toast.error("Failed to load invoice") }
    finally { setLoading(false) }
  }

  const addCage = () => setFormData({ ...formData, cages: [...formData.cages, { cageId: "", numberOfBirds: "", cageWeight: "" }] })
  const removeCage = (index: number) => setFormData({ ...formData, cages: formData.cages.filter((_, i) => i !== index) })
  const updateCage = (index: number, field: string, value: string) => {
    const newCages = [...formData.cages]
    newCages[index] = { ...newCages[index], [field]: value }
    setFormData({ ...formData, cages: newCages })
  }

  const calculateTotalWeight = () => formData.cages.reduce((sum, cage) => sum + (parseFloat(cage.cageWeight) || 0), 0)
  const calculateTotalAmountFromWeight = () => calculateTotalWeight() * (parseFloat(formData.ratePerKg) || 0)
  const calculateCharges = () => (parseFloat(formData.transportCharges) || 0) + (parseFloat(formData.loadingCharges) || 0) + (parseFloat(formData.commission) || 0) + (parseFloat(formData.otherCharges) || 0)
  const calculateDeductions = () => (parseFloat(formData.weightShortage) || 0) + (parseFloat(formData.mortalityDeduction) || 0) + (parseFloat(formData.otherDeduction) || 0)
  const calculateGrossAmount = () => calculateTotalAmountFromWeight() + calculateCharges()
  const calculateNetAmount = () => calculateGrossAmount() - calculateDeductions()
  const calculateOutstandingPayment = () => Math.max(0, calculateNetAmount() - (parseFloat(formData.advancePaid) || 0))
  const calculateBalanceAmount = () => Math.max(0, calculateNetAmount() - (parseFloat(formData.totalPaymentMade) || 0))


  const handleEdit = (purchase: ApiPurchaseOrder) => {
    setFormData({
      orderNumber: purchase.orderNumber,
      supplierName: purchase.supplierName,
      orderDate: purchase.orderDate,
      dueDate: purchase.dueDate || "",
      status: purchase.status,
      branch: (purchase as any).branch || "",
      unit: (purchase as any).unit || "",
      gstin: (purchase as any).gstin || "",
      liftingTime: (purchase as any).liftingTime || "",
      partyCode: (purchase as any).partyCode || "",
      prNumber: (purchase as any).prNumber || "",
      hsnCode: (purchase as any).hsnCode || "0105",
      farmerId: purchase.farmerId || "",
      farmerMobile: purchase.farmerMobile || "",
      farmLocation: purchase.farmLocation || "",
      vehicleId: purchase.vehicleId || "",
      purchasePaymentStatus: purchase.purchasePaymentStatus || "pending",
      birdType: purchase.birdType || "",
      cages: purchase.cages && purchase.cages.length > 0
        ? purchase.cages.map(cage => ({ cageId: cage.cageId || "", numberOfBirds: String(cage.numberOfBirds), cageWeight: String(cage.cageWeight) }))
        : [{ cageId: "", numberOfBirds: "", cageWeight: "" }],
      ratePerKg: String(purchase.ratePerKg || ""),
      transportCharges: String(purchase.transportCharges || ""),
      loadingCharges: String(purchase.loadingCharges || ""),
      commission: String(purchase.commission || ""),
      otherCharges: String(purchase.otherCharges || ""),
      weightShortage: String(purchase.weightShortage || ""),
      mortalityDeduction: String(purchase.mortalityDeduction || ""),
      otherDeduction: String(purchase.otherDeduction || ""),
      advancePaid: String(purchase.advancePaid || ""),
      paymentMode: purchase.paymentMode || "",
      totalPaymentMade: String(purchase.totalPaymentMade || ""),
      notes: purchase.notes || "",
      items: purchase.items && Array.isArray(purchase.items) && purchase.items.length > 0
        ? purchase.items.map(item => ({ itemName: item.itemName, quantity: String(item.quantity), unit: item.unit, unitPrice: String(item.unitPrice) }))
        : [{ itemName: "", quantity: "", unit: "", unitPrice: "" }],
    })
    setEditingId(purchase.id)
    setInvoiceFile(null)
    setShowDialog(true)
  }

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { itemName: "", quantity: "", unit: "", unitPrice: "" }] })
  const removeItem = (index: number) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })
  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const handleSave = async () => {
    if (!formData.orderNumber || !formData.supplierName) {
      toast.error("Please fill all required fields")
      return
    }
    try {
      setLoading(true)
      const items = formData.items
        .filter(item => item.itemName && item.quantity && item.unit && item.unitPrice)
        .map(item => ({ description: item.itemName, quantity: item.quantity, unit: item.unit, unitCost: item.unitPrice }))
      const cages = formData.cages
        .filter(cage => cage.cageId && cage.numberOfBirds && cage.cageWeight)
        .map(cage => ({ cageId: cage.cageId, birdType: formData.birdType, numberOfBirds: parseInt(cage.numberOfBirds) || 0, cageWeight: parseFloat(cage.cageWeight) || 0 }))

      const purchaseData: any = {
        orderNumber: formData.orderNumber, supplierName: formData.supplierName,
        orderDate: formData.orderDate, dueDate: formData.dueDate || undefined,
        status: formData.status,
        branch: formData.branch || undefined, unit: formData.unit || undefined,
        gstin: formData.gstin || undefined, liftingTime: formData.liftingTime || undefined,
        partyCode: formData.partyCode || undefined, prNumber: formData.prNumber || undefined,
        hsnCode: formData.hsnCode || "0105",
        farmerId: formData.farmerId || undefined, farmerMobile: formData.farmerMobile || undefined,
        farmLocation: formData.farmLocation || undefined, vehicleId: formData.vehicleId || undefined,
        birdType: formData.birdType || undefined,
        totalWeight: calculateTotalWeight().toString(),
        ratePerKg: formData.ratePerKg || undefined,
        transportCharges: formData.transportCharges || undefined, loadingCharges: formData.loadingCharges || undefined,
        commission: formData.commission || undefined, otherCharges: formData.otherCharges || undefined,
        weightShortage: formData.weightShortage || undefined, mortalityDeduction: formData.mortalityDeduction || undefined,
        otherDeduction: formData.otherDeduction || undefined,
        purchasePaymentStatus: formData.purchasePaymentStatus,
        advancePaid: formData.advancePaid || undefined, paymentMode: formData.paymentMode || undefined,
        totalPaymentMade: formData.totalPaymentMade || undefined,
        notes: formData.notes, items,
      }
      if (!editingId && cages.length > 0) purchaseData.cages = cages

      let savedOrder: ApiPurchaseOrder
      if (editingId) {
        savedOrder = await purchasesApi.update(editingId, purchaseData)
        toast.success("Purchase order updated successfully")
      } else {
        savedOrder = await purchasesApi.create(purchaseData)
        toast.success("Purchase order created successfully")
      }

      // Upload file if selected
      if (invoiceFile && savedOrder?.id) {
        try {
          setUploadingFile(true)
          await purchasesApi.uploadInvoice(savedOrder.id, invoiceFile)
          toast.success("Invoice attachment uploaded")
        } catch (err: any) {
          toast.error("Order saved but file upload failed: " + err.message)
        } finally {
          setUploadingFile(false)
        }
      }

      await fetchPurchases()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save purchase:", error)
      toast.error(error.message || "Failed to save purchase order")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) return
    try {
      setLoading(true)
      await purchasesApi.delete(id)
      toast.success("Purchase order deleted successfully")
      await fetchPurchases()
    } catch { toast.error("Failed to delete purchase order") }
    finally { setLoading(false) }
  }

  const handleViewInvoice = (purchase: ApiPurchaseOrder) => {
    setViewingPurchase(purchase)
    setShowInvoiceModal(true)
  }

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const toggleColumn = (key: string) => {
    const updated = visibleColumns.includes(key)
      ? visibleColumns.filter(c => c !== key)
      : [...visibleColumns, key]
    setVisibleColumns(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Bulk cage entry modal
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkTab, setBulkTab] = useState<"spreadsheet" | "paste">("spreadsheet")
  // Spreadsheet rows (local to modal, applied on confirm)
  const [sheetRows, setSheetRows] = useState<Array<{ cageId: string; numberOfBirds: string; cageWeight: string }>>([])
  const [pasteText, setPasteText] = useState("")
  const [pasteError, setPasteError] = useState("")

  const openBulkModal = () => {
    // Pre-fill spreadsheet with existing cages
    setSheetRows(formData.cages.map(c => ({ ...c })))
    setPasteText("")
    setPasteError("")
    setBulkTab("spreadsheet")
    setShowBulkModal(true)
  }

  const updateSheetRow = (i: number, field: string, value: string) => {
    const rows = [...sheetRows]
    rows[i] = { ...rows[i], [field]: value }
    // Auto-add new row when typing in last row
    if (i === rows.length - 1 && value !== "") {
      rows.push({ cageId: "", numberOfBirds: "", cageWeight: "" })
    }
    setSheetRows(rows)
  }

  const removeSheetRow = (i: number) => {
    if (sheetRows.length <= 1) return
    setSheetRows(sheetRows.filter((_, idx) => idx !== i))
  }

  const parsePasteText = () => {
    setPasteError("")
    const lines = pasteText.trim().split("\n").filter(l => l.trim())
    const parsed: Array<{ cageId: string; numberOfBirds: string; cageWeight: string }> = []
    for (const line of lines) {
      // Skip header line if it contains text like "CageID"
      if (/[a-zA-Z]{3,}/.test(line.split(",")[0])) continue
      const parts = line.split(/[,\t]/).map(p => p.trim())
      if (parts.length < 2) { setPasteError(`Could not parse line: "${line}"`); return }
      parsed.push({
        cageId: parts[0] || "",
        numberOfBirds: parts[1] || "",
        cageWeight: parts[2] || "",
      })
    }
    if (parsed.length === 0) { setPasteError("No valid rows found. Format: CageID, Birds, Weight"); return }
    setSheetRows(parsed)
    setBulkTab("spreadsheet")
  }

  const applyBulkCages = () => {
    const valid = sheetRows.filter(r => r.numberOfBirds || r.cageWeight)
    if (valid.length === 0) { setShowBulkModal(false); return }
    setFormData(prev => ({ ...prev, cages: valid.length > 0 ? valid : [{ cageId: "", numberOfBirds: "", cageWeight: "" }] }))
    setShowBulkModal(false)
  }


  const stats = useMemo(() => {
    const totalPurchases = purchases.length
    const totalBirds = purchases.reduce((sum, p) => {
      const fromCages = (p.cages || []).reduce((s, c) => s + Number(c.numberOfBirds || 0), 0)
      const fromItems = p.items.reduce((s, i) => s + Number(i.quantity || 0), 0)
      return sum + (fromCages > 0 ? fromCages : fromItems)
    }, 0)
    const totalValue = purchases.reduce((sum, p) => sum + Number(p.netAmount || p.totalAmount), 0)
    const totalPaymentMade = purchases.reduce((sum, p) => sum + Number(p.totalPaymentMade || 0), 0)
    return { totalPurchases, totalBirds, totalValue, totalPaymentMade }
  }, [purchases])

  const filteredPurchases = useMemo(() => {
    if (!Array.isArray(purchases)) return []
    let filtered = [...purchases]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(p => p.orderNumber.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q))
    }
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart); start.setHours(0, 0, 0, 0)
      const end = new Date(dateRangeEnd); end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(p => { const d = new Date(p.orderDate); d.setHours(0,0,0,0); return d >= start && d <= end })
    }
    return filtered
  }, [purchases, searchQuery, dateRangeStart, dateRangeEnd])

  const handleDownloadPDF = () => {
    const printContent = `<!DOCTYPE html><html><head><title>Purchase Orders Report</title>
      <style>body{font-family:Arial,sans-serif;margin:20px}h1{text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f2f2f2}</style>
      </head><body><h1>Purchase Orders Report</h1>
      <div><strong>Total:</strong> ${stats.totalPurchases} | <strong>Value:</strong> ₹${stats.totalValue.toFixed(2)} | <strong>Generated:</strong> ${new Date().toLocaleString()}</div>
      <table><thead><tr><th>Order #</th><th>Supplier</th><th>Order Date</th><th>Bird Amount</th><th>Net Amount</th><th>Status</th></tr></thead>
      <tbody>${filteredPurchases.map(p => `<tr><td>${p.orderNumber}</td><td>${p.supplierName}</td><td>${new Date(p.orderDate).toLocaleDateString()}</td><td>₹${Number(p.totalAmount).toFixed(2)}</td><td>₹${Number(p.netAmount||p.totalAmount).toFixed(2)}</td><td>${p.purchasePaymentStatus}</td></tr>`).join('')}</tbody>
      </table></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(printContent); w.document.close(); w.onload = () => w.print() }
  }

  if (!mounted) return null

  // Inline searchable farmer picker
  function FarmerSearch({ farmers, value, onChange, disabled }: { farmers: Farmer[]; value: string; onChange: (id: string) => void; disabled?: boolean }) {
    const [query, setQuery] = useState("")
    const [open, setOpen] = useState(false)
    const selected = farmers.find(f => f.id === value)
    const filtered = farmers.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    return (
      <div className="relative">
        <Input
          value={open ? query : (selected?.name || "")}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setQuery(""); setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={`Search farmer (${farmers.length} available)`}
          disabled={disabled}
        />
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <div className="px-3 py-2 text-sm text-muted-foreground">No farmers found</div>
              : filtered.map(f => (
                <div key={f.id} className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                  onMouseDown={() => { onChange(f.id); setOpen(false); setQuery("") }}>
                  {f.name}
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }


  // Invoice Print Modal component
  function InvoiceViewModal({ purchase, onClose }: { purchase: ApiPurchaseOrder; onClose: () => void }) {
    const totalBirds = purchase.cages?.reduce((s, c) => s + Number(c.numberOfBirds), 0) || 0
    const totalKgs = purchase.cages?.reduce((s, c) => s + Number(c.cageWeight), 0) || Number(purchase.totalWeight) || 0
    const avgWt = totalBirds > 0 ? (totalKgs / totalBirds).toFixed(3) : "0.000"
    const birdAmount = totalKgs * Number(purchase.ratePerKg || 0)
    const vehicle = vehicles.find(v => v.id === purchase.vehicleId)
    const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'https://chickenbackend.onrender.com'

    const handlePrint = () => {
      const el = document.getElementById("invoice-print-area")
      if (!el) return
      const w = window.open("", "_blank")
      if (!w) return
      w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${purchase.orderNumber}</title>
        <style>
          body{font-family:Arial,sans-serif;margin:20px;font-size:12px}
          .header{text-align:center;margin-bottom:10px}
          .header h2{margin:0;font-size:18px}
          .header p{margin:2px 0;font-size:11px}
          .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:10px 0;font-size:11px}
          table{width:100%;border-collapse:collapse;margin:10px 0}
          th,td{border:1px solid #333;padding:4px 6px;text-align:left;font-size:11px}
          th{background:#f0f0f0;font-weight:bold}
          .totals{margin-top:10px;font-size:11px}
          .totals table td{border:none;padding:2px 6px}
          .sig{display:flex;justify-content:space-between;margin-top:40px;font-size:11px}
          @media print{body{margin:10px}}
        </style>
      </head><body>${el.innerHTML}</body></html>`)
      w.document.close()
      w.onload = () => w.print()
    }

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice View — {purchase.orderNumber}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer size={14} className="mr-1" /> Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div id="invoice-print-area" className="p-4 border rounded bg-white text-sm">
            {/* Company Header */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">AZIZ POULTRY</h2>
              <p className="text-xs text-gray-600">Bill of Supply / Purchase Challan</p>
              {(purchase as any).gstin && <p className="text-xs">GSTIN: {(purchase as any).gstin}</p>}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs mb-4 border p-3 rounded">
              <div><span className="font-semibold">Bill No:</span> {purchase.orderNumber}</div>
              <div><span className="font-semibold">Date:</span> {new Date(purchase.orderDate).toLocaleDateString('en-IN')}</div>
              {(purchase as any).branch && <div><span className="font-semibold">Branch:</span> {(purchase as any).branch}</div>}
              {(purchase as any).unit && <div><span className="font-semibold">Unit:</span> {(purchase as any).unit}</div>}
              <div><span className="font-semibold">Supplied To:</span> {purchase.supplierName}</div>
              {vehicle && <div><span className="font-semibold">Vehicle:</span> {vehicle.vehicleNumber}</div>}
              {purchase.farmLocation && <div className="col-span-2"><span className="font-semibold">Address:</span> {purchase.farmLocation}</div>}
              {purchase.farmerMobile && <div><span className="font-semibold">Mobile:</span> {purchase.farmerMobile}</div>}
              {(purchase as any).liftingTime && <div><span className="font-semibold">Lifting Time:</span> {(purchase as any).liftingTime}</div>}
              {(purchase as any).partyCode && <div><span className="font-semibold">Party Code:</span> {(purchase as any).partyCode}</div>}
            </div>

            {/* Cage Table */}
            {purchase.cages && purchase.cages.length > 0 && (
              <table className="w-full border-collapse mb-4 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-2 py-1">S.N.</th>
                    <th className="border border-gray-400 px-2 py-1">Cage ID</th>
                    <th className="border border-gray-400 px-2 py-1">Birds</th>
                    <th className="border border-gray-400 px-2 py-1">Kgs</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.cages.map((cage, i) => (
                    <tr key={i}>
                      <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                      <td className="border border-gray-400 px-2 py-1">{cage.cageId || "-"}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right">{cage.numberOfBirds}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right">{Number(cage.cageWeight).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Totals */}
            <div className="border p-3 rounded text-xs space-y-1">
              <div className="grid grid-cols-2 gap-x-8">
                <div><span className="font-semibold">Total Birds:</span> {totalBirds}</div>
                <div><span className="font-semibold">Total Kgs:</span> {totalKgs.toFixed(2)}</div>
                <div><span className="font-semibold">Rate/Kg:</span> ₹{Number(purchase.ratePerKg || 0).toFixed(2)}</div>
                <div><span className="font-semibold">Bird Amount:</span> ₹{birdAmount.toFixed(2)}</div>
                <div><span className="font-semibold">Avg Wt/Bird:</span> {avgWt} Kg</div>
                {(purchase as any).hsnCode && <div><span className="font-semibold">HSN Code:</span> {(purchase as any).hsnCode}</div>}
                {(purchase as any).prNumber && <div><span className="font-semibold">PR No:</span> {(purchase as any).prNumber}</div>}
              </div>
              <div className="border-t pt-2 mt-2 grid grid-cols-2 gap-x-8">
                {Number(purchase.transportCharges) > 0 && <div><span className="font-semibold">Transport:</span> ₹{Number(purchase.transportCharges).toFixed(2)}</div>}
                {Number(purchase.loadingCharges) > 0 && <div><span className="font-semibold">Loading:</span> ₹{Number(purchase.loadingCharges).toFixed(2)}</div>}
                {Number(purchase.commission) > 0 && <div><span className="font-semibold">Commission:</span> ₹{Number(purchase.commission).toFixed(2)}</div>}
                <div><span className="font-semibold">Gross Amount:</span> ₹{Number(purchase.grossAmount || purchase.totalAmount).toFixed(2)}</div>
                <div className="font-bold text-green-700"><span className="font-semibold">Net Amount:</span> ₹{Number(purchase.netAmount || purchase.totalAmount).toFixed(2)}</div>
              </div>
            </div>

            {/* Attached Invoice */}
            {purchase.invoiceAttachment && (
              <div className="mt-3 p-2 border rounded bg-blue-50 text-xs">
                <span className="font-semibold">Attached Invoice: </span>
                <a href={`${backendBase}${purchase.invoiceAttachment}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  View Attached Invoice
                </a>
              </div>
            )}

            {/* Signatures */}
            <div className="flex justify-between mt-10 text-xs">
              <div className="text-center"><div className="border-t border-gray-400 w-32 pt-1">Supplier Signature</div></div>
              <div className="text-center"><div className="border-t border-gray-400 w-32 pt-1">Authorized Signature</div></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage your purchase orders</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
                <p id="dialog-description" className="sr-only">{editingId ? "Edit purchase order details" : "Create a new purchase order"}</p>
              </DialogHeader>
              <div className="space-y-5">
                {/* Section 1: Header Information */}
                <Card className="border-blue-200 shadow-sm">
                  <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <CardTitle className="text-blue-900">Section 1: Header Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Purchase Invoice No. *</Label>
                        <Select
                          value={editingId || "new"}
                          onValueChange={(value) => { if (value === "new") resetForm(); else handleInvoiceSelect(value) }}
                          disabled={loading}
                        >
                          <SelectTrigger><SelectValue placeholder="Select existing or create new" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new"><span className="font-semibold text-green-600">+ Create New Invoice</span></SelectItem>
                            {Array.isArray(invoiceList) && invoiceList.map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id}>{invoice.orderNumber} - {invoice.supplierName} ({invoice.orderDate})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(!editingId || editingId === "new") && (
                          <div className="flex mt-2">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">PO-</span>
                            <Input value={formData.orderNumber.replace('PO-', '')} onChange={(e) => setFormData({ ...formData, orderNumber: 'PO-' + e.target.value })} placeholder="e.g. 001, 002" className="rounded-l-none" disabled={loading} />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <Label>Purchase Date *</Label>
                        <DatePicker value={formData.orderDate} onChange={(date) => setFormData({ ...formData, orderDate: date })} disabled={loading} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5"><Label>Branch</Label><Input value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} placeholder="Branch name" disabled={loading} /></div>
                      <div className="space-y-2.5"><Label>Unit</Label><Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="Unit name" disabled={loading} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5"><Label>GSTIN</Label><Input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} placeholder="GSTIN number" disabled={loading} /></div>
                      <div className="space-y-2.5"><Label>Lifting Time</Label><Input type="time" value={formData.liftingTime} onChange={(e) => setFormData({ ...formData, liftingTime: e.target.value })} disabled={loading} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2.5"><Label>Party Code</Label><Input value={formData.partyCode} onChange={(e) => setFormData({ ...formData, partyCode: e.target.value })} placeholder="Party code" disabled={loading} /></div>
                      <div className="space-y-2.5"><Label>P.R. No.</Label><Input value={formData.prNumber} onChange={(e) => setFormData({ ...formData, prNumber: e.target.value })} placeholder="PR number" disabled={loading} /></div>
                      <div className="space-y-2.5"><Label>HSN Code</Label><Input value={formData.hsnCode} onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })} placeholder="0105" disabled={loading} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label>Farmer Name *</Label>
                        <FarmerSearch farmers={farmers} value={formData.farmerId} onChange={handleFarmerChange} disabled={loading} />
                      </div>
                      <div className="space-y-2.5"><Label>Farmer Mobile</Label><Input value={formData.farmerMobile} placeholder="Auto-filled" disabled className="bg-gray-50" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5"><Label>Farm Location</Label><Input value={formData.farmLocation} placeholder="Auto-filled" disabled className="bg-gray-50" /></div>
                      <div className="space-y-2.5">
                        <Label>Vehicle No</Label>
                        <Select value={formData.vehicleId} onValueChange={(value) => setFormData({ ...formData, vehicleId: value })} disabled={loading}>
                          <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                          <SelectContent>{Array.isArray(vehicles) && vehicles.map((v) => (<SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label>Purchase Payment *</Label>
                      <Select value={formData.purchasePaymentStatus} onValueChange={(value: any) => setFormData({ ...formData, purchasePaymentStatus: value })} disabled={loading}>
                        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Handwritten Invoice Upload */}
                    <div className="space-y-2.5">
                      <Label>Attach Handwritten Invoice (PDF/JPG/PNG)</Label>
                      <div className="flex items-center gap-3">
                        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                          onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                          <Paperclip size={14} className="mr-1" /> Choose File
                        </Button>
                        {invoiceFile && (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded">
                            <Paperclip size={12} />
                            <span>{invoiceFile.name}</span>
                            <button onClick={() => setInvoiceFile(null)} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                          </div>
                        )}
                        {editingId && purchases.find(p => p.id === editingId)?.invoiceAttachment && !invoiceFile && (
                          <span className="text-xs text-blue-600">✓ Invoice already attached</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label>Notes</Label>
                      <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" rows={3} disabled={loading} />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Bird Details */}
                <Card className="border-green-200 shadow-sm">
                  <CardHeader className="bg-green-50 border-b border-green-100">
                    <CardTitle className="text-green-900">Section 2: Bird Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="space-y-2.5">
                      <Label>Bird Type</Label>
                      <Select value={formData.birdType} onValueChange={(value) => setFormData({ ...formData, birdType: value })} disabled={loading}>
                        <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select bird type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="broiler">Broiler</SelectItem>
                          <SelectItem value="layer">Layer</SelectItem>
                          <SelectItem value="desi">Desi</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="grid grid-cols-3 gap-6 flex-1">
                          <Label className="text-sm font-medium">Cage ID Number</Label>
                          <Label className="text-sm font-medium">Number of Birds</Label>
                          <Label className="text-sm font-medium">Cage Weight (Kg)</Label>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={openBulkModal} className="ml-4 text-blue-600 border-blue-300 hover:bg-blue-50 whitespace-nowrap">
                          ⚡ Bulk Entry
                        </Button>
                      </div>
                      {formData.cages.map((cage, index) => (
                        <div key={index} className="grid grid-cols-3 gap-6">
                          <Input placeholder="Cage ID" value={cage.cageId} onChange={(e) => updateCage(index, "cageId", e.target.value)} disabled={loading} className="h-10" />
                          <Input type="number" placeholder="Birds" value={cage.numberOfBirds} onChange={(e) => updateCage(index, "numberOfBirds", e.target.value)} disabled={loading} className="h-10" />
                          <div className="flex gap-1">
                            <Input type="number" step="0.01" placeholder="Weight" value={cage.cageWeight} onChange={(e) => updateCage(index, "cageWeight", e.target.value)} disabled={loading} className="h-10" />
                            {formData.cages.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCage(index)} className="h-10 px-2 text-red-500"><X size={14} /></Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addCage} disabled={loading} className="mt-2">
                        <Plus size={16} className="mr-1" /> Add More Cage
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5"><Label>Total Weight</Label><Input value={calculateTotalWeight().toFixed(2)} placeholder="Auto-calculated" disabled className="bg-gray-50" /></div>
                      <div className="space-y-2.5"><Label>Rate per Kg</Label><Input type="number" step="0.01" value={formData.ratePerKg} onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                    </div>
                    <div className="space-y-2.5">
                      <Label>Total Amount</Label>
                      <Input value={`₹${calculateTotalAmountFromWeight().toFixed(2)}`} placeholder="Auto-calculated" disabled className="bg-gray-50 text-lg font-semibold" />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Charges */}
                <Card className="border-orange-200 shadow-sm">
                  <CardHeader className="bg-orange-50 border-b border-orange-100">
                    <CardTitle className="text-orange-900">Section 3: Charges & Deductions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5"><Label>Transport Charges</Label><Input type="number" step="0.01" value={formData.transportCharges} onChange={(e) => setFormData({ ...formData, transportCharges: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                      <div className="space-y-2.5"><Label>Loading Charges</Label><Input type="number" step="0.01" value={formData.loadingCharges} onChange={(e) => setFormData({ ...formData, loadingCharges: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5"><Label>Commission</Label><Input type="number" step="0.01" value={formData.commission} onChange={(e) => setFormData({ ...formData, commission: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                      <div className="space-y-2.5"><Label>Other Charges</Label><Input type="number" step="0.01" value={formData.otherCharges} onChange={(e) => setFormData({ ...formData, otherCharges: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                    </div>
                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold mb-3 block">Deductions</Label>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2.5"><Label>Weight Shortage</Label><Input type="number" step="0.01" value={formData.weightShortage} onChange={(e) => setFormData({ ...formData, weightShortage: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                        <div className="space-y-2.5"><Label>Mortality Deduction</Label><Input type="number" step="0.01" value={formData.mortalityDeduction} onChange={(e) => setFormData({ ...formData, mortalityDeduction: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                        <div className="space-y-2.5"><Label>Other Deduction</Label><Input type="number" step="0.01" value={formData.otherDeduction} onChange={(e) => setFormData({ ...formData, otherDeduction: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 4: Payment */}
                <Card className="border-purple-200 shadow-sm">
                  <CardHeader className="bg-purple-50 border-b border-purple-100">
                    <CardTitle className="text-purple-900">Section 4: Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5"><Label>Total Invoice</Label><Input value={`₹${calculateNetAmount().toFixed(2)}`} disabled className="bg-gray-50" /></div>
                      <div className="space-y-2.5"><Label>Advance Paid</Label><Input type="number" step="0.01" value={formData.advancePaid} onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5"><Label>Outstanding Payment</Label><Input value={`₹${calculateOutstandingPayment().toFixed(2)}`} disabled className="bg-gray-50" /></div>
                      <div className="space-y-2.5">
                        <Label>Payment Mode</Label>
                        <Select value={formData.paymentMode} onValueChange={(value) => setFormData({ ...formData, paymentMode: value })} disabled={loading}>
                          <SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5"><Label>Total Payment Made</Label><Input type="number" step="0.01" value={formData.totalPaymentMade} onChange={(e) => setFormData({ ...formData, totalPaymentMade: e.target.value })} placeholder="0.00" disabled={loading} /></div>
                      <div className="space-y-2.5"><Label>Balance Amount</Label><Input value={`₹${calculateBalanceAmount().toFixed(2)}`} disabled className="bg-gray-50" /></div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>Cancel</Button>
                  <Button onClick={handleSave} disabled={loading || uploadingFile} className="bg-green-600 hover:bg-green-700">
                    {loading || uploadingFile ? "Saving..." : editingId ? "Update Purchase Order" : "Create Purchase Order"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases (no)</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.totalPurchases}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Birds Purchase (Qty)</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.totalBirds.toFixed(0)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Value (₹)</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">₹{stats.totalValue.toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Payment Made (₹)</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">₹{stats.totalPaymentMade.toFixed(2)}</div></CardContent></Card>
        </div>

        {/* Table Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <CardTitle>Purchase Orders List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all purchase orders</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter startDate={dateRangeStart} endDate={dateRangeEnd} onDateRangeChange={handleDateRangeChange} />
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Filter:</Label>
                  <Input placeholder="Search by invoice, farmer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-[220px]" />
                </div>
                {/* Column Visibility Toggle */}
                <div className="relative" ref={columnPickerRef}>
                  <Button variant="outline" size="sm" onClick={() => setShowColumnPicker(v => !v)}>
                    <Columns size={14} className="mr-1" /> Columns
                  </Button>
                  {showColumnPicker && (
                    <div className="absolute right-0 top-9 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-56 max-h-80 overflow-y-auto">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Toggle Columns</p>
                      {ALL_COLUMNS.map(col => (
                        <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-1 rounded text-sm">
                          <input type="checkbox" checked={visibleColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="rounded" />
                          {col.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}><Download className="mr-2" size={16} />Download PDF</Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}><Printer className="mr-2" size={16} />Print Report</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && purchases.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredPurchases.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || (dateRangeStart && dateRangeEnd) ? "No purchase orders match your filters" : "No purchase orders found"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.includes("orderNumber") && <TableHead>Order #</TableHead>}
                      {visibleColumns.includes("supplierName") && <TableHead>Supplier</TableHead>}
                      {visibleColumns.includes("orderDate") && <TableHead>Order Date</TableHead>}
                      {visibleColumns.includes("dueDate") && <TableHead>Due Date</TableHead>}
                      {visibleColumns.includes("branch") && <TableHead>Branch/Unit</TableHead>}
                      {visibleColumns.includes("farmerMobile") && <TableHead>Farmer Mobile</TableHead>}
                      {visibleColumns.includes("vehicleId") && <TableHead>Vehicle</TableHead>}
                      {visibleColumns.includes("birdType") && <TableHead>Bird Type</TableHead>}
                      {visibleColumns.includes("totalWeight") && <TableHead>Total Weight</TableHead>}
                      {visibleColumns.includes("ratePerKg") && <TableHead>Rate/Kg</TableHead>}
                      {visibleColumns.includes("totalAmount") && <TableHead>Bird Amount</TableHead>}
                      {visibleColumns.includes("transportCharges") && <TableHead>Transport</TableHead>}
                      {visibleColumns.includes("loadingCharges") && <TableHead>Loading</TableHead>}
                      {visibleColumns.includes("commission") && <TableHead>Commission</TableHead>}
                      {visibleColumns.includes("grossAmount") && <TableHead>Gross Amount</TableHead>}
                      {visibleColumns.includes("netAmount") && <TableHead>Net Amount</TableHead>}
                      {visibleColumns.includes("purchasePaymentStatus") && <TableHead>Payment Status</TableHead>}
                      {visibleColumns.includes("advancePaid") && <TableHead>Advance Paid</TableHead>}
                      {visibleColumns.includes("balanceAmount") && <TableHead>Balance</TableHead>}
                      {visibleColumns.includes("actions") && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => {
                      const veh = vehicles.find(v => v.id === purchase.vehicleId)
                      return (
                        <TableRow key={purchase.id}>
                          {visibleColumns.includes("orderNumber") && <TableCell>{purchase.orderNumber}</TableCell>}
                          {visibleColumns.includes("supplierName") && <TableCell>{purchase.supplierName}</TableCell>}
                          {visibleColumns.includes("orderDate") && <TableCell>{new Date(purchase.orderDate).toLocaleDateString()}</TableCell>}
                          {visibleColumns.includes("dueDate") && <TableCell>{purchase.dueDate ? new Date(purchase.dueDate).toLocaleDateString() : "-"}</TableCell>}
                          {visibleColumns.includes("branch") && <TableCell>{(purchase as any).branch || "-"}{(purchase as any).unit ? ` / ${(purchase as any).unit}` : ""}</TableCell>}
                          {visibleColumns.includes("farmerMobile") && <TableCell>{purchase.farmerMobile || "-"}</TableCell>}
                          {visibleColumns.includes("vehicleId") && <TableCell>{veh?.vehicleNumber || "-"}</TableCell>}
                          {visibleColumns.includes("birdType") && <TableCell>{purchase.birdType || "-"}</TableCell>}
                          {visibleColumns.includes("totalWeight") && <TableCell>{Number(purchase.totalWeight || 0).toFixed(2)} Kg</TableCell>}
                          {visibleColumns.includes("ratePerKg") && <TableCell>₹{Number(purchase.ratePerKg || 0).toFixed(2)}</TableCell>}
                          {visibleColumns.includes("totalAmount") && <TableCell>₹{Number(purchase.totalAmount).toFixed(2)}</TableCell>}
                          {visibleColumns.includes("transportCharges") && <TableCell>₹{Number(purchase.transportCharges || 0).toFixed(2)}</TableCell>}
                          {visibleColumns.includes("loadingCharges") && <TableCell>₹{Number(purchase.loadingCharges || 0).toFixed(2)}</TableCell>}
                          {visibleColumns.includes("commission") && <TableCell>₹{Number(purchase.commission || 0).toFixed(2)}</TableCell>}
                          {visibleColumns.includes("grossAmount") && <TableCell>₹{Number(purchase.grossAmount || purchase.totalAmount).toFixed(2)}</TableCell>}
                          {visibleColumns.includes("netAmount") && <TableCell className="font-semibold text-green-600">₹{Number(purchase.netAmount || purchase.totalAmount).toFixed(2)}</TableCell>}
                          {visibleColumns.includes("purchasePaymentStatus") && (
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${purchase.purchasePaymentStatus === "paid" ? "bg-green-100 text-green-800" : purchase.purchasePaymentStatus === "partial" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                                {purchase.purchasePaymentStatus}
                              </span>
                            </TableCell>
                          )}
                          {visibleColumns.includes("advancePaid") && <TableCell>₹{Number(purchase.advancePaid || 0).toFixed(2)}</TableCell>}
                          {visibleColumns.includes("balanceAmount") && <TableCell>₹{Number(purchase.balanceAmount || 0).toFixed(2)}</TableCell>}
                          {visibleColumns.includes("actions") && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" title="View Invoice" onClick={() => handleViewInvoice(purchase)}>
                                  <Eye size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" title="Edit" onClick={() => handleEdit(purchase)}>
                                  <Edit2 size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDelete(purchase.id)}>
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice View Modal */}
      {showInvoiceModal && viewingPurchase && (
        <InvoiceViewModal purchase={viewingPurchase} onClose={() => { setShowInvoiceModal(false); setViewingPurchase(null) }} />
      )}

      {/* Bulk Cage Entry Modal */}
      {showBulkModal && (
        <Dialog open={true} onOpenChange={() => setShowBulkModal(false)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Cage Entry</DialogTitle>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex border-b mb-4">
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${bulkTab === "spreadsheet" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                onClick={() => setBulkTab("spreadsheet")}
              >
                📊 Spreadsheet
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${bulkTab === "paste" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                onClick={() => setBulkTab("paste")}
              >
                📋 Paste Text
              </button>
            </div>

            {bulkTab === "spreadsheet" && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">Tab through cells to move quickly. A new row appears automatically when you start typing in the last row.</p>
                <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 mb-1">
                  <Label className="text-xs font-semibold text-gray-600">Cage ID</Label>
                  <Label className="text-xs font-semibold text-gray-600">Birds</Label>
                  <Label className="text-xs font-semibold text-gray-600">Weight (Kg)</Label>
                  <span />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {sheetRows.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center">
                      <Input
                        value={row.cageId}
                        onChange={(e) => updateSheetRow(i, "cageId", e.target.value)}
                        placeholder={`C${i + 1}`}
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        value={row.numberOfBirds}
                        onChange={(e) => updateSheetRow(i, "numberOfBirds", e.target.value)}
                        placeholder="Birds"
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={row.cageWeight}
                        onChange={(e) => updateSheetRow(i, "cageWeight", e.target.value)}
                        placeholder="Kg"
                        className="h-8 text-sm"
                      />
                      <button onClick={() => removeSheetRow(i)} className="text-red-400 hover:text-red-600 text-xs" title="Remove row">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setSheetRows(r => [...r, { cageId: "", numberOfBirds: "", cageWeight: "" }])} className="mt-1">
                  <Plus size={14} className="mr-1" /> Add Row
                </Button>
                <p className="text-xs text-gray-400 mt-2">{sheetRows.filter(r => r.numberOfBirds || r.cageWeight).length} cage(s) ready</p>
              </div>
            )}

            {bulkTab === "paste" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Paste data from Excel, WhatsApp, or type manually. One cage per line.</p>
                <div className="bg-gray-50 rounded p-2 text-xs text-gray-500 font-mono">
                  Format: CageID, Birds, Weight<br />
                  C1, 150, 45.5<br />
                  C2, 148, 44.2<br />
                  C3, 152, 46.0
                </div>
                <Textarea
                  value={pasteText}
                  onChange={(e) => { setPasteText(e.target.value); setPasteError("") }}
                  placeholder={"C1, 150, 45.5\nC2, 148, 44.2\nC3, 152, 46.0"}
                  rows={8}
                  className="font-mono text-sm"
                />
                {pasteError && <p className="text-xs text-red-500">{pasteError}</p>}
                <Button type="button" variant="outline" size="sm" onClick={parsePasteText} className="text-blue-600 border-blue-300">
                  Parse & Preview →
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowBulkModal(false)}>Cancel</Button>
              <Button onClick={applyBulkCages} className="bg-green-600 hover:bg-green-700">
                Apply {sheetRows.filter(r => r.numberOfBirds || r.cageWeight).length} Cage(s)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
}
