"use client"

import { useEffect, useState } from "react"
import { getApiBaseUrl } from "@/lib/api-base-url"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [envApiUrl, setEnvApiUrl] = useState<string>("")
  const [resolvedApiUrl, setResolvedApiUrl] = useState<string>("")
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setEnvApiUrl(process.env.NEXT_PUBLIC_API_URL?.trim() || "NOT SET")
    setResolvedApiUrl(getApiBaseUrl())
  }, [])

  const testAPI = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      
      // Test dashboard API
      const response = await fetch(`${getApiBaseUrl()}/dashboard/comprehensive?startDate=2026-05-01&endDate=2026-05-10`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      setTestResult({
        status: response.status,
        url: response.url,
        data: data
      })
    } catch (error: any) {
      setTestResult({
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Debug Information</h1>
          <p className="text-muted-foreground">Frontend configuration and API testing</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">NEXT_PUBLIC_API_URL (build-time override, optional):</p>
              <p className="text-lg font-mono bg-gray-100 p-2 rounded">{envApiUrl}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Resolved API base (used for all requests):</p>
              <p className="text-lg font-mono bg-gray-100 p-2 rounded">{resolvedApiUrl}</p>
              <p className="text-xs text-muted-foreground mt-1">
                On Amplify, this follows the site hostname (staging.* → staging API, prod.* → prod API).
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Expected for Staging:</p>
              <p className="text-sm font-mono bg-green-50 p-2 rounded text-green-700">
                https://13.234.140.190.nip.io/staging/api/v1
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Expected for Production:</p>
              <p className="text-sm font-mono bg-blue-50 p-2 rounded text-blue-700">
                https://13.234.140.190.nip.io/api/v1
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Current Window Location:</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {typeof window !== "undefined" ? window.location.href : "Loading..."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={testAPI}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Testing..." : "Test Dashboard API (May 1-10)"}
            </button>

            {testResult && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Result:</p>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
                
                {testResult.data?.kpis && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="font-medium">Quick Check:</p>
                    <p className="text-sm">Total Revenue: ₹{testResult.data.kpis.totalRevenue?.toLocaleString()}</p>
                    <p className="text-sm">Total Sales: {testResult.data.kpis.totalSales}</p>
                    <p className="text-sm mt-2">
                      {testResult.data.kpis.totalRevenue === 89564.1 
                        ? "✅ CORRECT - Staging backend" 
                        : "❌ WRONG - Not using staging backend"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
                language: typeof navigator !== "undefined" ? navigator.language : "N/A",
                cookiesEnabled: typeof navigator !== "undefined" ? navigator.cookieEnabled : "N/A"
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
