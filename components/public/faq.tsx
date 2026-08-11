"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export interface FaqItem {
  question: string
  answer: string
}

interface FaqProps {
  items: FaqItem[]
}

export function Faq({ items }: FaqProps) {
  return (
    <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl">
      {items.map((item, index) => (
        <AccordionItem key={item.question} value={`item-${index}`}>
          <AccordionTrigger className="text-left text-base font-medium">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="leading-relaxed text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
