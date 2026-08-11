"use client"

import * as React from "react"
import { DatePicker } from "antd"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import dayjs, { Dayjs } from "dayjs"
import "antd/dist/reset.css"

const { RangePicker } = DatePicker

interface DateRangeFilterProps {
  startDate?: Date
  endDate?: Date
  onDateRangeChange: (startDate: Date | undefined, endDate: Date | undefined) => void
}

export function DateRangeFilter({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) {
  const value: [Dayjs, Dayjs] | null = startDate && endDate 
    ? [dayjs(startDate), dayjs(endDate)]
    : null

  const handleChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onDateRangeChange(dates[0].startOf("day").toDate(), dates[1].endOf("day").toDate())
    } else {
      onDateRangeChange(undefined, undefined)
    }
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

  const disabledDate = (current: Dayjs) => {
    return current && current.isAfter(dayjs().endOf("day"))
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Label className="text-sm font-medium whitespace-nowrap">Date Range:</Label>
      <div className="flex items-center gap-2">
        <RangePicker
          value={value}
          onChange={handleChange}
          format="DD-MMM-YYYY"
          disabledDate={disabledDate}
          popupClassName="no-calendar-shadow"
          className="premium-datepicker h-9"
        />
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
