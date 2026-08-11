"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  Building,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Phone,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Reveal } from "@/components/public/reveal"
import { SectionHeading } from "@/components/public/section-heading"
import { CONTACT_INFO } from "@/components/public/site-config"
import { cn } from "@/lib/utils"

type FormStatus = "idle" | "submitting" | "success" | "error"

interface InfoCard {
  icon: typeof Mail
  label: string
  lines: string[]
  note?: string
  href?: string
  fullWidth?: boolean
}

const INFO_CARDS: InfoCard[] = [
  {
    icon: Mail,
    label: "Email",
    lines: [CONTACT_INFO.email],
    note: "For product inquiries, onboarding, sales, and support.",
    href: `mailto:${CONTACT_INFO.email}`,
  },
  {
    icon: Phone,
    label: "Phone",
    lines: [CONTACT_INFO.phone],
    note: "Monday – Friday, 11:00 AM – 07:00 PM IST",
    href: `tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`,
  },
  {
    icon: Building2,
    label: "Head Office",
    lines: [
      "Zar Solutions, Currency Tower, VIP Road, Raipur, Chhattisgarh – 492001",
    ],
  },
  {
    icon: Building,
    label: "Branch Office",
    lines: [
      "Zar Solutions, 241–242, First Floor, Chouhan Estate, Supela, Bhilai Nagar, Durg, Chhattisgarh – 490023",
    ],
  },
  {
    icon: Clock,
    label: "Response Time",
    lines: ["Within 1 Business Day"],
    note: "We reply to every message within one business day.",
    fullWidth: true,
  },
]

const TRUST_POINTS = [
  "Free Product Demo",
  "Business Setup Assistance",
  "Fast Onboarding",
  "Dedicated Customer Support",
  "Secure Cloud Platform",
]

export default function ContactPage() {
  const [status, setStatus] = useState<FormStatus>("idle")
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const submittedNameRef = useRef("")

  const updateField = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus("error")
      setError("Please fill in your name, email and message.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setStatus("error")
      setError("Please enter a valid email address.")
      return
    }

    setStatus("submitting")
    setError("")
    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbxSCoadNAo50Xq5WrCQJmE1oxf9SK-Yz_kSM5aaBUAyCyAdiw7RxDQGaCVf-_WSdxyq/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            name: form.name,
            company: form.company,
            email: form.email,
            phone: form.phone,
            subject: form.subject,
            message: form.message,
          }),
        },
      )

      submittedNameRef.current = form.name.trim().split(" ")[0]
      setStatus("success")
      setForm({ name: "", company: "", email: "", phone: "", subject: "", message: "" })
    } catch (error) {
      console.error("Contact form submission failed:", error)
      setStatus("error")
      setError("Something went wrong. Please try again later.")
    }
  }

  return (
    <div className="overflow-hidden">
      <section className="px-4 pb-14 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 -z-10 h-[420px]"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, hsla(142, 76%, 36%, 0.12), transparent 55%)",
          }}
        />
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="Contact Us"
            title="Let's Grow Your Poultry Business Together"
            subtitle="Have questions about Poultry Sathi, pricing, onboarding, implementation, or product features? Our team is here to help. We typically respond within one business day."
          />
        </Reveal>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-5">
          <Reveal className="order-2 lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              {status === "success" ? (
                <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-8 w-8" />
                  </span>
                  <h2 className="mt-6 text-2xl font-bold text-foreground">Request received!</h2>
                  <p className="mt-3 max-w-sm text-muted-foreground">
                    Thanks for reaching out, {submittedNameRef.current || "friend"}. Our team will
                    get back to you within one business day.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => {
                      setStatus("idle")
                      setForm({ name: "", company: "", email: "", phone: "", subject: "", message: "" })
                    }}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Send us a message</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tell us about your business and what you need. We usually respond within one
                      business day.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={form.name}
                        onChange={updateField("name")}
                        className="h-11 px-4"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name (Optional)</Label>
                      <Input
                        id="company"
                        placeholder="Your company"
                        value={form.company}
                        onChange={updateField("company")}
                        className="h-11 px-4"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={updateField("email")}
                        className="h-11 px-4"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 7247248886"
                        value={form.phone}
                        onChange={updateField("phone")}
                        className="h-11 px-4"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="How can we help?"
                      value={form.subject}
                      onChange={updateField("subject")}
                      className="h-11 px-4"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      placeholder="Tell us a little about your business and what you need…"
                      value={form.message}
                      onChange={updateField("message")}
                      className="min-h-[156px]"
                      required
                    />
                  </div>

                  {status === "error" && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto"
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        Send Message <Send className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="order-1 lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {INFO_CARDS.map((item) => {
                const Icon = item.icon
                const card = (
                  <div className="flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <div className="mt-1 space-y-0.5 text-sm leading-relaxed text-muted-foreground">
                        {item.lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                      {item.note && (
                        <p className="mt-1 text-xs text-muted-foreground/80">{item.note}</p>
                      )}
                    </div>
                  </div>
                )
                const wrapperClass = cn("h-full", item.fullWidth && "sm:col-span-2 lg:col-span-1")
                return item.href ? (
                  <Link key={item.label} href={item.href} className={cn("block", wrapperClass)}>
                    {card}
                  </Link>
                ) : (
                  <div key={item.label} className={wrapperClass}>
                    {card}
                  </div>
                )
              })}
            </div>
          </Reveal>
        </div>

        
      </section>
    </div>
  )
}
