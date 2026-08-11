/**
 * Centralized date handling.
 * Date-only fields must stay calendar dates — never UTC via toISOString().
 *
 * Display:  DD-MMM-YYYY   (01-Aug-2026)
 * API:      YYYY-MM-DD
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
const IST = 'Asia/Kolkata'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function ymdFromParts(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

function ymdInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  return `${year}-${month}-${day}`
}

function isUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}

export function toDateOnlyString(value?: string | Date | null): string | null {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    if (isUtcMidnight(value)) {
      return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`
    }
    return ymdFromParts(value.getFullYear(), value.getMonth(), value.getDate())
  }

  const raw = String(value).trim()
  if (!raw || raw === 'Invalid Date') return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  const utcMidnight = raw.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(\.\d+)?Z$/)
  if (utcMidnight) return utcMidnight[1]

  const localMidnight = raw.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(\.\d+)?$/)
  if (localMidnight) return localMidnight[1]

  if (raw.includes('T') || raw.includes(' ')) {
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) return null
    if (isUtcMidnight(parsed)) {
      return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`
    }
    return ymdInTimeZone(parsed, IST)
  }

  const prefix = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  return prefix ? prefix[1] : null
}

export function formatDateToYYYYMMDD(date: Date): string {
  return ymdFromParts(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatDateForAPI(date?: Date | string | null): string | undefined {
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) return undefined
    return formatDateToYYYYMMDD(date)
  }
  return toDateOnlyString(date) ?? undefined
}

export const toLocalYMD = formatDateForAPI

export function getTodayIST(): string {
  return ymdInTimeZone(new Date(), IST)
}

export function getYearStartIST(): string {
  return `${ymdInTimeZone(new Date(), IST).slice(0, 4)}-01-01`
}

export function getCurrentMonthStartIST(): string {
  const today = ymdInTimeZone(new Date(), IST)
  return `${today.slice(0, 7)}-01`
}

export function getDaysAgoIST(days: number): string {
  const [y, m, d] = getTodayIST().split('-').map(Number)
  return formatDateToYYYYMMDD(new Date(y, m - 1, d - days))
}

export function getMonthsAgoIST(months: number): string {
  const [y, m, d] = getTodayIST().split('-').map(Number)
  return formatDateToYYYYMMDD(new Date(y, m - 1 - months, d))
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function parseDateOnly(value?: string | Date | null): Date | null {
  const ymd = toDateOnlyString(value)
  if (!ymd) return null
  return parseDateString(ymd)
}

export function isDateInRange(
  value: string | Date | null | undefined,
  start?: Date,
  end?: Date,
): boolean {
  const d = parseDateOnly(value)
  if (!d) return false
  if (start && d < startOfLocalDay(start)) return false
  if (end && d > startOfLocalDay(end)) return false
  return true
}

export function isValidDateString(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
}

export function normalizeDateToIST(date: string | Date): string {
  return toDateOnlyString(date) || getTodayIST()
}

/** UI date: 01-Aug-2026 */
export function formatDate(value?: string | Date | null, empty = '-'): string {
  const ymd = toDateOnlyString(value)
  if (!ymd) return empty
  const [year, month, day] = ymd.split('-')
  return `${day}-${MONTHS[Number(month) - 1]}-${year}`
}

export const formatDateForDisplay = formatDate

export function formatDateTime(value?: string | Date | null, empty = '-'): string {
  if (value == null || value === '') return empty
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return empty
  const ymd = ymdInTimeZone(date, IST)
  const [year, month, day] = ymd.split('-')
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
  return `${day}-${MONTHS[Number(month) - 1]}-${year} ${time}`
}
