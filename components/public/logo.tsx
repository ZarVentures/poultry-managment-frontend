import Link from "next/link"
import { Bird } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  href?: string
  showText?: boolean
}

export function Logo({ className, href = "/", showText = true }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="Poultry Sathi Home"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-md shadow-emerald-600/20 transition-transform group-hover:scale-105">
        <Bird className="h-5 w-5" />
      </span>
      {showText && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          Poultry<span className="text-primary"> Sathi</span>
        </span>
      )}
    </Link>
  )
}
