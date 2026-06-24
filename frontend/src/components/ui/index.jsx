import { cn } from '../../utils/helpers'

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  )
}

// ── Error ─────────────────────────────────────────────────────────────────────
export function ErrorState({ message }) {
  return (
    <div className="card flex items-center gap-3 text-rose-400 border-rose-500/30">
      <span className="text-lg">⚠</span>
      <div>
        <p className="font-medium text-sm">Failed to load data</p>
        <p className="text-xs text-rose-400/70 mt-0.5">{message}</p>
      </div>
    </div>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function EmptyState({ message = 'No data available' }) {
  return (
    <div className="card flex items-center justify-center py-12 text-slate-500">
      <div className="text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
export function KPICard({ title, value, sub, icon: Icon, color = 'indigo', trend, loading }) {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    rose: 'text-rose-400 bg-rose-400/10',
    sky: 'text-sky-400 bg-sky-400/10',
    violet: 'text-violet-400 bg-violet-400/10',
  }

  if (loading) {
    return (
      <div className="kpi-card">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    )
  }

  return (
    <div className="kpi-card fade-in">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colorMap[color])}>
            <Icon size={15} />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white font-mono tracking-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      {trend !== undefined && (
        <div className={cn('text-xs font-medium mt-2 flex items-center gap-1', trend >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend).toFixed(1)}% vs last month</span>
        </div>
      )}
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'indigo' }) {
  const map = {
    indigo: 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20',
    emerald: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
    amber: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
    rose: 'bg-rose-400/10 text-rose-400 border border-rose-400/20',
    orange: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
    slate: 'bg-slate-400/10 text-slate-400 border border-slate-400/20',
  }
  return <span className={cn('badge', map[color] || map.slate)}>{children}</span>
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ headers, rows, loading, skeletonRows = 5 }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-500">
            {headers.map((h, i) => (
              <th key={i} className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider py-2 px-3 first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="table-row">
              {row.map((cell, j) => (
                <td key={j} className="py-3 px-3 first:pl-0 text-slate-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
