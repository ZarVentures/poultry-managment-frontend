/**
 * Date utility functions for IST timezone handling
 * 
 * These utilities ensure consistent date handling across the frontend
 * All dates should be in IST (Asia/Kolkata timezone)
 */

/**
 * Get current date in IST as YYYY-MM-DD string
 */
export function getTodayIST(): string {
  const now = new Date();
  // Convert to IST
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return formatDateToYYYYMMDD(istDate);
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string or Date object to DD-MM-YYYY for display
 */
export function formatDateForDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Parse a date string (YYYY-MM-DD) to Date object
 * This ensures the date is interpreted as a local date, not UTC
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get first day of current month in IST as YYYY-MM-DD string
 */
export function getCurrentMonthStartIST(): string {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Get date N days ago from current IST date
 */
export function getDaysAgoIST(days: number): string {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const targetDate = new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate() - days);
  return formatDateToYYYYMMDD(targetDate);
}

/**
 * Get date N months ago from current IST date
 */
export function getMonthsAgoIST(months: number): string {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const targetDate = new Date(istDate.getFullYear(), istDate.getMonth() - months, istDate.getDate());
  return formatDateToYYYYMMDD(targetDate);
}

/**
 * Check if a date string is valid YYYY-MM-DD format
 */
export function isValidDateString(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Convert any date input to YYYY-MM-DD format in IST
 */
export function normalizeDateToIST(date: string | Date): string {
  if (typeof date === 'string') {
    if (isValidDateString(date)) {
      return date;
    }
    date = new Date(date);
  }
  
  // Convert to IST
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return formatDateToYYYYMMDD(istDate);
}
