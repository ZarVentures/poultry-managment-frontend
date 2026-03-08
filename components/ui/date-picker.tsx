"use client"

import * as React from "react"
import ReactDatePicker from "react-datepicker"
import { Calendar as CalendarIcon } from "lucide-react"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import "react-datepicker/dist/react-datepicker.css"

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
  placeholder = "Select date",
  className,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  React.useEffect(() => {
    if (value) {
      const date = dayjs(value)
      if (date.isValid()) {
        setSelectedDate(date.toDate())
      }
    } else {
      setSelectedDate(null)
    }
  }, [value])

  const handleChange = (date: Date | null) => {
    setSelectedDate(date)
    if (date && onChange) {
      onChange(dayjs(date).format("YYYY-MM-DD"))
    } else if (!date && onChange) {
      onChange("")
    }
  }

  return (
    <div className="relative">
      <ReactDatePicker
        selected={selectedDate}
        onChange={handleChange}
        disabled={disabled}
        dateFormat="dd-MMM-yyyy"
        placeholderText={placeholder}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        todayButton="Today"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        wrapperClassName="w-full"
        calendarClassName="shadow-lg border rounded-lg"
      />
      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  )
}
