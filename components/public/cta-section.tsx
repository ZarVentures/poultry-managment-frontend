import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CtaSectionProps {
  className?: string
}

export function CtaSection({ className }: CtaSectionProps) {
  return (
    <section className={cn("px-4 pb-20 sm:px-6 lg:px-8", className)}>
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 px-6 py-16 text-center shadow-xl shadow-emerald-900/20 sm:px-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.4) 0, transparent 40%)",
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Transform Your Poultry Trading Business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-emerald-50/90 sm:text-lg">
            Join poultry traders across India who use Poultry Sathi to manage purchases, sales, 
            inventory, payments, and business operations—all from one powerful platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full bg-white text-emerald-700 shadow-md hover:bg-emerald-50 sm:w-auto"
            >
              <Link href="/contact">
                Book a Demo <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <Link href="/features">Explore Features</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
