import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { DateFilterProvider } from "@/contexts/date-filter-context"
import { DevModeProvider } from "@/lib/dev-mode"
import { Toaster } from "@/components/ui/sonner"
import Providers from "@/components/providers"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aziz Poultry - Farm Management System",
  description: "Complete poultry farm management system for inventory, sales, purchases, and financial reporting",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          <DevModeProvider>
            <DateFilterProvider>
              {children}
            </DateFilterProvider>
          </DevModeProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}