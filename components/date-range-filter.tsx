"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface DateRangeFilterProps {
  startDate?: Date
  endDate?: Date
  onDateRangeChange: (startDate: Date | undefined, endDate: Date | undefined) => void
}

export function DateRangeFilter({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      // Both dates selected - update and close
      onDateRangeChange(range.from, range.to)
      setIsOpen(false)
    } else if (range?.from) {
      // Only start date selected - keep open for end date selection
      onDateRangeChange(range.from, undefined)
    } else {
      // No dates selected - clear
      onDateRangeChange(undefined, undefined)
    }
  }

  const handleClear = () => {
    onDateRangeChange(undefined, undefined)
    setIsOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium whitespace-nowrap">Date Range:</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate && endDate ? (
              <>
                {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}
              </>
            ) : startDate ? (
              format(startDate, "MMM dd, yyyy")
            ) : (
              "Select date range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 max-w-none" align="start">
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={startDate || new Date()}
              selected={{
                from: startDate,
                to: endDate,
              }}
              onSelect={handleSelect}
              numberOfMonths={2}
              initialFocus
            />
            {(startDate || endDate) && (
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm text-muted-foreground">
                  {startDate && endDate
                    ? `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`
                    : startDate
                      ? `From: ${format(startDate, "MMM dd, yyyy")}`
                      : ""}
                </div>
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

