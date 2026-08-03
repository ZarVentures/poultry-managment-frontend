"use client"

/**
 * Cage Tracking page is disabled in the menu.
 * Backend cages API is kept for purchases/sales/godown flows.
 */
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CageTrackingPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  return null
}
