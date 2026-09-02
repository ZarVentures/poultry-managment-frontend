import { redirect } from "next/navigation"

export default function LegacyBalanceSheetRedirect() {
  redirect("/billing/balance-sheet")
}
