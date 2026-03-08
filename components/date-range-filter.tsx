"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CalendarIcon, X } from "lucide-react"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { cn } from "@/lib/utils"
import * as React from "react"

dayjs.extend(customParseFormat)

interface DateRangeFilterProps {
  startDate?: Date
  endDate?: Date
  onDateRangeChange: (startDate: Date | undefined, endDate: Date | undefined) => void
}

export function DateRangeFilter({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) {
  const [startInput, setStartInput] = React.useState("")
  const [endInput, setEndInput] = React.useState("")

  React.useEffect(() => {
    if (startDate) {
      setStartInput(dayjs(startDate).format("DD-MM-YYYY"))
    } else {
      setStartInput("")
    }
  }, [startDate])

  React.useEffect(() => {
    if (endDate) {
      setEndInput(dayjs(endDate).format("DD-MM-YYYY"))
    } else {
      setEndInput("")
    }
  }, [endDate])

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setStartInput(input)

    if (input.length === 10) {
      const date = dayjs(input, "DD-MM-YYYY", true)
      if (date.isValid()) {
        onDateRangeChange(date.toDate(), endDate)
      }
    } else if (input === "") {
      onDateRangeChange(undefined, endDate)
    }
  }

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setEndInput(input)

    if (input.length === 10) {
      const date = dayjs(input, "DD-MM-YYYY", true)
      if (date.isValid()) {
        onDateRangeChange(startDate, date.toDate())
      }
    } else if (input === "") {
      onDateRangeChange(startDate, undefined)
    }
  }

  const handleClear = () => {
    setStartInput("")
    setEndInput("")
    onDateRangeChange(undefined, undefined)
  }

  const handleThisMonth = () => {
    const start = dayjs().startOf("month")
    const end = dayjs().endOf("month")
    setStartInput(start.format("DD-MM-YYYY"))
    setEndInput(end.format("DD-MM-YYYY"))
    onDateRangeChange(start.toDate(), end.toDate())
  }

  const handleLastMonth = () => {
    const start = dayjs().subtract(1, "month").startOf("month")
    const end = dayjs().subtract(1, "month").endOf("month")
    setStartInput(start.format("DD-MM-YYYY"))
    setEndInput(end.format("DD-MM-YYYY"))
    onDateRangeChange(start.toDate(), end.toDate())
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Label className="text-sm font-medium whitespace-nowrap">Date Range:</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={startInput}
            onChange={handleStartChange}
            placeholder="DD-MM-YYYY"
            className="w-[120px] h-9 pl-7 text-xs"
            maxLength={10}
          />
        </div>
        <span className="text-muted-foreground text-sm">-</span>
        <div className="relative">
          <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={endInput}
            onChange={handleEndChange}
            placeholder="DD-MM-YYYY"
            className="w-[120px] h-9 pl-7 text-xs"
            maxLength={10}
          />
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
