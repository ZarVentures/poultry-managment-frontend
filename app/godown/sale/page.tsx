"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, X, Printer } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { godownApi, retailersApi, purchasesApi, type GodownSale, type Retailer } from "@/lib/api"
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/api-base-url"

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "bank_transfer", "advance"] as const
type PaymentMode = typeof PAYMENT_MODES[number]
interface PaymentRow { mode: PaymentMode; amount: string }
const emptyPayment = (): PaymentRow => ({ mode: "cash", amount: "" })


export default function GodownSalePage() {
  const [sales, setSales] = useState<GodownSale[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])

  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [allowEditBillNo, setAllowEditBillNo] = useState(false)
  const [formData, setFormData] = useState({
    saleDate: new Date().toISOString().split("T")[0],
    purchaseBillNo: "",
    invoiceNumber: "",
    retailerId: "",
    customerName: "",
    numberOfBirds: "",
    totalWeight: "",
    ratePerKg: "",
    totalAmount: "",
    paymentStatus: "pending" as "paid" | "pending" | "partial",
    notes: "",
    weightLoss: "",
  })
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()])


  useEffect(() => {
    setMounted(true)
    fetchSales()
    fetchRetailers()
  }, [])
  const fetchSales = async () => {
    try {
      setLoading(true)
      const data = await godownApi.sales.getAll()
      setSales(data)
    } catch (error: any) {
      console.error("Failed to fetch sales:", error)
      toast.error("Failed to load sales")
    } finally {
      setLoading(false)
    }
  }

  const fetchRetailers = async () => {
    try {
      const data = await retailersApi.getAll()
      if (Array.isArray(data)) {
        const activeRetailers = data.filter(r => r.status === "active")
        // Ensure uniqueness by name to prevent UI duplicates
        const uniqueRetailers = activeRetailers.filter((v, i, a) => 
          a.findIndex(t => t.name === v.name) === i
        )
        setRetailers(uniqueRetailers)
      }
    } catch (error) {
      console.error("Failed to fetch retailers:", error)
    }
  }

  const fetchNextSaleNumber = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiBaseUrl()}/godown/sales/generate/next-sale-number`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        return data.nextSaleNumber || ""
      }
    } catch (error) {
      console.error('Failed to fetch next sale number:', error)
    }
    return ""
  }

  const addPayment = () => setPayments(p => [...p, emptyPayment()])
  const removePayment = (i: number) => setPayments(p => p.filter((_, idx) => idx !== i))
  const updatePayment = (i: number, field: keyof PaymentRow, value: string) =>
    setPayments(p => p.map((x, idx) => idx === i ? { ...x, [field]: value } : x))

  const resetForm = async () => {
    const nextNumber = editingId ? "" : await fetchNextSaleNumber()
    setFormData({
      saleDate: new Date().toISOString().split("T")[0],
      purchaseBillNo: "",
      invoiceNumber: nextNumber,
      retailerId: "",
      customerName: "",
      numberOfBirds: "",
      totalWeight: "",
      ratePerKg: "",
      totalAmount: "",
      paymentStatus: "pending",
      notes: "",
      weightLoss: "",
    })
    setPayments([emptyPayment()])
    setEditingId(null)
    setAllowEditBillNo(false)
  }

  const handleEdit = async (sale: GodownSale) => {
    setFormData({
      saleDate: sale.saleDate,
      purchaseBillNo: (sale as any).purchaseBillNo || "",
      invoiceNumber: (sale as any).invoiceNumber || "",
      retailerId: (sale as any).retailerId || "",
      customerName: sale.customerName,
      numberOfBirds: String(sale.numberOfBirds || ""),
      totalWeight: String(sale.totalWeight || ""),
      ratePerKg: String(sale.ratePerKg || ""),
      totalAmount: String(sale.totalAmount || ""),
      paymentStatus: (sale as any).paymentStatus || "pending",
      notes: sale.notes || "",
      weightLoss: String((sale as any).weightLoss || ""),
    })
    
    // Load payments from sale data
    const salePayments = (sale as any).payments
    if (salePayments && salePayments.length > 0) {
      setPayments(salePayments.map((p: any) => ({ 
        mode: (p.paymentMode || "cash") as PaymentMode, 
        amount: String(p.amount) 
      })))
    } else {
      setPayments([emptyPayment()])
    }
    
    setEditingId(sale.id)
    setAllowEditBillNo(false)
    setShowDialog(true)
  }



  const calculateTotal = () => {
    const weight = parseFloat(formData.totalWeight) || 0
    const rate = parseFloat(formData.ratePerKg) || 0
    return (weight * rate).toFixed(2)
  }

  const totalPaymentMade = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const balanceAmount = Math.max(0, parseFloat(formData.totalAmount || calculateTotal()) - totalPaymentMade)

  const handleSave = async () => {
    if (!formData.customerName || !formData.numberOfBirds || !formData.paymentStatus) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      const validPayments = payments.filter(p => parseFloat(p.amount) > 0).map(p => ({ 
        paymentMode: p.mode, 
        amount: p.amount 
      }))
      
      let cagePayload: Array<{ cageId: string; soldBirds: number; soldWeight: number; weightLoss: number }> = []
      if (formData.purchaseBillNo) {
        try {
          const matchedCages = await purchasesApi.getCagesByOrderNumber(formData.purchaseBillNo, 'in_godown')
          cagePayload = matchedCages
            .filter((c: any) => c?.id)
            .map((c: any) => ({
              cageId: c.id,
              soldBirds: Number(c.numberOfBirds || 0),
              soldWeight: Number(c.godownInwardWeight ?? c.purchaseWeight ?? 0),
              weightLoss: parseFloat(formData.weightLoss) || 0,
            }))
        } catch (error) {
          console.warn('Could not resolve in-godown cages for purchase bill:', error)
        }
      }

      const saleData = {
        retailerId: formData.retailerId || undefined,
        saleDate: formData.saleDate,
        invoiceNumber: formData.invoiceNumber || undefined,
        customerName: formData.customerName,
        numberOfBirds: parseInt(formData.numberOfBirds) || 0,
        totalWeight: parseFloat(formData.totalWeight) || undefined,
        ratePerKg: parseFloat(formData.ratePerKg) || undefined,
        totalAmount: parseFloat(formData.totalAmount) || parseFloat(calculateTotal()) || 0,
        paymentStatus: formData.paymentStatus,
        amountReceived: totalPaymentMade,
        notes: formData.notes,
        weightLoss: parseFloat(formData.weightLoss) || 0,
        payments: validPayments,
        cages: cagePayload,
        cageIds: cagePayload.map((c) => c.cageId),
      }

      if (editingId) {
        await godownApi.sales.update(editingId, saleData)
        toast.success("Sale updated successfully")
      } else {
        const saved = await godownApi.sales.create(saleData)
        if (saved?.invoiceNumber) {
          toast.success(`Sale created successfully - GDS No: ${saved.invoiceNumber}`)
        } else {
          toast.success("Sale created successfully")
        }
      }

      await fetchSales()
      resetForm()
      setShowDialog(false)
    } catch (error: any) {
      console.error("Failed to save sale:", error)
      toast.error(error.message || "Failed to save sale")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    try {
      setLoading(true)
      await godownApi.sales.delete(id)
      toast.success("Sale deleted successfully")
      await fetchSales()
    } catch (error: any) {
      console.error("Failed to delete sale:", error)
      toast.error("Failed to delete sale")
    } finally {
      setLoading(false)
    }
  }

  const handleRetailerChange = (retailerId: string) => {
    const retailer = retailers.find(r => r.id === retailerId)
    if (retailer) {
      setFormData({
        ...formData,
        retailerId,
        customerName: retailer.name,
      })
    } else {
      setFormData({ ...formData, retailerId: '', customerName: '' })
    }
  }

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const filteredSales = useMemo(() => {
    let filtered = [...sales]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (sale) =>
          sale.customerName.toLowerCase().includes(query)
      )
    }

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.saleDate)
        saleDate.setHours(0, 0, 0, 0)
        return saleDate >= start && saleDate <= end
      })
    }

    return filtered
  }, [sales, searchQuery, dateRangeStart, dateRangeEnd])

  const handlePrintReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Godown Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Godown Sales Report</h1>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>GDS No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(sale => `
                <tr>
                  <td>${sale.invoiceNumber || "-"}</td>
                  <td>${new Date(sale.saleDate).toLocaleDateString('en-GB')}</td>
                  <td>${sale.customerName}</td>
                  <td>${sale.numberOfBirds} birds</td>
                  <td>₹${Number(sale.ratePerKg || 0).toFixed(2)}/kg</td>
                  <td>₹${Number(sale.totalAmount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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

  const handlePrintSale = (sale: GodownSale) => {
    const received = Number((sale as any).amountReceived || 0)
    const totalAmount = Number(sale.totalAmount || 0)
    const balance = Math.max(0, totalAmount - received)
    const payments = Array.isArray((sale as any).payments) ? (sale as any).payments : []
    const subtotal = totalAmount
    const discount = 0
    const tax = 0
    const grandTotal = subtotal - discount + tax
    const invoiceNumber = sale.invoiceNumber || "INV-2026-000124"
    const invoiceDate = new Date(sale.saleDate).toLocaleDateString('en-GB')
    const dueDate = new Date(sale.saleDate)
    dueDate.setDate(dueDate.getDate() + 7)
    const dueDateLabel = dueDate.toLocaleDateString('en-GB')
    const paymentStatus = ((sale as any).paymentStatus || "pending").toUpperCase()
    const matchedRetailer = 
      retailers.find((r) => String(r.id) === String((sale as any).retailerId || "")) ||
      retailers.find((r) => r.name.toLowerCase() === String(sale.customerName || "").toLowerCase().trim()) ||
      (sale as any).retailer || null
    const customerPhone = String(
      (sale as any).customerPhone ||
      (sale as any).phone ||
      matchedRetailer?.phone ||
      ""
    ).trim()
    const customerAddress = String(
      (sale as any).customerAddress ||
      (sale as any).address ||
      matchedRetailer?.address ||
      ""
    ).trim()
    const barcodeBars = Array.from({ length: 36 }, (_, i) => `<span style="height:${10 + (i % 5) * 3}px"></span>`).join("")
    const qrPattern = Array.from({ length: 64 }, (_, i) => `<span class="qr-cell ${i % 7 === 0 || i % 11 === 3 || i % 13 === 2 ? "active" : ""}"></span>`).join("")

    const invoiceHtml = `
      <div class="invoice-shell">
        <div class="header-row">
          <div class="brand-block">
            <div class="logo-mark">AF</div>
            <div>
              <div class="brand-name">Aziz Poultry Farms</div>
              <div class="brand-sub">Premium Poultry ERP • Business Invoice</div>
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">Invoice</div>
            <div class="meta-row"><span>Invoice No</span><strong>${invoiceNumber}</strong></div>
            <div class="meta-row"><span>Invoice Date</span><strong>${invoiceDate}</strong></div>
            <div class="meta-row"><span>Due Date</span><strong>${dueDateLabel}</strong></div>
            <div class="status-pill">${paymentStatus}</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="info-grid">
          <div class="card">
            <div class="card-title">Customer Information</div>
            <div class="customer-name">${sale.customerName || "Walk-in Customer"}</div>
            <div class="info-list">
              <div class="info-item"><span class="label">Phone</span><span class="value">${customerPhone || "—"}</span></div>
              <div class="info-item"><span class="label">Address</span><span class="value">${customerAddress || "—"}</span></div>
              
            </div>
          </div>

          <div class="card summary-card">
            <div class="card-title">Invoice Summary</div>
            <div class="summary-row"><span>Subtotal</span><strong>₹${subtotal.toFixed(2)}</strong></div>
            <div class="summary-row"><span>Discount</span><strong>₹${discount.toFixed(2)}</strong></div>
            <div class="summary-row"><span>Tax</span><strong>₹${tax.toFixed(2)}</strong></div>
            <div class="summary-row grand"><span>Grand Total</span><strong>₹${grandTotal.toFixed(2)}</strong></div>
            <div class="summary-row"><span>Amount Paid</span><strong>₹${received.toFixed(2)}</strong></div>
            <div class="summary-row"><span>Remaining Balance</span><strong>₹${balance.toFixed(2)}</strong></div>
          </div>
        </div>

        <div class="section">
          <div class="card-title">Invoice Details</div>
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Birds</th>
                <th>Weight (kg)</th>
                <th>Rate/kg</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Godown sale of birds</td>
                <td>${sale.numberOfBirds || 0}</td>
                <td>${Number(sale.totalWeight || 0).toFixed(2)}</td>
                <td>₹${Number(sale.ratePerKg || 0).toFixed(2)}</td>
                <td>₹${grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${payments.length > 0 ? `
        <div class="section" style="margin-top:12px;">
          <div class="card-title">Payment Breakdown</div>
          <table class="invoice-table payments-table">
            <thead>
              <tr>
                <th>Mode</th>
                <th style="text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map((p: any) => `
                <tr>
                  <td>${(p.paymentMode || "cash").charAt(0).toUpperCase() + (p.paymentMode || "cash").slice(1)}</td>
                  <td style="text-align:right">₹${Number(p.amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>Total Paid</strong></td>
                <td style="text-align:right"><strong>₹${received.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="bottom-grid">
          <div class="card notes-card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div class="card-title">Notes / Terms & Conditions</div>
            <div class="terms">${sale.notes ? sale.notes.replace(/\n/g, '<br/>') : 'Payment due within 7 days. All disputes to be resolved within business days.'}</div>
          </div>
          <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div class="signature-row">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="label">Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-row">
          <div class="barcode">${barcodeBars}</div>
          <div class="thank-you">Thank You For Your Business</div>
        </div>
      </div>
    `

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice - ${sale.invoiceNumber || "Godown Sale"}</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #f4f4f5; }
            @page { size: A4 portrait; margin: 8mm; }
            .page { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; }
            .invoice-shell { position: relative; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px 20px 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); min-height: 135mm; }
            .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
            .brand-block { display: flex; align-items: center; gap: 10px; }
            .logo-mark { width: 44px; height: 44px; border-radius: 12px; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; letter-spacing: 0.08em; }
            .brand-name { font-size: 17px; font-weight: 700; color: #111; }
            .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
            .invoice-meta { text-align: right; min-width: 210px; }
            .invoice-title { font-size: 20px; font-weight: 700; margin-bottom: 6px; color: #111; }
            .meta-row { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: #4b5563; margin-top: 3px; }
            .meta-row strong { color: #111; }
            .status-pill { display: inline-block; margin-top: 8px; padding: 6px 10px; border-radius: 999px; background: #22C55E; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
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
            .summary-card .card-title, .summary-card .summary-row span, .summary-card .summary-row strong { color: #111827; }
            .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin-top: 7px; align-items: center; font-weight: 600; }
            .summary-row.grand { font-size: 12px; font-weight: 700; padding: 6px 8px; border-top: 1px solid rgba(17,24,39,0.12); margin-top: 8px; background: #e2e8f0; border-radius: 8px; }
            .section { margin-top: 12px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-top: 6px; border: 1px solid #e5e7eb; }
            .invoice-table th, .invoice-table td { border-bottom: 1px solid #e5e7eb; padding: 8px 8px; text-align: left; font-size: 11px; }
            .invoice-table th { background: #f4f4f5; font-weight: 700; color: #111; }
            .invoice-table tr:nth-child(even) { background: #fbfbfb; }
            .invoice-table tr:hover { background: #f4f4f5; }
            .payments-table { margin-top: 6px; }
            .payments-table .total-row td { border-top: 2px solid #111; background: #f4f4f5; }
            .bottom-grid { display: grid; grid-template-columns: 0.95fr 1.05fr; gap: 12px; margin-top: 12px; }
            .payment-card .chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
            .chip { display: inline-block; padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 999px; font-size: 10px; color: #111; background: #fff; }
            .payment-text { font-size: 10px; color: #4b5563; margin-top: 8px; }
            .qr-box { margin-top: 8px; display: inline-block; padding: 8px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; }
            .qr-grid { display: grid; grid-template-columns: repeat(8, 6px); gap: 2px; }
            .qr-cell { width: 6px; height: 6px; background: #f3f4f6; }
            .qr-cell.active { background: #111; }
            .qr-caption { font-size: 9px; text-align: center; color: #6b7280; margin-top: 6px; letter-spacing: 0.06em; text-transform: uppercase; }
            .terms { font-size: 10px; line-height: 1.5; color: #4b5563; }
            .signature-row { display: flex; justify-content: space-between; gap: 10px; margin-top: 12px; }
            .signature-block { flex: 1; }
            .signature-line { height: 28px; border-bottom: 1px solid #111; margin-bottom: 6px; }
            .stamp { height: 42px; border: 1px solid #111; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: #111; margin-bottom: 6px; }
            .label { font-size: 9px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.08em; }
            .footer-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
            .barcode { display: flex; align-items: flex-end; gap: 2px; }
            .barcode span { display: inline-block; width: 2px; background: #111; border-radius: 999px; }
            .thank-you { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #111; }
            @media print {
              body { background: #fff; }
              .page { padding: 0; }
              .invoice-shell { box-shadow: none; border: 1px solid #ddd; min-height: auto; }
            }
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

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Godown Sales</h1>
            <p className="text-muted-foreground">Record sales from godown</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                New Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Sale" : "New Sale"}</DialogTitle>
                <p id="dialog-description" className="sr-only">
                  {editingId ? "Edit godown sale details" : "Create a new godown sale"}
                </p>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sale Date *</Label>
                    <DatePicker
                      value={formData.saleDate}
                      onChange={(date) => setFormData({ ...formData, saleDate: date })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Godown Sale No</Label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowEditBillNo}
                          onChange={(e) => setAllowEditBillNo(e.target.checked)}
                          className="cursor-pointer"
                        />
                        <span>Edit manually</span>
                      </label>
                    </div>
                    <Input
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="Auto-generated on save"
                      disabled={loading}
                      readOnly={!allowEditBillNo}
                      className={!allowEditBillNo ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>



                <div className="space-y-2">
                  <Label>Retailer (Optional)</Label>
                  <Select
                    value={formData.retailerId || '__none__'}
                    onValueChange={(v) => handleRetailerChange(v === '__none__' ? '' : v)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select retailer" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="__none__">Select retailer...</SelectItem>
                      {retailers.map((retailer) => (
                        <SelectItem key={retailer.id} value={retailer.id}>
                          {retailer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={retailers.find(r => r.id === formData.retailerId)?.phone || ""} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={retailers.find(r => r.id === formData.retailerId)?.address || ""} disabled className="bg-gray-50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Customer name"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Birds *</Label>
                    <Input
                      type="number"
                      value={formData.numberOfBirds}
                      onChange={(e) => setFormData({ ...formData, numberOfBirds: e.target.value })}
                      placeholder="0"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate per Kg (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.ratePerKg}
                      onChange={(e) => {
                        const rate = e.target.value
                        const total = (parseFloat(formData.totalWeight || "0") * parseFloat(rate || "0")).toFixed(2)
                        setFormData({ ...formData, ratePerKg: rate, totalAmount: total })
                      }}
                      placeholder="0.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalWeight}
                      onChange={(e) => {
                        const weight = e.target.value
                        const total = (parseFloat(weight || "0") * parseFloat(formData.ratePerKg || "0")).toFixed(2)
                        setFormData({ ...formData, totalWeight: weight, totalAmount: total })
                      }}
                      placeholder="0.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight Loss (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.weightLoss}
                      onChange={(e) => setFormData({ ...formData, weightLoss: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Amount (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                      onWheel={(e) => e.currentTarget.blur()} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status *</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(v: any) => setFormData({ ...formData, paymentStatus: v })}
                      disabled={loading}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Breakdown Card */}
                <Card className="border-purple-200">
                  <CardHeader className="bg-purple-50 border-b border-purple-100 py-3">
                    <CardTitle className="text-purple-900 text-sm">Payment Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <Label className="text-sm font-medium">Payment Mode</Label>
                        <Label className="text-sm font-medium">Amount (₹)</Label>
                      </div>
                      {payments.map((p, i) => (
                        <div key={i} className="grid grid-cols-2 gap-4">
                          <Select value={p.mode} onValueChange={v => updatePayment(i, "mode", v as PaymentMode)} disabled={loading}>
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
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              value={p.amount} 
                              onChange={e => updatePayment(i, "amount", e.target.value)} 
                              disabled={loading}  
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                            {payments.length > 1 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removePayment(i)} 
                                className="px-2 text-red-500"
                              >
                                <X size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addPayment} 
                        disabled={loading}
                      >
                        <Plus size={14} className="mr-1" /> Add Payment Mode
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-2">
                        <Label>Total Received (₹)</Label>
                        <Input 
                          value={`₹${totalPaymentMade.toFixed(2)}`} 
                          disabled 
                          className="bg-gray-50 font-semibold text-green-700" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Balance (₹)</Label>
                        <Input 
                          value={`₹${balanceAmount.toFixed(2)}`} 
                          disabled 
                          className="bg-gray-50 font-semibold text-red-600" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={3}
                    disabled={loading}
                    onWheel={(e) => e.currentTarget.blur()} 
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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              {/* <div>
                <CardTitle>Sales List</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage godown sales</p>
              </div> */}
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onDateRangeChange={handleDateRangeChange}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Filter:</Label>
                  <Input
                    placeholder="Search by customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[250px]"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintReport}
                >
                  <Printer className="mr-2" size={16} />
                  Print Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && sales.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredSales.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {searchQuery || (dateRangeStart && dateRangeEnd) 
                  ? "No sales match your filters" 
                  : "No sales found"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">GDS No</TableHead>
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold">Customer</TableHead>
                      <TableHead className="font-bold">Birds</TableHead>
                      <TableHead className="font-bold">Rate</TableHead>
                      <TableHead className="font-bold">Total</TableHead>
                      <TableHead className="font-bold">Received</TableHead>
                      <TableHead className="font-bold">Balance</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => {
                      const totalAmount = Number(sale.totalAmount || 0)
                      const amountReceived = Number((sale as any).amountReceived || 0)
                      const balance = Math.max(0, totalAmount - amountReceived)
                      
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.invoiceNumber || "-"}</TableCell>
                          <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                          <TableCell>{sale.customerName}</TableCell>
                          <TableCell>{sale.numberOfBirds} birds</TableCell>
                          <TableCell>₹{Number(sale.ratePerKg || 0).toFixed(2)}/kg</TableCell>
                          <TableCell>₹{totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-green-700 font-medium">₹{amountReceived.toFixed(2)}</TableCell>
                          <TableCell className="text-red-600 font-medium">₹{balance.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              (sale as any).paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                              (sale as any).paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {(sale as any).paymentStatus || 'pending'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(sale)}>
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handlePrintSale(sale)}>
                                <Printer size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(sale.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
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
    </DashboardLayout>
  )
}
