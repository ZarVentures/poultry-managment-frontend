"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

dayjs.extend(customParseFormat)

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
  placeholder = "DD-MM-YYYY",
  className,
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState("")

  React.useEffect(() => {
    if (value) {
      // Convert YYYY-MM-DD to DD-MM-YYYY for display
      const date = dayjs(value)
      if (date.isValid()) {
        setInputValue(date.format("DD-MM-YYYY"))
      }
    } else {
      setInputValue("")
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setInputValue(input)

    // Try to parse the date
    if (input.length === 10) {
      const date = dayjs(input, "DD-MM-YYYY", true)
      if (date.isValid() && onChange) {
        onChange(date.format("YYYY-MM-DD"))
      }
    } else if (input === "" && onChange) {
      onChange("")
    }
  }

  const handleToday = () => {
    const today = dayjs()
    setInputValue(today.format("DD-MM-YYYY"))
    if (onChange) {
      onChange(today.format("YYYY-MM-DD"))
    }
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pl-9", className)}
          maxLength={10}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleToday}
        disabled={disabled}
        className="whitespace-nowrap"
      >
        Today
      </Button>
    </div>
  )
}
