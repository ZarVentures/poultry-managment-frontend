import { redirect } from "next/navigation"

export default function LedgerIndexRedirect() {
  redirect("/billing/ledger/farms")
}
