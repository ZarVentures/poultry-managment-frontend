"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api-base-url"

const TOKEN = "<YOUR_TOKEN>"

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE"
  path: string
  description: string
  auth: boolean
  body?: object
  params?: string
  response: object
}

interface Group {
  name: string
  description: string
  endpoints: Endpoint[]
}

const API_GROUPS: Group[] = [
  {
    name: "Authentication",
    description: "Login and get a JWT token. Use the token in all other requests.",
    endpoints: [
      {
        method: "POST", path: "/auth/login", auth: false,
        description: "Login with email and password. Returns a JWT access_token.",
        body: { email: "admin@azizpoultry.com", password: "admin123" },
        response: { access_token: "eyJhbGci...", user: { id: "1", name: "Admin", role: "admin" } }
      },
      {
        method: "GET", path: "/auth/profile", auth: true,
        description: "Get the currently logged-in user's profile.",
        response: { id: "1", name: "Admin", email: "admin@azizpoultry.com", role: "admin" }
      },
    ]
  },
  {
    name: "Farmers",
    description: "Manage farmer/supplier master entries.",
    endpoints: [
      {
        method: "GET", path: "/farmers", auth: true,
        description: "Get all farmers (paginated, up to 100).",
        response: { data: [{ id: "1", name: "Raju Pulty", phone: "9179094325", address: "Junal", status: "active" }], total: 28 }
      },
      {
        method: "GET", path: "/farmers/active", auth: true,
        description: "Get only active farmers (used in dropdowns).",
        response: [{ id: "1", name: "Raju Pulty", phone: "9179094325" }]
      },
      {
        method: "POST", path: "/farmers", auth: true,
        description: "Create a new farmer.",
        body: { name: "Ahmed Khan", phone: "9876543210", email: "ahmed@farm.com", address: "Village Road", farmhouseName: "Khan Farm", notes: "" },
        response: { id: "29", name: "Ahmed Khan", status: "active" }
      },
      {
        method: "PATCH", path: "/farmers/:id", auth: true,
        description: "Update a farmer by ID.",
        params: "id = farmer ID (e.g. 1)",
        body: { name: "Ahmed Khan Updated", phone: "9876543211" },
        response: { id: "1", name: "Ahmed Khan Updated" }
      },
      {
        method: "DELETE", path: "/farmers/:id", auth: true,
        description: "Delete a farmer by ID.",
        params: "id = farmer ID",
        response: {}
      },
    ]
  },
  {
    name: "Retailers",
    description: "Manage retailer/shop master entries.",
    endpoints: [
      {
        method: "GET", path: "/retailers", auth: true,
        description: "Get all retailers.",
        response: [{ id: "1", name: "Akka Shop", ownerName: "Akka", phone: "9876543210", status: "active" }]
      },
      {
        method: "GET", path: "/retailers/active", auth: true,
        description: "Get only active retailers.",
        response: [{ id: "1", name: "Akka Shop" }]
      },
      {
        method: "POST", path: "/retailers", auth: true,
        description: "Create a new retailer.",
        body: { name: "New Shop", ownerName: "Owner Name", phone: "9876543210", address: "Market Road", email: "" },
        response: { id: "32", name: "New Shop", status: "active" }
      },
      {
        method: "PATCH", path: "/retailers/:id", auth: true,
        description: "Update a retailer.",
        params: "id = retailer ID",
        body: { name: "Updated Shop", phone: "9876543211" },
        response: { id: "1", name: "Updated Shop" }
      },
      {
        method: "DELETE", path: "/retailers/:id", auth: true,
        description: "Delete a retailer.",
        params: "id = retailer ID",
        response: {}
      },
    ]
  },
  {
    name: "Vehicles",
    description: "Manage transport vehicles.",
    endpoints: [
      {
        method: "GET", path: "/vehicles", auth: true,
        description: "Get all vehicles.",
        response: [{ id: "1", vehicleNumber: "CG-07 CA-1090", vehicleType: "Truck", driverName: "Test", status: "active" }]
      },
      {
        method: "POST", path: "/vehicles", auth: true,
        description: "Add a new vehicle.",
        body: { vehicleNumber: "MP-09 AB-1234", vehicleType: "Truck", driverName: "Driver Name", phone: "9876543210", joinDate: "2026-04-01" },
        response: { id: "4", vehicleNumber: "MP-09 AB-1234", status: "active" }
      },
      {
        method: "PATCH", path: "/vehicles/:id", auth: true,
        description: "Update a vehicle.",
        params: "id = vehicle ID",
        body: { driverName: "New Driver" },
        response: { id: "1", driverName: "New Driver" }
      },
      {
        method: "DELETE", path: "/vehicles/:id", auth: true,
        description: "Delete a vehicle.",
        params: "id = vehicle ID",
        response: {}
      },
    ]
  },
  {
    name: "Purchases",
    description: "Manage purchase orders (bird buying from farmers).",
    endpoints: [
      {
        method: "GET", path: "/purchases", auth: true,
        description: "Get all purchase orders.",
        response: [{ id: "1", orderNumber: "PO-63349", supplierName: "Raju Pulty", orderDate: "2026-02-28", netAmount: "45000" }]
      },
      {
        method: "GET", path: "/purchases/invoices/list", auth: true,
        description: "Get a lightweight list of invoices for dropdowns.",
        response: [{ id: "1", orderNumber: "PO-63349", supplierName: "Raju Pulty", orderDate: "2026-02-28" }]
      },
      {
        method: "GET", path: "/purchases/:id", auth: true,
        description: "Get a single purchase order with all details.",
        params: "id = purchase order ID",
        response: { id: "1", orderNumber: "PO-63349", cages: [{ cageId: "1", numberOfBirds: 16, cageWeight: 37.35 }] }
      },
      {
        method: "POST", path: "/purchases", auth: true,
        description: "Create a new purchase order.",
        body: {
          orderNumber: "PO-001", supplierName: "Raju Pulty", orderDate: "2026-04-01",
          farmerId: "1", birdType: "broiler", ratePerKg: "146",
          cages: [{ cageId: "C1", numberOfBirds: 16, cageWeight: 37.35 }],
          purchasePaymentStatus: "pending"
        },
        response: { id: "11", orderNumber: "PO-001", netAmount: "5453.1" }
      },
      {
        method: "PATCH", path: "/purchases/:id", auth: true,
        description: "Update a purchase order.",
        params: "id = purchase order ID",
        body: { purchasePaymentStatus: "paid", totalPaymentMade: "45000" },
        response: { id: "1", purchasePaymentStatus: "paid" }
      },
      {
        method: "DELETE", path: "/purchases/:id", auth: true,
        description: "Delete a purchase order.",
        params: "id = purchase order ID",
        response: {}
      },
    ]
  },
  {
    name: "Sales",
    description: "Manage sales records (bird selling to retailers).",
    endpoints: [
      {
        method: "GET", path: "/sales", auth: true,
        description: "Get all sales.",
        response: [{ id: "1", invoiceNumber: "SI-001", customerName: "Akka Shop", saleDate: "2026-03-15", netAmount: "62000" }]
      },
      {
        method: "GET", path: "/sales/invoices/list", auth: true,
        description: "Get lightweight sales invoice list.",
        response: [{ id: "1", invoiceNumber: "SI-001", customerName: "Akka Shop", saleDate: "2026-03-15" }]
      },
      {
        method: "POST", path: "/sales", auth: true,
        description: "Create a new sale.",
        body: {
          invoiceNumber: "SI-001", customerName: "Akka Shop", saleDate: "2026-04-01",
          saleMode: "from_vehicle", productType: "meat",
          quantity: "426.050", unitPrice: "146",
          paymentStatus: "paid", amountReceived: "62000",
          retailerId: "1"
        },
        response: { id: "2", invoiceNumber: "SI-001", netAmount: "62203.3" }
      },
      {
        method: "PATCH", path: "/sales/:id", auth: true,
        description: "Update a sale.",
        params: "id = sale ID",
        body: { paymentStatus: "paid", amountReceived: "62000" },
        response: { id: "1", paymentStatus: "paid" }
      },
      {
        method: "PATCH", path: "/sales/:id/payment", auth: true,
        description: "Update only the payment status of a sale.",
        params: "id = sale ID",
        body: { paymentStatus: "paid", amountReceived: 62000 },
        response: { id: "1", paymentStatus: "paid" }
      },
      {
        method: "DELETE", path: "/sales/:id", auth: true,
        description: "Delete a sale.",
        params: "id = sale ID",
        response: {}
      },
    ]
  },
  {
    name: "Expenses",
    description: "Track farm expenses by category.",
    endpoints: [
      {
        method: "GET", path: "/expenses", auth: true,
        description: "Get all expenses.",
        response: [{ id: "1", category: "feed", amount: "5000", date: "2026-03-01", description: "Feed purchase" }]
      },
      {
        method: "POST", path: "/expenses", auth: true,
        description: "Add a new expense.",
        body: { category: "feed", amount: "5000", date: "2026-04-01", description: "Monthly feed", paymentMethod: "cash" },
        response: { id: "2", category: "feed", amount: "5000" }
      },
      {
        method: "PATCH", path: "/expenses/:id", auth: true,
        description: "Update an expense.",
        params: "id = expense ID",
        body: { amount: "5500" },
        response: { id: "1", amount: "5500" }
      },
      {
        method: "DELETE", path: "/expenses/:id", auth: true,
        description: "Delete an expense.",
        params: "id = expense ID",
        response: {}
      },
    ]
  },
  {
    name: "Mortality",
    description: "Track bird mortality records.",
    endpoints: [
      {
        method: "GET", path: "/mortality", auth: true,
        description: "Get all mortality records.",
        response: [{ id: "1", recordNumber: "MR-001", farmerName: "Raju Pulty", numberOfBirdsDied: 2, cause: "Disease" }]
      },
      {
        method: "POST", path: "/mortality", auth: true,
        description: "Record a new mortality event.",
        body: {
          recordNumber: "MR-001", purchaseInvoiceNo: "PO-63349",
          purchaseDate: "2026-02-28", farmerName: "Raju Pulty",
          totalBirdsPurchased: 384, numberOfBirdsDied: 2, cause: "Disease"
        },
        response: { id: "2", recordNumber: "MR-001" }
      },
      {
        method: "PATCH", path: "/mortality/:id", auth: true,
        description: "Update a mortality record.",
        params: "id = mortality record ID",
        body: { numberOfBirdsDied: 3, cause: "Heat stress" },
        response: { id: "1", numberOfBirdsDied: 3 }
      },
      {
        method: "DELETE", path: "/mortality/:id", auth: true,
        description: "Delete a mortality record.",
        params: "id = mortality record ID",
        response: {}
      },
    ]
  },
  {
    name: "Dashboard",
    description: "Get aggregated statistics for the dashboard.",
    endpoints: [
      {
        method: "GET", path: "/dashboard", auth: true,
        description: "Get comprehensive dashboard data including sales, purchases, expenses, and trends.",
        response: {
          totalSalesThisMonth: 62000, totalPurchasesThisMonth: 45000,
          totalExpensesThisMonth: 5000, netProfitThisMonth: 12000,
          totalFarmers: 28, totalRetailers: 31
        }
      },
    ]
  },
  {
    name: "Users",
    description: "Manage system users (admin only).",
    endpoints: [
      {
        method: "GET", path: "/users", auth: true,
        description: "Get all users.",
        response: [{ id: "1", name: "Admin", email: "admin@azizpoultry.com", role: "admin", status: "active" }]
      },
      {
        method: "POST", path: "/users", auth: true,
        description: "Create a new user.",
        body: { name: "New User", email: "user@azizpoultry.com", password: "password123", role: "staff", joinDate: "2026-04-01" },
        response: { id: "11", name: "New User", role: "staff" }
      },
      {
        method: "PATCH", path: "/users/:id", auth: true,
        description: "Update a user.",
        params: "id = user ID",
        body: { name: "Updated Name", role: "manager" },
        response: { id: "1", name: "Updated Name" }
      },
      {
        method: "DELETE", path: "/users/:id", auth: true,
        description: "Delete a user.",
        params: "id = user ID",
        response: {}
      },
    ]
  },
]

function methodColor(m: string) {
  return m === "GET" ? "bg-blue-100 text-blue-700" :
    m === "POST" ? "bg-green-100 text-green-700" :
    m === "PATCH" ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700"
}

function buildCurl(ep: Endpoint, base: string): string {
  const url = `${base}${ep.path.replace(":id", "1")}`
  const lines = [`curl -X ${ep.method} '${url}'`]
  lines.push(`  -H 'Content-Type: application/json'`)
  if (ep.auth) lines.push(`  -H 'Authorization: Bearer ${TOKEN}'`)
  if (ep.body) lines.push(`  -d '${JSON.stringify(ep.body, null, 2)}'`)
  return lines.join(" \\\n")
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
      title="Copy"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

function EndpointCard({ ep, apiBase }: { ep: Endpoint; apiBase: string }) {
  const [open, setOpen] = useState(false)
  const curl = buildCurl(ep, apiBase || getApiBaseUrl())
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-left"
      >
        <span className={`text-xs font-bold px-2 py-1 rounded font-mono w-16 text-center ${methodColor(ep.method)}`}>{ep.method}</span>
        <span className="font-mono text-sm text-gray-700 flex-1">{ep.path}</span>
        <span className="text-xs text-gray-500 flex-1">{ep.description}</span>
        {ep.auth && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">🔒 Auth</span>}
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
          {ep.params && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">PATH PARAMETERS</p>
              <code className="text-xs bg-gray-200 px-2 py-1 rounded">{ep.params}</code>
            </div>
          )}

          {ep.body && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">REQUEST BODY</p>
              <div className="relative">
                <pre className="bg-gray-900 text-green-300 text-xs rounded-lg p-3 overflow-x-auto font-mono">
                  {JSON.stringify(ep.body, null, 2)}
                </pre>
                <CopyButton text={JSON.stringify(ep.body, null, 2)} />
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">CURL COMMAND</p>
            <div className="relative">
              <pre className="bg-gray-900 text-cyan-300 text-xs rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
                {curl}
              </pre>
              <CopyButton text={curl} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">EXAMPLE RESPONSE</p>
            <div className="relative">
              <pre className="bg-gray-900 text-yellow-200 text-xs rounded-lg p-3 overflow-x-auto font-mono">
                {JSON.stringify(ep.response, null, 2)}
              </pre>
              <CopyButton text={JSON.stringify(ep.response, null, 2)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApiDocsPage() {
  const [search, setSearch] = useState("")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Authentication: true })
  const [apiBase, setApiBase] = useState("")
  useEffect(() => {
    setApiBase(getApiBaseUrl())
  }, [])

  const toggleGroup = (name: string) => setOpenGroups(v => ({ ...v, [name]: !v[name] }))

  const filtered = API_GROUPS.map(g => ({
    ...g,
    endpoints: g.endpoints.filter(ep =>
      !search || ep.path.toLowerCase().includes(search.toLowerCase()) ||
      ep.description.toLowerCase().includes(search.toLowerCase()) ||
      ep.method.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(g => g.endpoints.length > 0)

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Base URL: <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{apiBase || "…"}</code>
            <span className="ml-4 text-xs">
              Interactive:{" "}
              <a href={apiBase ? `${apiBase}/docs` : "#"} target="_blank" rel="noreferrer" className="text-blue-600 underline">Swagger UI</a>
              {" · "}
              <a href={apiBase ? `${apiBase}/docs-json` : "#"} target="_blank" rel="noreferrer" className="text-blue-600 underline">OpenAPI JSON (Postman import)</a>
            </span>
          </p>
        </div>

        {/* Auth note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-amber-800 mb-1">🔐 Authentication</p>
          <p className="text-amber-700">Most endpoints require a Bearer token. First call <code className="bg-amber-100 px-1 rounded">POST /auth/login</code> to get your token, then replace <code className="bg-amber-100 px-1 rounded">{TOKEN}</code> in the curl commands below.</p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search endpoints..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        {/* Groups */}
        {filtered.map(group => (
          <div key={group.name} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 text-left"
            >
              <div>
                <span className="font-bold text-gray-800">{group.name}</span>
                <span className="ml-3 text-xs text-gray-500">{group.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{group.endpoints.length} endpoints</span>
                {openGroups[group.name] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </button>
            {openGroups[group.name] && (
              <div className="divide-y divide-gray-100">
                {group.endpoints.map((ep, i) => (
                  <EndpointCard key={i} ep={ep} apiBase={apiBase} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
