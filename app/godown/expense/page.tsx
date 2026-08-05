"use client"

/**
 * Godown Expense page is disabled in the menu.
 * Use main Expenses page (/expenses). Backend godown expenses API is kept.
 */
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function GodownExpensePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/expenses")
  }, [router])

  return null
}
