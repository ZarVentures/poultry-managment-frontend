"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DateRangeFilterProps {
  startDate?: Date
  endDate?: Date
  onDateRangeChange: (startDate: Date | undefined, endDate: Date | undefined) => void
}

export function DateRangeFilter({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value ? new Date(e.target.value) : undefined
    onDateRangeChange(newStart, endDate)
  }

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value ? new Date(e.target.value) : undefined
    onDateRangeChange(startDate, newEnd)
  }

  const handleClear = () => {
    onDateRangeChange(undefined, undefined)
  }

  const formatDateValue = (date: Date | undefined) => {
    if (!date) return ""
    try {
      return format(date, "yyyy-MM-dd")
    } catch {
      return ""
    }
  }

  const displayText = startDate && endDate
    ? `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`
    : startDate
      ? `From: ${format(startDate, "MMM dd, yyyy")}`
      : endDate
        ? `To: ${format(endDate, "MMM dd, yyyy")}`
        : "Select date range"

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium whitespace-nowrap">Date Range:</Label>
      <div className="relative flex items-center gap-2">
        <div className="relative">
          <input
            type="date"
            value={formatDateValue(startDate)}
            onChange={handleStartChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-[140px] h-full z-10"
          />
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal h-9 px-3 pointer-events-none text-xs",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
          </Button>
        </div>
        <span className="text-muted-foreground">-</span>
        <div className="relative">
          <input
            type="date"
            value={formatDateValue(endDate)}
            onChange={handleEndChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-[140px] h-full z-10"
          />
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal h-9 px-3 pointer-events-none text-xs",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
          </Button>
        </div>
        {(startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 px-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
