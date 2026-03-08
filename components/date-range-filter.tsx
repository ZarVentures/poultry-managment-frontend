"use client"

import * as React from "react"
import ReactDatePicker from "react-datepicker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CalendarIcon, X } from "lucide-react"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import "react-datepicker/dist/react-datepicker.css"

interface DateRangeFilterProps {
  startDate?: Date
  endDate?: Date
  onDateRangeChange: (startDate: Date | undefined, endDate: Date | undefined) => void
}

export function DateRangeFilter({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) {
  const handleStartChange = (date: Date | null) => {
    onDateRangeChange(date || undefined, endDate)
  }

  const handleEndChange = (date: Date | null) => {
    onDateRangeChange(startDate, date || undefined)
  }

  const handleClear = () => {
    onDateRangeChange(undefined, undefined)
  }

  const handleThisMonth = () => {
    const start = dayjs().startOf("month").toDate()
    const end = dayjs().endOf("month").toDate()
    onDateRangeChange(start, end)
  }

  const handleLastMonth = () => {
    const start = dayjs().subtract(1, "month").startOf("month").toDate()
    const end = dayjs().subtract(1, "month").endOf("month").toDate()
    onDateRangeChange(start, end)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Label className="text-sm font-medium whitespace-nowrap">Date Range:</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <ReactDatePicker
            selected={startDate}
            onChange={handleStartChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="dd-MMM-yyyy"
            placeholderText="Start date"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            todayButton="Today"
            className={cn(
              "flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            calendarClassName="shadow-lg border rounded-lg"
          />
          <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
        <span className="text-muted-foreground text-sm">-</span>
        <div className="relative">
          <ReactDatePicker
            selected={endDate}
            onChange={handleEndChange}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            dateFormat="dd-MMM-yyyy"
            placeholderText="End date"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            todayButton="Today"
            className={cn(
              "flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            calendarClassName="shadow-lg border rounded-lg"
          />
          <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
        <Button variant="outline" size="sm" onClick={handleThisMonth} className="h-9 text-xs">
          This Month
        </Button>
        <Button variant="outline" size="sm" onClick={handleLastMonth} className="h-9 text-xs">
          Last Month
        </Button>
        {(startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 px-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
