"use client";

import React, { useCallback, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
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
  type CreatePaymentVoucherPayload,
  type PaymentMethodVoucher,
  type PaymentVoucherRecord,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

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

export function PaymentVoucherPageContent({ variant }: { variant: PaymentVoucherFlow }) {
  const config = useMemo(
    () =>
      variant === "in"
        ? {
            pageTitle: "PAYMENT VOUCHER",
            subtitle:
              "Record incoming payments for financial control and institutional compliance.",
            defaultPurpose: "Payment received (customer receipt)",
            defaultPayeeType: "retailer" as CreatePaymentVoucherPayload["payeeType"],
            referenceType: "sale" as NonNullable<CreatePaymentVoucherPayload["referenceType"]>,
            amountLabel: "RECEIVED AMOUNT (INR) *",
            payeeLabel: "CUSTOMER / PAYEE NAME *",
            headerHint: "Incoming — number is issued when you save",
          }
        : {
            pageTitle: "PAYMENT-OUT VOUCHER",
            subtitle:
              "Record outgoing payments for financial control and institutional compliance.",
            defaultPurpose: "Payment — purchase / supplier settlement",
            defaultPayeeType: "supplier" as CreatePaymentVoucherPayload["payeeType"],
            referenceType: "purchase" as NonNullable<CreatePaymentVoucherPayload["referenceType"]>,
            amountLabel: "PAID AMOUNT (INR) *",
            payeeLabel: "PAYEE NAME (supplier / farmer) *",
            headerHint: "Outgoing — number is issued when you save",
          },
    [variant]
  );

  const [payeeName, setPayeeName] = useState("");
  const [voucherDate, setVoucherDate] = useState(todayISO);
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodVoucher>("cash");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState(config.defaultPurpose);
  const [description, setDescription] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [lastVoucherNumber, setLastVoucherNumber] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdRecord, setCreatedRecord] = useState<PaymentVoucherRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForNewVoucher = useCallback(() => {
    setPayeeName("");
    setVoucherDate(todayISO());
    setTransactionReference("");
    setPaymentMethod("cash");
    setAmount("");
    setPurpose(config.defaultPurpose);
    setDescription("");
    setChequeNumber("");
    setBankName("");
  }, [config.defaultPurpose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number.parseFloat(amount);
    if (!payeeName.trim()) {
      toast.error("Enter payee name");
      return;
    }
    if (!Number.isFinite(amt) || amt < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (paymentMethod === "cheque" && !chequeNumber.trim()) {
      toast.error("Enter cheque number");
      return;
    }

    const payload: CreatePaymentVoucherPayload = {
      voucherDate,
      payeeType: config.defaultPayeeType,
      payeeName: payeeName.trim(),
      amount: amt,
      paymentMethod,
      purpose: purpose.trim() || config.defaultPurpose,
      description: description.trim() || undefined,
      referenceType: config.referenceType,
      transactionReference: transactionReference.trim() || undefined,
      status: "paid",
      paidDate: voucherDate,
      chequeNumber: paymentMethod === "cheque" ? chequeNumber.trim() : undefined,
      bankName:
        paymentMethod === "cheque" || paymentMethod === "bank_transfer"
          ? bankName.trim() || undefined
          : undefined,
    };

    setSubmitting(true);
    try {
      const res = await paymentVouchersApi.create(payload);
      setCreatedRecord(res);
      setLastVoucherNumber(res.voucherNumber);
      setSuccessOpen(true);
      toast.success("Voucher created");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not create voucher";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyNumber() {
    if (!createdRecord?.voucherNumber) return;
    await navigator.clipboard.writeText(createdRecord.voucherNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDialogClose(open: boolean) {
    setSuccessOpen(open);
    if (!open) {
      resetForNewVoucher();
      setCreatedRecord(null);
    }
  }

  function handleCreateAnother() {
    resetForNewVoucher();
    setCreatedRecord(null);
    setSuccessOpen(false);
  }

  const displayId = lastVoucherNumber ?? "—";

  return (
    <DashboardLayout>
      <div className="bg-white px-6 py-8 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide uppercase text-black">
              {config.pageTitle}
            </h1>
            <p className="text-gray-500 mt-3 text-sm md:text-lg">{config.subtitle}</p>
          </div>
          <div className="md:text-right">
            <p className="text-gray-400 text-sm font-semibold uppercase">Voucher number</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-700 tabular-nums">{displayId}</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px] md:ml-auto">
              {lastVoucherNumber ? "Last saved on this session" : config.headerHint}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-100 min-h-screen">
        <div className="bg-white rounded-2xl shadow-md p-6 w-full lg:w-[350px] h-fit">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-sm">
              ✓
            </span>
            Financial Control
          </h2>
          <p className="text-gray-600 text-sm leading-6 mb-5">
            Each save creates a new voucher with a unique number from the server. Use the checklist
            for compliance.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 border">
            <h3 className="font-semibold text-xs tracking-wide text-gray-700 mb-3">
              REQUIREMENT CHECKLIST
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-green-600">
                <span>●</span>
                Payee identity captured
              </li>
              <li className="flex items-center gap-2 text-green-600">
                <span>●</span>
                Server-assigned voucher sequence
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span>●</span>
                Attachments (optional)
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 flex-1">
          <h3 className="text-lg font-semibold mb-6">Entry Form</h3>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                {config.payeeLabel}
              </label>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="Name as on records..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                  VOUCHER / PAYMENT DATE *
                </label>
                <input
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
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
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Bank ref, receipt no…"
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
                    onClick={() => setPaymentMethod(key)}
                    className={cn(
                      "px-5 py-2 rounded-lg text-sm font-medium transition",
                      paymentMethod === key
                        ? "bg-black text-white"
                        : "border border-gray-300 hover:bg-gray-100"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {(paymentMethod === "cheque" || paymentMethod === "bank_transfer") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethod === "cheque" && (
                  <div>
                    <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                      CHEQUE NUMBER *
                    </label>
                    <input
                      type="text"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required={paymentMethod === "cheque"}
                    />
                  </div>
                )}
                <div className={paymentMethod === "cheque" ? "" : "md:col-span-2"}>
                  <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                    BANK NAME
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
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
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-700">
                ATTACHMENTS
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500 text-sm">
                Optional — paste URL later or extend upload API.
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-6 rounded-xl font-semibold text-base bg-black hover:bg-gray-900"
            >
              {submitting ? "Saving…" : "SAVE VOUCHER"}
            </Button>
          </form>
        </div>
      </div>

      <Dialog open={successOpen} onOpenChange={handleDialogClose}>
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
                <>
                  <Check className="size-4 mr-2" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-2" /> Copy number
                </>
              )}
            </Button>
            <Button type="button" className="w-full sm:w-auto" onClick={handleCreateAnother}>
              Create another voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
