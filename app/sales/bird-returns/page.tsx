"use client"

/**
 * Vehicle Bird Returns page is disabled in the menu.
 * Backend vehicle-bird-returns API is kept for existing flows.
 */
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function VehicleBirdReturnsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/sales")
  }, [router])

  return null
}
