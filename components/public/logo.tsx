import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  href?: string
  priority?: boolean
}

export function Logo({ className, href = "/", priority = false }: LogoProps) {
  return (
    <Link
      href={href}
      className="group flex items-center"
      aria-label="Poultry Sathi Home"
    >
      <Image
        src="/logo.png"
        alt="Poultry Sathi"
        width={1201}
        height={301}
        priority={priority}
        className={cn("h-10 w-auto transition-transform group-hover:scale-105", className)}
      />
    </Link>
  )
}
