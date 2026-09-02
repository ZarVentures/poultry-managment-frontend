import { redirect } from "next/navigation"

export default function BillingIndexRedirect() {
  redirect("/billing/balance-sheet")
}
