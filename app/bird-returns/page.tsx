"use client"

/**
 * Godown Bird Returns page is disabled in the menu.
 * Backend bird-returns API is kept for existing flows.
 */
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BirdReturnsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  return null
}
