"use client"

import * as React from "react"
import { DatePicker as AntDatePicker } from "antd"
import dayjs, { Dayjs } from "dayjs"
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
  format = "DD-MMM-YYYY",
}: DatePickerProps) {
  const handleChange = (date: Dayjs | null) => {
    if (onChange) {
      onChange(date ? date.format("YYYY-MM-DD") : "")
    }
  }

  return (
    <AntDatePicker
      value={value ? dayjs(value) : null}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      format={format}
      className={`premium-datepicker w-full h-10 ${className}`}
    />
  )
}
