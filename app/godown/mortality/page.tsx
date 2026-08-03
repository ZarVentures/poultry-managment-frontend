"use client"

/**
 * Godown Mortality standalone page is disabled.
 * Use the main Mortality page instead: /mortality
 * Backend `/godown/mortality` API is kept for stock summary + bird-return auto-create.
 */
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function GodownMortalityPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/mortality")
  }, [router])

  return null
}
