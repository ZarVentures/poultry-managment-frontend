"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  paymentVouchersApi,
  retailersApi,
  farmersApi,
  type CreatePaymentVoucherPayload,
  type PaymentMethodVoucher,
  type PaymentVoucherRecord,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Copy, Check, Plus, Pencil, Trash2, XCircle, CheckCircle, Calendar } from "lucide-react";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type PaymentVoucherFlow = "in" | "out";

const METHODS: { key: PaymentMethodVoucher; label: string }[] = [
  { key: "cash", label: "CASH" },
  { key: "bank_transfer", label: "BANK" },
  { key: "upi", label: "UPI" },
  { key: "card", label: "CARD" },
  { key: "cheque", label: "CHEQUE" },
];

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

const initialFormState = {
  selectedPartyId: "",
  payeeName: "",
  voucherDate: todayISO(),
  transactionReference: "",
  paymentMethod: "cash" as PaymentMethodVoucher,
  amount: "",
  purpose: "",
  description: "",
  chequeNumber: "",
  bankName: "",
};

export function PaymentVoucherPageContent({ variant }: { variant: PaymentVoucherFlow }) {
  const config = useMemo(
    () =>
      variant === "in"
        ? {
            pageTitle: "Payment In",
            subtitle: "Incoming payments from customers",
            defaultPurpose: "Payment received (customer receipt)",
            defaultPayeeType: "retailer" as CreatePaymentVoucherPayload["payeeType"],
            referenceType: "sale" as NonNullable<CreatePaymentVoucherPayload["referenceType"]>,
            amountLabel: "RECEIVED AMOUNT (INR) *",
            payeeLabel: "CUSTOMER / PAYEE NAME *",
            fetchParties: () => retailersApi.getActive(),
          }
        : {
            pageTitle: "Payment Out",
            subtitle: "Outgoing payments to suppliers / farmers",
            defaultPurpose: "Payment — purchase / supplier settlement",
            defaultPayeeType: "supplier" as CreatePaymentVoucherPayload["payeeType"],
            referenceType: "purchase" as NonNullable<CreatePaymentVoucherPayload["referenceType"]>,
            amountLabel: "PAID AMOUNT (INR) *",
            payeeLabel: "PAYEE NAME (supplier / farmer) *",
            fetchParties: () => farmersApi.getActive(),
          },
    [variant]
  );

  const [parties, setParties] = useState<any[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);

  const [vouchers, setVouchers] = useState<PaymentVoucherRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PaymentVoucherRecord | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const [lastVoucherNumber, setLastVoucherNumber] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdRecord, setCreatedRecord] = useState<PaymentVoucherRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchVouchers = useCallback(async () => {
    setLoadingList(true);
    try {
      const params: Record<string, string | undefined> = { voucherType: variant };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter) params.status = statusFilter;
      const data = await paymentVouchersApi.findAll(params);
      setVouchers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load vouchers");
    } finally {
      setLoadingList(false);
    }
  }, [startDate, endDate, statusFilter, variant]);

  useEffect(() => {
    setLoadingParties(true);
    config
      .fetchParties()
      .then((data) => setParties(data || []))
      .catch(() => toast.error("Failed to load payee list"))
      .finally(() => setLoadingParties(false));
  }, [config]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  function resetForm() {
    setForm(initialFormState);
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setForm((prev) => ({ ...prev, purpose: config.defaultPurpose }));
    setShowForm(true);
  }

  function openEdit(v: PaymentVoucherRecord) {
    setEditingId(v.id);
    setForm({
      selectedPartyId: v.payeeId ? String(v.payeeId) : "",
      payeeName: v.payeeName,
      voucherDate: v.voucherDate,
      transactionReference: v.transactionReference || "",
      paymentMethod: (v.paymentMethod as PaymentMethodVoucher) || "cash",
      amount: String(v.amount),
      purpose: v.purpose,
      description: v.description || "",
      chequeNumber: v.chequeNumber || "",
      bankName: v.bankName || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number.parseFloat(form.amount);
    if (!form.selectedPartyId) { toast.error("Select a payee"); return; }
    if (!form.payeeName.trim()) { toast.error("Enter payee name"); return; }
    if (!Number.isFinite(amt) || amt < 0) { toast.error("Enter a valid amount"); return; }
    if (form.paymentMethod === "cheque" && !form.chequeNumber.trim()) { toast.error("Enter cheque number"); return; }

    const payload: CreatePaymentVoucherPayload = {
      voucherDate: form.voucherDate,
      voucherType: variant,
      payeeType: config.defaultPayeeType,
      payeeId: Number(form.selectedPartyId),
      payeeName: form.payeeName.trim(),
      amount: amt,
      paymentMethod: form.paymentMethod,
      purpose: form.purpose.trim() || config.defaultPurpose,
      description: form.description.trim() || undefined,
      referenceType: config.referenceType,
      transactionReference: form.transactionReference.trim() || undefined,
      status: "paid",
      paidDate: form.voucherDate,
      chequeNumber: form.paymentMethod === "cheque" ? form.chequeNumber.trim() : undefined,
      bankName:
        form.paymentMethod === "cheque" || form.paymentMethod === "bank_transfer"
          ? form.bankName.trim() || undefined
          : undefined,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await paymentVouchersApi.update(editingId, payload);
        toast.success("Voucher updated");
      } else {
        const res = await paymentVouchersApi.create(payload);
        setCreatedRecord(res);
        setLastVoucherNumber(res.voucherNumber);
        setSuccessOpen(true);
        toast.success("Voucher created");
      }
      setShowForm(false);
      resetForm();
      fetchVouchers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Operation failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: number) {
    try {
      await paymentVouchersApi.approve(id);
      toast.success("Voucher approved");
      fetchVouchers();
    } catch { toast.error("Failed to approve"); }
  }

  async function handleCancel(id: number) {
    try {
      await paymentVouchersApi.cancel(id);
      toast.success("Voucher cancelled");
      fetchVouchers();
    } catch { toast.error("Failed to cancel"); }
  }

  function confirmDelete(v: PaymentVoucherRecord) {
    setDeleteTarget(v);
    setShowDelete(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await paymentVouchersApi.delete(deleteTarget.id);
      toast.success("Voucher deleted");
      setShowDelete(false);
      setDeleteTarget(null);
      fetchVouchers();
    } catch { toast.error("Failed to delete"); }
  }

  async function handleCopyNumber() {
    if (!createdRecord?.voucherNumber) return;
    await navigator.clipboard.writeText(createdRecord.voucherNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSuccessClose(open: boolean) {
    setSuccessOpen(open);
    if (!open) {
      setCreatedRecord(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{config.pageTitle}</h1>
            <p className="text-muted-foreground text-sm">{config.subtitle}</p>
          </div>
          <Button onClick={openCreate} className="shrink-0 self-start sm:self-auto gap-2">
            <Plus className="size-4" /> New Voucher
          </Button>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl p-4 print:hidden">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> From
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-[160px] h-10 rounded-full border border-gray-300 px-3 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar size={12} /> To
              </label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-[160px] h-10 rounded-full border border-gray-300 px-3 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-[160px] h-10 rounded-full border border-gray-300 px-3 text-sm bg-white">
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchVouchers} className="rounded-full px-5 h-10 w-full sm:w-auto">
              Refresh
            </Button>
          </div>
        </Card>

        {/* Table */}
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Voucher #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Payee</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Purpose</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No vouchers found</td></tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{v.voucherNumber}</td>
                    <td className="px-4 py-3">{v.voucherDate}</td>
                    <td className="px-4 py-3">{v.payeeName}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      ₹{Number(v.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 capitalize">{v.paymentMethod.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 max-w-[150px] truncate">{v.purpose}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[v.status] || "bg-gray-100 text-gray-600")}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-gray-100 text-blue-600" title="Edit">
                          <Pencil className="size-4" />
                        </button>
                        {v.status !== "cancelled" && (
                          <button onClick={() => handleCancel(v.id)} className="p-1.5 rounded hover:bg-gray-100 text-red-600" title="Cancel">
                            <XCircle className="size-4" />
                          </button>
                        )}
                        {v.status === "pending" && (
                          <button onClick={() => handleApprove(v.id)} className="p-1.5 rounded hover:bg-gray-100 text-green-600" title="Approve">
                            <CheckCircle className="size-4" />
                          </button>
                        )}
                        <button onClick={() => confirmDelete(v)} className="p-1.5 rounded hover:bg-gray-100 text-red-600" title="Delete">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-sm:max-w-[calc(100%-2rem)] sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Voucher" : "New Voucher"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                {config.payeeLabel}
              </label>
              {loadingParties ? (
                <div className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 bg-gray-50">
                  Loading payee list...
                </div>
              ) : (
                <select
                  value={form.selectedPartyId}
                  onChange={(e) => {
                    const idVal = e.target.value;
                    setForm((prev) => ({ ...prev, selectedPartyId: idVal }));
                    const party = parties.find((p) => String(p.id) === idVal);
                    if (party) setForm((prev) => ({ ...prev, payeeName: party.name }));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">Select Payee...</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                  VOUCHER / PAYMENT DATE *
                </label>
                <input
                  type="date"
                  value={form.voucherDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, voucherDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                  RECEIPT / REFERENCE NUMBER
                </label>
                <input
                  type="text"
                  value={form.transactionReference}
                  onChange={(e) => setForm((prev) => ({ ...prev, transactionReference: e.target.value }))}
                  placeholder="Bank ref, receipt no..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                PAYMENT TYPE *
              </label>
              <div className="flex flex-wrap gap-3">
                {METHODS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, paymentMethod: key }))}
                    className={cn(
                      "px-5 py-2 rounded-lg text-sm font-medium transition",
                      form.paymentMethod === key
                        ? "bg-black text-white"
                        : "border border-gray-300 hover:bg-gray-100"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {(form.paymentMethod === "cheque" || form.paymentMethod === "bank_transfer") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.paymentMethod === "cheque" && (
                  <div>
                    <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                      CHEQUE NUMBER *
                    </label>
                    <input
                      type="text"
                      value={form.chequeNumber}
                      onChange={(e) => setForm((prev) => ({ ...prev, chequeNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required={form.paymentMethod === "cheque"}
                    />
                  </div>
                )}
                <div className={form.paymentMethod === "cheque" ? "" : "md:col-span-2"}>
                  <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                    BANK NAME
                  </label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                PURPOSE (SHORT) *
              </label>
              <input
                type="text"
                value={form.purpose}
                onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                {config.amountLabel}
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
                <span className="text-gray-500 text-lg mr-2">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="flex-1 outline-none text-lg font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                DESCRIPTION / NOTES
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-6 rounded-xl font-semibold text-base bg-black hover:bg-gray-900"
            >
              {submitting ? "Saving..." : editingId ? "UPDATE VOUCHER" : "SAVE VOUCHER"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Voucher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete voucher <strong>{deleteTarget?.voucherNumber}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={handleSuccessClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voucher created</DialogTitle>
            <DialogDescription>
              Your voucher was saved. A new number is generated every time you create a voucher.
            </DialogDescription>
          </DialogHeader>
          {createdRecord && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border bg-muted/40 p-4 text-center space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Your voucher number is
                </p>
                <p className="text-2xl font-bold tracking-tight font-mono">
                  {createdRecord.voucherNumber}
                </p>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Payee</dt>
                <dd className="font-medium">{createdRecord.payeeName}</dd>
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-medium tabular-nums">
                  ₹{Number(createdRecord.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </dd>
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium">{String(createdRecord.voucherDate)}</dd>
              </dl>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleCopyNumber}
              disabled={!createdRecord?.voucherNumber}
            >
              {copied ? (
                <><Check className="size-4 mr-2" /> Copied</>
              ) : (
                <><Copy className="size-4 mr-2" /> Copy number</>
              )}
            </Button>
            <Button type="button" className="w-full sm:w-auto" onClick={() => { setSuccessOpen(false); setCreatedRecord(null); }}>
              Create another voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
