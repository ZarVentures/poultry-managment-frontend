import { Bell, Bird, CheckCircle2, IndianRupee, TrendingUp } from "lucide-react"

export function MobilePreview() {
  return (
    <div className="mx-auto w-[280px] max-w-full rounded-[2.5rem] border-[10px] border-slate-800 bg-slate-900 shadow-2xl dark:border-slate-700">
      <div className="relative h-[540px] overflow-hidden rounded-[2rem] bg-slate-950">
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-800" />

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-5 pb-6 pt-10 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Good morning, Rajesh</p>
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bell className="h-4 w-4" />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-amber-400" />
            </span>
          </div>
          <p className="mt-4 text-xs text-emerald-100/80">Today's Sales</p>
          <p className="flex items-center gap-1 text-2xl font-bold">
            <IndianRupee className="h-5 w-5" /> 84,200
          </p>
        </div>

        <div className="space-y-3 bg-slate-50 px-4 py-5 dark:bg-slate-950">
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Sales up 18%</p>
              <p className="text-[10px] text-muted-foreground">vs last month</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <Bird className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Inventory Available</p>
              <p className="text-[10px] text-muted-foreground">1,250 Birds</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Recent Purchase</p>
              <p className="text-[10px] text-muted-foreground">PO-2024-0189 · Green Farm</p>
            </div>
          </div>

          <div className="mt-2 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <p className="mb-3 text-xs font-semibold text-foreground">This Week</p>
            <div className="flex h-16 items-end gap-2">
              {[40, 65, 50, 80, 70, 95, 85].map((height, index) => (
                <div
                  key={index}
                  style={{ height: `${height}%` }}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
