"use client"

import Link from "next/link"
import { ArrowRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PublicLayout } from "@/components/public-layout"

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <section className="flex flex-col items-center justify-center px-4 py-28 text-center sm:py-36">
        <p className="text-8xl font-extrabold tracking-tight text-primary sm:text-9xl">404</p>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s get
          you back to the coop.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/features">
              Explore Features <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  )
}
