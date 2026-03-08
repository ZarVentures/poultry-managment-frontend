"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  const displayValue = value ? format(new Date(value), "dd-MMM-yyyy") : placeholder

  return (
    <div className="relative">
      <input
        type="date"
        value={value || ""}
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
      />
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal h-10 px-3 pointer-events-none",
          !value && "text-muted-foreground",
          className
        )}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span className="text-sm">{displayValue}</span>
      </Button>
    </div>
  )
}

