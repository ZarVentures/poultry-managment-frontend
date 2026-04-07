"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export interface ApiLog {
  id: string
  timestamp: string
  method: string
  url: string
  body?: string
  status?: number
  duration?: number
  curl: string
}

interface DevModeContextType {
  isDevMode: boolean
  logs: ApiLog[]
  enableDevMode: (password: string) => boolean
  disableDevMode: () => void
  clearLogs: () => void
  addLog: (log: ApiLog) => void
}

const DevModeContext = createContext<DevModeContextType>({
  isDevMode: false,
  logs: [],
  enableDevMode: () => false,
  disableDevMode: () => {},
  clearLogs: () => {},
  addLog: () => {},
})

const DEV_PASSWORD = "0110"
const STORAGE_KEY = "dev_mode_enabled"
const MAX_LOGS = 50

export function DevModeProvider({ children }: { children: ReactNode }) {
  const [isDevMode, setIsDevMode] = useState(false)
  const [logs, setLogs] = useState<ApiLog[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDevMode(localStorage.getItem(STORAGE_KEY) === "true")
    }
  }, [])

  const enableDevMode = useCallback((password: string) => {
    if (password.trim() === DEV_PASSWORD) {
      setIsDevMode(true)
      localStorage.setItem(STORAGE_KEY, "true")
      return true
    }
    return false
  }, [])

  const disableDevMode = useCallback(() => {
    setIsDevMode(false)
    localStorage.removeItem(STORAGE_KEY)
    setLogs([])
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  const addLog = useCallback((log: ApiLog) => {
    setLogs(prev => [log, ...prev].slice(0, MAX_LOGS))
  }, [])

  return (
    <DevModeContext.Provider value={{ isDevMode, logs, enableDevMode, disableDevMode, clearLogs, addLog }}>
      {children}
    </DevModeContext.Provider>
  )
}

export const useDevMode = () => useContext(DevModeContext)

// Build curl command from request details
export function buildCurl(method: string, url: string, token: string | null, body?: string): string {
  const parts = [`curl -X ${method} '${url}'`]
  parts.push(`  -H 'Content-Type: application/json'`)
  if (token) parts.push(`  -H 'Authorization: Bearer ${token}'`)
  if (body && body !== "{}") parts.push(`  -d '${body}'`)
  return parts.join(" \\\n")
}
