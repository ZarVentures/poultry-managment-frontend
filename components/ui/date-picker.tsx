"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, parse } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  const [date, setDate] = React.useState<Date | undefined>(
    value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  )

  React.useEffect(() => {
    if (value) {
      setDate(parse(value, 'yyyy-MM-dd', new Date()))
    } else {
      setDate(undefined)
    }
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate && onChange) {
      onChange(format(selectedDate, "yyyy-MM-dd"))
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <span className="text-sm">{format(date, "dd-MMM-yyyy")}</span>
          ) : (
            <span className="text-sm">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={disabled}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  )
}

