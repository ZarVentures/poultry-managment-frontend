import {
  BarChart3,
  Bell,
  Bird,
  Boxes,
  Handshake,
  IndianRupee,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react"

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon
  label: string
  value: string
  color: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-[11px] font-medium uppercase leading-snug tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2.5 break-words text-lg font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}

const BARS = [35, 55, 40, 70, 50, 85, 65, 90, 72, 96, 80, 100]
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]

const NAV_ITEMS: { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Inventory", icon: Boxes },
  { label: "Purchases", icon: ShoppingCart },
  { label: "Sales", icon: Store },
  { label: "Customers", icon: Users },
  { label: "Suppliers", icon: Handshake },
  { label: "Godown", icon: Warehouse },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings },
]

const EXPENSES = [
  { label: "Purchases", value: "62%", color: "bg-emerald-500" },
  { label: "Transport", value: "13%", color: "bg-blue-500" },
  { label: "Labour", value: "14%", color: "bg-amber-500" },
  { label: "Other", value: "11%", color: "bg-violet-500" },
]

const TRANSACTIONS: {
  type: string
  party: string
  amount: string
  amountColor: string
  badge: string
  badgeColor: string
  chip: string
  icon: LucideIcon
}[] = [
  {
    type: "Sale",
    party: "Sunrise Traders",
    amount: "+₹1,24,500",
    amountColor: "text-emerald-600 dark:text-emerald-400",
    badge: "Paid",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    chip: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: ShoppingCart,
  },
  {
    type: "Purchase",
    party: "Green Valley Feeds",
    amount: "−₹86,200",
    amountColor: "text-red-500 dark:text-red-400",
    badge: "PO-0218",
    badgeColor: "bg-muted text-muted-foreground",
    chip: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    icon: Package,
  },
  {
    type: "Collection",
    party: "Kumar Retailers",
    amount: "+₹54,800",
    amountColor: "text-emerald-600 dark:text-emerald-400",
    badge: "Cleared",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    chip: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    icon: IndianRupee,
  },
]

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-slate-900/10">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <div className="ml-3 hidden flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground sm:block">
          app.poultrysathi.com/dashboard
        </div>
      </div>

      <div className="flex">
        <aside className="hidden w-44 shrink-0 flex-col gap-1 border-r border-border bg-muted/30 p-3 sm:flex">
          <div className="mb-2 flex items-center gap-2 border-b border-border pb-3 pl-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 text-white">
              <Bird className="h-3.5 w-3.5" />
            </span>
            <span className="truncate text-sm font-bold tracking-tight text-foreground">
              Poultry Sathi
            </span>
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                  item.active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            )
          })}
        </aside>

        <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">Dashboard</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Good morning, Rajesh — here&apos;s your trade at a glance
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground md:flex">
                <Search className="h-3.5 w-3.5" />
                Search&hellip;
              </div>
              <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-bold text-white">
                RK
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            <Stat
              icon={IndianRupee}
              label="Monthly Sales"
              value="₹8,42,500"
              color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
            />
            <Stat
              icon={Package}
              label="Monthly Purchases"
              value="₹6,10,000"
              color="bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
            />
            <Stat
              icon={TrendingUp}
              label="Net Profit"
              value="₹1,32,400"
              color="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
            />
            <Stat
              icon={Wallet}
              label="Outstanding"
              value="₹2,18,600"
              color="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Revenue</p>
                  <p className="text-[10px] text-muted-foreground">This year</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  +18% vs last month
                </span>
              </div>
              <div className="flex h-24 items-end gap-1.5 sm:gap-2">
                {BARS.map((height, index) => (
                  <div
                    key={index}
                    style={{ height: `${height}%` }}
                    className="min-w-0 flex-1 rounded-t-md bg-gradient-to-t from-emerald-600/70 to-emerald-400/70"
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[8px] font-medium text-muted-foreground">
                {MONTHS.map((month, index) => (
                  <span key={index}>{month}</span>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-foreground">Expense Breakdown</p>
              <p className="text-[10px] text-muted-foreground">This month</p>
              <div className="mt-4 flex flex-col items-center gap-4">
                <div
                  className="relative h-28 w-28 shrink-0 rounded-full"
                  style={{
                    background:
                      "conic-gradient(#10b981 0deg 223.2deg, #3b82f6 223.2deg 270deg, #f59e0b 270deg 320.4deg, #8b5cf6 320.4deg 360deg)",
                  }}
                >
                  <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-card">
                    <p className="text-sm font-bold tabular-nums text-foreground">₹6.1L</p>
                    <p className="text-[9px] text-muted-foreground">Expenses</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  {EXPENSES.map((item) => (
                    <span
                      key={item.label}
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                    >
                      <span className={`h-2 w-2 rounded-full ${item.color}`} />
                      {item.label} {item.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Recent Transactions</p>
              <span className="text-[10px] font-semibold text-primary">View all</span>
            </div>
            <div className="space-y-2.5">
              {TRANSACTIONS.map((tx) => {
                const Icon = tx.icon
                return (
                  <div
                    key={tx.type}
                    className="flex items-center gap-3 border-b border-border/60 pb-2.5 last:border-0 last:pb-0"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tx.chip}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{tx.type}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{tx.party}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold tabular-nums ${tx.amountColor}`}>
                      {tx.amount}
                    </span>
                    <span
                      className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline ${tx.badgeColor}`}
                    >
                      {tx.badge}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
