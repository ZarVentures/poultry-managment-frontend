"use client"

import * as React from "react"
import { DatePicker as AntDatePicker } from "antd"
import dayjs, { Dayjs } from "dayjs"
import { CalendarDays } from "lucide-react"
import "antd/dist/reset.css"

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
  format = "DD MMM YYYY",
}: DatePickerProps) {

  const handleChange = (date: Dayjs | null) => {
    if (onChange) {
      onChange(date ? date.format("YYYY-MM-DD") : "")
    }
  }

  return (
    <div className="relative w-full">
      
      {/* Icon */}
      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />

      <AntDatePicker
        value={value ? dayjs(value) : null}
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
          ${className}
        `}
      />
    </div>
  )
}