"use client"

import * as React from "react"
import { DatePicker as AntDatePicker } from "antd"
import dayjs, { Dayjs } from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { CalendarDays } from "lucide-react"
import { toDateOnlyString } from "@/lib/date-utils"
import "antd/dist/reset.css"

dayjs.extend(customParseFormat)

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  format?: string
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = "Select date",
  className = "",
  format = "DD-MMM-YYYY",
}: DatePickerProps) {

  const handleChange = (date: Dayjs | null) => {
    if (onChange) {
      onChange(date ? date.format("YYYY-MM-DD") : "")
    }
  }

  const parsed = value ? toDateOnlyString(value) : null

  return (
    <div className="relative w-full">
      
      {/* Icon */}
      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />

      <AntDatePicker
        value={parsed ? dayjs(parsed, "YYYY-MM-DD") : null}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        format={format}
        getPopupContainer={() => document.body}
        classNames={{
          popup: {
            root: "no-calendar-shadow"
          }
        }}
        className={`
          w-full h-10 pl-9 pr-3 
          rounded-xl border border-gray-200 
          bg-gray-50 
          hover:bg-white 
          hover:border-green-500 
          focus-within:border-green-600 
          transition-all duration-200
          [&_input]:font-normal [&_input]:text-sm
          ${className}
        `}
      />
    </div>
  )
}